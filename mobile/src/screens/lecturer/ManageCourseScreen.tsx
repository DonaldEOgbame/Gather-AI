import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader, Txt, Card, Button, ListCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { enrollmentApi, offeringsApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

/**
 * Lecturer/admin command center for a single offering. These controls used to
 * be injected into the student-facing Course detail (design 13); relocated here
 * so Course detail can match its frame exactly while every control stays one tap
 * away behind the course's "Manage" action.
 */
export default function ManageCourseScreen({ route, navigation }: RootScreen<"ManageCourse">) {
  const { offeringId, code, title } = route.params;
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [mode, setMode] = useState<string>("advisor_approval");
  const [joinCode, setJoinCode] = useState<string | null>(null);

  useEffect(() => {
    offeringsApi.get(offeringId).then((o) => o.enrollment_mode && setMode(o.enrollment_mode)).catch(() => {});
  }, [offeringId]);

  async function updateMode(next: string) {
    try {
      await enrollmentApi.updateMode(offeringId, next);
      setMode(next);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to update enrollment mode");
    }
  }

  async function generateCode() {
    try {
      const res = await enrollmentApi.generateJoinCode(offeringId);
      setJoinCode(res.code);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to generate join code");
    }
  }

  const controls: [IconName, AccentName, string, string][] = [
    ["grid", "sky", "Course analytics", "CourseAnalytics"],
    ["upload", "mint", "Upload material", "UploadMaterial"],
    ["users", "peach", "Course roster", "CourseRoster"],
    ["users", "sky", "Enrollment requests", "EnrollmentRequests"],
    ["megaphone", "lemon", "Post announcement", "AnnouncementCompose"],
    ["file", "peach", "File reports", "FileReports"],
    ["clock", "lilac", "Version history", "VersionRollback"],
    ["check", "mint", "Registration approvals", "AdvisorApproval"],
    ["shield", "lilac", "Sharing restriction", "SharingRestriction"],
    ["calendar", "mint", "Timetable", "TimetableEditor"],
    ["eye", "lilac", "Preview as student", "PreviewAsStudent"],
    ["lock", "sky", "Change restriction", "ChangeRestriction"],
    ["trash", "peach", "Emergency takedown", "Takedown"],
    ["cloud", "lemon", "Pending actions (offline)", "PendingActions"],
  ];

  return (
    <Screen scroll>
      <ScreenHeader title="Manage course" onBack={() => navigation.goBack()} />
      <Txt variant="muted" style={{ fontSize: 13, marginTop: 8, marginBottom: 16 }}>
        {code}{title ? ` · ${title}` : ""}
      </Txt>

      {/* Enrollment mode */}
      <Card style={{ marginBottom: 16 }}>
        <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginBottom: 10 }}>ENROLLMENT MODE</Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["roster", "code", "advisor_approval"].map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <Button
                title={m === "advisor_approval" ? "Approval" : m.charAt(0).toUpperCase() + m.slice(1)}
                variant={mode === m ? "primary" : "secondary"}
                onPress={() => updateMode(m)}
              />
            </View>
          ))}
        </View>
        {mode === "code" && (
          <View style={{ marginTop: 12, alignItems: "center" }}>
            {joinCode ? (
              <Txt style={{ ...font(800) }}>Active code: {joinCode}</Txt>
            ) : (
              <Button title="Generate join code" variant="secondary" onPress={generateCode} />
            )}
          </View>
        )}
      </Card>

      <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginBottom: 10 }}>COURSE CONTROLS</Txt>
      <View style={{ gap: 10 }}>
        {controls.map(([icon, accent, label, screen]) => (
          <ListCard
            key={screen}
            icon={icon}
            accent={accent}
            title={label}
            onPress={() => nav.navigate(screen as any, { offeringId, code, title } as any)}
            right={<Icon name="chev" size={18} color={palette.textFaint} />}
          />
        ))}
      </View>
    </Screen>
  );
}
