import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, Button, Avatar, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const SUBMITTED: [string, string][] = [
  ["CSC401", "Software Engineering"],
  ["CSC403", "Operating Systems"],
  ["MTH401", "Numerical Analysis"],
  ["CSC405", "Computer Networks"],
];

/** Student · Awaiting advisor (design 84): registration pending approval. */
export default function AwaitingAdvisorScreen({ navigation }: RootScreen<"AwaitingAdvisor">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Registration</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: palette.accents.lemon.bg, alignItems: "center", justifyContent: "center" }}>
            <Icon name="clock" size={38} color={palette.accents.lemon.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 16 }}>Sent for approval</Txt>
          <Txt variant="muted" style={{ fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21, maxWidth: 280 }}>
            Your advisor reviews the whole registration before it's locked in.
          </Txt>
        </View>

        <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Avatar name="N Achebe" size={42} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Dr. N. Achebe</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>Academic advisor · 200 level</Txt>
          </View>
          <StatusPill label="Reviewing" accent="lemon" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>SUBMITTED</Txt>
          <Txt style={{ fontSize: 12, ...font(700), color: palette.accents.mint.fg }}>18 / 24 units ✓</Txt>
        </View>
        <View style={{ gap: 8 }}>
          {SUBMITTED.map(([code, title]) => (
            <View key={code} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 11, opacity: 0.92, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accents.lemon.fg }} />
              <Txt style={{ width: 56, fontSize: 13, ...font(800), color: palette.textMuted }}>{code}</Txt>
              <Txt style={{ flex: 1, fontSize: 12.5, ...font(600), color: palette.textMuted }}>{title}</Txt>
              <StatusPill label="Pending" accent="lemon" />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Edit while window is open" variant="ghost" onPress={() => navigation.navigate("RegisterCourses")} />
        </View>
      </ScrollView>
    </View>
  );
}
