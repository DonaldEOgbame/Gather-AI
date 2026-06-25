from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    AccountStatus,
    EnrollmentStatus,
    GlobalRole,
    InstitutionStatus,
    MaterialStatus,
    OfferingStatus,
    SemesterStatus,
    SemesterTerm,
    SessionStatus,
)


# ---------------------------------------------------------------------------
# Module 6: identity & onboarding
# ---------------------------------------------------------------------------

class RosterRowIn(BaseModel):
    email: EmailStr
    full_name: str = ""
    title: str = ""
    matric_or_staff_id: str
    global_role: GlobalRole = GlobalRole.student


class RosterImportIn(BaseModel):
    institution_id: str
    rows: list[RosterRowIn]


class RosterRowError(BaseModel):
    row: int
    email: str
    reason: str


class RosterImportResult(BaseModel):
    """C9: per-row structured result — not all-or-nothing."""
    invited: int
    skipped_existing: int
    failed: list[RosterRowError] = []


class ActivateIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


class SelfRegisterIn(BaseModel):
    join_code: str
    matric_or_staff_id: str
    email: EmailStr
    full_name: str = ""
    requested_role: GlobalRole = GlobalRole.student


class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str
    password: str = Field(min_length=8)


class ApprovalActionIn(BaseModel):
    approve: bool


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class AccessOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SessionOut(BaseModel):
    id: str
    device_name: str
    created_at: datetime
    last_seen_at: datetime
    current: bool = False

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    legal_name: str
    display_name: str | None
    title: str
    matric_or_staff_id: str | None = None
    global_role: GlobalRole
    status: AccountStatus
    institution_id: str | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class DisplayNameIn(BaseModel):
    """C18: student-editable display name update."""
    display_name: str = Field(max_length=120)


class PendingApprovalOut(BaseModel):
    id: str
    email: str
    full_name: str
    matric_or_staff_id: str
    requested_role: GlobalRole
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# C4 invite-only: institution provisioning and access requests
# ---------------------------------------------------------------------------

class InstitutionProvisionIn(BaseModel):
    """Superadmin provisions a new institution (invite-only v1)."""
    name: str
    join_code: str | None = None
    timezone: str = "UTC"
    retention_months: int = 12
    admin_email: EmailStr
    admin_full_name: str = ""
    admin_matric_or_staff_id: str = "ADMIN-1"


class InstitutionIn(BaseModel):
    """Update-only (superadmin patching an existing institution)."""
    name: str | None = None
    join_code: str | None = None
    timezone: str | None = None
    sharing_ceiling: str | None = None
    watermark_mandatory: bool | None = None
    retention_months: int | None = None


class InstitutionOut(BaseModel):
    id: str
    name: str
    join_code: str | None
    timezone: str
    sharing_ceiling: str
    watermark_mandatory: bool
    status: InstitutionStatus
    retention_months: int

    class Config:
        from_attributes = True


class AccessRequestIn(BaseModel):
    """C4: public lead-capture form. Lands in superadmin queue for manual review."""
    contact_name: str
    contact_email: EmailStr
    institution_name: str
    country: str | None = None
    message: str | None = None


class AccessRequestOut(BaseModel):
    id: str
    contact_name: str
    contact_email: str
    institution_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Academic Session & Semester
# ---------------------------------------------------------------------------

class SemesterOut(BaseModel):
    id: str
    term: SemesterTerm
    start_date: datetime | None
    end_date: datetime | None
    registration_open: bool
    late_registration_open: bool
    credit_unit_cap: int
    status: SemesterStatus

    class Config:
        from_attributes = True


class SemesterPatchIn(BaseModel):
    """Admin patches semester dates and registration window."""
    start_date: datetime | None = None
    end_date: datetime | None = None
    registration_open: bool | None = None
    late_registration_open: bool | None = None
    credit_unit_cap: int | None = None


class AcademicSessionIn(BaseModel):
    """C1: Admin creates a session. Both semesters auto-created as 'upcoming'."""
    name: str                           # e.g. "2025/2026"
    start_date: datetime | None = None
    end_date: datetime | None = None


class AcademicSessionOut(BaseModel):
    id: str
    name: str
    start_date: datetime | None
    end_date: datetime | None
    status: SessionStatus
    semesters: list[SemesterOut]

    class Config:
        from_attributes = True


class CurrentContextOut(BaseModel):
    """Returned by GET /sessions/current — the anchor for all 'current' queries."""
    session: AcademicSessionOut
    semester: SemesterOut


# ---------------------------------------------------------------------------
# Department (stable, for catalog management)
# ---------------------------------------------------------------------------

class DepartmentIn(BaseModel):
    university_id: str
    name: str


class DepartmentOut(BaseModel):
    id: str
    university_id: str
    name: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Catalog Course (no semester_id — stable across offerings)
# ---------------------------------------------------------------------------

class CourseIn(BaseModel):
    department_id: str
    code: str
    title: str = ""
    credit_units: int = 3
    description: str | None = None
    semester_id: str | None = None


class CourseOut(BaseModel):
    id: str
    department_id: str
    code: str
    title: str
    credit_units: int
    description: str | None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Course Offering (catalog course × semester instance)
# ---------------------------------------------------------------------------

class OfferingIn(BaseModel):
    course_id: str
    semester_id: str
    enrollment_mode: str = "advisor_approval"
    sharing_ceiling: str = "open"
    watermark_mandatory: bool = False


class OfferingOut(BaseModel):
    id: str
    course_id: str
    semester_id: str
    status: OfferingStatus
    enrollment_mode: str
    sharing_ceiling: str
    watermark_mandatory: bool
    # Denormalized for display convenience (avoids extra round-trips on client)
    code: str | None = None
    title: str | None = None
    credit_units: int | None = None
    department_id: str | None = None
    session_name: str | None = None       # e.g. "2025/2026"
    semester_term: SemesterTerm | None = None
    # Computed for the requesting user
    enrollment_status: str | None = None  # "active" | "advisor_pending" | "unenrolled"
    is_lecturer: bool | None = None
    is_owner: bool | None = None

    class Config:
        from_attributes = True


class OfferingPatchIn(BaseModel):
    enrollment_mode: str | None = None
    sharing_ceiling: str | None = None
    watermark_mandatory: bool | None = None
    status: OfferingStatus | None = None


class CloneIn(BaseModel):
    """C2: Clone materials from a previous offering into this one.
    
    Decisions:
    - Default: materials only (as drafts), download_count=0.
    - opt_copy_settings: also copies sharing_ceiling, watermark_mandatory, enrollment_mode.
    - opt_copy_team: also copies OfferingLecturer rows.
    - Student enrollments are NEVER cloned.
    """
    source_offering_id: str
    week_filter: list[int] | None = None        # None = all weeks
    opt_copy_settings: bool = False
    opt_copy_team: bool = False                 # OFF by default — staffing changes term-to-term


# ---------------------------------------------------------------------------
# Offering Lecturer (replaces old CourseRoster)
# ---------------------------------------------------------------------------

class OfferingLecturerIn(BaseModel):
    lecturer_id: str
    is_owner: bool = False
    can_publish: bool = True
    can_manage_roster: bool = False


class OfferingLecturerOut(BaseModel):
    id: str
    offering_id: str
    lecturer_id: str
    is_owner: bool
    can_publish: bool
    can_manage_roster: bool

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# C3: Student Registration (advisor-approval model)
# ---------------------------------------------------------------------------

class RegistrationSubmitIn(BaseModel):
    """Student submits their course selection for the semester."""
    semester_id: str
    offering_ids: list[str]


class RegistrationItemOut(BaseModel):
    id: str
    offering_id: str

    class Config:
        from_attributes = True


class StudentRegistrationOut(BaseModel):
    id: str
    student_id: str
    semester_id: str
    approved_by: str | None
    status: str         # advisor_pending | active | rejected
    total_credit_units: int
    is_late: bool
    submitted_at: datetime
    approved_at: datetime | None
    items: list[RegistrationItemOut] = []

    class Config:
        from_attributes = True


class RegistrationApprovalIn(BaseModel):
    """Advisor/HOD approves or rejects a student's full registration batch."""
    approve: bool
    note: str | None = None


# ---------------------------------------------------------------------------
# Enrollment (individual offering-student link)
# ---------------------------------------------------------------------------

class EnrollmentOut(BaseModel):
    id: str
    offering_id: str
    student_id: str
    status: EnrollmentStatus
    source: str
    enrolled_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

class MaterialOut(BaseModel):
    id: str
    offering_id: str
    week: int
    title: str
    original_filename: str
    size_bytes: int
    content_sha256: str
    status: MaterialStatus
    release_at: datetime | None
    download_count: int
    created_at: datetime
    restriction: str
    watermark_override: bool
    removed_at: datetime | None = None

    class Config:
        from_attributes = True


class MaterialUpdateIn(BaseModel):
    week: int | None = None
    title: str | None = None
    status: MaterialStatus | None = None
    release_at: datetime | None = None
    restriction: str | None = None
    watermark_override: bool | None = None


class PublishIn(BaseModel):
    release_at: datetime | None = None


class PublishBatchIn(BaseModel):
    material_ids: list[str]
    release_at: datetime | None = None


class MaterialRemoveIn(BaseModel):
    """C11: emergency takedown reason."""
    reason: str


# ---------------------------------------------------------------------------
# Module 11/13: Notifications & Audit
# ---------------------------------------------------------------------------

class FcmTokenIn(BaseModel):
    fcm_token: str


class NotificationSettingsOut(BaseModel):
    enabled: bool
    new_material: bool
    material_updated: bool
    scheduled_release: bool
    draft_activity: bool
    roster_changes: bool
    pending_approvals: bool
    batch_delivery: bool
    quiet_hours_start: str | None
    quiet_hours_end: str | None

    class Config:
        from_attributes = True


class NotificationSettingsUpdateIn(BaseModel):
    enabled: bool | None = None
    new_material: bool | None = None
    material_updated: bool | None = None
    scheduled_release: bool | None = None
    draft_activity: bool | None = None
    roster_changes: bool | None = None
    pending_approvals: bool | None = None
    batch_delivery: bool | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None


class NotificationOut(BaseModel):
    id: str
    offering_id: str | None
    material_id: str | None
    title: str
    body: str
    type: str
    created_at: datetime
    read_at: datetime | None
    sent_at: datetime | None

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: str
    institution_id: str
    user_id: str
    action: str
    target_id: str | None
    details: str | None
    created_at: datetime

    class Config:
        from_attributes = True
