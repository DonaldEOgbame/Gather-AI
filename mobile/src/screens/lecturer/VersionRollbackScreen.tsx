import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const OLD: [string, string, AccentName][] = [
  ["v2", "You · 3 days ago · 2.3 MB", "sky"],
  ["v1", "You · 2 weeks ago · 2.1 MB", "lemon"],
];

function PillBtn({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  const { palette } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 10, borderWidth: ghost ? 1.5 : 0, borderColor: palette.border, backgroundColor: ghost ? "transparent" : palette.field, paddingHorizontal: 13, paddingVertical: 8 }}>
      <Txt style={{ fontSize: 12.5, ...font(700), color: ghost ? palette.textMuted : palette.text }}>{label}</Txt>
    </Pressable>
  );
}

/** Lecturer · Version rollback (design 59): re-point the live file to a prior version. */
export default function VersionRollbackScreen({ route }: RootScreen<"VersionRollback">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101 · Week 12";
  const fileName = route.params?.fileName ?? "Lecture 12 — Recursion.pdf";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Version history</Txt>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint, marginTop: 12 }}>{code}</Txt>
        <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 2 }}>{fileName}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Current */}
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: palette.accents.mint.fg, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <TinyIcon icon="file" accent="mint" size={44} iconSize={22} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>v3 · current</Txt>
              <StatusPill label="Live" accent="mint" />
            </View>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>You · 2h ago · 2.4 MB</Txt>
          </View>
        </View>

        <View style={{ gap: 11, marginTop: 11 }}>
          {OLD.map(([v, meta, accent]) => (
            <View key={v} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="clock" accent={accent} size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{v}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{meta}</Txt>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <PillBtn label="View" ghost onPress={() => Alert.alert("View", `Open ${v}`)} />
                <PillBtn label="Rollback" onPress={() => Alert.alert("Rollback", `Make ${v} the live version?`)} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={17} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(600), color: palette.text }}>
            Rollback re-points the live file. Students get the Stale Sweeper update automatically.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
