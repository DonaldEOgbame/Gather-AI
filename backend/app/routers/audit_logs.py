from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import AuditLog, OfferingLecturer, CourseOffering, Material, GlobalRole, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/courses/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AuditLog]:
    """Retrieve audit logs for the institution.
    - Admins see all logs.
    - Lecturers see logs related to offerings they are assigned to.
    - Students are forbidden.
    """
    if user.global_role == GlobalRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot access audit logs",
        )

    if user.global_role == GlobalRole.admin:
        # Admin gets everything in their institution
        return (
            db.query(AuditLog)
            .filter(AuditLog.institution_id == user.institution_id)
            .order_by(AuditLog.created_at.desc())
            .all()
        )

    # Lecturer gets logs related to their assigned offerings
    roster_entries = db.query(OfferingLecturer).filter(OfferingLecturer.lecturer_id == user.id).all()
    offering_ids = {r.offering_id for r in roster_entries}

    all_logs = (
        db.query(AuditLog)
        .filter(AuditLog.institution_id == user.institution_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )

    visible_logs = []
    # Cache material -> offering and roster -> offering lookups to avoid N+1 queries
    material_to_offering = {}
    roster_to_offering = {}

    for log in all_logs:
        # 1. Action was performed by the lecturer themselves
        if log.user_id == user.id:
            visible_logs.append(log)
            continue

        # 2. Target is directly an offering assigned to them
        if log.target_id in offering_ids:
            visible_logs.append(log)
            continue

        # 3. Action is roster-related, check if roster offering is assigned
        if log.action in ("add_roster", "update_roster", "remove_roster") and log.target_id:
            offering_id = roster_to_offering.get(log.target_id)
            if offering_id is None:
                r_entry = db.get(OfferingLecturer, log.target_id)
                offering_id = r_entry.offering_id if r_entry else ""
                roster_to_offering[log.target_id] = offering_id
            if offering_id in offering_ids:
                visible_logs.append(log)
                continue

        # 4. Action is material-related, check if material offering is assigned
        if log.action in ("create_material", "update_material", "publish_material", "delete_material", "report_file") and log.target_id:
            offering_id = material_to_offering.get(log.target_id)
            if offering_id is None:
                mat = db.get(Material, log.target_id)
                offering_id = mat.offering_id if mat else ""
                material_to_offering[log.target_id] = offering_id
            if offering_id in offering_ids:
                visible_logs.append(log)
                continue

    return visible_logs
