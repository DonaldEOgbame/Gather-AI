/**
 * Wire types mirroring the FastAPI backend (backend/app/schemas.py & models.py).
 * Keep these in sync with the server contract.
 */

export type GlobalRole = "admin" | "lecturer" | "student";
export type AccountStatus = "invited" | "active" | "suspended" | "archived";
export type MaterialStatus = "draft" | "scheduled" | "live" | "removed";
export type SessionStatus = "upcoming" | "active" | "archived";
export type SemesterTerm = "first" | "second";
export type SemesterStatus = "upcoming" | "active" | "archived";
export type OfferingStatus = "draft" | "active" | "archived";

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  legal_name: string;
  display_name: string | null;
  title: string;
  global_role: GlobalRole;
  status: AccountStatus;
  institution_id: string | null;
  matric_or_staff_id: string | null;
  created_at: string;
}

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface AccessOut {
  access_token: string;
  token_type: "bearer";
}

export interface CourseOut {
  id: string;
  department_id: string;
  code: string;
  title: string;
  credit_units: number;
  description: string | null;
}

export interface OfferingOut {
  id: string;
  course_id: string;
  semester_id: string;
  status: OfferingStatus;
  enrollment_mode: string;
  sharing_ceiling: string;
  watermark_mandatory: boolean;
  code: string | null;
  title: string | null;
  credit_units: number | null;
  department_id: string | null;
  session_name: string | null;
  semester_term: SemesterTerm | null;
  enrollment_status: string | null;
  is_lecturer: boolean | null;
  is_owner: boolean | null;
}

export interface OfferingLecturerOut {
  id: string;
  offering_id: string;
  lecturer_id: string;
  is_owner: boolean;
  can_publish: boolean;
  can_manage_roster: boolean;
}

export interface AcademicSessionOut {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: SessionStatus;
  semesters: SemesterOut[];
}

export interface SemesterOut {
  id: string;
  term: SemesterTerm;
  start_date: string | null;
  end_date: string | null;
  registration_open: boolean;
  late_registration_open: boolean;
  credit_unit_cap: number;
  status: SemesterStatus;
}

export interface CurrentContextOut {
  session: AcademicSessionOut;
  semester: SemesterOut;
}

export interface RegistrationItemOut {
  id: string;
  offering_id: string;
}

export interface StudentRegistrationOut {
  id: string;
  student_id: string;
  semester_id: string;
  approved_by: string | null;
  status: "advisor_pending" | "active" | "rejected";
  total_credit_units: number;
  is_late: boolean;
  submitted_at: string;
  approved_at: string | null;
  items: RegistrationItemOut[];
}

export interface MaterialOut {
  id: string;
  offering_id: string;
  week: number;
  title: string;
  content_sha256: string;
  original_filename: string;
  size_bytes: number;
  status: MaterialStatus;
  release_at: string | null;
  download_count: number;
  created_at: string;
  restriction: string;
  watermark_override: boolean;
  removed_at: string | null;
}

export interface NotificationOut {
  id: string;
  offering_id: string | null;
  material_id: string | null;
  title: string;
  body: string;
  type: string;
  created_at: string;
  read_at: string | null;
  sent_at: string | null;
}

export interface NotificationSettingsOut {
  enabled: boolean;
  new_material: boolean;
  material_updated: boolean;
  scheduled_release: boolean;
  draft_activity: boolean;
  roster_changes: boolean;
  pending_approvals: boolean;
  batch_delivery: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface SessionOut {
  id: string;
  device_name: string;
  created_at: string;
  last_seen_at: string;
  current: boolean;
}

export interface PendingApprovalOut {
  id: string;
  email: string;
  full_name: string;
  matric_or_staff_id: string;
  requested_role: GlobalRole;
  status: string;
  created_at: string;
}
