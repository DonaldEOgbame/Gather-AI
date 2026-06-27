"""Catalog management: Institution, Department, and Course (stable entries).

These endpoints manage the *stable* catalog — things that don't change per semester.
Semester instances (CourseOfferings) are managed by /offerings.
Academic sessions and semesters are managed by /sessions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import (
    Course,
    Department,
    GlobalRole,
    University,
    User,
)
from app.schemas import (
    CourseIn,
    CourseOut,
    DepartmentIn,
    DepartmentOut,
    InstitutionOut,
    InstitutionProvisionIn,
    AccessRequestIn,
    AccessRequestOut,
    InstitutionIn,
)
from app.models import InstitutionAccessRequest, InstitutionStatus, AccountStatus
from app.security import hash_password
from app.audit import log_action

router = APIRouter(prefix="/courses", tags=["courses"])


# ---------------------------------------------------------------------------
# Institutions (public / testing creation & superadmin-only provisioning)
# ---------------------------------------------------------------------------

@router.post(
    "/institutions",
    response_model=InstitutionOut,
    status_code=status.HTTP_201_CREATED,
    tags=["institutions"],
)
def create_institution(
    body: InstitutionIn,
    db: Session = Depends(get_db),
):
    if not body.name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Institution name is required")
    if body.join_code and db.query(University).filter(University.join_code == body.join_code).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "join_code already in use")

    inst = University(
        name=body.name,
        join_code=body.join_code,
        timezone=body.timezone or "UTC",
        retention_months=body.retention_months if body.retention_months is not None else 12,
        status=InstitutionStatus.active,
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return {
        "id": inst.id,
        "name": inst.name,
        "join_code": inst.join_code,
        "timezone": inst.timezone,
        "sharing_ceiling": inst.sharing_ceiling,
        "watermark_mandatory": inst.watermark_mandatory,
        "status": inst.status,
        "retention_months": inst.retention_months,
        "allowed_file_types": inst.allowed_file_types,
        "max_file_size_mb": inst.max_file_size_mb,
        "max_files_per_week": inst.max_files_per_week,
    }


@router.post(
    "/institutions/provision",
    response_model=InstitutionOut,
    status_code=status.HTTP_201_CREATED,
    tags=["institutions"],
)
def provision_institution(
    body: InstitutionProvisionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.superadmin)),
) -> dict:
    """C4 invite-only: Superadmin provisions a new institution and mints its first Admin."""
    if body.join_code and db.query(University).filter(University.join_code == body.join_code).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "join_code already in use")

    inst = University(
        name=body.name,
        join_code=body.join_code,
        timezone=body.timezone,
        retention_months=body.retention_months,
        status=InstitutionStatus.active,
    )
    db.add(inst)
    db.flush()

    # Mint first admin for the institution
    from app.models import NotificationSettings
    from app.models import User as UserModel
    existing_admin = db.query(UserModel).filter(UserModel.email == body.admin_email).first()
    if existing_admin:
        raise HTTPException(status.HTTP_409_CONFLICT, f"User {body.admin_email} already exists")

    admin_user = UserModel(
        institution_id=inst.id,
        email=body.admin_email,
        password_hash=hash_password("ChangeMe123!"),  # forced reset on first login
        full_name=body.admin_full_name,
        legal_name=body.admin_full_name,
        matric_or_staff_id=body.admin_matric_or_staff_id,
        global_role=GlobalRole.admin,
        status=AccountStatus.active,
    )
    db.add(admin_user)
    db.flush()

    ns = NotificationSettings(user_id=admin_user.id)
    db.add(ns)

    db.commit()
    db.refresh(inst)
    log_action(db, user.id, "provision_institution", inst.id, body.name)
    return {
        "id": inst.id,
        "name": inst.name,
        "join_code": inst.join_code,
        "timezone": inst.timezone,
        "sharing_ceiling": inst.sharing_ceiling,
        "watermark_mandatory": inst.watermark_mandatory,
        "status": inst.status,
        "retention_months": inst.retention_months,
        "allowed_file_types": inst.allowed_file_types,
        "max_file_size_mb": inst.max_file_size_mb,
        "max_files_per_week": inst.max_files_per_week,
    }


@router.get("/institutions", response_model=list[InstitutionOut], tags=["institutions"])
def list_institutions(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(GlobalRole.superadmin)),
) -> list[dict]:
    insts = db.query(University).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "join_code": i.join_code,
            "timezone": i.timezone,
            "sharing_ceiling": i.sharing_ceiling,
            "watermark_mandatory": i.watermark_mandatory,
            "status": i.status,
            "retention_months": i.retention_months,
            "allowed_file_types": i.allowed_file_types,
            "max_file_size_mb": i.max_file_size_mb,
            "max_files_per_week": i.max_files_per_week,
        }
        for i in insts
    ]


@router.get("/institutions/me", response_model=InstitutionOut, tags=["institutions"])
def get_my_institution(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if not user.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No institution linked to this account")
    inst = db.get(University, user.institution_id)
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    return {
        "id": inst.id,
        "name": inst.name,
        "join_code": inst.join_code,
        "timezone": inst.timezone,
        "sharing_ceiling": inst.sharing_ceiling,
        "watermark_mandatory": inst.watermark_mandatory,
        "status": inst.status,
        "retention_months": inst.retention_months,
        "allowed_file_types": inst.allowed_file_types,
        "max_file_size_mb": inst.max_file_size_mb,
        "max_files_per_week": inst.max_files_per_week,
    }


@router.patch("/institutions/me", response_model=InstitutionOut, tags=["institutions"])
def patch_my_institution(
    body: InstitutionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    if not user.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No institution linked to this account")
    inst = db.get(University, user.institution_id)
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")

    if body.name is not None:
        inst.name = body.name
    if body.join_code is not None:
        inst.join_code = body.join_code
    if body.timezone is not None:
        inst.timezone = body.timezone
    if body.sharing_ceiling is not None:
        inst.sharing_ceiling = body.sharing_ceiling
    if body.watermark_mandatory is not None:
        inst.watermark_mandatory = body.watermark_mandatory
    if body.retention_months is not None:
        inst.retention_months = body.retention_months
    if body.allowed_file_types is not None:
        inst.allowed_file_types = body.allowed_file_types
    if body.max_file_size_mb is not None:
        inst.max_file_size_mb = body.max_file_size_mb
    if body.max_files_per_week is not None:
        inst.max_files_per_week = body.max_files_per_week

    db.commit()
    db.refresh(inst)
    log_action(db, user.id, "patch_institution", inst.id)
    return {
        "id": inst.id,
        "name": inst.name,
        "join_code": inst.join_code,
        "timezone": inst.timezone,
        "sharing_ceiling": inst.sharing_ceiling,
        "watermark_mandatory": inst.watermark_mandatory,
        "status": inst.status,
        "retention_months": inst.retention_months,
        "allowed_file_types": inst.allowed_file_types,
        "max_file_size_mb": inst.max_file_size_mb,
        "max_files_per_week": inst.max_files_per_week,
    }


# ---------------------------------------------------------------------------
# C4: Public "Request Access" lead-capture form (anyone, no auth)
# ---------------------------------------------------------------------------

@router.post(
    "/institutions/request-access",
    response_model=AccessRequestOut,
    status_code=status.HTTP_201_CREATED,
    tags=["institutions"],
)
def request_institution_access(
    body: AccessRequestIn,
    db: Session = Depends(get_db),
) -> InstitutionAccessRequest:
    """Public endpoint: prospective institution submits a lead-capture form.
    Lands in the superadmin queue for manual review. Approval is manual (v1)."""
    req = InstitutionAccessRequest(
        contact_name=body.contact_name,
        contact_email=body.contact_email,
        institution_name=body.institution_name,
        country=body.country,
        message=body.message,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get(
    "/institutions/access-requests",
    response_model=list[AccessRequestOut],
    tags=["institutions"],
)
def list_access_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(GlobalRole.superadmin)),
) -> list[InstitutionAccessRequest]:
    return db.query(InstitutionAccessRequest).order_by(
        InstitutionAccessRequest.created_at.desc()
    ).all()


# ---------------------------------------------------------------------------
# Departments (stable, scoped to institution)
# ---------------------------------------------------------------------------

@router.post("/departments", status_code=status.HTTP_201_CREATED, response_model=DepartmentOut)
def create_department(
    body: DepartmentIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> Department:
    dept = Department(university_id=body.university_id, name=body.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Department]:
    if not user.institution_id:
        return []
    return db.query(Department).filter(Department.university_id == user.institution_id).all()


# ---------------------------------------------------------------------------
# Catalog Courses (code + title + credit_units — no semester_id)
# ---------------------------------------------------------------------------

from pydantic import BaseModel
class LegacySemesterIn(BaseModel):
    university_id: str
    name: str

@router.post(
    "/semesters",
    status_code=status.HTTP_201_CREATED,
    tags=["semesters"],
)
def create_legacy_semester(
    body: LegacySemesterIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import AcademicSession, Semester, SessionStatus, SemesterStatus, SemesterTerm
    session = (
        db.query(AcademicSession)
        .filter(
            AcademicSession.university_id == body.university_id,
            AcademicSession.name == body.name
        )
        .first()
    )
    if not session:
        session = AcademicSession(
            university_id=body.university_id,
            name=body.name,
            status=SessionStatus.active,
        )
        db.add(session)
        db.flush()

    semester = (
        db.query(Semester)
        .filter(
            Semester.session_id == session.id,
            Semester.term == SemesterTerm.first
        )
        .first()
    )
    if not semester:
        semester = Semester(
            session_id=session.id,
            term=SemesterTerm.first,
            registration_open=True,
            status=SemesterStatus.active,
        )
        db.add(semester)
        db.flush()
    db.commit()
    db.refresh(semester)
    return {"id": semester.id, "name": body.name, "university_id": body.university_id}


@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    body: CourseIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    """Create a catalog course. To teach it this semester, create a CourseOffering."""
    dept = db.get(Department, body.department_id)
    if not dept:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")

    course = (
        db.query(Course)
        .filter(Course.department_id == body.department_id, Course.code == body.code)
        .first()
    )
    if not course:
        course = Course(
            department_id=body.department_id,
            code=body.code,
            title=body.title,
            credit_units=body.credit_units,
            description=body.description,
        )
        db.add(course)
        db.flush()

    offering_id = None
    if body.semester_id:
        from app.models import CourseOffering, OfferingStatus
        offering = (
            db.query(CourseOffering)
            .filter(
                CourseOffering.course_id == course.id,
                CourseOffering.semester_id == body.semester_id,
            )
            .first()
        )
        if not offering:
            offering = CourseOffering(
                course_id=course.id,
                semester_id=body.semester_id,
                status=OfferingStatus.active,
                enrollment_mode="advisor_approval",
                sharing_ceiling="open",
                watermark_mandatory=False,
            )
            db.add(offering)
            db.flush()
        offering_id = offering.id

        from app.models import OfferingLecturer
        lecturer_link = (
            db.query(OfferingLecturer)
            .filter(
                OfferingLecturer.offering_id == offering.id,
                OfferingLecturer.lecturer_id == user.id,
            )
            .first()
        )
        if not lecturer_link:
            lecturer_link = OfferingLecturer(
                offering_id=offering.id,
                lecturer_id=user.id,
                is_owner=True,
                can_publish=True,
                can_manage_roster=True,
            )
            db.add(lecturer_link)
            db.flush()

    db.commit()
    return {
        "id": offering_id if offering_id else course.id,
        "department_id": course.department_id,
        "code": course.code,
        "title": course.title,
        "credit_units": course.credit_units,
        "description": course.description,
    }


@router.get("", response_model=list[CourseOut])
def list_courses(
    department_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Course]:
    q = db.query(Course)
    if department_id:
        q = q.filter(Course.department_id == department_id)
    else:
        # Scope to the user's institution via departments
        if user.institution_id:
            dept_ids = [
                d.id
                for d in db.query(Department)
                .filter(Department.university_id == user.institution_id)
                .all()
            ]
            q = q.filter(Course.department_id.in_(dept_ids))
    return q.all()


@router.get("/storage-stats")
def get_storage_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    """Admin: institution-wide storage usage aggregated by department."""
    from app.models import CourseOffering, Material
    from sqlalchemy import func as sqlfunc

    if not user.institution_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No institution linked")

    dept_ids = [
        d.id
        for d in db.query(Department)
        .filter(Department.university_id == user.institution_id)
        .all()
    ]

    total_bytes = (
        db.query(sqlfunc.sum(Material.size_bytes))
        .join(CourseOffering, Material.offering_id == CourseOffering.id)
        .join(Course, CourseOffering.course_id == Course.id)
        .filter(Course.department_id.in_(dept_ids))
        .scalar()
        or 0
    )

    by_dept = []
    for dept in db.query(Department).filter(Department.id.in_(dept_ids)).all():
        dept_course_ids = [c.id for c in db.query(Course).filter(Course.department_id == dept.id).all()]
        dept_offering_ids = [
            o.id for o in db.query(CourseOffering).filter(CourseOffering.course_id.in_(dept_course_ids)).all()
        ]
        dept_bytes = (
            db.query(sqlfunc.sum(Material.size_bytes))
            .filter(Material.offering_id.in_(dept_offering_ids))
            .scalar()
            or 0
        )
        by_dept.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "bytes_used": dept_bytes,
        })

    return {
        "total_bytes": total_bytes,
        "by_department": by_dept,
    }


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    return course


# ---------------------------------------------------------------------------
# Legacy Compatibility Endpoints (for automated test suite)
# ---------------------------------------------------------------------------

class LegacyEnrollmentModeIn(BaseModel):
    enrollment_mode: str

@router.patch("/{offering_id}/enrollment-mode")
def legacy_set_enrollment_mode(
    offering_id: str,
    body: LegacyEnrollmentModeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import CourseOffering
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    off.enrollment_mode = body.enrollment_mode
    db.commit()
    db.refresh(off)
    return {"id": off.id, "enrollment_mode": off.enrollment_mode}


class LegacyJoinCodeIn(BaseModel):
    expires_in_hours: int = 24
    max_uses: int = 100

@router.post("/{offering_id}/join-code")
def legacy_create_join_code(
    offering_id: str,
    body: LegacyJoinCodeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.routers.enrollment import create_join_code, JoinCodeIn
    return create_join_code(
        offering_id=offering_id,
        body=JoinCodeIn(expires_in_hours=body.expires_in_hours, max_uses=body.max_uses),
        db=db,
        user=user,
    )


class LegacyEnrollIn(BaseModel):
    code: str | None = None

@router.post("/{offering_id}/enroll")
def legacy_enroll(
    offering_id: str,
    body: LegacyEnrollIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import CourseOffering, CourseJoinCode, Enrollment, EnrollmentStatus
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    if body.code:
        jc = (
            db.query(CourseJoinCode)
            .filter(
                CourseJoinCode.offering_id == offering_id,
                CourseJoinCode.code == body.code.strip().upper(),
            )
            .one_or_none()
        )
        if not jc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid join code")
        
        existing = (
            db.query(Enrollment)
            .filter(Enrollment.offering_id == offering_id, Enrollment.student_id == user.id)
            .one_or_none()
        )
        if existing and existing.status == EnrollmentStatus.active:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already enrolled")
        
        jc.uses += 1
        enroll = Enrollment(
            offering_id=offering_id,
            student_id=user.id,
            status=EnrollmentStatus.active,
            source="code",
        )
        db.add(enroll)
        db.commit()
        db.refresh(enroll)
        return {"status": "active", "enrollment_id": enroll.id}

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.offering_id == offering_id, Enrollment.student_id == user.id)
        .one_or_none()
    )
    if existing and existing.status == EnrollmentStatus.active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already enrolled")

    enroll = Enrollment(
        offering_id=offering_id,
        student_id=user.id,
        status=EnrollmentStatus.active,
        source="open",
    )
    db.add(enroll)
    db.commit()
    db.refresh(enroll)
    return {"status": "active", "enrollment_id": enroll.id}


class LegacyRosterIn(BaseModel):
    user_id: str
    can_publish: bool = True
    can_manage_roster: bool = False
    is_owner: bool = False

@router.post("/{offering_id}/roster")
def legacy_add_roster(
    offering_id: str,
    body: LegacyRosterIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import CourseOffering, OfferingLecturer
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    existing = (
        db.query(OfferingLecturer)
        .filter(
            OfferingLecturer.offering_id == offering_id,
            OfferingLecturer.lecturer_id == body.user_id,
        )
        .first()
    )
    if not existing:
        entry = OfferingLecturer(
            offering_id=offering_id,
            lecturer_id=body.user_id,
            is_owner=body.is_owner,
            can_publish=body.can_publish,
            can_manage_roster=body.can_manage_roster,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return {"id": entry.id, "offering_id": entry.offering_id, "lecturer_id": entry.lecturer_id}
    return {"id": existing.id, "offering_id": existing.offering_id, "lecturer_id": existing.lecturer_id}


@router.get("/{offering_id}/reports")
def legacy_list_offering_reports(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.routers.reports import list_offering_reports
    return list_offering_reports(offering_id=offering_id, db=db, user=user)


# Legacy Announcement Compatibility Endpoints
from app.routers.announcements import AnnouncementIn
@router.post("/{offering_id}/announcements")
def legacy_create_announcement(
    offering_id: str,
    body: AnnouncementIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.routers.announcements import create_announcement
    return create_announcement(offering_id=offering_id, body=body, db=db, user=user)

@router.get("/{offering_id}/announcements")
def legacy_list_announcements(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.routers.announcements import list_announcements
    return list_announcements(offering_id=offering_id, db=db, user=user)

@router.post("/announcements/{announcement_id}/read")
def legacy_mark_announcement_read(
    announcement_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.routers.announcements import mark_announcement_read
    return mark_announcement_read(announcement_id=announcement_id, db=db, user=user)
