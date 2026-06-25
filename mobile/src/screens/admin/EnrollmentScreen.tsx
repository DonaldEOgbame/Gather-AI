import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Segmented, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { QRCode } from "@/components/QRCode";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const PENDING: [string, string, AccentName][] = [
  ["Ngozi Eze", "CSC/22/118", "mint"],
  ["Sam Ade", "CSC/22/204", "peach"],
];

/** Admin/lecturer · Enrollment (design 47): mode + join code/QR + approvals. */
export default function EnrollmentScreen({ route }: RootScreen<"Enrollment">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  const title = route.params?.title ?? "Intro to CS";
  const [mode, setMode] = useState<"roster" | "code" | "approved">("code");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Enrollment</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.textMuted }}>{code} · {title}</Txt>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>ENROLLMENT MODE</Txt>
        <Segmented
          value={mode}
          onChange={(k) => setMode(k)}
          options={[{ key: "roster", label: "Roster" }, { key: "code", label: "Code" }, { key: "approved", label: "Approved" }]}
        />

        {mode === "code" && (
          <View style={{ backgroundColor: palette.card, borderRadius: 20, padding: 18, marginTop: 18, alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <QRCode size={132} />
            <Pressable onPress={() => Alert.alert("Share code", "CSC-7F2K")} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.field, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}>
              <Txt style={{ fontSize: 22, ...font(800), color: palette.text, letterSpacing: 4 }}>CSC-7F2K</Txt>
              <Icon name="share" size={18} color={palette.textFaint} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <StatusPill label="Expires in 7d" accent="lemon" />
              <StatusPill label="41 / 200 used" accent="sky" />
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>PENDING</Txt>
          <Pressable onPress={() => Alert.alert("Approved", "All pending requests approved.")}>
            <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>Approve all</Txt>
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          {PENDING.map(([name, id, accent], i) => (
            <View key={i} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Avatar name={name} size={38} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{id}</Txt>
              </View>
              <Pressable onPress={() => Alert.alert("Approved", `${name} enrolled.`)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={18} color={palette.accents.mint.fg} width={2.4} />
              </Pressable>
              <Pressable onPress={() => Alert.alert("Rejected", `${name} declined.`)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: palette.field, alignItems: "center", justifyContent: "center" }}>
                <Txt style={{ fontSize: 15, ...font(800), color: palette.textFaint }}>✕</Txt>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
