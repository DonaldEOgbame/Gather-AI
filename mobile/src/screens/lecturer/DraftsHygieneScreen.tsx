import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const STALE: [string, string, AccentName][] = [
  ["week3_notes.pdf", "Edited 21 days ago", "peach"],
  ["tutorial_q.docx", "Edited 18 days ago", "sky"],
  ["lab_setup.pdf", "Edited 15 days ago", "lemon"],
];

/** Lecturer · Drafts hygiene (design 58): surfaces stale drafts before auto-trash. */
export default function DraftsHygieneScreen() {
  const { palette } = useTheme();
  const [tab, setTab] = useState("Stale 3");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Drafts</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>8 total · 3 stale</Txt>
        <View style={{ marginTop: 16 }}>
          <ChipRow>
            {["All 8", "Stale 3", "Scheduled 2"].map((t) => (
              <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
            ))}
          </ChipRow>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name="clock" size={19} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
            3 drafts are over 14 days old. Publish or they move to trash (recoverable).
          </Txt>
        </View>

        <View style={{ marginTop: 18, gap: 11 }}>
          {STALE.map(([file, edited, accent]) => (
            <View key={file} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="file" accent={accent} size={42} iconSize={21} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{file}</Txt>
                  <StatusPill label="Stale" accent="lemon" />
                </View>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{edited}</Txt>
              </View>
              <Icon name="chev" size={18} color={palette.textFaint} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
