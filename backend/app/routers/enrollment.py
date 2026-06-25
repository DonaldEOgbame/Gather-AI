"""C3: Student Registration — advisor-approval model (Nigerian standard).

Flow:
  1. Registration window opens (semester.registration_open = True).
  2. Student self-selects offerings (creating/updating a StudentRegistration with status=advisor_pending).
     - Credit-unit cap is enforced at submission time.
     - Missing the window forfeits the semester (late window optional, is_late=True).
  3. Advisor/HOD reviews the student's full registration batch → approve / reject.
  4. On approval: Enrollment rows are created for each RegistrationItem.
  5. On rejection: student may revise and re-submit (within the window).

Edge-case modes per offering (for non-standard situations):
  - 'roster': Admin pre-seeds enrollment rows directly.
  - 'code': Student uses a join code for direct active enrollment.
  - 'open': Free join (no approval needed — used for elective/workshop offerings).
"""

import random
import string
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.audit import log_action
from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import (
    Course,
    CourseJoinCode,
    CourseOffering,
    Enrollment,
    EnrollmentStatus,
    GlobalRole,
    OfferingLecturer,
    RegistrationItem,
    Semester,
    SemesterStatus,
    StudentRegistration,
    User,
)
from app.notification_service import NotificationService
from app.schemas import (
    RegistrationApprovalIn,
    RegistrationItemOut,
    RegistrationSubmitIn,
    StudentRegistrationOut,
)

router = APIRouter(prefix="/registration", tags=["registration"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_can_manage_offering(offering_id: str, user: User, db: Session):
    """Lecturers need can_manage_roster or admin bypass."""
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin):
        return
    entry = (
        db.query(OfferingLecturer)
        .filter(OfferingLecturer.offering_id == offering_id, OfferingLecturer.lecturer_id == user.id)
        .one_or_none()
    )
    if not entry or not entry.can_manage_roster:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requires can_manage_roster permission")


def _registration_out(reg: StudentRegistration) -> dict:
    return {
        "id": reg.id,
        "student_id": reg.student_id,
        "semester_id": reg.semester_id,
        "approved_by": reg.approved_by,
        "status": reg.status,
        "total_credit_units": reg.total_credit_units,
        "is_late": reg.is_late,
        "submitted_at": reg.submitted_at,
        "approved_at": reg.approved_at,
        "items": [{"id": ri.id, "offering_id": ri.offering_id} for ri in reg.registration_items],
    }


# ---------------------------------------------------------------------------
# C3: Student submits/updates their registration (course selection)
# ---------------------------------------------------------------------------

@router.post("", response_model=StudentRegistrationOut, status_code=status.HTTP_201_CREATED)
def submit_registration(
    body: RegistrationSubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Student self-selects offerings for the semester.
    
    Validates:
    - Registration window is open (registration_open OR late_registration_open).
    - Credit-unit total does not exceed semester cap.
    - All selected offerings belong to this semester.
    - Student does not already have an 'active' registration (can only resubmit if rejected/pending).
    """
    if user.global_role != GlobalRole.student:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only students can submit registrations")

    sem = db.get(Semester, body.semester_id)
    if not sem:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Semester not found")

    if sem.status == SemesterStatus.archived:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot register for an archived semester")

    is_late = False
    if not sem.registration_open:
        if sem.late_registration_open:
            is_late = True
        else:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Registration window is closed for this semester",
            )

    # Validate all offerings exist and belong to this semester
    offerings = []
    for oid in body.offering_ids:
        off = db.get(CourseOffering, oid)
        if not off or off.semester_id != body.semester_id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Offering {oid} is not valid for this semester",
            )
        offerings.append(off)

    # Credit-unit cap check
    from app.models import Course
    total_credits = 0
    for off in offerings:
        course = db.get(Course, off.course_id)
        if course:
            total_credits += course.credit_units
    if total_credits > sem.credit_unit_cap:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Selected courses total {total_credits} credit units, exceeding the cap of {sem.credit_unit_cap}",
        )

    # Check for existing registration
    existing_reg = (
        db.query(StudentRegistration)
        .filter(
            StudentRegistration.student_id == user.id,
            StudentRegistration.semester_id == body.semester_id,
        )
        .one_or_none()
    )
    if existing_reg:
        if existing_reg.status == "active":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Registration is already approved and active for this semester",
            )
        # Allow resubmission if pending or rejected — delete old items and re-create
        for item in existing_reg.registration_items:
            db.delete(item)
        existing_reg.status = "advisor_pending"
        existing_reg.total_credit_units = total_credits
        existing_reg.is_late = is_late
        existing_reg.submitted_at = datetime.now(timezone.utc)
        existing_reg.approved_by = None
        existing_reg.approved_at = None
        db.flush()
        for off in offerings:
            db.add(RegistrationItem(registration_id=existing_reg.id, offering_id=off.id))
        db.commit()
        db.refresh(existing_reg)
        log_action(db, user.id, "resubmit_registration", existing_reg.id, f"semester={body.semester_id} credits={total_credits}")
        return _registration_out(existing_reg)

    # Create fresh registration
    reg = StudentRegistration(
        student_id=user.id,
        semester_id=body.semester_id,
        status="advisor_pending",
        total_credit_units=total_credits,
        is_late=is_late,
    )
    db.add(reg)
    db.flush()
    for off in offerings:
        db.add(RegistrationItem(registration_id=reg.id, offering_id=off.id))
    db.commit()
    db.refresh(reg)
    log_action(db, user.id, "submit_registration", reg.id, f"semester={body.semester_id} credits={total_credits}")
    return _registration_out(reg)


# ---------------------------------------------------------------------------
# C3: Student views their own registration
# ---------------------------------------------------------------------------

@router.get("/my/{semester_id}", response_model=StudentRegistrationOut)
def get_my_registration(
    semester_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    reg = (
        db.query(StudentRegistration)
        .filter(
            StudentRegistration.student_id == user.id,
            StudentRegistration.semester_id == semester_id,
        )
        .one_or_none()
    )
    if not reg:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No registration found for this semester")
    return _registration_out(reg)


# ---------------------------------------------------------------------------
# C3: Advisor/Admin lists pending registrations for a semester
# ---------------------------------------------------------------------------

@router.get("/pending/{semester_id}", response_model=list[StudentRegistrationOut])
def list_pending_registrations(
    semester_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    if user.global_role not in (GlobalRole.admin, GlobalRole.superadmin, GlobalRole.lecturer):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Advisors/admins only")
    regs = (
        db.query(StudentRegistration)
        .filter(
            StudentRegistration.semester_id == semester_id,
            StudentRegistration.status == "advisor_pending",
        )
        .all()
    )
    return [_registration_out(r) for r in regs]


# ---------------------------------------------------------------------------
# C3: Advisor/Admin approves or rejects a student's registration batch
# ---------------------------------------------------------------------------

@router.post("/{registration_id}/approve", response_model=StudentRegistrationOut)
def approve_registration(
    registration_id: str,
    body: RegistrationApprovalIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Advisor approves or rejects a student's full registration batch.
    
    On approval:
    - StudentRegistration.status → 'active'
    - Creates Enrollment rows for each RegistrationItem.
    On rejection:
    - StudentRegistration.status → 'rejected'
    - Student may revise and resubmit (within the window).
    """
    if user.global_role not in (GlobalRole.admin, GlobalRole.superadmin, GlobalRole.lecturer):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Advisors/admins only")

    reg = db.get(StudentRegistration, registration_id)
    if not reg:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    if reg.status != "advisor_pending":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Registration is not pending (current status: {reg.status})",
        )

    ns = NotificationService()
    student = db.get(User, reg.student_id)
    student_name = student.display_name or student.full_name if student else "Student"

    if body.approve:
        reg.status = "active"
        reg.approved_by = user.id
        reg.approved_at = datetime.now(timezone.utc)

        # Create enrollment rows for each registration item
        for item in reg.registration_items:
            existing = (
                db.query(Enrollment)
                .filter(
                    Enrollment.offering_id == item.offering_id,
                    Enrollment.student_id == reg.student_id,
                )
                .one_or_none()
            )
            if not existing:
                enroll = Enrollment(
                    offering_id=item.offering_id,
                    student_id=reg.student_id,
                    status=EnrollmentStatus.active,
                    source="registration",
                )
                db.add(enroll)

        db.commit()
        db.refresh(reg)
        log_action(db, user.id, "approve_registration", registration_id, f"student={reg.student_id}")

        if student:
            ns.send_notification_to_user(
                db=db,
                user_id=reg.student_id,
                title="Registration Approved",
                body=f"Your course registration for the semester has been approved.",
                notif_type="roster_changes",
            )
    else:
        reg.status = "rejected"
        db.commit()
        db.refresh(reg)
        log_action(db, user.id, "reject_registration", registration_id, f"student={reg.student_id} note={body.note}")

        if student:
            ns.send_notification_to_user(
                db=db,
                user_id=reg.student_id,
                title="Registration Rejected",
                body=f"Your course registration was rejected. You may revise and resubmit within the registration window.",
                notif_type="roster_changes",
            )

    return _registration_out(reg)


# ---------------------------------------------------------------------------
# Edge-case: join-code enrollment (code mode per offering)
# ---------------------------------------------------------------------------

join_code_router = APIRouter(prefix="/offerings", tags=["enrollment"])


class EnrollByCodeIn(BaseModel):
    code: str


@join_code_router.post("/{offering_id}/enroll-code")
def enroll_by_code(
    offering_id: str,
    body: EnrollByCodeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if user.global_role != GlobalRole.student:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Students only")

    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    if off.enrollment_mode != "code":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This offering does not use join codes")

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
    if jc.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Join code expired")
    if jc.uses >= jc.max_uses:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Join code usage limit reached")

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
    log_action(db, user.id, "enroll_by_code", offering_id, f"code={body.code}")
    return {"status": "active", "enrollment_id": enroll.id}


# ---------------------------------------------------------------------------
# Edge-case: join-code generation (admin/lecturer)
# ---------------------------------------------------------------------------

class JoinCodeIn(BaseModel):
    expires_in_hours: int = 24
    max_uses: int = 100


@join_code_router.post("/{offering_id}/join-code")
def create_join_code(
    offering_id: str,
    body: JoinCodeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    _check_can_manage_offering(offering_id, user, db)

    code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(hours=body.expires_in_hours)

    jc = CourseJoinCode(
        code=code,
        offering_id=offering_id,
        expires_at=expires_at,
        max_uses=body.max_uses,
        uses=0,
    )
    db.add(jc)
    db.commit()
    log_action(db, user.id, "create_join_code", offering_id, f"code={code}")
    return {"code": code, "expires_at": expires_at, "max_uses": body.max_uses}


# ---------------------------------------------------------------------------
# List enrollments for an offering (lecturer/admin)
# ---------------------------------------------------------------------------

@join_code_router.get("/{offering_id}/enrollments")
def list_enrollments(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    _check_can_manage_offering(offering_id, user, db)

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.offering_id == offering_id)
        .all()
    )
    out = []
    for e in enrollments:
        student = db.get(User, e.student_id)
        if student:
            out.append({
                "enrollment_id": e.id,
                "student_id": student.id,
                "email": student.email,
                "full_name": student.full_name,
                "matric_or_staff_id": student.matric_or_staff_id,
                "status": e.status.value,
                "source": e.source,
                "enrolled_at": e.enrolled_at,
            })
    return out
