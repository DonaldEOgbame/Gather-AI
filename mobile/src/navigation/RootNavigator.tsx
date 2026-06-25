import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/stores/auth";
import { usePrefs } from "@/stores/prefs";
import { useOnboarding } from "@/screens/auth/OnboardingScreen";
import { biometricUnlock } from "@/services/permissions";

import type { RootStackParams } from "./types";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import OnboardingScreen from "@/screens/auth/OnboardingScreen";
import LockedScreen from "@/screens/LockedScreen";
import OfferingDetailScreen from "@/screens/OfferingDetailScreen";
import ViewerScreen from "@/screens/ViewerScreen";
import FolderDetailScreen from "@/screens/FolderDetailScreen";
import NotificationCenterScreen from "@/screens/NotificationCenterScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SemestersScreen from "@/screens/admin/SemestersScreen";
import DepartmentsScreen from "@/screens/admin/DepartmentsScreen";
import RosterImportScreen from "@/screens/admin/RosterImportScreen";
import AssignLecturersScreen from "@/screens/admin/AssignLecturersScreen";
import EnrollmentScreen from "@/screens/admin/EnrollmentScreen";
import AuditLogScreen from "@/screens/admin/AuditLogScreen";
import SharingPolicyScreen from "@/screens/admin/SharingPolicyScreen";
import StorageQuotasScreen from "@/screens/admin/StorageQuotasScreen";
import FileLimitsScreen from "@/screens/admin/FileLimitsScreen";
import TimetableEditorScreen from "@/screens/admin/TimetableEditorScreen";
import EnrollmentRequestsScreen from "@/screens/lecturer/EnrollmentRequestsScreen";
import AnnouncementComposeScreen from "@/screens/lecturer/AnnouncementComposeScreen";
import FileReportsScreen from "@/screens/lecturer/FileReportsScreen";
import SharingRestrictionScreen from "@/screens/lecturer/SharingRestrictionScreen";
import CourseAnalyticsScreen from "@/screens/lecturer/CourseAnalyticsScreen";
import UploadMaterialScreen from "@/screens/lecturer/UploadMaterialScreen";
import DraftsHygieneScreen from "@/screens/lecturer/DraftsHygieneScreen";
import VersionRollbackScreen from "@/screens/lecturer/VersionRollbackScreen";
import PublishSheetScreen from "@/screens/lecturer/PublishSheetScreen";
import ReadyTodayScreen from "@/screens/student/ReadyTodayScreen";
import VersionsScreen from "@/screens/student/VersionsScreen";
import PreDownloadScreen from "@/screens/student/PreDownloadScreen";
import StorageSyncScreen from "@/screens/student/StorageSyncScreen";
import JoinCourseScreen from "@/screens/student/JoinCourseScreen";

const Stack = createNativeStackNavigator<RootStackParams>();

export default function RootNavigator() {
  const { phase, unlocked, setUnlocked } = useAuth();
  const onboardingDone = useOnboarding((s) => s.done);
  const biometricLock = usePrefs((s) => s.biometricLock);

  // App-lock gate (Module 6C): when enabled, require biometrics each launch.
  useEffect(() => {
    if (phase === "authed" && biometricLock && !unlocked) {
      biometricUnlock().then((ok) => ok && setUnlocked(true));
    } else if (phase === "authed" && !biometricLock) {
      setUnlocked(true);
    }
  }, [phase, biometricLock, unlocked, setUnlocked]);

  if (phase === "anon" || phase === "loading") {
    return <AuthNavigator />;
  }
  if (phase === "locked") {
    return <LockedScreen reason="suspended" />;
  }
  if (biometricLock && !unlocked) {
    return <LockedScreen reason="biometric" />;
  }
  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  // Detail screens carry their own large in-screen headers; the native bar
  // contributes only a back chevron (no title / shadow) over the app background.
  const detailHeader = {
    title: "",
    headerShadowVisible: false,
    headerTintColor: "#14171C",
    headerStyle: { backgroundColor: "#F7F8FA" },
  } as const;

  return (
    <Stack.Navigator screenOptions={detailHeader}>
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="OfferingDetail" component={OfferingDetailScreen} />
      <Stack.Screen name="Viewer" component={ViewerScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Semesters" component={SemestersScreen} />
      <Stack.Screen name="Departments" component={DepartmentsScreen} />
      <Stack.Screen name="RosterImport" component={RosterImportScreen} />
      <Stack.Screen name="AssignLecturers" component={AssignLecturersScreen} />
      <Stack.Screen name="Enrollment" component={EnrollmentScreen} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} />
      <Stack.Screen name="SharingPolicy" component={SharingPolicyScreen} />
      <Stack.Screen name="StorageQuotas" component={StorageQuotasScreen} />
      <Stack.Screen name="FileLimits" component={FileLimitsScreen} />
      <Stack.Screen name="TimetableEditor" component={TimetableEditorScreen} />
      <Stack.Screen name="EnrollmentRequests" component={EnrollmentRequestsScreen} />
      <Stack.Screen name="AnnouncementCompose" component={AnnouncementComposeScreen} />
      <Stack.Screen name="FileReports" component={FileReportsScreen} />
      <Stack.Screen name="SharingRestriction" component={SharingRestrictionScreen} />
      <Stack.Screen name="CourseAnalytics" component={CourseAnalyticsScreen} />
      <Stack.Screen name="UploadMaterial" component={UploadMaterialScreen} />
      <Stack.Screen name="DraftsHygiene" component={DraftsHygieneScreen} />
      <Stack.Screen name="VersionRollback" component={VersionRollbackScreen} />
      <Stack.Screen name="ReadyToday" component={ReadyTodayScreen} />
      <Stack.Screen name="Versions" component={VersionsScreen} />
      <Stack.Screen name="StorageSync" component={StorageSyncScreen} />
      <Stack.Screen name="JoinCourse" component={JoinCourseScreen} />
      {/* Bottom-sheet style overlays */}
      <Stack.Screen name="PublishSheet" component={PublishSheetScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="PreDownload" component={PreDownloadScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
    </Stack.Navigator>
  );
}
