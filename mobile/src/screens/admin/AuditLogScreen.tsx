import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { useTheme, font, type AccentName } from "@/theme";
import { useAuditLogs } from "@/hooks/queries";
import type { IconName } from "@/components/Icon";

const TABS = ["All", "Users", "Roles", "Policy"];

const ACTION_ICON: Record<string, [IconName, AccentName]> = {
  roster_import: ["users", "sky"],
  self_register: ["user", "mint"],
  approve_user: ["check", "mint"],
  reject_user: ["shield", "peach"],
  suspend_account: ["lock", "peach"],
  change_role: ["user", "lilac"],
  add_roster: ["users", "sky"],
  remove_roster: ["users", "peach"],
  update_roster: ["users", "lemon"],
  patch_institution: ["shield", "lilac"],
  add_timetable_slot: ["clock", "sky"],
  import_timetable: ["upload", "sky"],
  publish_material: ["check", "mint"],
  create_material: ["file", "lemon"],
  update_material: ["edit", "sky"],
  remove_material: ["trash", "peach"],
  provision_institution: ["building", "mint"],
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Admin · Audit log (design 48): a vertical activity timeline. */
export default function AuditLogScreen() {
  const { palette } = useTheme();
  const [tab, setTab] = useState("All");
  const { data: logs = [], isLoading } = useAuditLogs(tab === "All" ? undefined : tab);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Audit log</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
        <ChipRow>
          {TABS.map((t) => (
            <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </ChipRow>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {logs.length === 0 && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 40 }}>No audit log entries.</Txt>
          )}
          {logs.map((entry, i) => {
            const [icon, accent] = ACTION_ICON[entry.action] ?? ["shield", "lilac" as AccentName];
            const actor = entry.user_display_name ?? entry.user_email ?? "Unknown";
            const detail = entry.details ? `${actor} · ${entry.details}` : actor;
            return (
              <View key={entry.id} style={{ flexDirection: "row", gap: 13 }}>
                <View style={{ alignItems: "center" }}>
                  <TinyIcon icon={icon} accent={accent} size={38} iconSize={19} />
                  {i < logs.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: palette.fieldBorder, marginTop: 4 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 18 }}>
                  <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{entry.action.replace(/_/g, " ")}</Txt>
                  <Txt style={{ fontSize: 12.5, ...font(500), color: palette.textMuted, marginTop: 2 }} numberOfLines={1}>{detail}</Txt>
                  <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 3 }}>{timeAgo(entry.created_at)}</Txt>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
