from sqlalchemy.orm import Session
from app.models import AuditLog, User


def log_action(
    db: Session,
    user_id: str,
    action: str,
    target_id: str | None = None,
    details: str | None = None,
) -> AuditLog:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("User not found for audit logging")

    # If the user has no institution (e.g. bootstrap/admin without institution initially, 
    # though users usually have one), fallback to a placeholder or skip.
    institution_id = user.institution_id or "00000000-0000-0000-0000-000000000000"

    log = AuditLog(
        institution_id=institution_id,
        user_id=user_id,
        action=action,
        target_id=target_id,
        details=details,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
