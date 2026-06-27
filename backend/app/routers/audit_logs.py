from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.db import get_db
from app.deps import get_current_user
from app.models import AuditLog, OfferingLecturer, CourseOffering, Material, GlobalRole, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/courses/audit-logs", tags=["audit-logs"])

CATEGORY_ACTIONS: dict[str, list[str]] = {
    "Users": ["roster_import", "self_register", "suspend_account", "approve_user", "reject_user"],
    "Roles": ["approve_user", "reject_user", "change_role", "add_roster", "remove_roster", "update_roster"],
    "Policy": ["patch_institution", "add_timetable_slot", "import_timetable", "publish_material", "create_material"],
}


class AuditLogOutExtended(AuditLogOut):
    user_display_name: str | None = None
    user_email: str | None = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[AuditLogOutExtended])
def get_audit_logs(
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    if user.global_role == GlobalRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot access audit logs",
        )

    base_q = (
        db.query(AuditLog)
        .filter(AuditLog.institution_id == user.institution_id)
        .order_by(AuditLog.created_at.desc())
    )

    if category and category in CATEGORY_ACTIONS:
        base_q = base_q.filter(AuditLog.action.in_(CATEGORY_ACTIONS[category]))

    if user.global_role == GlobalRole.admin:
        logs = base_q.all()
    else:
        all_logs = base_q.all()
        roster_entries = db.query(OfferingLecturer).filter(OfferingLecturer.lecturer_id == user.id).all()
        offering_ids = {r.offering_id for r in roster_entries}
        material_to_offering: dict[str, str] = {}
        roster_to_offering: dict[str, str] = {}
        logs = []
        for log in all_logs:
            if log.user_id == user.id:
                logs.append(log)
                continue
            if log.target_id in offering_ids:
                logs.append(log)
                continue
            if log.action in ("add_roster", "update_roster", "remove_roster") and log.target_id:
                offering_id = roster_to_offering.get(log.target_id)
                if offering_id is None:
                    r_entry = db.get(OfferingLecturer, log.target_id)
                    offering_id = r_entry.offering_id if r_entry else ""
                    roster_to_offering[log.target_id] = offering_id
                if offering_id in offering_ids:
                    logs.append(log)
                    continue
            if log.action in ("create_material", "update_material", "publish_material", "delete_material", "report_file") and log.target_id:
                offering_id = material_to_offering.get(log.target_id)
                if offering_id is None:
                    mat = db.get(Material, log.target_id)
                    offering_id = mat.offering_id if mat else ""
                    material_to_offering[log.target_id] = offering_id
                if offering_id in offering_ids:
                    logs.append(log)
                    continue

    # Enrich with user display info
    user_cache: dict[str, User] = {}
    result = []
    for log in logs:
        actor = user_cache.get(log.user_id)
        if actor is None:
            actor = db.get(User, log.user_id)
            if actor:
                user_cache[log.user_id] = actor
        result.append({
            "id": log.id,
            "institution_id": log.institution_id,
            "user_id": log.user_id,
            "action": log.action,
            "target_id": log.target_id,
            "details": log.details,
            "created_at": log.created_at,
            "user_display_name": actor.display_name if actor else None,
            "user_email": actor.email if actor else None,
        })
    return result
