import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Student · Versions (design 31): stale-sweeper version history for a file. */
export default function VersionsScreen({ route }: RootScreen<"Versions">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "MATH101 · Week 5";
  const fileName = route.params?.fileName ?? "Assignment 2";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Versions</Txt>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint, marginTop: 12 }}>{code}</Txt>
        <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 2 }}>{fileName}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={20} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19, ...font(500), color: palette.text }}>
            Lecturer updated this file. The old version was archived automatically — you'll never open the wrong one.
          </Txt>
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="History" />
        </View>
        <View style={{ gap: 11 }}>
          <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: palette.accents.mint.fg, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <TinyIcon icon="file" accent="mint" size={44} iconSize={22} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Current · v2</Txt>
                <StatusPill label="Latest" accent="mint" />
              </View>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>Updated 2h ago · 2.4 MB</Txt>
            </View>
            <Pressable onPress={() => Alert.alert("Open", "Opening current version")} style={{ backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 }}>
              <Txt style={{ fontSize: 14, ...font(700), color: "#fff" }}>Open</Txt>
            </Pressable>
          </View>
          <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <TinyIcon icon="trash" accent="peach" size={44} iconSize={22} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Archived · v1</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>Replaced · kept offline</Txt>
            </View>
            <Pressable onPress={() => Alert.alert("Compare", "Compare v1 and v2")} style={{ borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: 16, paddingVertical: 9 }}>
              <Txt style={{ fontSize: 13, ...font(700), color: palette.text }}>Compare</Txt>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
