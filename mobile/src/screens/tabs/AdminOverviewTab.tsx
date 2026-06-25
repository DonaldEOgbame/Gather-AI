import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, TinyIcon, ListCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useCourses } from "@/hooks/queries";
import { useAuth } from "@/stores/auth";

const POLICIES: [IconName, AccentName, string, string][] = [
  ["shield", "lilac", "Sharing policy", "SharingPolicy"],
  ["grid", "mint", "Storage quotas", "StorageQuotas"],
  ["file", "sky", "File & upload limits", "FileLimits"],
  ["calendar", "peach", "Timetable editor", "TimetableEditor"],
  ["clock", "lemon", "Audit log", "AuditLog"],
];

function StatCard({ icon, accent, value, label }: { icon: "book" | "calendar"; accent: AccentName; value: string; label: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
      <TinyIcon icon={icon} accent={accent} size={40} iconSize={20} />
      <Txt style={{ fontSize: 24, ...font(800), color: palette.text, marginTop: 12 }}>{value}</Txt>
      <Txt style={{ fontSize: 13, ...font(600), color: palette.textFaint, marginTop: 1 }}>{label}</Txt>
    </View>
  );
}

/** Admin Overview (Module 8 · design 23): institution header + key counts. */
export default function AdminOverviewTab() {
  const { palette } = useTheme();
  const user = useAuth((s) => s.user);
  const { data: courses } = useCourses();

  const nav = useNavigation<any>();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Institution header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
            <Icon name="building" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 18, ...font(800), color: palette.text }}>{user?.institution_id ? "Your institution" : "—"}</Txt>
            <Txt variant="muted" style={{ fontSize: 13, marginTop: 2 }}>{user?.institution_id ? "Active" : "No institution"}</Txt>
          </View>
        </View>

        {/* Counts */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
          <StatCard icon="book" accent="mint" value={String(courses?.length ?? 0)} label="Courses" />
          <StatCard icon="calendar" accent="lilac" value="Current" label="Active semester" />
        </View>

        {/* Policies & controls */}
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 24, marginBottom: 8 }}>POLICIES & CONTROLS</Txt>
        <View style={{ gap: 10 }}>
          {POLICIES.map(([icon, accent, title, route]) => (
            <ListCard key={route} icon={icon} accent={accent} title={title} onPress={() => nav.navigate(route)} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
