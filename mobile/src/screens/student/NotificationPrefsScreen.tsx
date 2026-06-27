import React from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { Txt, SettingsGroup, SettingItem, Toggle, InfoCard } from "@/components/ui";
import { useTheme, font } from "@/theme";
import { useNotifSettings } from "@/hooks/queries";
import { notifApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationSettingsOut } from "@/api/types";

/** Notification preferences (design 107). Backed by /auth/notifications/settings. */
export default function NotificationPrefsScreen() {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const { data: s, isLoading } = useNotifSettings();

  const update = async (patch: Partial<NotificationSettingsOut>) => {
    // optimistic
    qc.setQueryData<NotificationSettingsOut>(["notif-settings"], (prev) =>
      prev ? { ...prev, ...patch } : prev
    );
    await notifApi.updateSettings(patch);
    qc.invalidateQueries({ queryKey: ["notif-settings"] });
  };

  if (isLoading || !s) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const sw = (key: keyof NotificationSettingsOut, label: string) => (
    <Toggle value={!!s[key]} onValueChange={(v) => update({ [key]: v } as any)} label={label} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Notifications</Txt>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <InfoCard accent="sky" icon="bell" text="Choose what Gather pings you about. Critical account-security alerts are always on." />

        <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>COURSES & MATERIALS</Txt>
        <SettingsGroup>
          <SettingItem first icon="file" accent="mint" title="New material published" right={sw("new_material", "New material published")} />
          <SettingItem icon="bell" accent="peach" title="Announcements from lecturers" right={sw("roster_changes", "Announcements")} />
          <SettingItem icon="clock" accent="lemon" title="Registration & deadlines" right={sw("scheduled_release", "Registration & deadlines")} />
          <SettingItem icon="refresh" accent="sky" title="Material updated or re-versioned" right={sw("material_updated", "Material updated")} />
        </SettingsGroup>

        <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>HOW YOU GET THEM</Txt>
        <SettingsGroup>
          <SettingItem first icon="bell" accent="peach" title="Push notifications" right={sw("enabled", "Push notifications")} />
          <SettingItem icon="mail" accent="mint" title="Weekly digest" sub="Collapse same-day releases per course" right={sw("batch_delivery", "Weekly digest")} />
        </SettingsGroup>
      </ScrollView>
    </View>
  );
}
