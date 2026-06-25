import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, Segmented } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const DAYS: [string, number, boolean][] = [
  ["M", 23, false],
  ["T", 24, true],
  ["W", 25, false],
  ["T", 26, false],
  ["F", 27, false],
];
const CLASSES: [string, string, string, AccentName][] = [
  ["09:00", "MTH204", "Linear Algebra · Hall B", "lemon"],
  ["11:00", "CSC101", "Recursion lab · Lab 3", "mint"],
  ["14:00", "BIO202", "Cell Biology · Hall A", "peach"],
];

/** Student · Schedule (design 64): week strip + day agenda. */
export default function ScheduleScreen() {
  const { palette } = useTheme();
  const [view, setView] = useState<"week" | "agenda">("agenda");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Schedule</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Week of June 24</Txt>
        </View>
        <View style={{ width: 160 }}>
          <Segmented value={view} onChange={setView} options={[{ key: "week", label: "Week" }, { key: "agenda", label: "Agenda" }]} />
        </View>
      </View>

      {/* Week strip */}
      <View style={{ flexDirection: "row", gap: 7, paddingHorizontal: 24, marginTop: 16 }}>
        {DAYS.map(([d, n, active], i) => (
          <View key={i} style={{ flex: 1, borderRadius: 14, backgroundColor: active ? palette.primary : palette.card, paddingVertical: 10, alignItems: "center", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <Txt style={{ fontSize: 11, ...font(700), color: active ? "rgba(255,255,255,0.6)" : palette.textFaint }}>{d}</Txt>
            <Txt style={{ fontSize: 16, ...font(800), color: active ? "#fff" : palette.text, marginTop: 2 }}>{n}</Txt>
          </View>
        ))}
      </View>

      <Txt variant="faint" style={{ paddingHorizontal: 24, letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>TUESDAY · 3 CLASSES</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
        {CLASSES.map(([time, code, place, accent]) => (
          <View key={code} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ alignItems: "center" }}>
              <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>{time.split(":")[0]}</Txt>
              <Txt style={{ fontSize: 11, ...font(700), color: palette.textFaint }}>{time.split(":")[1]}</Txt>
            </View>
            <View style={{ width: 3, height: 38, borderRadius: 2, backgroundColor: palette.accents[accent].fg }} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{code}</Txt>
              <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text, marginTop: 2 }}>{place}</Txt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.accents.mint.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
              <Icon name="check" size={12} color={palette.accents.mint.fg} width={2.6} />
              <Txt style={{ fontSize: 10.5, ...font(800), color: palette.accents.mint.fg }}>Ready</Txt>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
