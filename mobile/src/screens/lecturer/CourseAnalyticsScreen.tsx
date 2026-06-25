import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, TinyIcon, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const STATS: [string, string, AccentName][] = [
  ["142", "files", "mint"],
  ["3,412", "downloads", "sky"],
  ["218", "students", "lilac"],
];
const TOP: [string, number, AccentName][] = [
  ["Lecture 12 — Recursion.pdf", 198, "peach"],
  ["Recursion worksheet.docx", 176, "sky"],
  ["Lab recording.mp4", 94, "lilac"],
  ["Reading list.pdf", 61, "mint"],
];

/** Lecturer · Course analytics (design 22): download counts + top materials. */
export default function CourseAnalyticsScreen({ route }: RootScreen<"CourseAnalytics">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  const title = route.params?.title ?? "Intro to Computer Science";
  const max = Math.max(...TOP.map((t) => t[1]));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt variant="title" style={{ fontSize: 21, marginTop: 2 }}>{title}</Txt>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          {STATS.map(([v, l, a]) => (
            <View key={l} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Txt style={{ fontSize: 17, ...font(800), color: palette.accents[a].fg }}>{v}</Txt>
              <Txt style={{ fontSize: 11.5, ...font(600), color: palette.textFaint, marginTop: 2 }}>{l}</Txt>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Top materials" action={{ label: "Week 12", onPress: () => {} }} />
        <View style={{ gap: 10 }}>
          {TOP.map(([name, dl, accent]) => (
            <View key={name} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="file" accent={accent} size={42} iconSize={20} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{name}</Txt>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: palette.field, marginTop: 7, overflow: "hidden" }}>
                  <View style={{ height: 5, borderRadius: 3, width: `${(dl / max) * 100}%`, backgroundColor: palette.accents[accent].fg }} />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="download" size={15} color={palette.textFaint} />
                <Txt style={{ fontSize: 13, ...font(800), color: palette.text }}>{dl}</Txt>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
