"""C2: Course Offering management.

A CourseOffering is a catalog Course taught in a specific Semester.
All materials, lecturer rosters, and enrollments attach here — never to the
bare catalog course or the bare semester.

Key flows:
- C2: Create offering; clone from a previous offering (materials-only default,
       opt-in settings+team copies; student enrollment NEVER cloned).
- C4: Archive an offering (read-only; existing downloads stay available per retention_months).
- C10: Remove a lecturer from an offering (blocked if sole owner — must reassign first).
- C16: Preview-as-student (lecturers only; returns what a student would see).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.audit import log_action
from app.db import get_db
from app.deps import (
    get_current_user,
    get_student_enrollment,
    require_offering_member,
    require_offering_owner,
    require_role,
)
from app.models import (
    AcademicSession,
    Course,
    CourseOffering,
    Department,
    Enrollment,
    EnrollmentStatus,
    GlobalRole,
    Material,
    MaterialStatus,
    OfferingLecturer,
    OfferingStatus,
    Semester,
    SemesterTerm,
    University,
    User,
)
from app.schemas import (
    CloneIn,
    MaterialOut,
    OfferingIn,
    OfferingLecturerIn,
    OfferingLecturerOut,
    OfferingOut,
    OfferingPatchIn,
)

router = APIRouter(prefix="/offerings", tags=["offerings"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _effective_ceiling(univ: University | None, offering: CourseOffering) -> str:
    scale = ["view-only", "app-only", "open"]
    univ_ceil = (univ.sharing_ceiling if univ and univ.sharing_ceiling else "open")
    off_ceil = offering.sharing_ceiling or "open"
    try:
        u_idx = scale.index(univ_ceil)
    except ValueError:
        u_idx = 2
    try:
        o_idx = scale.index(off_ceil)
    except ValueError:
        o_idx = 2
    return scale[min(u_idx, o_idx)]


def _build_offering_out(off: CourseOffering, db: Session, user: User) -> dict:
    course = db.get(Course, off.course_id)
    sem = db.get(Semester, off.semester_id)
    session = db.get(AcademicSession, sem.session_id) if sem else None
    univ = db.get(University, user.institution_id) if user.institution_id else None
    eff_ceil = _effective_ceiling(univ, off)

    # Per-user enrollment/role context
    enrollment_status = None
    is_lecturer = False
    is_owner = False

    if user.global_role == GlobalRole.student:
        enroll = get_student_enrollment(off.id, user.id, db)
        if enroll:
            enrollment_status = enroll.status.value
        else:
            enrollment_status = "unenrolled"
    elif user.global_role in (GlobalRole.lecturer,):
        lec = (
            db.query(OfferingLecturer)
            .filter(OfferingLecturer.offering_id == off.id, OfferingLecturer.lecturer_id == user.id)
            .one_or_none()
        )
        if lec:
            is_lecturer = True
            is_owner = lec.is_owner
    else:
        # admin / superadmin
        is_lecturer = True
        is_owner = True

    return {
        "id": off.id,
        "course_id": off.course_id,
        "semester_id": off.semester_id,
        "status": off.status,
        "enrollment_mode": off.enrollment_mode,
        "sharing_ceiling": eff_ceil,
        "watermark_mandatory": off.watermark_mandatory,
        "code": course.code if course else None,
        "title": course.title if course else None,
        "credit_units": course.credit_units if course else None,
        "department_id": course.department_id if course else None,
        "session_name": session.name if session else None,
        "semester_term": sem.term if sem else None,
        "enrollment_status": enrollment_status,
        "is_lecturer": is_lecturer,
        "is_owner": is_owner,
    }


# ---------------------------------------------------------------------------
# Create offering
# ---------------------------------------------------------------------------

@router.post("", response_model=OfferingOut, status_code=status.HTTP_201_CREATED)
def create_offering(
    body: OfferingIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    course = db.get(Course, body.course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    sem = db.get(Semester, body.semester_id)
    if not sem:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Semester not found")

    existing = (
        db.query(CourseOffering)
        .filter(
            CourseOffering.course_id == body.course_id,
            CourseOffering.semester_id == body.semester_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Offering for {course.code} already exists in this semester",
        )

    off = CourseOffering(
        course_id=body.course_id,
        semester_id=body.semester_id,
        enrollment_mode=body.enrollment_mode,
        sharing_ceiling=body.sharing_ceiling,
        watermark_mandatory=body.watermark_mandatory,
        status=OfferingStatus.active,
    )
    db.add(off)
    db.commit()
    db.refresh(off)
    log_action(db, user.id, "create_offering", off.id, f"{course.code} @ sem {body.semester_id}")
    return _build_offering_out(off, db, user)


# ---------------------------------------------------------------------------
# List offerings (scoped by role + optional semester filter)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[OfferingOut])
def list_offerings(
    semester_id: str | None = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    q = db.query(CourseOffering)

    if semester_id:
        q = q.filter(CourseOffering.semester_id == semester_id)

    if not include_archived:
        q = q.filter(CourseOffering.status != OfferingStatus.archived)

    offerings = q.all()

    # Scope to relevant offerings per role
    if user.global_role == GlobalRole.student:
        # Only enrolled offerings for the student
        enrolled_offering_ids = {
            e.offering_id
            for e in db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
        }
        if include_archived:
            # Include all enrolled (past semesters for read-only view — C6)
            offerings = [o for o in offerings if o.id in enrolled_offering_ids]
        else:
            offerings = [o for o in offerings if o.id in enrolled_offering_ids]
    elif user.global_role == GlobalRole.lecturer:
        assigned_ids = {
            ol.offering_id
            for ol in db.query(OfferingLecturer)
            .filter(OfferingLecturer.lecturer_id == user.id)
            .all()
        }
        offerings = [o for o in offerings if o.id in assigned_ids]
    # Admins see all offerings (no filter)

    return [_build_offering_out(o, db, user) for o in offerings]


# ---------------------------------------------------------------------------
# Get single offering
# ---------------------------------------------------------------------------

@router.get("/{offering_id}", response_model=OfferingOut)
def get_offering(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    return _build_offering_out(off, db, user)


# ---------------------------------------------------------------------------
# Patch offering metadata
# ---------------------------------------------------------------------------

@router.patch("/{offering_id}", response_model=OfferingOut)
def patch_offering(
    offering_id: str,
    body: OfferingPatchIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_owner(offering_id, user, db)

    if body.enrollment_mode is not None:
        off.enrollment_mode = body.enrollment_mode
    if body.sharing_ceiling is not None:
        off.sharing_ceiling = body.sharing_ceiling
    if body.watermark_mandatory is not None:
        off.watermark_mandatory = body.watermark_mandatory
    if body.status is not None:
        off.status = body.status

    db.commit()
    db.refresh(off)
    return _build_offering_out(off, db, user)


# ---------------------------------------------------------------------------
# C4: Archive offering (read-only; existing files stay accessible per retention)
# ---------------------------------------------------------------------------

@router.post("/{offering_id}/archive")
def archive_offering(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_owner(offering_id, user, db)

    if off.status == OfferingStatus.archived:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already archived")

    off.status = OfferingStatus.archived
    db.commit()
    log_action(db, user.id, "archive_offering", offering_id)
    return {"status": "archived", "offering_id": offering_id}


# ---------------------------------------------------------------------------
# C2: Clone materials from a previous offering
# ---------------------------------------------------------------------------

@router.post("/{offering_id}/clone")
def clone_offering(
    offering_id: str,
    body: CloneIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Clone materials from source_offering_id into this offering.
    
    Decisions:
    - Default: materials only, as drafts, download_count=0.
    - opt_copy_settings: copies sharing_ceiling + watermark_mandatory + enrollment_mode.
    - opt_copy_team: copies OfferingLecturer rows.
    - Student enrollments are NEVER cloned.
    """
    target_off = db.get(CourseOffering, offering_id)
    if not target_off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Target offering not found")
    require_offering_member(offering_id, user, db)

    source_off = db.get(CourseOffering, body.source_offering_id)
    if not source_off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Source offering not found")

    # Clone settings first (before materials, in case ceiling changed)
    if body.opt_copy_settings:
        target_off.sharing_ceiling = source_off.sharing_ceiling
        target_off.watermark_mandatory = source_off.watermark_mandatory
        target_off.enrollment_mode = source_off.enrollment_mode

    # Clone teaching team
    if body.opt_copy_team:
        existing_lecturer_ids = {
            ol.lecturer_id
            for ol in db.query(OfferingLecturer)
            .filter(OfferingLecturer.offering_id == offering_id)
            .all()
        }
        source_lecturers = (
            db.query(OfferingLecturer)
            .filter(OfferingLecturer.offering_id == body.source_offering_id)
            .all()
        )
        for src_lec in source_lecturers:
            if src_lec.lecturer_id not in existing_lecturer_ids:
                new_lec = OfferingLecturer(
                    offering_id=offering_id,
                    lecturer_id=src_lec.lecturer_id,
                    is_owner=src_lec.is_owner,
                    can_publish=src_lec.can_publish,
                    can_manage_roster=src_lec.can_manage_roster,
                )
                db.add(new_lec)

    # Clone materials as drafts
    mat_query = db.query(Material).filter(
        Material.offering_id == body.source_offering_id,
        Material.status != MaterialStatus.removed,
    )
    if body.week_filter:
        mat_query = mat_query.filter(Material.week.in_(body.week_filter))
    source_materials = mat_query.all()

    cloned_count = 0
    for src in source_materials:
        new_mat = Material(
            offering_id=offering_id,
            week=src.week,
            title=src.title,
            storage_key=src.storage_key,        # same storage key — shared blob
            content_sha256=src.content_sha256,
            original_filename=src.original_filename,
            size_bytes=src.size_bytes,
            status=MaterialStatus.draft,         # always draft
            release_at=None,
            summary_json=src.summary_json,
            download_count=0,                    # NEVER clone download counts
            uploaded_by=user.id,
            restriction=src.restriction,
            watermark_override=src.watermark_override,
        )
        db.add(new_mat)
        cloned_count += 1

    db.commit()
    log_action(
        db,
        user.id,
        "clone_offering",
        offering_id,
        f"from={body.source_offering_id} cloned={cloned_count} settings={body.opt_copy_settings} team={body.opt_copy_team}",
    )
    return {
        "status": "ok",
        "cloned_materials": cloned_count,
        "settings_copied": body.opt_copy_settings,
        "team_copied": body.opt_copy_team,
    }


# ---------------------------------------------------------------------------
# C16: Preview as student (lecturer/admin only — read-only view of live materials)
# ---------------------------------------------------------------------------

@router.get("/{offering_id}/preview-as-student", response_model=list[MaterialOut])
def preview_as_student(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Material]:
    """Returns what a student would see: live materials only, ordered by week.
    Does not create any storage access or download. Lecturer/admin only."""
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_member(offering_id, user, db)

    materials = (
        db.query(Material)
        .filter(
            Material.offering_id == offering_id,
            Material.status == MaterialStatus.live,
        )
        .order_by(Material.week, Material.created_at)
        .all()
    )
    return materials


# ---------------------------------------------------------------------------
# Teaching team management
# ---------------------------------------------------------------------------

@router.get("/{offering_id}/lecturers", response_model=list[OfferingLecturerOut])
def list_offering_lecturers(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[OfferingLecturer]:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_member(offering_id, user, db)
    return db.query(OfferingLecturer).filter(OfferingLecturer.offering_id == offering_id).all()


@router.post(
    "/{offering_id}/lecturers",
    response_model=OfferingLecturerOut,
    status_code=status.HTTP_201_CREATED,
)
def add_offering_lecturer(
    offering_id: str,
    body: OfferingLecturerIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OfferingLecturer:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    entry = require_offering_member(offering_id, user, db)
    if not entry.can_manage_roster:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing 'can_manage_roster' permission")

    existing = (
        db.query(OfferingLecturer)
        .filter(
            OfferingLecturer.offering_id == offering_id,
            OfferingLecturer.lecturer_id == body.lecturer_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Lecturer already on this offering")

    lec = OfferingLecturer(
        offering_id=offering_id,
        lecturer_id=body.lecturer_id,
        is_owner=body.is_owner,
        can_publish=body.can_publish,
        can_manage_roster=body.can_manage_roster,
    )
    db.add(lec)
    db.commit()
    db.refresh(lec)
    log_action(db, user.id, "add_offering_lecturer", offering_id, body.lecturer_id)
    return lec


@router.delete("/{offering_id}/lecturers/{lecturer_id}")
def remove_offering_lecturer(
    offering_id: str,
    lecturer_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """C10: Remove a lecturer from an offering.
    Blocked if the lecturer is the sole owner — must reassign ownership first.
    """
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_owner(offering_id, user, db)

    target = (
        db.query(OfferingLecturer)
        .filter(
            OfferingLecturer.offering_id == offering_id,
            OfferingLecturer.lecturer_id == lecturer_id,
        )
        .one_or_none()
    )
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lecturer not on this offering")

    # C10 guard: cannot remove sole owner
    if target.is_owner:
        owner_count = (
            db.query(OfferingLecturer)
            .filter(
                OfferingLecturer.offering_id == offering_id,
                OfferingLecturer.is_owner == True,
            )
            .count()
        )
        if owner_count <= 1:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Cannot remove the sole owner. Assign another owner first.",
            )

    db.delete(target)
    db.commit()
    log_action(db, user.id, "remove_offering_lecturer", offering_id, lecturer_id)
    return {"status": "removed", "lecturer_id": lecturer_id}
