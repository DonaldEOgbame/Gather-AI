import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, StatusPill, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import { useInstitution } from "@/hooks/queries";
import type { RootScreen } from "@/navigation/types";

/** Settings · Account switcher (design 100): per-account encrypted sandboxes. */
export default function SwitchAccountScreen(_: RootScreen<"SwitchAccount">) {
  const { palette, scheme } = useTheme();
  const user = useAuth((s) => s.user);
  const { data: institution } = useInstitution();
  const activeName = user?.full_name ?? "You";
  const roleLabel = user ? user.global_role.charAt(0).toUpperCase() + user.global_role.slice(1) : "Student";
  const activeSub = `${institution?.name ?? "Institution"} · ${roleLabel}`;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <InfoCard accent="mint" icon="lock" text="Each account lives in its own encrypted sandbox. Switching locks one and unlocks the other." />

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>ON THIS PHONE</Txt>
        <View style={{ gap: 10 }}>
          <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderColor: palette.text, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <Avatar name={activeName} size={44} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{activeName}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{activeSub}</Txt>
            </View>
            <StatusPill label="Active" accent="mint" />
          </View>

          <Pressable onPress={() => Alert.alert("Switch account", "Unlock Tunde Bello’s sandbox? Ada’s files will be locked.")} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <Avatar name="Tunde Bello" size={44} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>Tunde Bello</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>Nile University · Lecturer</Txt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Icon name="lock" size={14} color={palette.textFaint} />
              <Txt style={{ fontSize: 12, ...font(700), color: palette.textFaint }}>Locked</Txt>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={() => Alert.alert("Add account", "Sign in to another institution account on this device.")} style={{ marginTop: 22, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, borderStyle: "dashed", paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <Icon name="plus" size={20} color={palette.text} />
          <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>Add another account</Txt>
        </Pressable>
      </ScrollView>
    </View>
  );
}
