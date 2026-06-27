import React from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Student · Over the credit cap (design 99): registration overflow sheet. */
export default function OverTheCapScreen({ navigation }: RootScreen<"OverTheCap">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 18 }} />
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.dangerSoft, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
          <Icon name="shield" size={28} color={palette.danger} />
        </View>
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text, textAlign: "center" }}>That puts you over the cap</Txt>
        <Txt variant="muted" style={{ fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
          Adding CSC407 (3 units) would make 27 — the limit is 24.
        </Txt>

        <View style={{ backgroundColor: palette.field, borderRadius: 14, padding: 14, marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 13, ...font(700), color: palette.textMuted }}>Selected</Txt>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.danger }}>27 / 24 units</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.border, marginTop: 10, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, width: "100%", backgroundColor: palette.danger }} />
          </View>
        </View>

        <View style={{ marginTop: 16, backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={18} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(500), color: palette.text }}>
            Drop a course, or ask your advisor for an overload — they can lift the cap per student.
          </Txt>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button title="Drop a course" onPress={() => navigation.goBack()} />
        </View>
        <Pressable onPress={() => { Alert.alert("Overload requested", "Your advisor will review the request."); navigation.goBack(); }} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>Request overload from advisor</Txt>
        </Pressable>
      </View>
    </View>
  );
}
