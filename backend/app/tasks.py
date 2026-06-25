from datetime import datetime, timezone
from app.celery_app import celery_app
from app.db import SessionLocal
from app.models import Material, MaterialStatus, Notification
from app.notification_service import NotificationService


@celery_app.task
def check_scheduled_releases():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        scheduled_materials = (
            db.query(Material)
            .filter(Material.status == MaterialStatus.scheduled, Material.release_at <= now)
            .all()
        )
        if not scheduled_materials:
            return

        by_course = {}
        for m in scheduled_materials:
            m.status = MaterialStatus.live
            by_course.setdefault(m.course_id, []).append(m)

        db.commit()

        ns = NotificationService()
        for course_id, materials in by_course.items():
            ns.create_and_send_new_materials_notification(db, course_id, materials)

    finally:
        db.close()


@celery_app.task
def send_immediate_notification(notification_id: str):
    db = SessionLocal()
    try:
        ns = NotificationService()
        ns.dispatch_single_notification(db, notification_id)
    finally:
        db.close()


@celery_app.task
def flush_delayed_notifications():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = (
            db.query(Notification)
            .filter(Notification.sent_at.is_(None), Notification.scheduled_send_at <= now)
            .all()
        )
        if not pending:
            return

        ns = NotificationService()
        for notification in pending:
            ns.dispatch_single_notification(db, notification.id)
    finally:
        db.close()
