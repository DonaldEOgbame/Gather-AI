from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    AccountStatus,
    AcademicSession,
    CourseOffering,
    Enrollment,
    GlobalRole,
    OfferingLecturer,
    Semester,
    SemesterStatus,
    SessionStatus,
    University,
    User,
)
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = db.get(User, payload["sub"])
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    # Module 6D status enforcement: suspended/archived/invited cannot act on the server.
    if user.status == AccountStatus.suspended:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")
    if user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Account not active ({user.status.value})")
    return user


def require_role(*roles: GlobalRole):
    """Dependency factory guarding a global role (Superadmin / Admin / Lecturer / Student)."""

    def _check(user: User = Depends(get_current_user)) -> User:
        if user.global_role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user

    return _check


# ---------------------------------------------------------------------------
# Offering-level access helpers (replaces require_course_member)
# ---------------------------------------------------------------------------

def get_offering_lecturer_entry(offering_id: str, user: User, db: Session) -> OfferingLecturer | None:
    return (
        db.query(OfferingLecturer)
        .filter(
            OfferingLecturer.offering_id == offering_id,
            OfferingLecturer.lecturer_id == user.id,
        )
        .one_or_none()
    )


def require_offering_member(offering_id: str, user: User, db: Session) -> OfferingLecturer:
    """User must be on the offering's teaching team. Admins bypass."""
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin):
        # Admins act as an implicit full-privilege member.
        return OfferingLecturer(
            offering_id=offering_id,
            lecturer_id=user.id,
            is_owner=True,
            can_publish=True,
            can_manage_roster=True,
        )
    entry = get_offering_lecturer_entry(offering_id, user, db)
    if entry is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not assigned to this offering")
    return entry


def require_offering_publisher(offering_id: str, user: User, db: Session) -> OfferingLecturer:
    """User must have can_publish=True on this offering."""
    entry = require_offering_member(offering_id, user, db)
    if not entry.can_publish:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing 'can_publish' permission")
    return entry


def require_offering_owner(offering_id: str, user: User, db: Session) -> OfferingLecturer:
    """User must be the owner of this offering (or admin)."""
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin):
        return OfferingLecturer(
            offering_id=offering_id,
            lecturer_id=user.id,
            is_owner=True,
            can_publish=True,
            can_manage_roster=True,
        )
    entry = get_offering_lecturer_entry(offering_id, user, db)
    if entry is None or not entry.is_owner:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Must be offering owner")
    return entry


# ---------------------------------------------------------------------------
# Institution-scoped active semester / session helpers
# ---------------------------------------------------------------------------

def get_active_semester(institution_id: str, db: Session) -> Semester:
    """Returns the single active Semester for the given institution.
    Raises 404 if no semester is currently active."""
    active_sem = (
        db.query(Semester)
        .join(AcademicSession, Semester.session_id == AcademicSession.id)
        .filter(
            AcademicSession.university_id == institution_id,
            Semester.status == SemesterStatus.active,
        )
        .one_or_none()
    )
    if active_sem is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No active semester found for this institution",
        )
    return active_sem


def get_active_session(institution_id: str, db: Session) -> AcademicSession:
    """Returns the active AcademicSession for the institution."""
    active_session = (
        db.query(AcademicSession)
        .filter(
            AcademicSession.university_id == institution_id,
            AcademicSession.status == SessionStatus.active,
        )
        .one_or_none()
    )
    if active_session is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No active academic session found for this institution",
        )
    return active_session


def get_student_enrollment(offering_id: str, student_id: str, db: Session) -> Enrollment | None:
    return (
        db.query(Enrollment)
        .filter(
            Enrollment.offering_id == offering_id,
            Enrollment.student_id == student_id,
        )
        .one_or_none()
    )


def require_student_enrolled(offering_id: str, user: User, db: Session) -> Enrollment:
    """Student must be actively enrolled in the offering. Lecturers/admins bypass."""
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin, GlobalRole.lecturer):
        return Enrollment(offering_id=offering_id, student_id=user.id, status="active", source="bypass")
    enroll = get_student_enrollment(offering_id, user.id, db)
    if enroll is None or enroll.status != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not enrolled in this offering")
    return enroll


# ---------------------------------------------------------------------------
# Device session helper
# ---------------------------------------------------------------------------

def get_current_session(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Extract the active device session from the access token."""
    from app.models import Session as SessionModel
    payload = decode_token(token)
    if not payload or "sid" not in payload:
        return None
    sess = db.get(SessionModel, payload["sid"])
    if sess is None or sess.revoked_at is not None:
        return None
    return sess
