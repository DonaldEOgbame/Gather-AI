import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Txt, Avatar, InfoCard, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import { authApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

/** Settings · Name & identity (design 96): editable display name vs locked record. */
export default function NameIdentityScreen(_: RootScreen<"NameIdentity">) {
  const { palette, scheme } = useTheme();
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
  }, [user?.display_name]);

  async function save() {
    setSaving(true);
    try {
      await authApi.patchMe({ display_name: displayName.trim() });
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not update display name.");
    } finally {
      setSaving(false);
    }
  }

  const record: [string, string][] = [
    ["Legal name", user?.legal_name ?? user?.full_name ?? "—"],
    ...(user?.matric_or_staff_id ? [["Matric / Staff ID", user.matric_or_staff_id] as [string, string]] : []),
    ["Email", user?.email ?? "—"],
    ["Role", user?.global_role ?? "—"],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Name & identity</Txt>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Avatar name={user?.display_name ?? user?.full_name ?? "?"} size={76} />
          <Txt style={{ fontSize: 20, ...font(800), color: palette.text, marginTop: 4 }}>
            {user?.display_name ?? user?.full_name ?? "—"}
          </Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>DISPLAY NAME · EDITABLE</Txt>

        {editing ? (
          <View style={{ gap: 10 }}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How your name appears in class lists"
              placeholderTextColor={palette.textFaint}
              style={{ backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, ...font(600), color: palette.text, borderWidth: 1.5, borderColor: palette.primary }}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title={saving ? "Saving…" : "Save"} onPress={save} loading={saving} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="ghost" onPress={() => { setEditing(false); setDisplayName(user?.display_name ?? ""); }} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
          >
            <Icon name="user" size={20} color={palette.textFaint} />
            <Txt style={{ flex: 1, fontSize: 15, ...font(600), color: user?.display_name ? palette.text : palette.textFaint }}>
              {user?.display_name || "Tap to set a display name"}
            </Txt>
            <Icon name="edit" size={18} color={palette.text} />
          </Pressable>
        )}

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>INSTITUTION OF RECORD · LOCKED</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          {record.map(([label, val], i) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13, borderTopColor: palette.border, borderTopWidth: i ? 1 : 0 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="faint" style={{ fontSize: 12, ...font(700) }}>{label}</Txt>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text, marginTop: 2 }}>{val}</Txt>
              </View>
              <Icon name="lock" size={16} color={palette.textFaint} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <InfoCard accent="lilac" icon="shield" text="Watermarks and rosters always use your legal name + matric — not the display name." />
        </View>
      </ScrollView>
    </View>
  );
}
