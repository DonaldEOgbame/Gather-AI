import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class GlobalRole(str, enum.Enum):
    superadmin = "superadmin"   # platform-level (across institutions)
    admin = "admin"             # institution-level
    lecturer = "lecturer"
    student = "student"


class AccountStatus(str, enum.Enum):
    """Module 6D lifecycle: Invited -> Active -> Suspended -> Archived."""
    invited = "invited"
    active = "active"
    suspended = "suspended"
    archived = "archived"


class SessionStatus(str, enum.Enum):
    """Status of an AcademicSession (e.g. 2025/2026)."""
    upcoming = "upcoming"
    active = "active"
    archived = "archived"


class SemesterTerm(str, enum.Enum):
    """First or Second semester within an academic session."""
    first = "first"
    second = "second"


class SemesterStatus(str, enum.Enum):
    upcoming = "upcoming"
    active = "active"
    archived = "archived"


class OfferingStatus(str, enum.Enum):
    """Status of a single CourseOffering (a course taught in one semester)."""
    draft = "draft"
    active = "active"
    archived = "archived"


class MaterialStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    live = "live"
    removed = "removed"   # C11 emergency takedown — tombstone for sync protocol


class EnrollmentStatus(str, enum.Enum):
    """C3 advisor-approval registration model."""
    advisor_pending = "advisor_pending"  # student selected; waiting for advisor batch-approve
    active = "active"
    dropped = "dropped"


class InstitutionStatus(str, enum.Enum):
    """C4/invite-only: institution must be provisioned by superadmin."""
    pending = "pending"    # access-request submitted; not yet approved
    active = "active"
    suspended = "suspended"


# ---------------------------------------------------------------------------
# Institution (tenant root)
# ---------------------------------------------------------------------------

class University(Base):
    """The tenant root (a.k.a. Institution in Modules 6-15).
    All users, structure, and content are scoped to one of these (M13 tenant isolation).
    
    Decisions:
    - retention_months: post-graduation grace window for material downloads (default 12, unlimited while enrolled)
    - status: invite-only onboarding v1 — superadmin provisions each institution
    """

    __tablename__ = "universities"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # Per-institution self-register join code (Module 6A.2), e.g. "ADUN-2026".
    join_code: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    timezone: Mapped[str] = mapped_column(String, nullable=False, default="UTC")  # M12 scheduling
    sharing_ceiling: Mapped[str] = mapped_column(String, nullable=False, default="open")  # open|app-only|view-only
    watermark_mandatory: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # C4 invite-only onboarding
    status: Mapped[InstitutionStatus] = mapped_column(
        Enum(InstitutionStatus, name="institution_status"),
        nullable=False,
        default=InstitutionStatus.active,
    )
    # Decision 1: post-graduation read/download grace window. 0 = unlimited (used for active students).
    retention_months: Mapped[int] = mapped_column(Integer, nullable=False, default=12)

    academic_sessions: Mapped[list["AcademicSession"]] = relationship(back_populates="university")
    departments: Mapped[list["Department"]] = relationship(back_populates="university")


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    institution_id: Mapped[str | None] = mapped_column(
        ForeignKey("universities.id"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    # Nullable: an invited user has no password until they activate (Module 6A.1).
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    # C18: legal_name is institution-set, watermark-safe, never student-editable.
    # display_name is cosmetic and student-editable.
    full_name: Mapped[str] = mapped_column(String, nullable=False, default="")     # legacy alias for legal_name
    legal_name: Mapped[str] = mapped_column(String, nullable=False, default="")   # institution-set, read-only for student
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)       # student-editable cosmetic
    title: Mapped[str] = mapped_column(String, nullable=False, default="")        # "Prof."/"Dr."
    matric_or_staff_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    global_role: Mapped[GlobalRole] = mapped_column(
        Enum(GlobalRole, name="global_role"), nullable=False
    )
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="account_status"),
        nullable=False,
        default=AccountStatus.invited,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Temporal hierarchy: Institution → AcademicSession → Semester
# ---------------------------------------------------------------------------

class AcademicSession(Base):
    """An academic year, e.g. '2025/2026'. Contains exactly two Semesters (First, Second).
    
    Rule: only one AcademicSession may be 'active' per institution at a time.
    Creating a session auto-creates both First and Second semesters (status=upcoming).
    """

    __tablename__ = "academic_sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    university_id: Mapped[str] = mapped_column(
        ForeignKey("universities.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "2025/2026"
    start_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status"),
        nullable=False,
        default=SessionStatus.upcoming,
        index=True,
    )

    university: Mapped["University"] = relationship(back_populates="academic_sessions")
    semesters: Mapped[list["Semester"]] = relationship(back_populates="session")


class Semester(Base):
    """First or Second semester within an AcademicSession.
    
    Rule: only one Semester may be 'active' per institution at a time (across all sessions).
    Activating a semester archives all others in the same institution.
    registration_open gates student course-selection (C3).
    """

    __tablename__ = "semesters"
    __table_args__ = (UniqueConstraint("session_id", "term", name="uq_semester_session_term"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=False, index=True
    )
    term: Mapped[SemesterTerm] = mapped_column(
        Enum(SemesterTerm, name="semester_term"), nullable=False
    )
    start_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    # C3: registration_open gates student self-selection of offerings
    registration_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # C3: advisor-approval registration — credit unit cap enforced per student registration
    credit_unit_cap: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    # C3: late registration window (separate flag; penalty handled by UI)
    late_registration_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[SemesterStatus] = mapped_column(
        Enum(SemesterStatus, name="semester_status"),
        nullable=False,
        default=SemesterStatus.upcoming,
        index=True,
    )

    session: Mapped["AcademicSession"] = relationship(back_populates="semesters")
    offerings: Mapped[list["CourseOffering"]] = relationship(back_populates="semester")


# ---------------------------------------------------------------------------
# Catalog: Department → Course (stable)
# ---------------------------------------------------------------------------

class Department(Base):
    """Stable — does not change per semester."""

    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    university_id: Mapped[str] = mapped_column(
        ForeignKey("universities.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)

    university: Mapped["University"] = relationship(back_populates="departments")
    courses: Mapped[list["Course"]] = relationship(back_populates="department")


class Course(Base):
    """Catalog entry — stable across semesters. CSC401 the description, not CSC401 taught this term.
    
    Rule: catalog course has no semester_id. Course Offerings are the semester instances.
    UNIQUE(department_id, code) ensures one canonical course per department.
    """

    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("department_id", "code", name="uq_course_dept_code"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String, nullable=False)     # e.g. "CSC401"
    title: Mapped[str] = mapped_column(String, nullable=False, default="")
    credit_units: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    department: Mapped["Department"] = relationship(back_populates="courses")
    offerings: Mapped[list["CourseOffering"]] = relationship(back_populates="course")


# ---------------------------------------------------------------------------
# Course Offering: Course × Semester instance
# ---------------------------------------------------------------------------

class CourseOffering(Base):
    """A specific course taught in a specific semester. 
    
    Rule: lecturers, rosters, enrollment, and materials attach to the offering,
    never to the catalog course or the bare semester.
    
    UNIQUE(course_id, semester_id): one offering per course per semester.
    """

    __tablename__ = "course_offerings"
    __table_args__ = (UniqueConstraint("course_id", "semester_id", name="uq_offering_course_semester"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    course_id: Mapped[str] = mapped_column(
        ForeignKey("courses.id"), nullable=False, index=True
    )
    semester_id: Mapped[str] = mapped_column(
        ForeignKey("semesters.id"), nullable=False, index=True
    )
    status: Mapped[OfferingStatus] = mapped_column(
        Enum(OfferingStatus, name="offering_status"),
        nullable=False,
        default=OfferingStatus.active,
        index=True,
    )
    # Per-offering enrollment mode (may override semester default for edge-case courses)
    enrollment_mode: Mapped[str] = mapped_column(
        String, nullable=False, default="advisor_approval"
    )  # advisor_approval | code | roster (admin-seeded) | open (free join)
    sharing_ceiling: Mapped[str] = mapped_column(
        String, nullable=False, default="open"
    )  # open | app-only | view-only; bounded by university ceiling
    watermark_mandatory: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    course: Mapped["Course"] = relationship(back_populates="offerings")
    semester: Mapped["Semester"] = relationship(back_populates="offerings")
    lecturers: Mapped[list["OfferingLecturer"]] = relationship(back_populates="offering")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="offering")
    materials: Mapped[list["Material"]] = relationship(back_populates="offering")


# ---------------------------------------------------------------------------
# Offering Lecturer (replaces CourseRoster)
# ---------------------------------------------------------------------------

class OfferingLecturer(Base):
    """A lecturer/TA assigned to a specific offering, with permission toggles.
    
    is_owner: True for the primary/owning lecturer who can delete the offering
    and manage the teaching team. There must always be at least one owner.
    """

    __tablename__ = "offering_lecturers"
    __table_args__ = (UniqueConstraint("offering_id", "lecturer_id", name="uq_offering_lecturer"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lecturer_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    is_owner: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_publish: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    can_manage_roster: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    offering: Mapped["CourseOffering"] = relationship(back_populates="lecturers")


# ---------------------------------------------------------------------------
# C3: Student Registration (advisor-approval model)
# ---------------------------------------------------------------------------

class StudentRegistration(Base):
    """C3: A student's registration for a whole semester.
    
    Flow: student self-selects offerings (advisor_pending) during registration_open window
    → advisor/HOD approves the whole registration batch (validates credit cap) → active.
    
    One registration per student per semester. Enrollment rows are created/confirmed
    when the registration status transitions to 'active'.
    """

    __tablename__ = "student_registrations"
    __table_args__ = (
        UniqueConstraint("student_id", "semester_id", name="uq_registration_student_semester"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    student_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    semester_id: Mapped[str] = mapped_column(
        ForeignKey("semesters.id"), nullable=False, index=True
    )
    # advisor/HOD who approved (nullable until approved)
    approved_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="advisor_pending"
    )  # advisor_pending | active | rejected
    total_credit_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # late registration — penalized on institution side but allowed
    is_late: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    registration_items: Mapped[list["RegistrationItem"]] = relationship(
        back_populates="registration"
    )


class RegistrationItem(Base):
    """A single offering chosen by a student within a StudentRegistration."""

    __tablename__ = "registration_items"
    __table_args__ = (
        UniqueConstraint("registration_id", "offering_id", name="uq_regitem_reg_offering"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    registration_id: Mapped[str] = mapped_column(
        ForeignKey("student_registrations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id"), nullable=False, index=True
    )

    registration: Mapped["StudentRegistration"] = relationship(
        back_populates="registration_items"
    )


# ---------------------------------------------------------------------------
# Enrollment (one per student per offering — created/confirmed by registration approval)
# ---------------------------------------------------------------------------

class Enrollment(Base):
    """Active enrollment of a student in a CourseOffering.
    
    Created from:
    1. Registration approval (advisor_approval mode) — the main path.
    2. Join-code self-enrollment (code mode).
    3. Admin roster-import (roster mode).
    
    Note: student enrollment is NEVER cloned across semesters.
    """

    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("offering_id", "student_id", name="uq_enroll_offering_student"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status"),
        nullable=False,
        default=EnrollmentStatus.active,
        index=True,
    )
    source: Mapped[str] = mapped_column(
        String, nullable=False, default="roster"
    )  # roster | code | registration
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    offering: Mapped["CourseOffering"] = relationship(back_populates="enrollments")

    @property
    def course_id(self) -> str:
        return self.offering_id

    @course_id.setter
    def course_id(self, value: str):
        self.offering_id = value


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

class Material(Base):
    """Course material uploaded by a lecturer and attached to a CourseOffering.
    
    Note: download_count is NEVER cloned when creating a new offering from a previous one.
    Cloned materials come in as status=draft with download_count=0.
    """

    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    week: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..15
    title: Mapped[str] = mapped_column(String, nullable=False)
    storage_key: Mapped[str] = mapped_column(String, nullable=False)
    content_sha256: Mapped[str] = mapped_column(String, nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String, nullable=False, default="")
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[MaterialStatus] = mapped_column(
        Enum(MaterialStatus, name="material_status"),
        nullable=False,
        default=MaterialStatus.draft,
        index=True,
    )
    release_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    summary_json: Mapped[str | None] = mapped_column(String, nullable=True)
    download_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    restriction: Mapped[str] = mapped_column(
        String, nullable=False, default="open"
    )  # open | app-only | view-only
    watermark_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # C11: emergency takedown — tombstone for mobile sync
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    removed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    offering: Mapped["CourseOffering"] = relationship(back_populates="materials")

    @property
    def course_id(self) -> str:
        return self.offering_id

    @course_id.setter
    def course_id(self, value: str):
        self.offering_id = value


# ---------------------------------------------------------------------------
# Timetable Sessions (admin/registry-owned, attached to offering)
# ---------------------------------------------------------------------------

class TimetableSession(Base):
    __tablename__ = "timetable_sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-6 (Mon-Sun)
    start_time: Mapped[str] = mapped_column(String, nullable=False)    # "HH:MM"
    end_time: Mapped[str] = mapped_column(String, nullable=False)      # "HH:MM"
    room: Mapped[str] = mapped_column(String, nullable=False)
    recurrence_rule: Mapped[str | None] = mapped_column(String, nullable=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Module 6: Identity, Onboarding & Authentication
# ---------------------------------------------------------------------------

class Invitation(Base):
    """Module 6A.1: an admin roster-import seeds an `invited` user + this token.
    The activation link carries `token`; using it sets the password -> Active."""

    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OtpCode(Base):
    """Module 6A.2 / 6C: short-lived numeric code for email/SMS verification."""

    __tablename__ = "otp_codes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String, nullable=False)  # never store raw OTP
    purpose: Mapped[str] = mapped_column(String, nullable=False)    # "verify" | "reset"
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Session(Base):
    """Module 6C: a logged-in device. Refresh token is hashed; supports remote logout."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    refresh_token_hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    device_name: Mapped[str] = mapped_column(String, nullable=False, default="Unknown device")
    fcm_token: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PendingApproval(Base):
    """Module 6A.2: a self-register request whose ID didn't match the roster lands here
    for an admin to approve/reject."""

    __tablename__ = "pending_approvals"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    institution_id: Mapped[str] = mapped_column(
        ForeignKey("universities.id"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False, default="")
    matric_or_staff_id: Mapped[str] = mapped_column(String, nullable=False)
    requested_role: Mapped[GlobalRole] = mapped_column(
        Enum(GlobalRole, name="global_role"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending|approved|rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InstitutionAccessRequest(Base):
    """C4/invite-only: lead-capture form. A prospective institution submits this;
    a superadmin manually reviews and provisions the institution if approved."""

    __tablename__ = "institution_access_requests"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    contact_name: Mapped[str] = mapped_column(String, nullable=False)
    contact_email: Mapped[str] = mapped_column(String, nullable=False)
    institution_name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    message: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending|approved|rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Module 11: Notifications & Module 13: Audit Trail
# ---------------------------------------------------------------------------

class NotificationSettings(Base):
    """Module 10B/11: user notification preferences, including digests and quiet hours."""

    __tablename__ = "notification_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    new_material: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    material_updated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    scheduled_release: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    draft_activity: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    roster_changes: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    pending_approvals: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    batch_delivery: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quiet_hours_start: Mapped[str | None] = mapped_column(String, nullable=True, default="22:00")
    quiet_hours_end: Mapped[str | None] = mapped_column(String, nullable=True, default="07:00")


class Notification(Base):
    """Module 11: in-app notification center feed (bell icon)."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    offering_id: Mapped[str | None] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="SET NULL"), nullable=True
    )
    material_id: Mapped[str | None] = mapped_column(
        ForeignKey("materials.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)   # e.g., "new_material"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_send_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def course_id(self) -> str | None:
        return self.offering_id

    @course_id.setter
    def course_id(self, value: str | None):
        self.offering_id = value


class AuditLog(Base):
    """Module 13: immutable audit trail for administrative and lecturer actions."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    institution_id: Mapped[str] = mapped_column(
        ForeignKey("universities.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    action: Mapped[str] = mapped_column(String, nullable=False)    # e.g., "publish_material"
    target_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Gap Solutions Models
# ---------------------------------------------------------------------------

class CourseJoinCode(Base):
    """Edge-case enrollment mode: code grants direct access to an offering."""

    __tablename__ = "course_join_codes"

    code: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    uses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class PersonalBackup(Base):
    __tablename__ = "personal_backups"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    manifest_blob: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    offering_id: Mapped[str] = mapped_column(
        ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(String, nullable=False)
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"

    announcement_id: Mapped[str] = mapped_column(
        ForeignKey("announcements.id", ondelete="CASCADE"), primary_key=True
    )
    student_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )


class FileReport(Base):
    __tablename__ = "file_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    material_id: Mapped[str] = mapped_column(
        ForeignKey("materials.id", ondelete="CASCADE"), nullable=False
    )
    reporter_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="open"
    )  # open | resolved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
