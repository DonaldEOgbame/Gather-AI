from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.audit import log_action
from app.db import get_db
from app.deps import get_current_user, require_offering_member
from app.models import (
    Announcement,
    AnnouncementRead,
    CourseOffering,
    Enrollment,
    EnrollmentStatus,
    GlobalRole,
    OfferingLecturer,
    User,
)
from app.notification_service import NotificationService

router = APIRouter(prefix="/offerings", tags=["announcements"])


class AnnouncementIn(BaseModel):
    title: str
    body: str
    pinned: bool = False
    send_push: bool = True


def _check_can_announce(offering_id: str, user: User, db: Session):
    if user.global_role in (GlobalRole.admin, GlobalRole.superadmin):
        return
    entry = (
        db.query(OfferingLecturer)
        .filter(
            OfferingLecturer.offering_id == offering_id,
            OfferingLecturer.lecturer_id == user.id,
        )
        .first()
    )
    if not entry or not entry.can_publish:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires lecturer publish permissions for this offering",
        )


@router.post("/{offering_id}/announcements")
def create_announcement(
    offering_id: str,
    body: AnnouncementIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    _check_can_announce(offering_id, user, db)

    announcement = Announcement(
        offering_id=offering_id,
        author_id=user.id,
        title=body.title.strip(),
        body=body.body.strip(),
        pinned=body.pinned,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    log_action(db, user.id, "create_announcement", offering_id, body.title)

    if body.send_push:
        enrollments = (
            db.query(Enrollment)
            .filter(
                Enrollment.offering_id == offering_id,
                Enrollment.status == EnrollmentStatus.active,
            )
            .all()
        )
        ns = NotificationService()
        from app.models import Course
        course = db.get(Course, off.course_id)
        offering_name = f"{course.code} - {course.title}" if course else "Course"
        title = f"Announcement in {offering_name}"
        msg_body = f"{user.title or 'Lecturer'} {user.full_name}: {body.title}"
        for e in enrollments:
            ns.send_notification_to_user(
                db=db,
                user_id=e.student_id,
                title=title,
                body=msg_body,
                notif_type="announcement",
                offering_id=offering_id,
            )

    return {
        "id": announcement.id,
        "title": announcement.title,
        "body": announcement.body,
        "pinned": announcement.pinned,
        "created_at": announcement.created_at,
        "read_count": 0,
    }


@router.get("/{offering_id}/announcements")
def list_announcements(
    offering_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    if user.global_role == GlobalRole.student:
        enrolled = (
            db.query(Enrollment)
            .filter(
                Enrollment.offering_id == offering_id,
                Enrollment.student_id == user.id,
                Enrollment.status == EnrollmentStatus.active,
            )
            .first()
        )
        if not enrolled:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not enrolled in this offering")
    else:
        require_offering_member(offering_id, user, db)

    announcements = (
        db.query(Announcement)
        .filter(Announcement.offering_id == offering_id)
        .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
        .all()
    )

    out = []
    for a in announcements:
        read_count = (
            db.query(AnnouncementRead).filter(AnnouncementRead.announcement_id == a.id).count()
        )
        is_read = (
            db.query(AnnouncementRead)
            .filter(AnnouncementRead.announcement_id == a.id, AnnouncementRead.student_id == user.id)
            .first()
            is not None
        )
        out.append({
            "id": a.id,
            "title": a.title,
            "body": a.body,
            "pinned": a.pinned,
            "created_at": a.created_at,
            "read_count": read_count,
            "is_read": is_read,
        })
    return out


@router.post("/announcements/{announcement_id}/read")
def mark_announcement_read(
    announcement_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ann = db.get(Announcement, announcement_id)
    if not ann:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Announcement not found")

    if user.global_role == GlobalRole.student:
        enrolled = (
            db.query(Enrollment)
            .filter(
                Enrollment.offering_id == ann.offering_id,
                Enrollment.student_id == user.id,
                Enrollment.status == EnrollmentStatus.active,
            )
            .first()
        )
        if not enrolled:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not enrolled in this offering")
    else:
        require_offering_member(ann.offering_id, user, db)

    existing = (
        db.query(AnnouncementRead)
        .filter(
            AnnouncementRead.announcement_id == announcement_id,
            AnnouncementRead.student_id == user.id,
        )
        .first()
    )
    if not existing:
        ar = AnnouncementRead(announcement_id=announcement_id, student_id=user.id)
        db.add(ar)
        db.commit()

    return {"status": "read"}
