import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, TinyIcon, SectionHeader, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const CLASSES: [string, string, string, AccentName][] = [
  ["09:00", "MTH204", "Linear Algebra · Hall B", "lemon"],
  ["11:00", "CSC101", "Recursion lab · Lab 3", "mint"],
  ["14:00", "BIO202", "Cell Biology · Hall A", "peach"],
];

/** Student · Ready for today (design 30): timetable pre-cache confirmation. */
export default function ReadyTodayScreen() {
  const { palette } = useTheme();
  const [precache, setPrecache] = useState(true);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="muted" style={{ fontSize: 14, ...font(500) }}>{today}</Txt>
        <Txt variant="title" style={{ marginTop: 2 }}>Ready for today</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Ink confirmation */}
        <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={24} color="#fff" width={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15.5, ...font(700), color: "#fff" }}>All set — 3 classes pre-loaded</Txt>
            <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Downloaded overnight · 0 MB used now</Txt>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionHeader title="Today's classes" />
        </View>
        <View style={{ gap: 11 }}>
          {CLASSES.map(([time, code, place, accent]) => (
            <View key={code} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ alignItems: "center" }}>
                <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>{time.split(":")[0]}</Txt>
                <Txt style={{ fontSize: 11, ...font(700), color: palette.textFaint }}>{time.split(":")[1]}</Txt>
              </View>
              <View style={{ width: 1, height: 36, backgroundColor: "#F1F2F4" }} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{code}</Txt>
                <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text, marginTop: 2 }}>{place}</Txt>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.accents.mint.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
                <Icon name="check" size={13} color={palette.accents.mint.fg} width={2.6} />
                <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.mint.fg }}>Ready</Txt>
              </View>
            </View>
          ))}
        </View>

        {/* Nightly pre-cache */}
        <View style={{ marginTop: 16, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <TinyIcon icon="clock" accent="sky" size={38} iconSize={19} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>Nightly pre-cache</Txt>
            <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), marginTop: 1 }}>Wi-Fi only · 2:00 AM</Txt>
          </View>
          <Toggle value={precache} onValueChange={setPrecache} label="Nightly pre-cache" />
        </View>
      </ScrollView>
    </View>
  );
}
