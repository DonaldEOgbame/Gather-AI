import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { useTheme, font } from "@/theme";

const DEPTS: [string, number][] = [
  ["Computer Science", 88],
  ["Biology", 72],
  ["Mathematics", 95],
  ["Law", 41],
];

/** Admin · Storage quotas (design 50): institution usage + per-department bars. */
export default function StorageQuotasScreen() {
  const { palette } = useTheme();
  const color = (p: number) => (p >= 95 ? palette.danger : p >= 80 ? palette.accents.peach.fg : palette.textFaint);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Storage quotas</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Institution meter */}
        <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 26, ...font(800), color: "#fff" }}>312 GB</Txt>
            <Txt style={{ fontSize: 13, ...font(600), color: "rgba(255,255,255,0.6)" }}>of 500 GB</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 12, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, width: "62%", backgroundColor: "#fff" }} />
          </View>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 12 }}>BY DEPARTMENT</Txt>
        <View style={{ gap: 14 }}>
          {DEPTS.map(([name, p], i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{name}</Txt>
                <Txt style={{ fontSize: 12.5, ...font(700), color: color(p) }}>{p}%</Txt>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: "#EAECEF", overflow: "hidden" }}>
                <View style={{ height: 8, borderRadius: 4, width: `${p}%`, backgroundColor: palette.primary }} />
              </View>
              {p >= 80 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color(p) }} />
                  <Txt style={{ fontSize: 11, ...font(700), color: color(p) }}>{p >= 95 ? "Over 95% — uploads blocked" : "Over 80% — alert sent"}</Txt>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Set per-course quotas" variant="ghost" onPress={() => Alert.alert("Per-course quotas", "Configure caps for individual offerings.")} />
        </View>
      </ScrollView>
    </View>
  );
}
