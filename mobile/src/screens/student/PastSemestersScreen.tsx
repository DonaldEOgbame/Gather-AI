import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const PAST: [string, string, AccentName][] = [
  ["Spring 2026", "CSC202, MTH210 · 8 courses", "sky"],
  ["Fall 2025", "CSC101, PHY110 · 9 courses", "lemon"],
  ["Spring 2025", "GST101, MTH101 · 10 courses", "lilac"],
];

/** Student · Past semesters (design 70): archived, read-only terms. */
export default function PastSemestersScreen() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Courses</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Fall 2026 · 12 enrolled</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <Icon name="clock" size={19} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
            Account archived on graduation. Local files stay offline; server access has ended.
          </Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PAST SEMESTERS</Txt>
        <View style={{ gap: 11 }}>
          {PAST.map(([term, sub, accent]) => (
            <View key={term} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.92, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="calendar" accent={accent} size={42} iconSize={21} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{term}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{sub}</Txt>
              </View>
              <StatusPill label="Read-only" accent="lemon" />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
