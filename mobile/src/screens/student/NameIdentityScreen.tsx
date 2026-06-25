import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const RECORD: [string, string][] = [
  ["Legal name", "Augusta Ada Lovelace"],
  ["Matric number", "CSC/22/0421"],
  ["Email (SSO)", "ada@lasu.edu.ng"],
];

/** Settings · Name & identity (design 96): editable display name vs locked record. */
export default function NameIdentityScreen(_: RootScreen<"NameIdentity">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Avatar name="Ada Lovelace" size={76} />
          <Txt style={{ fontSize: 20, ...font(800), color: palette.text, marginTop: 4 }}>Ada Lovelace</Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>DISPLAY NAME · EDITABLE</Txt>
        <Pressable onPress={() => Alert.alert("Edit display name", "This is how your name appears in class lists and discussions.")} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Icon name="user" size={20} color={palette.textFaint} />
          <Txt style={{ flex: 1, fontSize: 15, ...font(600), color: palette.text }}>Ada L.</Txt>
          <Icon name="edit" size={18} color={palette.text} />
        </Pressable>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>INSTITUTION OF RECORD · LOCKED</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          {RECORD.map(([label, val], i) => (
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
