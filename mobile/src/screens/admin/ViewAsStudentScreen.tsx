import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const WEEKS: [string, string, boolean][] = [
  ["Week 5", "Visible · 3 files", true],
  ["Week 6", "Not enrolled in this offering", false],
  ["Week 7", "Visible · 2 files", true],
];

/** Admin · View-as-student (design 103): audited, read-only impersonation for support. */
export default function ViewAsStudentScreen({ navigation }: RootScreen<"ViewAsStudent">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ backgroundColor: palette.danger, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Icon name="eye" size={17} color="#fff" />
        <Txt style={{ flex: 1, fontSize: 12.5, ...font(700), color: "#fff" }}>Viewing as Ada Lovelace · read-only</Txt>
        <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
          <Txt style={{ fontSize: 12.5, ...font(800), color: "#fff" }}>Exit</Txt>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>Support session</Txt>
        <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 2 }}>“I can’t see Week 6”</Txt>

        <View style={{ marginTop: 16, backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Avatar name="Ada Lovelace" size={42} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Ada Lovelace</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>CSC/22/0421 · CSC401</Txt>
          </View>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>HER VIEW · CSC401 WEEKS</Txt>
        <View style={{ gap: 8 }}>
          {WEEKS.map(([week, sub, visible]) => (
            <View key={week} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, opacity: visible ? 1 : 0.6, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Icon name={visible ? "check" : "lock"} size={17} color={visible ? palette.accents.mint.fg : palette.danger} width={2.4} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13.5, ...font(800), color: palette.text }}>{week}</Txt>
                <Txt style={{ fontSize: 11.5, ...font(600), marginTop: 1, color: visible ? palette.textFaint : palette.danger }}>{sub}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <InfoCard accent="lilac" icon="shield" text="Every impersonation is read-only and written to the audit log — who, when, whose account." />
        </View>
      </ScrollView>
    </View>
  );
}
