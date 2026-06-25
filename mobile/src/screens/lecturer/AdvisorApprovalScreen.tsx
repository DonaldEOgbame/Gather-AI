import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Advisor/HOD · Registration approval (design 85): per-student registration review. */
export default function AdvisorApprovalScreen({ route }: RootScreen<"AdvisorApproval">) {
  const { palette } = useTheme();
  const [tab, setTab] = useState("Pending 23");
  const courses = ["CSC401", "CSC403", "MTH401", "CSC405", "GST401"];
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Approvals</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Computer Science · 200 level</Txt>
        <View style={{ marginTop: 16 }}>
          <ChipRow>
            {["Pending 23", "Approved", "Returned"].map((t) => (
              <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
            ))}
          </ChipRow>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Valid registration */}
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar name="Ada Lovelace" size={44} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>Ada Lovelace</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>CSC/22/0421 · 5 courses</Txt>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Txt style={{ fontSize: 18, ...font(800), color: palette.text }}>18</Txt>
              <Txt style={{ fontSize: 10.5, ...font(700), color: palette.textFaint }}>units</Txt>
            </View>
          </View>
          <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
            <Txt style={{ fontSize: 12, ...font(600), color: palette.text }}>Within 24-unit cap · all prerequisites met</Txt>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
            {courses.map((c) => (
              <View key={c} style={{ backgroundColor: palette.field, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Txt style={{ fontSize: 11.5, ...font(700), color: palette.textMuted }}>{c}</Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable onPress={() => Alert.alert("Approved", "Ada's registration is locked in.")} style={{ flex: 1.4, alignItems: "center", justifyContent: "center", backgroundColor: palette.primary, borderRadius: 12, paddingVertical: 12 }}>
              <Txt style={{ fontSize: 14, ...font(700), color: "#fff" }}>Approve registration</Txt>
            </Pressable>
            <Pressable onPress={() => Alert.alert("Returned", "Sent back for edits.")} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: palette.border, paddingVertical: 12 }}>
              <Txt style={{ fontSize: 14, ...font(700), color: palette.textMuted }}>Return</Txt>
            </Pressable>
          </View>
        </View>

        {/* Over-cap student */}
        <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Avatar name="Sam Okafor" size={40} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Sam Okafor</Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.danger }} />
              <Txt style={{ fontSize: 11.5, ...font(700), color: palette.danger }}>27 units — over cap</Txt>
            </View>
          </View>
          <Icon name="chev" size={18} color={palette.textFaint} />
        </View>
      </ScrollView>
    </View>
  );
}
