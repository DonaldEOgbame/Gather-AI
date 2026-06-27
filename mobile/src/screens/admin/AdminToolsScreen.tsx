import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader, Txt, ListCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/**
 * Admin command center. These control lists used to live on the Overview tab
 * (design 23), which the mock shows as a pure stat grid + storage card; moved
 * here so Overview can match its frame while every tool stays reachable.
 */
const GROUPS: { label: string; rows: [IconName, AccentName, string, string][] }[] = [
  {
    label: "POLICIES & CONTROLS",
    rows: [
      ["shield", "lilac", "Sharing policy", "SharingPolicy"],
      ["grid", "mint", "Storage quotas", "StorageQuotas"],
      ["file", "sky", "File & upload limits", "FileLimits"],
      ["calendar", "peach", "Timetable editor", "TimetableEditor"],
      ["clock", "lemon", "Audit log", "AuditLog"],
    ],
  },
  {
    label: "SESSIONS & ACCESS",
    rows: [
      ["calendar", "mint", "Academic sessions", "Sessions"],
      ["refresh", "sky", "Semester rollover", "Rollover"],
      ["book", "lilac", "Add offering", "AddOffering"],
      ["users", "peach", "Tenant access requests", "TenantQueue"],
    ],
  },
  {
    label: "OPERATIONS",
    rows: [
      ["upload", "sky", "Roster import results", "ImportResults"],
      ["logout", "peach", "Remove a lecturer", "Handover"],
      ["eye", "lilac", "View as student", "ViewAsStudent"],
    ],
  },
];

export default function AdminToolsScreen({ navigation }: RootScreen<"AdminTools">) {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  return (
    <Screen scroll>
      <ScreenHeader title="Admin tools" onBack={() => navigation.goBack()} />
      {GROUPS.map((g) => (
        <View key={g.label}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>{g.label}</Txt>
          <View style={{ gap: 10 }}>
            {g.rows.map(([icon, accent, title, route]) => (
              <ListCard key={route} icon={icon} accent={accent} title={title} onPress={() => nav.navigate(route)} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
