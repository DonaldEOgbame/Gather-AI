import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, TinyIcon } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useCourses, useInstitution, useCurrentContext, useDepartments, useInstitutionUsers, useStorageStats, usePendingRegistrations } from "@/hooks/queries";
import { useAuth } from "@/stores/auth";
import { formatBytes } from "@/util/format";

const LEGEND: AccentName[] = ["sky", "mint", "lemon", "lilac", "peach", "blush"];

function StatCard({ icon, accent, value, label, onPress }: { icon: IconName; accent: AccentName; value: string; label: string; onPress?: () => void }) {
  const { palette, scheme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => ({ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, opacity: pressed ? 0.85 : 1, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 })}
    >
      <TinyIcon icon={icon} accent={accent} size={40} iconSize={20} />
      <Txt style={{ fontSize: 24, ...font(800), color: palette.text, marginTop: 12 }}>{value}</Txt>
      <Txt style={{ fontSize: 13, ...font(600), color: palette.textFaint, marginTop: 1 }}>{label}</Txt>
    </Pressable>
  );
}

/** Admin Overview (Module 8 · design 23): institution header, 2×2 counts, storage. */
export default function AdminOverviewTab() {
  const { palette, scheme } = useTheme();
  const user = useAuth((s) => s.user);
  const nav = useNavigation<any>();
  const { data: courses } = useCourses();
  const { data: institution } = useInstitution();
  const { data: ctx } = useCurrentContext();
  const { data: departments } = useDepartments();
  const { data: users } = useInstitutionUsers();
  const { data: storage } = useStorageStats();
  const { data: pending } = usePendingRegistrations(ctx?.semester?.id ?? "");

  const semLabel = ctx ? `${ctx.semester.term === "first" ? "First" : "Second"} Sem · ${ctx.session.name}` : "Active";

  // Storage stacked bar from real per-department usage (top segments + remainder).
  const total = storage?.total_bytes ?? 0;
  const quota = Math.max(total, 1) * 1.6; // representative ceiling until a quota endpoint exists
  const segments = (storage?.by_department ?? []).slice(0, 6);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Institution header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
            <Icon name="building" size={24} color={palette.primaryText} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 18, ...font(800), color: palette.text }}>{institution?.name ?? user?.institution_id ?? "—"}</Txt>
            <Txt variant="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {semLabel} · {institution ? (institution.status === "active" ? "Active" : institution.status) : "—"}
            </Txt>
          </View>
        </View>

        {/* 2×2 counts (design 23) */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
          <StatCard icon="users" accent="sky" value={String(users?.length ?? 0)} label="Users" onPress={() => nav.navigate("Users")} />
          <StatCard icon="book" accent="mint" value={String(courses?.length ?? 0)} label="Courses" onPress={() => nav.navigate("Structure")} />
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <StatCard icon="building" accent="lilac" value={String(departments?.length ?? 0)} label="Departments" onPress={() => nav.navigate("Structure")} />
          <StatCard icon="clock" accent="lemon" value={String(pending?.length ?? 0)} label="Pending" onPress={() => nav.navigate("Users")} />
        </View>

        {/* Storage usage (design 23) */}
        <Pressable onPress={() => nav.navigate("StorageQuotas")} style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 18, padding: 18, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <Txt variant="h2">Storage usage</Txt>
            <Txt variant="muted" style={{ fontSize: 13, ...font(600) }}>{formatBytes(total)} / {formatBytes(quota)}</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: palette.field, flexDirection: "row", overflow: "hidden" }}>
            {segments.length ? (
              segments.map((s, i) => (
                <View key={s.department_id} style={{ width: `${(s.bytes_used / quota) * 100}%`, backgroundColor: palette.accents[LEGEND[i % LEGEND.length]].fg }} />
              ))
            ) : (
              <View style={{ width: `${(total / quota) * 100}%`, backgroundColor: palette.accents.sky.fg }} />
            )}
          </View>
          {segments.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
              {segments.map((s, i) => (
                <View key={s.department_id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: palette.accents[LEGEND[i % LEGEND.length]].fg }} />
                  <Txt style={{ fontSize: 12, ...font(600), color: palette.textMuted }}>{s.department_name}</Txt>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        {/* Relocated admin tool hub (design: reached contextually, surfaced here as one entry) */}
        <Pressable
          onPress={() => nav.navigate("AdminTools")}
          style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
        >
          <TinyIcon icon="gear" accent="sky" size={40} iconSize={20} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>Admin tools</Txt>
            <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), marginTop: 1 }}>Policies · sessions · operations</Txt>
          </View>
          <Icon name="chev" size={18} color={palette.textFaint} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
