import { useQuery } from "@tanstack/react-query";
import { authApi, coursesApi, offeringsApi, sessionsApi, materialsApi, notifApi, registrationApi, auditLogsApi } from "@/api/endpoints";
import type {
  CourseOut,
  MaterialOut,
  NotificationOut,
  NotificationSettingsOut,
  OfferingLecturerOut,
  AcademicSessionOut,
  OfferingOut,
  CurrentContextOut,
  StudentRegistrationOut,
  UserOut,
} from "@/api/types";

export const useCourses = () =>
  useQuery<CourseOut[]>({ queryKey: ["courses"], queryFn: coursesApi.list });

export const useOfferings = (semesterId?: string, includeArchived?: boolean) =>
  useQuery<OfferingOut[]>({
    queryKey: ["offerings", semesterId, includeArchived],
    queryFn: () => offeringsApi.list(semesterId, includeArchived),
  });

export const useMaterials = (offeringId: string) =>
  useQuery<MaterialOut[]>({
    queryKey: ["materials", offeringId],
    queryFn: () => materialsApi.list(offeringId),
  });

export const useRoster = (offeringId: string) =>
  useQuery<OfferingLecturerOut[]>({
    queryKey: ["roster", offeringId],
    queryFn: () => offeringsApi.listLecturers(offeringId),
  });

export const useNotifications = () =>
  useQuery<NotificationOut[]>({ queryKey: ["notifications"], queryFn: notifApi.list });

export const useNotifSettings = () =>
  useQuery<NotificationSettingsOut>({
    queryKey: ["notif-settings"],
    queryFn: notifApi.settings,
  });

export const useSessions = () =>
  useQuery<AcademicSessionOut[]>({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });

export const useCurrentContext = () =>
  useQuery<CurrentContextOut>({
    queryKey: ["current-context"],
    queryFn: sessionsApi.current,
  });

export const useMyRegistration = (semesterId: string) =>
  useQuery<StudentRegistrationOut>({
    queryKey: ["my-registration", semesterId],
    queryFn: () => registrationApi.getMy(semesterId),
    enabled: !!semesterId,
  });

export const useRegistrationOfferings = (semesterId: string) =>
  useQuery<OfferingOut[]>({
    queryKey: ["registration-offerings", semesterId],
    queryFn: () => registrationApi.availableOfferings(semesterId),
    enabled: !!semesterId,
  });

export const usePendingRegistrations = (semesterId: string) =>
  useQuery<StudentRegistrationOut[]>({
    queryKey: ["pending-registrations", semesterId],
    queryFn: () => registrationApi.listPending(semesterId),
    enabled: !!semesterId,
  });

export const useDepartments = () =>
  useQuery<{ id: string; university_id: string; name: string }[]>({
    queryKey: ["departments"],
    queryFn: coursesApi.listDepartments,
  });

export const useInstitution = () =>
  useQuery<{
    id: string;
    name: string;
    join_code: string | null;
    timezone: string;
    sharing_ceiling: string;
    watermark_mandatory: boolean;
    status: string;
    retention_months: number;
  }>({
    queryKey: ["institution"],
    queryFn: coursesApi.getInstitution,
  });

export const useStorageStats = () =>
  useQuery<{
    total_bytes: number;
    by_department: { department_id: string; department_name: string; bytes_used: number }[];
  }>({
    queryKey: ["storage-stats"],
    queryFn: coursesApi.storageStats,
  });

export const useOfferingAnalytics = (offeringId: string) =>
  useQuery<{
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
  }>({
    queryKey: ["offering-analytics", offeringId],
    queryFn: () => materialsApi.analytics(offeringId),
    enabled: !!offeringId,
  });

export const useInstitutionUsers = (role?: string) =>
  useQuery<UserOut[]>({
    queryKey: ["institution-users", role],
    queryFn: () => authApi.listUsers(role),
  });

export const useEnrollments = (offeringId: string) =>
  useQuery<{
    enrollment_id: string;
    student_id: string;
    email: string;
    full_name: string;
    matric_or_staff_id: string | null;
    status: string;
    source: string;
    enrolled_at: string;
  }[]>({
    queryKey: ["enrollments", offeringId],
    queryFn: () => registrationApi.listEnrollments(offeringId),
    enabled: !!offeringId,
  });

export const useAuditLogs = (category?: string) =>
  useQuery<{
    id: string;
    institution_id: string;
    user_id: string;
    action: string;
    target_id: string | null;
    details: string | null;
    created_at: string;
    user_display_name: string | null;
    user_email: string | null;
  }[]>({
    queryKey: ["audit-logs", category],
    queryFn: () => auditLogsApi.list(category),
  });

export const useDrafts = (offeringId: string) =>
  useQuery<MaterialOut[]>({
    queryKey: ["drafts", offeringId],
    queryFn: () => materialsApi.list(offeringId),
    enabled: !!offeringId,
    select: (data) => data.filter((m) => m.status === "draft"),
  });

export const useOfferingMaterials = (offeringId: string) =>
  useQuery<MaterialOut[]>({
    queryKey: ["materials", offeringId],
    queryFn: () => materialsApi.list(offeringId),
    enabled: !!offeringId,
  });
