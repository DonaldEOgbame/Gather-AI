from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.deps import get_current_user
from app.models import User, PersonalBackup
from app.storage import get_storage
from app.audit import log_action

router = APIRouter(prefix="/backup", tags=["backup"])

class BackupManifestIn(BaseModel):
    manifest_blob: str

@router.put("/manifest")
def save_backup_manifest(
    body: BackupManifestIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    backup = db.get(PersonalBackup, user.id)
    if not backup:
        backup = PersonalBackup(user_id=user.id, manifest_blob=body.manifest_blob)
        db.add(backup)
    else:
        backup.manifest_blob = body.manifest_blob
    
    db.commit()
    log_action(db, user.id, "save_backup_manifest", None, f"Saved encrypted manifest size {len(body.manifest_blob)}")
    return {"status": "saved"}

@router.get("/manifest")
def get_backup_manifest(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    backup = db.get(PersonalBackup, user.id)
    if not backup:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No personal library backup found")
    return {"manifest_blob": backup.manifest_blob, "updated_at": backup.updated_at}

@router.post("/file")
def upload_backup_file(
    sha256: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = file.file.read()
    storage_key = f"backups/{user.id}/{sha256}"
    
    storage = get_storage()
    if not storage.exists(storage_key):
        storage.put(storage_key, data)
        
    log_action(db, user.id, "upload_backup_file", None, f"Uploaded personal backup file: {sha256} ({len(data)} bytes)")
    return {"status": "uploaded", "sha256": sha256}

@router.get("/file/{sha256}")
def download_backup_file(
    sha256: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    storage_key = f"backups/{user.id}/{sha256}"
    storage = get_storage()
    if not storage.exists(storage_key):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Backup file not found")
        
    fh = storage.open(storage_key)
    return StreamingResponse(
        fh,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{sha256}.enc"'},
    )
