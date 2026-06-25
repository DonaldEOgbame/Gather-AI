import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, StatusPill, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

type Report = { file: string; meta: string; accent: AccentName; count: string; countAccent: AccentName; tags: string[]; reUpload: boolean };
const REPORTS: Report[] = [
  { file: "Lecture 8 — Trees.pdf", meta: "Week 8 · v1", accent: "peach", count: "3 reports", countAccent: "peach", tags: ["Won't open ×2", "Wrong course"], reUpload: true },
  { file: "Reading list.docx", meta: "Week 3 · v2", accent: "sky", count: "1 report", countAccent: "lemon", tags: ["Outdated"], reUpload: false },
];

/** Lecturer · Broken-file reports (design 55): triage student-reported files. */
export default function FileReportsScreen({ route }: RootScreen<"FileReports">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Reports</Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, marginTop: 14 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <StatusPill label="4 open" accent="peach" />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
        {REPORTS.map((r) => (
          <View key={r.file} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TinyIcon icon="file" accent={r.accent} size={42} iconSize={21} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{r.file}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{r.meta}</Txt>
              </View>
              <StatusPill label={r.count} accent={r.countAccent} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F2F4" }}>
              {r.tags.map((t) => (
                <View key={t} style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>{t}</Txt>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              {r.reUpload && (
                <Pressable onPress={() => Alert.alert("Re-upload", `Replace ${r.file}`)} style={{ flex: 1.3, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: palette.primary, borderRadius: 12, paddingVertical: 11 }}>
                  <Icon name="upload" size={17} color="#fff" />
                  <Txt style={{ fontSize: 14, ...font(700), color: "#fff" }}>Re-upload</Txt>
                </Pressable>
              )}
              <Pressable onPress={() => Alert.alert("Resolved", `${r.file} marked resolved.`)} style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: palette.border, paddingVertical: 11 }}>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.textMuted }}>Resolve</Txt>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
