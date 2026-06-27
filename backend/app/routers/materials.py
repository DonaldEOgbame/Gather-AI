import hashlib
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.ai import get_ai
from app.audit import log_action
from app.db import get_db
from app.deps import (
    get_current_user,
    get_offering_lecturer_entry,
    require_offering_member,
    require_offering_publisher,
)
from app.models import (
    CourseOffering,
    Enrollment,
    EnrollmentStatus,
    GlobalRole,
    Material,
    MaterialStatus,
    OfferingLecturer,
    University,
    User,
)
from app.schemas import MaterialOut, MaterialRemoveIn, MaterialUpdateIn, PublishBatchIn, PublishIn
from app.storage import get_storage

router = APIRouter(prefix="/materials", tags=["materials"])


# ---------------------------------------------------------------------------
# Restriction validation (against offering ceiling + institution ceiling)
# ---------------------------------------------------------------------------

def validate_restriction(db: Session, offering_id: str, restriction: str, user: User):
    if not restriction:
        return
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    univ = db.get(University, user.institution_id) if user.institution_id else None
    univ_ceiling = univ.sharing_ceiling if (univ and univ.sharing_ceiling) else "open"
    off_ceiling = off.sharing_ceiling if (off and off.sharing_ceiling) else "open"

    scale = ["view-only", "app-only", "open"]
    try:
        uc_idx = scale.index(univ_ceiling)
    except ValueError:
        uc_idx = 2
    try:
        oc_idx = scale.index(off_ceiling)
    except ValueError:
        oc_idx = 2

    effective_ceiling_idx = min(uc_idx, oc_idx)
    effective_ceiling = scale[effective_ceiling_idx]

    try:
        r_idx = scale.index(restriction)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid restriction value: {restriction}")

    if r_idx > effective_ceiling_idx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Restriction '{restriction}' is looser than the ceiling '{effective_ceiling}'",
        )


# ---------------------------------------------------------------------------
# Upload material (POST /materials)
# ---------------------------------------------------------------------------

@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def upload_material(
    offering_id: str | None = Form(None),
    course_id: str | None = Form(None),
    week: int = Form(...),
    title: str = Form(""),
    restriction: str = Form("open"),
    watermark_override: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Material:
    """Lecturer/TA uploads a file. Lands as DRAFT (Module 2B)."""
    actual_offering_id = offering_id or course_id
    if not actual_offering_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "offering_id or course_id is required")
    entry = require_offering_member(actual_offering_id, user, db)

    if not 1 <= week <= 15:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "week must be 1..15")
    if restriction not in ["open", "app-only", "view-only"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid restriction value")

    validate_restriction(db, actual_offering_id, restriction, user)

    data = file.file.read()

    # Enforce institution upload policy (file type, per-file size, weekly count).
    univ = db.get(University, user.institution_id) if user.institution_id else None
    if univ:
        ext = (file.filename or "").rsplit(".", 1)[-1].upper() if "." in (file.filename or "") else ""
        allowed = [t.strip().upper() for t in univ.allowed_file_types.split(",") if t.strip()]
        if allowed and ext not in allowed:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type .{ext} is not allowed. Permitted: {', '.join(allowed)}.",
            )
        max_bytes = univ.max_file_size_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {univ.max_file_size_mb} MB per-file limit.",
            )
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        week_start = now - timedelta(days=now.weekday(), hours=now.hour, minutes=now.minute, seconds=now.second, microseconds=now.microsecond)
        weekly_count = (
            db.query(func.count(Material.id))
            .filter(
                Material.offering_id == actual_offering_id,
                Material.uploaded_by == user.id,
                Material.created_at >= week_start,
            )
            .scalar()
            or 0
        )
        if weekly_count >= univ.max_files_per_week:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Weekly upload limit of {univ.max_files_per_week} files reached.",
            )

    # 413 Quota Check: 2 GB per offering
    total_size = (
        db.query(func.sum(Material.size_bytes))
        .filter(Material.offering_id == actual_offering_id)
        .scalar()
        or 0
    )
    if total_size + len(data) > 2 * 1024 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Course storage full — 2/2 GB. Remove files or contact admin.",
        )

    digest = hashlib.sha256(data).hexdigest()
    storage_key = f"{actual_offering_id}/{digest}"

    storage = get_storage()
    if not storage.exists(storage_key):
        storage.put(storage_key, data)

    # Stubbed AI seam fills in title/week if blank
    if not title:
        meta = get_ai().extract_metadata(file.filename or "", "")
        title = meta.topic or (file.filename or "Untitled")

    material = Material(
        offering_id=actual_offering_id,
        week=week,
        title=title,
        storage_key=storage_key,
        content_sha256=digest,
        original_filename=file.filename or "",
        size_bytes=len(data),
        status=MaterialStatus.draft,
        uploaded_by=user.id,
        restriction=restriction,
        watermark_override=watermark_override,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


# ---------------------------------------------------------------------------
# Access control helper
# ---------------------------------------------------------------------------

def _can_see(material: Material, user: User, db: Session) -> bool:
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin):
        return True
    # C11: removed materials are invisible to students
    if material.status == MaterialStatus.removed:
        if user.global_role == GlobalRole.student:
            return False
    # Teaching staff on the offering see everything (incl. drafts)
    if get_offering_lecturer_entry(material.offering_id, user, db) is not None:
        return True
    # Students: only LIVE materials in offerings they're actively enrolled in
    if material.status != MaterialStatus.live:
        return False
    enroll = (
        db.query(Enrollment)
        .filter(
            Enrollment.offering_id == material.offering_id,
            Enrollment.student_id == user.id,
            Enrollment.status == EnrollmentStatus.active,
        )
        .first()
    )
    return enroll is not None


# ---------------------------------------------------------------------------
# List materials for an offering
# ---------------------------------------------------------------------------

@router.get("", response_model=list[MaterialOut])
def list_materials(
    offering_id: str | None = None,
    course_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Material]:
    actual_offering_id = offering_id or course_id
    if not actual_offering_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "offering_id or course_id is required")
    if not db.get(CourseOffering, actual_offering_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    rows = db.query(Material).filter(Material.offering_id == actual_offering_id).all()
    return [m for m in rows if _can_see(m, user, db)]


# ---------------------------------------------------------------------------
# Download material
# ---------------------------------------------------------------------------

@router.get("/{material_id}/download")
def download_material(
    material_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    material = db.get(Material, material_id)
    if material is None or not _can_see(material, user, db):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    # C11: removed materials return 410 Gone to trigger sync tombstone on client
    if material.status == MaterialStatus.removed:
        raise HTTPException(status.HTTP_410_GONE, "Material has been removed")

    material.download_count += 1
    db.commit()

    storage = get_storage()
    if not storage.exists(material.storage_key):
        raise HTTPException(status.HTTP_410_GONE, "Blob missing from storage")

    fh = storage.open(material.storage_key)
    filename = material.original_filename or material.title
    return StreamingResponse(
        fh,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Update material metadata
# ---------------------------------------------------------------------------

@router.patch("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: str,
    body: MaterialUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Material:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    entry = require_offering_member(material.offering_id, user, db)

    update_data = body.model_dump(exclude_unset=True)

    target_restriction = update_data.get("restriction", material.restriction)
    validate_restriction(db, material.offering_id, target_restriction, user)

    if "week" in update_data:
        week = update_data["week"]
        if not 1 <= week <= 15:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "week must be 1..15")

    new_status = update_data.get("status", material.status)
    if new_status in (MaterialStatus.live, MaterialStatus.scheduled) and material.status == MaterialStatus.draft:
        if not entry.can_publish:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing 'can_publish' permission")

    for field, val in update_data.items():
        setattr(material, field, val)

    if material.status in (MaterialStatus.live, MaterialStatus.scheduled):
        if material.release_at and material.release_at > datetime.now(timezone.utc):
            material.status = MaterialStatus.scheduled
        else:
            material.status = MaterialStatus.live

    db.commit()
    db.refresh(material)

    log_action(db, user.id, "update_material", material.id, f"title={material.title} status={material.status.value}")

    if material.status == MaterialStatus.live:
        from app.notification_service import NotificationService
        ns = NotificationService()
        ns.create_and_send_new_materials_notification(db, material.offering_id, [material])
        log_action(db, user.id, "publish_material", material.id)

    return material


# ---------------------------------------------------------------------------
# Publish single material
# ---------------------------------------------------------------------------

@router.post("/{material_id}/publish", response_model=MaterialOut)
def publish_material(
    material_id: str,
    body: PublishIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Material:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    entry = require_offering_publisher(material.offering_id, user, db)

    material.release_at = body.release_at
    if body.release_at and body.release_at > datetime.now(timezone.utc):
        material.status = MaterialStatus.scheduled
    else:
        material.status = MaterialStatus.live

    db.commit()
    db.refresh(material)

    log_action(db, user.id, "publish_material", material.id)

    if material.status == MaterialStatus.live:
        from app.notification_service import NotificationService
        ns = NotificationService()
        ns.create_and_send_new_materials_notification(db, material.offering_id, [material])

    return material


# ---------------------------------------------------------------------------
# Batch publish
# ---------------------------------------------------------------------------

@router.post("/publish-batch", response_model=list[MaterialOut])
def publish_batch(
    body: PublishBatchIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Material]:
    """Publish multiple materials at once. Collapses push notifications per offering."""
    materials = []
    by_offering: dict[str, list[Material]] = {}

    for mid in body.material_ids:
        material = db.get(Material, mid)
        if not material:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Material {mid} not found")

        entry = require_offering_publisher(material.offering_id, user, db)

        material.release_at = body.release_at
        if body.release_at and body.release_at > datetime.now(timezone.utc):
            material.status = MaterialStatus.scheduled
        else:
            material.status = MaterialStatus.live

        materials.append(material)
        if material.status == MaterialStatus.live:
            by_offering.setdefault(material.offering_id, []).append(material)

    db.commit()

    from app.notification_service import NotificationService
    ns = NotificationService()
    for m in materials:
        log_action(db, user.id, "publish_material", m.id)
    for offering_id, off_mats in by_offering.items():
        ns.create_and_send_new_materials_notification(db, offering_id, off_mats)

    return materials


# ---------------------------------------------------------------------------
# C11: Emergency takedown (mark as 'removed' — tombstone for sync protocol)
# ---------------------------------------------------------------------------

@router.get("/analytics/{offering_id}")
def get_offering_analytics(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Returns aggregate download stats + top materials for the offering."""
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")
    require_offering_member(offering_id, user, db)

    from sqlalchemy import func as sqlfunc
    materials = (
        db.query(Material)
        .filter(Material.offering_id == offering_id, Material.status != MaterialStatus.removed)
        .all()
    )

    total_downloads = sum(m.download_count for m in materials)
    total_files = len(materials)

    enrolled_count = (
        db.query(func.count(Enrollment.id))
        .filter(
            Enrollment.offering_id == offering_id,
            Enrollment.status == EnrollmentStatus.active,
        )
        .scalar()
        or 0
    )

    top = sorted(materials, key=lambda m: m.download_count, reverse=True)[:10]

    return {
        "total_files": total_files,
        "total_downloads": total_downloads,
        "total_bytes": sum(m.size_bytes for m in materials),
        "quota_bytes": 2 * 1024 * 1024 * 1024,  # per-offering cap (see upload guard)
        "enrolled_students": enrolled_count,
        "top_materials": [
            {
                "id": m.id,
                "title": m.title,
                "original_filename": m.original_filename,
                "download_count": m.download_count,
                "week": m.week,
                "status": m.status.value,
            }
            for m in top
        ],
    }


@router.post("/{material_id}/remove", response_model=MaterialOut)
def remove_material(
    material_id: str,
    body: MaterialRemoveIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Material:
    """C11: Admin or offering owner removes a material.
    
    Sets status → 'removed' (does NOT delete the DB row; the row acts as a sync tombstone
    so mobile clients know to purge the local copy). Download returns 410 Gone.
    """
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    # Only owners + admins can remove
    entry = require_offering_member(material.offering_id, user, db)
    if not (entry.is_owner or user.global_role in (GlobalRole.admin, GlobalRole.superadmin)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only offering owner or admin can remove materials")

    if material.status == MaterialStatus.removed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Material is already removed")

    material.status = MaterialStatus.removed
    material.removed_at = datetime.now(timezone.utc)
    material.removed_by = user.id
    db.commit()
    db.refresh(material)

    log_action(db, user.id, "remove_material", material.id, body.reason)
    return material


@router.get("/{material_id}/summary")
def get_material_summary(
    material_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    material = db.get(Material, material_id)
    if not material or not _can_see(material, user, db):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")

    import json
    if material.summary_json:
        try:
            return json.loads(material.summary_json)
        except Exception:
            pass

    # Read from storage and extract readable text (PDF/DOCX/PPTX → text; else decode)
    storage = get_storage()
    if not storage.exists(material.storage_key):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material file missing from storage")

    from app.extract import extract_text

    fh = storage.open(material.storage_key)
    try:
        raw_data = fh.read()
        source_name = material.original_filename or material.title
        text_content = extract_text(source_name, raw_data)
    except Exception:
        text_content = material.title
    finally:
        fh.close()

    if not text_content.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "No extractable text in this file")

    # Generate summary
    ai = get_ai()
    summary = ai.summarize(text_content)

    summary_data = {
        "tldr": summary.tldr,
        "key_terms": summary.key_terms,
    }

    # Save back to DB
    material.summary_json = json.dumps(summary_data)
    db.commit()

    return summary_data
