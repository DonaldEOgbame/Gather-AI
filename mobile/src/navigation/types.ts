import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParams = {
  Login: undefined;
  Activate: { token?: string } | undefined;
  JoinCode: undefined;
  Otp: { email: string };
  Onboarding: undefined;
  RequestAccess: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Main: undefined;
  Locked: undefined;
  // shared modal-ish screens reachable from tabs:
  OfferingDetail: { offeringId: string; code: string; title: string; sessionName?: string; semesterTerm?: string };
  Viewer: { placementId?: string; materialId?: string; title: string; sha256?: string };
  FolderDetail: { folderId: string; name: string; isCollection?: boolean };
  NotificationCenter: undefined;
  Settings: undefined;
  PastSemesters: undefined;
  RegistrationPortal: undefined;
  // Admin · institution setup (design 43–48)
  Semesters: undefined;
  Departments: undefined;
  RosterImport: undefined;
  AssignLecturers: { offeringId?: string; code?: string; title?: string } | undefined;
  Enrollment: { offeringId?: string; code?: string; title?: string } | undefined;
  AuditLog: undefined;
  // Admin · policies, quotas & timetable (design 49–52)
  SharingPolicy: undefined;
  StorageQuotas: undefined;
  FileLimits: undefined;
  TimetableEditor: { offeringId?: string; code?: string } | undefined;
  // Lecturer · approvals, announcements & controls (design 53–56)
  EnrollmentRequests: { offeringId?: string; code?: string } | undefined;
  AnnouncementCompose: { offeringId?: string; code?: string } | undefined;
  FileReports: { offeringId?: string; code?: string } | undefined;
  SharingRestriction: { offeringId?: string; code?: string } | undefined;
  // Batch 3 · lecturer + student rich flows (design 21–22, 30–33, 57–60)
  PublishSheet: { ids?: string[]; code?: string; week?: number } | undefined;
  CourseAnalytics: { offeringId?: string; code?: string; title?: string } | undefined;
  UploadMaterial: { offeringId?: string; code?: string } | undefined;
  DraftsHygiene: undefined;
  VersionRollback: { code?: string; fileName?: string } | undefined;
  ReadyToday: undefined;
  Versions: { code?: string; fileName?: string } | undefined;
  PreDownload: { title?: string } | undefined;
  StorageSync: undefined;
  JoinCourse: undefined;
  // Batch 4 · student data, sync, backup & collections (design 61–72)
  AnnouncementsFeed: { offeringId?: string; code?: string } | undefined;
  ReportIssue: { title?: string; code?: string } | undefined;
  RestrictedViewer: { title?: string; code?: string } | undefined;
  Schedule: undefined;
  DataCost: { title?: string } | undefined;
  SearchInFiles: undefined;
  LibraryBackup: undefined;
  Restore: undefined;
  SyncInfo: undefined;
  Collections: undefined;
  LiteMode: undefined;
  // Batch 5 · workflow sheets + registration & semester transition (design 27,29,36,38,83-87,99)
  ShareToGather: undefined;
  SmartCluster: { folderId?: string; name?: string } | undefined;
  ImportFiles: undefined;
  FileActions: { title?: string; meta?: string } | undefined;
  RegisterCourses: undefined;
  AwaitingAdvisor: undefined;
  AdvisorApproval: { code?: string } | undefined;
  NewSemester: undefined;
  Reorganizing: undefined;
  OverTheCap: undefined;
  // Batch 6 · session model (design 77-82)
  Sessions: undefined;
  CreateSession: undefined;
  AddOffering: { offeringId?: string } | undefined;
  Rollover: undefined;
  TenantQueue: undefined;
  // Batch 6 · safety, identity & ops (design 89-104, 106)
  Takedown: { title?: string; meta?: string } | undefined;
  PhotoConsent: undefined;
  ReviewPhotos: undefined;
  LogoutOptions: undefined;
  PreviewAsStudent: { offeringId?: string; code?: string } | undefined;
  AccountVsDevice: undefined;
  NameIdentity: undefined;
  ImportResults: undefined;
  LocalMirror: undefined;
  SwitchAccount: undefined;
  Handover: { lecturerId?: string } | undefined;
  PendingActions: undefined;
  ViewAsStudent: { studentId?: string; code?: string } | undefined;
  ChangeRestriction: { fileName?: string; code?: string } | undefined;
  FreeUpSpace: undefined;
};

export type AuthScreen<T extends keyof AuthStackParams> = NativeStackScreenProps<
  AuthStackParams,
  T
>;
export type RootScreen<T extends keyof RootStackParams> = NativeStackScreenProps<
  RootStackParams,
  T
>;
