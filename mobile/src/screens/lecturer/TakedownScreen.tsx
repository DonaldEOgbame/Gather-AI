import React, { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { Txt, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const POINTS: [string, AccentName][] = [
  ["Unpublished server-side immediately", "mint"],
  ["Deleted from students’ devices on next sync", "peach"],
  ["This is different from an update — the file is purged", "lemon"],
];

/** Lecturer · Emergency takedown (design 89): remove a published file everywhere. */
export default function TakedownScreen({ route, navigation }: RootScreen<"Takedown">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "Exam answers (mistake).pdf";
  const meta = route.params?.meta ?? "CSC401 · Week 9 · 142 downloads";
  const [reason, setReason] = useState("");
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.5)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: "#FBE3E0", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
          <Icon name="trash" size={28} color={palette.danger} />
        </View>
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text, textAlign: "center" }}>Remove from everywhere?</Txt>

        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.field, borderRadius: 14, padding: 13 }}>
          <TinyIcon icon="file" accent="peach" size={42} iconSize={21} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14, ...font(800), color: palette.text }}>{title}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{meta}</Txt>
          </View>
        </View>

        <View style={{ marginTop: 14, gap: 9 }}>
          {POINTS.map(([text, accent]) => (
            <View key={text} style={{ flexDirection: "row", alignItems: "flex-start", gap: 9 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accents[accent].fg, marginTop: 6 }} />
              <Txt style={{ flex: 1, fontSize: 12.5, ...font(600), lineHeight: 18, color: palette.textMuted }}>{text}</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, backgroundColor: palette.field, borderRadius: 14, padding: 13, minHeight: 56 }}>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason (logged in audit trail)…"
            placeholderTextColor={palette.textFaint}
            multiline
            style={{ fontSize: 13, ...font(500), color: palette.text }}
          />
        </View>

        <Pressable
          onPress={() => { Alert.alert("Removed", "The file has been purged from all devices."); navigation.goBack(); }}
          style={{ borderRadius: 999, backgroundColor: palette.danger, alignItems: "center", paddingVertical: 16, marginTop: 16 }}
        >
          <Txt style={{ fontSize: 16, ...font(700), color: "#fff" }}>Remove from all devices</Txt>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 14.5, ...font(700) }}>Cancel</Txt>
        </Pressable>
      </View>
    </View>
  );
}
