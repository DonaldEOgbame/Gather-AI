import { useQuery } from "@tanstack/react-query";
import { coursesApi, offeringsApi, sessionsApi, materialsApi, notifApi, registrationApi } from "@/api/endpoints";
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
