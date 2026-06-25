import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

const PAST = [
  ["Second Sem · 2024/25", "Feb – Jun · archived"],
  ["First Sem · 2024/25", "Sep – Jan · archived"],
  ["Second Sem · 2023/24", "Feb – Jun · archived"],
];

/** Admin · Semesters (design 43): active session + past terms + rollover. */
export default function SemestersScreen() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Semesters</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>2025 / 2026 · active session</Txt>
        </View>
        <Pressable onPress={() => Alert.alert("New semester", "Wired to /courses/semesters")} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 18 }} showsVerticalScrollIndicator={false}>
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>ACTIVE</Txt>
        <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TinyIcon icon="calendar" accent="mint" size={46} iconSize={23} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>First Semester · 2025/26</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Sep 1 – Jan 31 · 142 offerings</Txt>
          </View>
          <StatusPill label="Active" accent="mint" />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PAST SEMESTERS</Txt>
        <View style={{ gap: 10 }}>
          {PAST.map(([t, s], i) => (
            <View key={i} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="calendar" accent="lemon" size={40} iconSize={20} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{t}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>{s}</Txt>
              </View>
              <StatusPill label="Read-only" accent="lemon" />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 22 }}>
          <Button title="Roll over → activate next semester" onPress={() => Alert.alert("Roll over", "Archives the active term and activates the next.")} />
        </View>
      </ScrollView>
    </View>
  );
}
