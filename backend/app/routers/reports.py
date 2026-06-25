from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.audit import log_action
from app.db import get_db
from app.deps import get_current_user, require_offering_member
from app.models import (
    CourseOffering,
    Enrollment,
    EnrollmentStatus,
    FileReport,
    GlobalRole,
    Material,
    User,
)

router = APIRouter(prefix="", tags=["reports"])


class ReportIn(BaseModel):
    reason: str
    note: str | None = None


class ReportStatusUpdate(BaseModel):
    status: str  # "resolved" | "open"


@router.post("/materials/{material_id}/report")
def report_file(
    material_id: str,
    body: ReportIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    if user.global_role == GlobalRole.student:
        enrolled = (
            db.query(Enrollment)
            .filter(
                Enrollment.offering_id == material.offering_id,
                Enrollment.student_id == user.id,
                Enrollment.status == EnrollmentStatus.active,
            )
            .first()
        )
        if not enrolled:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not enrolled in this offering")
    else:
        require_offering_member(material.offering_id, user, db)

    report = FileReport(
        material_id=material_id,
        reporter_id=user.id,
        reason=body.reason.strip(),
        note=body.note.strip() if body.note else None,
        status="open",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_action(db, user.id, "report_file", material.offering_id, f"Reported {material_id}: {body.reason}")
    return {
        "id": report.id,
        "material_id": report.material_id,
        "reporter_id": report.reporter_id,
        "reason": report.reason,
        "note": report.note,
        "status": report.status,
        "created_at": report.created_at,
    }


@router.get("/offerings/{offering_id}/reports")
def list_offering_reports(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    entry = require_offering_member(offering_id, user, db)
    if not (entry.can_publish or user.global_role in (GlobalRole.admin, GlobalRole.superadmin)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requires publish permissions")

    reports = (
        db.query(FileReport)
        .join(Material, FileReport.material_id == Material.id)
        .filter(Material.offering_id == offering_id)
        .order_by(FileReport.created_at.desc())
        .all()
    )
    out = []
    for r in reports:
        m = db.get(Material, r.material_id)
        reporter = db.get(User, r.reporter_id)
        out.append({
            "id": r.id,
            "material_id": r.material_id,
            "material_title": m.title if m else "Unknown",
            "reporter_name": reporter.full_name if reporter else "Unknown",
            "reason": r.reason,
            "note": r.note,
            "status": r.status,
            "created_at": r.created_at,
        })
    return out


@router.patch("/reports/{report_id}/resolve")
def resolve_report(
    report_id: str,
    body: ReportStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    report = db.get(FileReport, report_id)
    if not report:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")

    material = db.get(Material, report.material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    entry = require_offering_member(material.offering_id, user, db)
    if not (entry.can_publish or user.global_role in (GlobalRole.admin, GlobalRole.superadmin)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requires publish permissions")

    if body.status not in ("resolved", "open"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Status must be 'resolved' or 'open'")

    report.status = body.status
    db.commit()
    db.refresh(report)
    log_action(db, user.id, "resolve_report", material.offering_id, f"{report_id} → {body.status}")
    return {"id": report.id, "material_id": report.material_id, "status": report.status}
