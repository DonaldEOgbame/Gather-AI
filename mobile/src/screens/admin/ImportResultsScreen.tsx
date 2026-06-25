import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, InfoCard } from "@/components/ui";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const FAILED: [string, string][] = [
  ["Row 14", "Duplicate matric · CSC/22/118"],
  ["Row 41", "Bad email · “sam@@lasu”"],
  ["Row 77", "Unknown department · “CMP”"],
  ["Row 92", "Missing staff ID"],
];

/** Admin · CSV import results (design 97): reconcile failed rows after a roster import. */
export default function ImportResultsScreen({ navigation }: RootScreen<"ImportResults">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 16 }}>
            <Txt style={{ fontSize: 26, ...font(800), color: palette.accents.mint.fg }}>288</Txt>
            <Txt style={{ fontSize: 12, ...font(700), color: palette.accents.mint.fg, marginTop: 2 }}>imported</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: "#FBE3E0", borderRadius: 16, padding: 16 }}>
            <Txt style={{ fontSize: 26, ...font(800), color: palette.danger }}>12</Txt>
            <Txt style={{ fontSize: 12, ...font(700), color: palette.danger, marginTop: 2 }}>failed</Txt>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="lemon" icon="sparkle" text="The 288 are saved. Fix the 12 and re-import only those — already-created rows are skipped." />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>FAILED ROWS</Txt>
        <View style={{ gap: 8 }}>
          {FAILED.map(([row, reason]) => (
            <View key={row} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FBE3E0", alignItems: "center", justifyContent: "center" }}>
                <Txt style={{ fontSize: 17, ...font(800), color: palette.danger }}>!</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13, ...font(800), color: palette.text }}>{row}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>{reason}</Txt>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1.5 }}>
          <Button title="Download failed rows" onPress={() => Alert.alert("Exported", "failed-rows.csv saved to Downloads.")} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Done</Txt>
        </Pressable>
      </View>
    </View>
  );
}
