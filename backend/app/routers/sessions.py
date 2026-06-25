"""C1: Academic Session management.

Hierarchy: Institution → AcademicSession → Semester (First + Second).

Rules:
- Creating a session auto-creates both First and Second semesters (status=upcoming).
- Activating a semester is exclusive: exactly one semester is 'active' per institution.
  All other semesters in the institution flip to 'archived' (if was active) or stay 'upcoming'.
- Archiving a session is only allowed once both its semesters are archived.
- GET /sessions/current returns the active session + active semester — the anchor
  for all 'current' role views.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.audit import log_action
from app.db import get_db
from app.deps import get_active_semester, get_current_user, get_active_session, require_role
from app.models import (
    AcademicSession,
    GlobalRole,
    Semester,
    SemesterStatus,
    SemesterTerm,
    SessionStatus,
    University,
    User,
)
from app.schemas import (
    AcademicSessionIn,
    AcademicSessionOut,
    CurrentContextOut,
    SemesterOut,
    SemesterPatchIn,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _build_session_out(sess: AcademicSession) -> dict:
    """Serialize an AcademicSession with its semesters for the response."""
    sems = sorted(sess.semesters, key=lambda s: s.term.value)
    return {
        "id": sess.id,
        "name": sess.name,
        "start_date": sess.start_date,
        "end_date": sess.end_date,
        "status": sess.status,
        "semesters": [
            {
                "id": s.id,
                "term": s.term,
                "start_date": s.start_date,
                "end_date": s.end_date,
                "registration_open": s.registration_open,
                "late_registration_open": s.late_registration_open,
                "credit_unit_cap": s.credit_unit_cap,
                "status": s.status,
            }
            for s in sems
        ],
    }


def _institution_id_for_user(user: User, db: Session) -> str:
    if not user.institution_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User has no institution")
    return user.institution_id


# ---------------------------------------------------------------------------
# C1: Create academic session (Admin only)
# ---------------------------------------------------------------------------

@router.post("", response_model=AcademicSessionOut, status_code=status.HTTP_201_CREATED)
def create_academic_session(
    body: AcademicSessionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    """Create an academic session and automatically seed First + Second semesters."""
    inst_id = _institution_id_for_user(user, db)

    # Guard: name must be unique per institution
    existing = (
        db.query(AcademicSession)
        .filter(
            AcademicSession.university_id == inst_id,
            AcademicSession.name == body.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Academic session '{body.name}' already exists for this institution",
        )

    sess = AcademicSession(
        university_id=inst_id,
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        status=SessionStatus.upcoming,
    )
    db.add(sess)
    db.flush()

    # Auto-create First and Second semesters
    for term in (SemesterTerm.first, SemesterTerm.second):
        sem = Semester(
            session_id=sess.id,
            term=term,
            status=SemesterStatus.upcoming,
            registration_open=False,
            late_registration_open=False,
        )
        db.add(sem)

    db.commit()
    db.refresh(sess)
    log_action(db, user.id, "create_academic_session", sess.id, body.name)
    return _build_session_out(sess)


# ---------------------------------------------------------------------------
# List sessions for the user's institution
# ---------------------------------------------------------------------------

@router.get("", response_model=list[AcademicSessionOut])
def list_academic_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    inst_id = _institution_id_for_user(user, db)
    sessions = (
        db.query(AcademicSession)
        .filter(AcademicSession.university_id == inst_id)
        .order_by(AcademicSession.name.desc())
        .all()
    )
    return [_build_session_out(s) for s in sessions]


# ---------------------------------------------------------------------------
# GET /sessions/current — the universal anchor for 'current' role views
# ---------------------------------------------------------------------------

@router.get("/current", response_model=CurrentContextOut)
def get_current_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Returns the active AcademicSession + active Semester.
    Used by Home, CoursesTab, DraftsTab to scope all queries to 'now'."""
    inst_id = _institution_id_for_user(user, db)
    active_session = get_active_session(inst_id, db)
    active_sem = get_active_semester(inst_id, db)
    return {
        "session": _build_session_out(active_session),
        "semester": {
            "id": active_sem.id,
            "term": active_sem.term,
            "start_date": active_sem.start_date,
            "end_date": active_sem.end_date,
            "registration_open": active_sem.registration_open,
            "late_registration_open": active_sem.late_registration_open,
            "credit_unit_cap": active_sem.credit_unit_cap,
            "status": active_sem.status,
        },
    }


# ---------------------------------------------------------------------------
# Patch semester metadata (dates, registration window)
# ---------------------------------------------------------------------------

@router.patch("/{session_id}/semesters/{term}", response_model=SemesterOut)
def patch_semester(
    session_id: str,
    term: SemesterTerm,
    body: SemesterPatchIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    sem = (
        db.query(Semester)
        .filter(Semester.session_id == session_id, Semester.term == term)
        .one_or_none()
    )
    if sem is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Semester not found")

    if body.start_date is not None:
        sem.start_date = body.start_date
    if body.end_date is not None:
        sem.end_date = body.end_date
    if body.registration_open is not None:
        sem.registration_open = body.registration_open
    if body.late_registration_open is not None:
        sem.late_registration_open = body.late_registration_open
    if body.credit_unit_cap is not None:
        sem.credit_unit_cap = body.credit_unit_cap

    db.commit()
    db.refresh(sem)
    log_action(db, user.id, "patch_semester", sem.id, f"term={term.value}")
    return {
        "id": sem.id,
        "term": sem.term,
        "start_date": sem.start_date,
        "end_date": sem.end_date,
        "registration_open": sem.registration_open,
        "late_registration_open": sem.late_registration_open,
        "credit_unit_cap": sem.credit_unit_cap,
        "status": sem.status,
    }


# ---------------------------------------------------------------------------
# Activate a semester (exclusive — flips all others in institution)
# ---------------------------------------------------------------------------

@router.post("/{session_id}/semesters/{term}/activate", response_model=SemesterOut)
def activate_semester(
    session_id: str,
    term: SemesterTerm,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    """Activate a semester exclusively.
    
    - The target semester flips to 'active'.
    - Any previously active semester in the institution flips to 'archived'.
    - The target session is set to 'active' if not already.
    - Sessions with all-archived semesters are set to 'archived' automatically.
    """
    inst_id = _institution_id_for_user(user, db)

    target_sess = db.get(AcademicSession, session_id)
    if not target_sess or target_sess.university_id != inst_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Academic session not found")

    if target_sess.status == SessionStatus.archived:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Cannot activate a semester in an archived session",
        )

    target_sem = (
        db.query(Semester)
        .filter(Semester.session_id == session_id, Semester.term == term)
        .one_or_none()
    )
    if target_sem is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Semester not found")

    # Archive all currently-active semesters in this institution (exclusive rule)
    all_institution_sems = (
        db.query(Semester)
        .join(AcademicSession, Semester.session_id == AcademicSession.id)
        .filter(
            AcademicSession.university_id == inst_id,
            Semester.status == SemesterStatus.active,
        )
        .all()
    )
    for s in all_institution_sems:
        s.status = SemesterStatus.archived

    # Activate the target
    target_sem.status = SemesterStatus.active

    # Activate the containing session
    target_sess.status = SessionStatus.active

    # Auto-archive other sessions that had their last active semester archived
    other_sessions = (
        db.query(AcademicSession)
        .filter(
            AcademicSession.university_id == inst_id,
            AcademicSession.status == SessionStatus.active,
            AcademicSession.id != session_id,
        )
        .all()
    )
    for sess in other_sessions:
        if all(s.status == SemesterStatus.archived for s in sess.semesters):
            sess.status = SessionStatus.archived

    db.commit()
    db.refresh(target_sem)
    log_action(db, user.id, "activate_semester", target_sem.id, f"session={session_id} term={term.value}")

    return {
        "id": target_sem.id,
        "term": target_sem.term,
        "start_date": target_sem.start_date,
        "end_date": target_sem.end_date,
        "registration_open": target_sem.registration_open,
        "late_registration_open": target_sem.late_registration_open,
        "credit_unit_cap": target_sem.credit_unit_cap,
        "status": target_sem.status,
    }


# ---------------------------------------------------------------------------
# Archive a session (only when both semesters are archived)
# ---------------------------------------------------------------------------

@router.post("/{session_id}/archive")
def archive_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> dict:
    inst_id = _institution_id_for_user(user, db)
    sess = db.get(AcademicSession, session_id)
    if not sess or sess.university_id != inst_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Academic session not found")

    non_archived = [s for s in sess.semesters if s.status != SemesterStatus.archived]
    if non_archived:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot archive session: {len(non_archived)} semester(s) are not yet archived",
        )

    sess.status = SessionStatus.archived
    db.commit()
    log_action(db, user.id, "archive_session", session_id, sess.name)
    return {"status": "archived", "session_id": session_id}
