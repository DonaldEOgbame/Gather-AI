"""Timetable: admin/registry-owned sessions, attached to CourseOfferings.

Admin-only writes (per spec decision). Students/lecturers read-only.
All references use offering_id instead of course_id.
"""
import csv
import io
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.audit import log_action
from app.db import get_db
from app.deps import get_current_user, require_offering_member
from app.models import (
    Course,
    CourseOffering,
    Enrollment,
    EnrollmentStatus,
    GlobalRole,
    OfferingLecturer,
    Semester,
    SemesterStatus,
    TimetableSession,
    University,
    User,
)

router = APIRouter(prefix="/timetable", tags=["timetable"])


class TimetableSlotIn(BaseModel):
    weekday: int | None = None      # legacy compatibility
    day_of_week: int | None = None  # 0-6 (Mon-Sun)
    start_time: str                 # "HH:MM"
    end_time: str                   # "HH:MM"
    room: str
    recurrence_rule: str | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None


def _check_can_edit(user: User):
    """Admin-only write access (spec decision: timetable is registry-owned)."""
    if user.global_role not in (GlobalRole.admin, GlobalRole.superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin role can write timetable sessions",
        )


def _slot_out(s: TimetableSession, offering: CourseOffering | None = None, course: Course | None = None) -> dict:
    return {
        "id": s.id,
        "offering_id": s.offering_id,
        "course_code": course.code if course else None,
        "course_title": course.title if course else None,
        "day_of_week": s.day_of_week,
        "weekday": s.day_of_week,   # legacy compatibility
        "start_time": s.start_time,
        "end_time": s.end_time,
        "room": s.room,
        "recurrence_rule": s.recurrence_rule,
        "valid_from": s.valid_from.isoformat() if s.valid_from else None,
        "valid_until": s.valid_until.isoformat() if s.valid_until else None,
    }


def check_conflict(
    db: Session,
    offering_id: str,
    day_of_week: int,
    start_time: str,
    end_time: str,
    room: str,
    exclude_id: str | None = None,
    pending_sessions: list | None = None,
) -> str | None:
    """Check for room and lecturer double-booking across the active semester."""
    off = db.get(CourseOffering, offering_id)
    if not off:
        return None
    sem = db.get(Semester, off.semester_id)
    if not sem or sem.status != SemesterStatus.active:
        return None  # Only enforce conflicts in active semester

    # All active-semester timetable sessions at the same time
    q = (
        db.query(TimetableSession)
        .join(CourseOffering, TimetableSession.offering_id == CourseOffering.id)
        .join(Semester, CourseOffering.semester_id == Semester.id)
        .filter(
            Semester.status == SemesterStatus.active,
            TimetableSession.day_of_week == day_of_week,
            TimetableSession.start_time < end_time,
            TimetableSession.end_time > start_time,
        )
    )
    if exclude_id:
        q = q.filter(TimetableSession.id != exclude_id)

    all_sessions = list(q.all())
    if pending_sessions:
        for ps in pending_sessions:
            if (
                ps.day_of_week == day_of_week
                and ps.start_time < end_time
                and ps.end_time > start_time
            ):
                all_sessions.append(ps)

    # Lecturers assigned to the target offering
    lecturer_ids = {
        ol.lecturer_id
        for ol in db.query(OfferingLecturer).filter(OfferingLecturer.offering_id == offering_id).all()
    }

    for s in all_sessions:
        # Room conflict
        if s.room.strip().lower() == room.strip().lower() and room.strip():
            other_off = db.get(CourseOffering, s.offering_id)
            other_course = db.get(Course, other_off.course_id) if other_off else None
            code = other_course.code if other_course else s.offering_id
            return f"Conflict: Room '{room}' is double-booked by offering '{code}' at {s.start_time}-{s.end_time} on day {s.day_of_week}."

        # Lecturer conflict
        other_lecturer_ids = {
            ol.lecturer_id
            for ol in db.query(OfferingLecturer).filter(OfferingLecturer.offering_id == s.offering_id).all()
        }
        common = lecturer_ids & other_lecturer_ids
        if common:
            names = []
            for uid in common:
                u = db.get(User, uid)
                if u:
                    names.append(f"{u.title} {u.full_name}".strip())
            other_off = db.get(CourseOffering, s.offering_id)
            other_course = db.get(Course, other_off.course_id) if other_off else None
            code = other_course.code if other_course else s.offering_id
            return f"Conflict: Lecturer ({', '.join(names)}) is double-booked by offering '{code}' at {s.start_time}-{s.end_time} on day {s.day_of_week}."

    return None


@router.get("/today")
def get_today_timetable(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get today's timetable for the current user, scoped to their active offerings."""
    offering_ids: list[str] = []
    if user.global_role == GlobalRole.student:
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.student_id == user.id, Enrollment.status == EnrollmentStatus.active)
            .all()
        )
        offering_ids = [e.offering_id for e in enrollments]
    elif user.global_role == GlobalRole.lecturer:
        entries = (
            db.query(OfferingLecturer)
            .filter(OfferingLecturer.lecturer_id == user.id)
            .all()
        )
        offering_ids = [ol.offering_id for ol in entries]
    else:
        # Admin sees all offerings in active semester
        offerings = (
            db.query(CourseOffering)
            .join(Semester, CourseOffering.semester_id == Semester.id)
            .filter(Semester.status == SemesterStatus.active)
            .all()
        )
        offering_ids = [o.id for o in offerings]

    if not offering_ids:
        return []

    inst = db.get(University, user.institution_id)
    tz_name = inst.timezone if inst else "UTC"
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = timezone.utc

    local_now = datetime.now(tz)
    weekday = local_now.weekday()

    slots = (
        db.query(TimetableSession)
        .filter(
            TimetableSession.offering_id.in_(offering_ids),
            TimetableSession.day_of_week == weekday,
        )
        .all()
    )

    out = []
    for s in slots:
        off = db.get(CourseOffering, s.offering_id)
        course = db.get(Course, off.course_id) if off else None
        out.append(_slot_out(s, off, course))

    out.sort(key=lambda x: x["start_time"])
    return out


@router.post("/import")
def import_timetable_csv(
    offering_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _check_can_edit(user)

    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    content = file.file.read().decode("utf-8")
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    if rows and ("weekday" in rows[0][0].lower() or "day" in rows[0][0].lower()):
        rows = rows[1:]

    pending: list[TimetableSession] = []
    for row in rows:
        if len(row) < 4:
            continue
        try:
            day = int(row[0].strip())
            start = row[1].strip()
            end = row[2].strip()
            room = row[3].strip()
            rec_rule = row[4].strip() if len(row) > 4 else None
            valid_from = None
            if len(row) > 5 and row[5].strip():
                valid_from = datetime.fromisoformat(row[5].strip())
            valid_until = None
            if len(row) > 6 and row[6].strip():
                valid_until = datetime.fromisoformat(row[6].strip())

            conflict_msg = check_conflict(db, offering_id, day, start, end, room, pending_sessions=pending)
            if conflict_msg:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, conflict_msg)

            pending.append(
                TimetableSession(
                    offering_id=offering_id,
                    day_of_week=day,
                    start_time=start,
                    end_time=end,
                    room=room,
                    recurrence_rule=rec_rule,
                    valid_from=valid_from,
                    valid_until=valid_until,
                )
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Malformed CSV row: {row}. Error: {e}")

    db.query(TimetableSession).filter(TimetableSession.offering_id == offering_id).delete()
    for s in pending:
        db.add(s)
    db.commit()
    log_action(db, user.id, "import_timetable", offering_id, f"Imported {len(pending)} slots from CSV")
    return {"imported": len(pending)}


@router.get("/offering/{offering_id}")
def get_offering_timetable(
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

    course = db.get(Course, off.course_id)
    slots = db.query(TimetableSession).filter(TimetableSession.offering_id == offering_id).all()
    return [_slot_out(s, off, course) for s in slots]


@router.post("/offering/{offering_id}")
def add_timetable_slot(
    offering_id: str,
    body: TimetableSlotIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _check_can_edit(user)

    off = db.get(CourseOffering, offering_id)
    if not off:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offering not found")

    day = body.day_of_week if body.day_of_week is not None else body.weekday
    if day is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Either day_of_week or weekday must be provided")

    conflict_msg = check_conflict(db, offering_id, day, body.start_time, body.end_time, body.room)
    if conflict_msg:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, conflict_msg)

    s = TimetableSession(
        offering_id=offering_id,
        day_of_week=day,
        start_time=body.start_time,
        end_time=body.end_time,
        room=body.room,
        recurrence_rule=body.recurrence_rule,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    log_action(db, user.id, "add_timetable_slot", offering_id, f"day {day} at {body.start_time} room {body.room}")

    course = db.get(Course, off.course_id)
    return _slot_out(s, off, course)


# ---------------------------------------------------------------------------
# Legacy Compatibility Endpoints (for automated test suite)
# ---------------------------------------------------------------------------

@router.get("/course/{course_id}")
def get_course_timetable_legacy(
    course_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_offering_timetable(offering_id=course_id, db=db, user=user)


@router.post("/course/{course_id}")
def add_timetable_slot_legacy(
    course_id: str,
    body: TimetableSlotIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return add_timetable_slot(offering_id=course_id, body=body, db=db, user=user)
