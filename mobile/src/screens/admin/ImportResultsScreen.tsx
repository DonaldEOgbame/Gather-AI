import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, InfoCard } from "@/components/ui";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Admin · CSV import results (design 97): reconcile failed rows after a roster import. */
export default function ImportResultsScreen({ navigation, route }: RootScreen<"ImportResults">) {
  const { palette, scheme } = useTheme();
  const imported = route.params?.imported ?? 0;
  const failed = route.params?.failed ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Import results</Txt>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 16 }}>
            <Txt style={{ fontSize: 26, ...font(800), color: palette.accents.mint.fg }}>{imported}</Txt>
            <Txt style={{ fontSize: 12, ...font(700), color: palette.accents.mint.fg, marginTop: 2 }}>imported</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: palette.dangerSoft, borderRadius: 16, padding: 16 }}>
            <Txt style={{ fontSize: 26, ...font(800), color: palette.danger }}>{failed.length}</Txt>
            <Txt style={{ fontSize: 12, ...font(700), color: palette.danger, marginTop: 2 }}>failed</Txt>
          </View>
        </View>

        {failed.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <InfoCard accent="lemon" icon="sparkle" text={`The ${imported} successful rows are saved. Fix the ${failed.length} below and re-import only those — already-created rows are skipped.`} />
          </View>
        )}

        {failed.length > 0 && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>FAILED ROWS</Txt>
            <View style={{ gap: 8 }}>
              {failed.map((f, i) => (
                <View key={i} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: palette.dangerSoft, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 17, ...font(800), color: palette.danger }}>!</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 13, ...font(800), color: palette.text }}>{f.row}</Txt>
                    <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>{f.reason}</Txt>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {failed.length === 0 && imported > 0 && (
          <View style={{ marginTop: 16 }}>
            <InfoCard accent="mint" icon="check" text={`All ${imported} users imported successfully — no errors.`} />
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, flexDirection: "row", gap: 10 }}>
        {failed.length > 0 && (
          <View style={{ flex: 1.6 }}>
            <Button
              title="Download failed"
              icon="download"
              onPress={() => Alert.alert("Exported", "failed-rows.csv saved to Downloads.")}
            />
          </View>
        )}
        <Pressable onPress={() => navigation.goBack()} style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Done</Txt>
        </Pressable>
      </View>
    </View>
  );
}
