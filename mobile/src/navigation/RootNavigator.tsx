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
import AnnouncementsFeedScreen from "@/screens/student/AnnouncementsFeedScreen";
import ScheduleScreen from "@/screens/student/ScheduleScreen";
import SearchInFilesScreen from "@/screens/student/SearchInFilesScreen";
import PastSemestersScreen from "@/screens/student/PastSemestersScreen";
import CollectionsScreen from "@/screens/student/CollectionsScreen";
import LibraryBackupScreen from "@/screens/student/LibraryBackupScreen";
import RestoreScreen from "@/screens/student/RestoreScreen";
import SyncInfoScreen from "@/screens/student/SyncInfoScreen";
import LiteModeScreen from "@/screens/student/LiteModeScreen";
import ReportIssueScreen from "@/screens/student/ReportIssueScreen";
import RestrictedViewerScreen from "@/screens/student/RestrictedViewerScreen";
import DataCostScreen from "@/screens/student/DataCostScreen";
import ShareToGatherScreen from "@/screens/workflow/ShareToGatherScreen";
import SmartClusterScreen from "@/screens/workflow/SmartClusterScreen";
import ImportFilesScreen from "@/screens/workflow/ImportFilesScreen";
import FileActionsScreen from "@/screens/workflow/FileActionsScreen";
import RegisterCoursesScreen from "@/screens/student/RegisterCoursesScreen";
import AwaitingAdvisorScreen from "@/screens/student/AwaitingAdvisorScreen";
import AdvisorApprovalScreen from "@/screens/lecturer/AdvisorApprovalScreen";
import NewSemesterScreen from "@/screens/student/NewSemesterScreen";
import ReorganizingScreen from "@/screens/student/ReorganizingScreen";
import OverTheCapScreen from "@/screens/student/OverTheCapScreen";
import SessionsScreen from "@/screens/admin/SessionsScreen";
import CreateSessionScreen from "@/screens/admin/CreateSessionScreen";
import AddOfferingScreen from "@/screens/admin/AddOfferingScreen";
import RolloverScreen from "@/screens/admin/RolloverScreen";
import TenantQueueScreen from "@/screens/admin/TenantQueueScreen";
import ImportResultsScreen from "@/screens/admin/ImportResultsScreen";
import HandoverScreen from "@/screens/admin/HandoverScreen";
import ViewAsStudentScreen from "@/screens/admin/ViewAsStudentScreen";
import TakedownScreen from "@/screens/lecturer/TakedownScreen";
import PreviewAsStudentScreen from "@/screens/lecturer/PreviewAsStudentScreen";
import PendingActionsScreen from "@/screens/lecturer/PendingActionsScreen";
import ChangeRestrictionScreen from "@/screens/lecturer/ChangeRestrictionScreen";
import PhotoConsentScreen from "@/screens/student/PhotoConsentScreen";
import ReviewPhotosScreen from "@/screens/student/ReviewPhotosScreen";
import LogoutOptionsScreen from "@/screens/student/LogoutOptionsScreen";
import AccountVsDeviceScreen from "@/screens/student/AccountVsDeviceScreen";
import NameIdentityScreen from "@/screens/student/NameIdentityScreen";
import LocalMirrorScreen from "@/screens/student/LocalMirrorScreen";
import SwitchAccountScreen from "@/screens/student/SwitchAccountScreen";
import FreeUpSpaceScreen from "@/screens/student/FreeUpSpaceScreen";

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
      <Stack.Screen name="AnnouncementsFeed" component={AnnouncementsFeedScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="SearchInFiles" component={SearchInFilesScreen} />
      <Stack.Screen name="PastSemesters" component={PastSemestersScreen} />
      <Stack.Screen name="Collections" component={CollectionsScreen} />
      <Stack.Screen name="LibraryBackup" component={LibraryBackupScreen} />
      <Stack.Screen name="Restore" component={RestoreScreen} />
      <Stack.Screen name="SyncInfo" component={SyncInfoScreen} />
      <Stack.Screen name="LiteMode" component={LiteModeScreen} />
      <Stack.Screen name="RestrictedViewer" component={RestrictedViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="DataCost" component={DataCostScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      {/* Batch 5 · workflow + registration */}
      <Stack.Screen name="SmartCluster" component={SmartClusterScreen} />
      <Stack.Screen name="ImportFiles" component={ImportFilesScreen} />
      <Stack.Screen name="RegisterCourses" component={RegisterCoursesScreen} />
      <Stack.Screen name="AwaitingAdvisor" component={AwaitingAdvisorScreen} />
      <Stack.Screen name="AdvisorApproval" component={AdvisorApprovalScreen} />
      <Stack.Screen name="Reorganizing" component={ReorganizingScreen} />
      <Stack.Screen name="NewSemester" component={NewSemesterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShareToGather" component={ShareToGatherScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="FileActions" component={FileActionsScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="OverTheCap" component={OverTheCapScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      {/* Batch 6 · session model */}
      <Stack.Screen name="Sessions" component={SessionsScreen} />
      <Stack.Screen name="AddOffering" component={AddOfferingScreen} />
      <Stack.Screen name="Rollover" component={RolloverScreen} />
      <Stack.Screen name="TenantQueue" component={TenantQueueScreen} />
      {/* Batch 6 · safety, identity & ops */}
      <Stack.Screen name="ImportResults" component={ImportResultsScreen} />
      <Stack.Screen name="Handover" component={HandoverScreen} />
      <Stack.Screen name="ViewAsStudent" component={ViewAsStudentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PreviewAsStudent" component={PreviewAsStudentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PendingActions" component={PendingActionsScreen} />
      <Stack.Screen name="PhotoConsent" component={PhotoConsentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReviewPhotos" component={ReviewPhotosScreen} />
      <Stack.Screen name="AccountVsDevice" component={AccountVsDeviceScreen} />
      <Stack.Screen name="NameIdentity" component={NameIdentityScreen} />
      <Stack.Screen name="LocalMirror" component={LocalMirrorScreen} />
      <Stack.Screen name="SwitchAccount" component={SwitchAccountScreen} />
      <Stack.Screen name="FreeUpSpace" component={FreeUpSpaceScreen} />
      {/* Bottom-sheet style overlays */}
      <Stack.Screen name="PublishSheet" component={PublishSheetScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="PreDownload" component={PreDownloadScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="CreateSession" component={CreateSessionScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="Takedown" component={TakedownScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="LogoutOptions" component={LogoutOptionsScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="ChangeRestriction" component={ChangeRestrictionScreen} options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }} />
    </Stack.Navigator>
  );
}
