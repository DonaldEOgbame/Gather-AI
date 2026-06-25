from datetime import datetime, timezone, timedelta, time
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.models import (
    User,
    University,
    Notification,
    NotificationSettings,
    Enrollment,
    Session as SessionModel,
    Material,
)
from app.notifier import get_notifier


class NotificationService:
    def get_user_settings(self, db: Session, user_id: str) -> NotificationSettings:
        settings = (
            db.query(NotificationSettings)
            .filter(NotificationSettings.user_id == user_id)
            .one_or_none()
        )
        if not settings:
            # Create default settings
            settings = NotificationSettings(user_id=user_id)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    def calculate_scheduled_time(self, db: Session, user: User, settings: NotificationSettings) -> datetime | None:
        if not settings.enabled:
            return None

        inst = db.get(University, user.institution_id)
        tz_name = inst.timezone if inst else "UTC"
        try:
            tz = ZoneInfo(tz_name)
        except Exception:
            tz = timezone.utc

        now_local = datetime.now(tz)

        # 1. Batch/digest delivery
        if settings.batch_delivery:
            digest_time = time(18, 0)  # 6:00 PM local
            dt_local = datetime.combine(now_local.date(), digest_time, tzinfo=tz)
            if dt_local <= now_local:
                dt_local += timedelta(days=1)
            return dt_local.astimezone(timezone.utc)

        # 2. Quiet hours
        if settings.quiet_hours_start and settings.quiet_hours_end:
            try:
                shour, smin = map(int, settings.quiet_hours_start.split(":"))
                ehour, emin = map(int, settings.quiet_hours_end.split(":"))
                start = time(shour, smin)
                end = time(ehour, emin)
            except Exception:
                return None

            local_time = now_local.time()
            in_quiet = False
            if start <= end:
                in_quiet = start <= local_time <= end
            else:
                in_quiet = local_time >= start or local_time <= end

            if in_quiet:
                delivery_local = datetime.combine(now_local.date(), end, tzinfo=tz)
                if delivery_local <= now_local:
                    delivery_local += timedelta(days=1)
                elif start > end and local_time >= start:
                    delivery_local += timedelta(days=1)
                return delivery_local.astimezone(timezone.utc)

        return None

    def send_notification_to_user(
        self,
        db: Session,
        user_id: str,
        title: str,
        body: str,
        notif_type: str,
        course_id: str | None = None,
        material_id: str | None = None,
    ) -> Notification:
        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        settings = self.get_user_settings(db, user_id)

        # Check if type is enabled
        type_enabled = True
        if notif_type == "new_material" and not settings.new_material:
            type_enabled = False
        elif notif_type == "material_updated" and not settings.material_updated:
            type_enabled = False
        elif notif_type == "scheduled_release" and not settings.scheduled_release:
            type_enabled = False
        elif notif_type == "draft_activity" and not settings.draft_activity:
            type_enabled = False
        elif notif_type == "roster_changes" and not settings.roster_changes:
            type_enabled = False
        elif notif_type == "pending_approvals" and not settings.pending_approvals:
            type_enabled = False

        if not settings.enabled or not type_enabled:
            # Save as already read/sent, but don't dispatch
            notif = Notification(
                user_id=user_id,
                course_id=course_id,
                material_id=material_id,
                title=title,
                body=body,
                type=notif_type,
                sent_at=datetime.now(timezone.utc),
            )
            db.add(notif)
            db.commit()
            return notif

        scheduled_send_at = self.calculate_scheduled_time(db, user, settings)

        notif = Notification(
            user_id=user_id,
            course_id=course_id,
            material_id=material_id,
            title=title,
            body=body,
            type=notif_type,
            scheduled_send_at=scheduled_send_at,
        )
        db.add(notif)
        db.commit()

        if scheduled_send_at is None:
            # Import tasks locally to avoid circular dependencies
            from app.tasks import send_immediate_notification
            send_immediate_notification.delay(notif.id)

        return notif

    def create_and_send_new_materials_notification(
        self, db: Session, course_id: str, materials: list[Material]
    ):
        if not materials:
            return

        # Find enrolled students
        enrollments = db.query(Enrollment).filter(Enrollment.offering_id == course_id).all()
        student_ids = [e.student_id for e in enrollments]

        if not student_ids:
            return

        # Collapse titles into one string
        titles_str = ", ".join(m.title for m in materials)
        count = len(materials)

        from app.models import Course, CourseOffering
        off = db.get(CourseOffering, course_id)
        course = db.get(Course, off.course_id) if off else None
        course_name = f"{course.code} - {course.title}" if course else "Course"

        title = f"New material published in {course_name}"
        if count == 1:
            body = f"A new material has been published: {materials[0].title}"
        else:
            body = f"{count} new materials have been published: {titles_str}"

        for student_id in student_ids:
            self.send_notification_to_user(
                db=db,
                user_id=student_id,
                title=title,
                body=body,
                notif_type="new_material",
                course_id=course_id,
                material_id=materials[0].id if count == 1 else None,
            )

    def dispatch_single_notification(self, db: Session, notification_id: str):
        notif = db.get(Notification, notification_id)
        if not notif or notif.sent_at is not None:
            return

        user = db.get(User, notif.user_id)
        if not user:
            return

        settings = self.get_user_settings(db, user.id)

        if settings.batch_delivery:
            # Find all unsent digest notifications for this user
            now = datetime.now(timezone.utc)
            unsent = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.sent_at.is_(None),
                    Notification.scheduled_send_at <= now,
                )
                .all()
            )
            if not unsent:
                return

            collapsed_body = "\n".join(f"- {n.title}: {n.body}" for n in unsent)
            subject = "Your UniPortal Daily Digest"
            body = f"Here is your daily summary:\n\n{collapsed_body}"

            notifier = get_notifier()
            notifier.send_email(to=user.email, subject=subject, body=body)

            sessions = (
                db.query(SessionModel)
                .filter(SessionModel.user_id == user.id, SessionModel.revoked_at.is_(None))
                .all()
            )
            for sess in sessions:
                if sess.fcm_token:
                    notifier.send_push(
                        fcm_token=sess.fcm_token,
                        title=subject,
                        body=f"You have {len(unsent)} new notifications. Check your daily digest.",
                    )

            for n in unsent:
                n.sent_at = now
            db.commit()
            return

        # Individual delivery
        notifier = get_notifier()

        sessions = (
            db.query(SessionModel)
            .filter(SessionModel.user_id == user.id, SessionModel.revoked_at.is_(None))
            .all()
        )
        has_sent_push = False
        for sess in sessions:
            if sess.fcm_token:
                notifier.send_push(
                    fcm_token=sess.fcm_token,
                    title=notif.title,
                    body=notif.body,
                    data={"type": notif.type, "course_id": notif.course_id, "material_id": notif.material_id},
                )
                has_sent_push = True

        if not has_sent_push:
            notifier.send_email(to=user.email, subject=notif.title, body=notif.body)

        notif.sent_at = datetime.now(timezone.utc)
        db.commit()
