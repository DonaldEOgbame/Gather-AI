/** Typed wrappers over the backend routes (see backend/app/routers/*). */
import { request } from "./client";
import type {
  AccessOut,
  AccountStatus,
  CourseOut,
  GlobalRole,
  InstitutionOut,
  MaterialOut,
  NotificationOut,
  NotificationSettingsOut,
  PendingApprovalOut,
  OfferingLecturerOut,
  AcademicSessionOut,
  SemesterOut,
  OfferingOut,
  CurrentContextOut,
  StudentRegistrationOut,
  SemesterTerm,
  SessionOut,
  TokenOut,
  UserOut,
} from "./types";

export const authApi = {
  patchMe: (body: { display_name?: string; photo_consent?: boolean }) =>
    request<UserOut>("/auth/me", { method: "PATCH", body }),
  listUsers: (role?: string) =>
    request<UserOut[]>(`/auth/users${role ? `?role=${encodeURIComponent(role)}` : ""}`),
  getUser: (id: string) => request<UserOut>(`/auth/users/${id}`),
  resetPassword: (id: string) =>
    request<{ status: string; reset_token: string; expires_at: string }>(
      `/auth/users/${id}/reset-password`,
      { method: "POST" }
    ),
  changeRole: (id: string, global_role: GlobalRole) =>
    request<UserOut>(`/auth/users/${id}/role`, {
      method: "PATCH",
      body: { global_role },
    }),
  setStatus: (id: string, statusValue: AccountStatus) =>
    request<UserOut>(`/auth/users/${id}/status`, {
      method: "PATCH",
      body: { status: statusValue },
    }),
  revokeAllOtherSessions: () =>
    request<{ revoked: number }>("/auth/sessions/revoke-others", { method: "POST" }),
  login: (username: string, password: string, deviceName: string) => {
    // OAuth2PasswordRequestForm expects urlencoded form fields.
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    return request<TokenOut>(
      `/auth/login?device_name=${encodeURIComponent(deviceName)}`,
      { method: "POST", form, auth: false }
    );
  },
  forgotPassword: (email: string) =>
    request<{ status: string; reset_token: string | null }>("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email },
    }),
  resetPasswordPublic: (token: string, password: string) =>
    request<UserOut>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { token, password },
    }),
  activate: (token: string, password: string) =>
    request<UserOut>("/auth/activate", {
      method: "POST",
      auth: false,
      body: { token, password },
    }),
  /** Public match-preview for the Join screen (design 06): code → institution. */
  resolveJoinCode: (code: string) =>
    request<{ id: string; name: string; timezone: string }>(
      `/auth/resolve-join-code?code=${encodeURIComponent(code)}`,
      { auth: false }
    ),
  selfRegister: (body: {
    join_code: string;
    email: string;
    full_name: string;
    matric_or_staff_id: string;
    requested_role: string;
  }) => request("/auth/self-register", { method: "POST", auth: false, body }),
  verifyOtp: (body: { email: string; code: string; password: string }) =>
    request<UserOut>("/auth/verify-otp", { method: "POST", auth: false, body }),
  refresh: (refresh_token: string) =>
    request<AccessOut>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: { refresh_token },
    }),
  me: () => request<UserOut>("/auth/me"),
  sessions: () => request<SessionOut[]>("/auth/sessions"),
  revokeSession: (id: string) =>
    request(`/auth/sessions/${id}`, { method: "DELETE" }),
  setFcmToken: (fcm_token: string) =>
    request("/auth/fcm-token", { method: "PUT", body: { fcm_token } }),
  pendingApprovals: () =>
    request<PendingApprovalOut[]>("/auth/pending-approvals"),
  actOnApproval: (id: string, action: "approve" | "reject") =>
    request(`/auth/pending-approvals/${id}`, { method: "POST", body: { action } }),
  rosterImport: (institution_id: string, rows: unknown[]) =>
    request("/auth/roster-import", {
      method: "POST",
      body: { institution_id, rows },
    }),
};

export const notifApi = {
  list: () => request<NotificationOut[]>("/auth/notifications"),
  settings: () =>
    request<NotificationSettingsOut>("/auth/notifications/settings"),
  updateSettings: (s: Partial<NotificationSettingsOut>) =>
    request<NotificationSettingsOut>("/auth/notifications/settings", {
      method: "PUT",
      body: s,
    }),
  markRead: (id: string) =>
    request<NotificationOut>(`/auth/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () =>
    request("/auth/notifications/read-all", { method: "PUT" }),
};

export const coursesApi = {
  list: () => request<CourseOut[]>("/courses"),
  storageStats: () =>
    request<{
      total_bytes: number;
      by_department: { department_id: string; department_name: string; bytes_used: number }[];
    }>("/courses/storage-stats"),
  listDepartments: () =>
    request<{ id: string; university_id: string; name: string }[]>("/courses/departments"),
  createDepartment: (body: { university_id: string; name: string }) =>
    request<{ id: string; university_id: string; name: string }>("/courses/departments", {
      method: "POST",
      body,
    }),
  getInstitution: () =>
    request<{
      id: string;
      name: string;
      join_code: string | null;
      timezone: string;
      sharing_ceiling: string;
      watermark_mandatory: boolean;
      status: string;
      retention_months: number;
    }>("/courses/institutions/me"),
  requestAccess: (body: {
    contact_name: string;
    contact_email: string;
    institution_name: string;
    country?: string;
    message?: string;
  }) =>
    request<{ id: string; status: string }>("/courses/institutions/request-access", {
      method: "POST",
      auth: false,
      body,
    }),
  /** Super-admin: list pending institution access requests (design 81). */
  listAccessRequests: () =>
    request<{ id: string; contact_name: string; contact_email: string; institution_name: string; status: string; created_at: string }[]>(
      "/courses/institutions/access-requests"
    ),
  /** Super-admin: provision a new institution + mint its first admin (design 81). */
  provisionInstitution: (body: {
    name: string;
    admin_email: string;
    admin_full_name?: string;
    join_code?: string;
    timezone?: string;
  }) => request<{ id: string; name: string }>("/courses/institutions/provision", { method: "POST", body }),
  createCourse: (body: {
    department_id: string;
    code: string;
    title: string;
    credit_units?: number;
    description?: string;
  }) => request<CourseOut>("/courses", { method: "POST", body }),
};

export const sessionsApi = {
  list: () => request<AcademicSessionOut[]>("/sessions"),
  current: () => request<CurrentContextOut>("/sessions/current"),
  create: (body: { name: string; start_date?: string; end_date?: string }) =>
    request<AcademicSessionOut>("/sessions", { method: "POST", body }),
  activateSemester: (sessionId: string, term: SemesterTerm) =>
    request<SemesterOut>(`/sessions/${sessionId}/semesters/${term}/activate`, {
      method: "POST",
    }),
  patchSemester: (
    sessionId: string,
    term: SemesterTerm,
    body: {
      start_date?: string;
      end_date?: string;
      registration_open?: boolean;
      late_registration_open?: boolean;
      credit_unit_cap?: number;
    }
  ) =>
    request<SemesterOut>(`/sessions/${sessionId}/semesters/${term}`, {
      method: "PATCH",
      body,
    }),
  archiveSession: (sessionId: string) =>
    request(`/sessions/${sessionId}/archive`, { method: "POST" }),
};

export const offeringsApi = {
  list: (semesterId?: string, includeArchived?: boolean) =>
    request<OfferingOut[]>(
      `/offerings?semester_id=${semesterId ?? ""}&include_archived=${
        includeArchived ?? false
      }`
    ),
  get: (id: string) => request<OfferingOut>(`/offerings/${id}`),
  patch: (
    id: string,
    body: { sharing_ceiling?: string; watermark_mandatory?: boolean; enrollment_mode?: string; status?: string }
  ) => request<OfferingOut>(`/offerings/${id}`, { method: "PATCH", body }),
  create: (body: {
    course_id: string;
    semester_id: string;
    enrollment_mode?: string;
    sharing_ceiling?: string;
    watermark_mandatory?: boolean;
  }) => request<OfferingOut>("/offerings", { method: "POST", body }),
  clone: (
    id: string,
    body: {
      source_offering_id: string;
      week_filter?: number[] | null;
      opt_copy_settings?: boolean;
      opt_copy_team?: boolean;
    }
  ) =>
    request<{
      status: string;
      cloned_materials: number;
      settings_copied: boolean;
      team_copied: boolean;
    }>(`/offerings/${id}/clone`, { method: "POST", body }),
  archive: (id: string) =>
    request<{ status: string; offering_id: string }>(
      `/offerings/${id}/archive`,
      { method: "POST" }
    ),
  previewAsStudent: (id: string) =>
    request<MaterialOut[]>(`/offerings/${id}/preview-as-student`),
  listLecturers: (id: string) =>
    request<OfferingLecturerOut[]>(`/offerings/${id}/lecturers`),
  addLecturer: (
    id: string,
    body: {
      lecturer_id: string;
      is_owner?: boolean;
      can_publish?: boolean;
      can_manage_roster?: boolean;
    }
  ) =>
    request<OfferingLecturerOut>(`/offerings/${id}/lecturers`, {
      method: "POST",
      body,
    }),
  updateLecturer: (
    id: string,
    lecturerId: string,
    body: { can_publish?: boolean; can_manage_roster?: boolean }
  ) =>
    request<OfferingLecturerOut>(`/offerings/${id}/lecturers/${lecturerId}`, {
      method: "PATCH",
      body,
    }),
  removeLecturer: (id: string, lecturerId: string) =>
    request(`/offerings/${id}/lecturers/${lecturerId}`, { method: "DELETE" }),
};

export const registrationApi = {
  submit: (body: { semester_id: string; offering_ids: string[] }) =>
    request<StudentRegistrationOut>("/registration", { method: "POST", body }),
  availableOfferings: (semesterId: string) =>
    request<OfferingOut[]>(`/registration/available-offerings/${semesterId}`),
  getMy: (semesterId: string) =>
    request<StudentRegistrationOut>(`/registration/my/${semesterId}`),
  listPending: (semesterId: string) =>
    request<StudentRegistrationOut[]>(`/registration/pending/${semesterId}`),
  actOnApproval: (registrationId: string, body: { approve: boolean; note?: string }) =>
    request<StudentRegistrationOut>(`/registration/${registrationId}/approve`, {
      method: "POST",
      body,
    }),
  enrollByCode: (offeringId: string, code: string) =>
    request<{ status: string; enrollment_id: string }>(
      `/offerings/${offeringId}/enroll-code`,
      { method: "POST", body: { code } }
    ),
  createJoinCode: (
    offeringId: string,
    body?: { expires_in_hours?: number; max_uses?: number }
  ) =>
    request<{ code: string; expires_at: string; max_uses: number }>(
      `/offerings/${offeringId}/join-code`,
      { method: "POST", body: body ?? {} }
    ),
  listEnrollments: (offeringId: string) =>
    request<
      {
        enrollment_id: string;
        student_id: string;
        email: string;
        full_name: string;
        matric_or_staff_id: string | null;
        status: string;
        source: string;
        enrolled_at: string;
      }[]
    >(`/offerings/${offeringId}/enrollments`),
};

export const enrollmentApi = {
  /** Resolve a student course join code (e.g. "ZKFP8G") to its offering. */
  resolveCourseJoinCode: (code: string) =>
    request<OfferingOut>(`/offerings/join-code/${encodeURIComponent(code.trim().toUpperCase())}`),
  enroll: (offeringId: string, code?: string) => {
    if (code) {
      return registrationApi.enrollByCode(offeringId, code);
    }
    return request(`/offerings/${offeringId}/enroll-code`, {
      method: "POST",
      body: { code: "" },
    });
  },
  generateJoinCode: (offeringId: string, maxUses = 100, hours = 24) =>
    registrationApi.createJoinCode(offeringId, {
      max_uses: maxUses,
      expires_in_hours: hours,
    }),
  updateMode: (offeringId: string, enrollmentMode: string) =>
    request<{ id: string; enrollment_mode: string }>(
      `/offerings/${offeringId}`,
      { method: "PATCH", body: { enrollment_mode: enrollmentMode } }
    ),
  actOnRequest: (requestId: string, approve: boolean) =>
    registrationApi.actOnApproval(requestId, { approve }),
};

export const materialsApi = {
  list: (offeringId: string) =>
    request<MaterialOut[]>(`/materials?offering_id=${offeringId}`),
  analytics: (offeringId: string) =>
    request<{
      total_files: number;
      total_downloads: number;
      total_bytes: number;
      quota_bytes: number;
      enrolled_students: number;
      top_materials: {
        id: string;
        title: string;
        original_filename: string;
        download_count: number;
        week: number;
        status: string;
      }[];
    }>(`/materials/analytics/${offeringId}`),
  upload: (form: FormData) =>
    request<MaterialOut>("/materials", { method: "POST", form }),
  update: (id: string, body: Record<string, unknown>) =>
    request<MaterialOut>(`/materials/${id}`, { method: "PATCH", body }),
  publish: (id: string, release_at: string | null) =>
    request<MaterialOut>(`/materials/${id}/publish`, {
      method: "POST",
      body: { release_at },
    }),
  publishBatch: (material_ids: string[], release_at: string | null) =>
    request<MaterialOut[]>("/materials/publish-batch", {
      method: "POST",
      body: { material_ids, release_at },
    }),
  remove: (id: string, reason: string) =>
    request<{ status: string; material_id: string }>(
      `/materials/${id}/remove`,
      { method: "POST", body: { reason } }
    ),
  summary: (id: string) =>
    request<{ tldr: string[]; key_terms: string[] }>(`/materials/${id}/summary`),
  downloadUrl: (id: string) => `/materials/${id}/download`,
};

export const timetableApi = {
  getToday: () => request<any[]>("/timetable/today"),
  importCsv: (offeringId: string, fileData: string, fileName: string) => {
    const form = new FormData();
    form.append("offering_id", offeringId);
    form.append("file", {
      uri: fileData,
      name: fileName,
      type: "text/csv",
    } as any);
    return request<{ imported: number }>("/timetable/import", {
      method: "POST",
      form,
    });
  },
  getOfferingTimetable: (offeringId: string) =>
    request<any[]>(`/timetable/offering/${offeringId}`),
  getCourseTimetable: (offeringId: string) =>
    request<any[]>(`/timetable/offering/${offeringId}`),
  addSlot: (
    offeringId: string,
    body: {
      weekday?: number;
      day_of_week?: number;
      start_time: string;
      end_time: string;
      room: string;
    }
  ) =>
    request<any>(`/timetable/offering/${offeringId}`, { method: "POST", body }),
  updateSlot: (slotId: string, body: { start_time?: string; end_time?: string; room?: string }) =>
    request<any>(`/timetable/slot/${slotId}`, { method: "PATCH", body }),
  deleteSlot: (slotId: string) =>
    request<void>(`/timetable/slot/${slotId}`, { method: "DELETE" }),
};

export const backupApi = {
  putManifest: (manifestBlob: string) =>
    request("/backup/manifest", {
      method: "PUT",
      body: { manifest_blob: manifestBlob },
    }),
  getManifest: () => request<{ manifest_blob: string }>("/backup/manifest"),
  uploadFile: (form: FormData) =>
    request<{ hash: string }>("/backup/file", { method: "POST", form }),
  downloadFile: (hash: string) => request<Blob>(`/backup/file/${hash}`),
};

export const announcementsApi = {
  create: (
    offeringId: string,
    title: string,
    body: string,
    pinned = false,
    sendPush = true
  ) =>
    request<any>(`/offerings/${offeringId}/announcements`, {
      method: "POST",
      body: { title, body, pinned, send_push: sendPush },
    }),
  list: (offeringId: string) =>
    request<any[]>(`/offerings/${offeringId}/announcements`),
  markRead: (id: string) =>
    request<any>(`/offerings/announcements/${id}/read`, { method: "POST" }),
};

export const reportsApi = {
  reportFile: (materialId: string, reason: string, note?: string) =>
    request<any>(`/materials/${materialId}/report`, {
      method: "POST",
      body: { reason, note },
    }),
  listReports: (offeringId: string) =>
    request<any[]>(`/offerings/${offeringId}/reports`),
  resolveReport: (reportId: string, status: "resolved" | "open") =>
    request<any>(`/reports/${reportId}/resolve`, {
      method: "PATCH",
      body: { status },
    }),
};

export const auditLogsApi = {
  list: (category?: string) =>
    request<{
      id: string;
      institution_id: string;
      user_id: string;
      action: string;
      target_id: string | null;
      details: string | null;
      created_at: string;
      user_display_name: string | null;
      user_email: string | null;
    }[]>(`/courses/audit-logs${category && category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
};

export const institutionApi = {
  get: () => request<InstitutionOut>("/courses/institutions/me"),
  patch: (body: {
    sharing_ceiling?: string;
    watermark_mandatory?: boolean;
    retention_months?: number;
    name?: string;
    join_code?: string;
    timezone?: string;
    allowed_file_types?: string;
    max_file_size_mb?: number;
    max_files_per_week?: number;
  }) => request<InstitutionOut>("/courses/institutions/me", { method: "PATCH", body }),
};
