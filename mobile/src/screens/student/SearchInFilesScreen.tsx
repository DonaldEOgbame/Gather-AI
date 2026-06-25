import React, { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const MATCHES: [string, string, string, AccentName][] = [
  ["Lecture 12 — Recursion.pdf", "p.4", "Every recursion needs a base case to terminate…", "peach"],
  ["Past paper 2023.pdf", "p.2", "Define the base case for the function below…", "lemon"],
  ["Tutorial 5.pdf", "p.1", "Without a base case, the call stack overflows…", "sky"],
];

/** Student · Search inside files (design 66): offline full-text with snippets. */
export default function SearchInFilesScreen() {
  const { palette } = useTheme();
  const [scope, setScope] = useState("Inside files");
  const [q, setQ] = useState("base case");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Search</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Icon name="search" size={20} color={palette.textFaint} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search inside files" placeholderTextColor={palette.textFaint} style={{ flex: 1, paddingVertical: 14, fontSize: 15, ...font(600), color: palette.text }} />
        </View>
        <View style={{ marginTop: 14 }}>
          <ChipRow>
            {["Titles", "Inside files", "Courses"].map((s) => (
              <Chip key={s} label={s} selected={scope === s} onPress={() => setScope(s)} />
            ))}
          </ChipRow>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 24, marginTop: 18, marginBottom: 8 }}>
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>{MATCHES.length * 2} MATCHES IN {MATCHES.length} FILES</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Icon name="cloud" size={14} color={palette.textFaint} />
          <Txt variant="faint" style={{ fontSize: 11.5, ...font(700) }}>Offline</Txt>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
        {MATCHES.map(([file, page, snippet, accent]) => (
          <View key={file} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <TinyIcon icon="file" accent={accent} size={38} iconSize={19} />
              <Txt numberOfLines={1} style={{ flex: 1, fontSize: 13.5, ...font(700), color: palette.text }}>{file}</Txt>
              <View style={{ backgroundColor: palette.field, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Txt style={{ fontSize: 11.5, ...font(800), color: palette.textMuted }}>{page}</Txt>
              </View>
            </View>
            <View style={{ marginTop: 10, backgroundColor: palette.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
              <Txt style={{ fontSize: 12.5, lineHeight: 18, ...font(500), color: palette.textMuted }}>{snippet}</Txt>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
