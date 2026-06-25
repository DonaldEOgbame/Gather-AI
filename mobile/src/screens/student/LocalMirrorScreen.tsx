import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const TREE: [string, number, boolean][] = [
  ["/MyUni/", 0, false],
  ["2025-2026/", 1, false],
  ["First/", 2, false],
  ["CSC401/", 3, false],
  ["Week04/ · 6 files", 4, true],
];

/** Settings · Local mirror (design 98): namespaced folder tree + incremental rescan. */
export default function LocalMirrorScreen(_: RootScreen<"LocalMirror">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.text, borderRadius: 18, padding: 16 }}>
          <Txt style={{ fontSize: 11, ...font(800), color: "rgba(255,255,255,0.55)", letterSpacing: 0.5, marginBottom: 10 }}>FOLDER STRUCTURE</Txt>
          {TREE.map(([label, depth, leaf]) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: depth * 14, paddingBottom: 5 }}>
              <Icon name={leaf ? "file" : "folder"} size={14} color={leaf ? "#fff" : "rgba(255,255,255,0.55)"} />
              <Txt style={{ fontSize: 12.5, ...font(leaf ? 800 : 600), color: leaf ? "#fff" : "rgba(255,255,255,0.7)" }}>{label}</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="refresh" accent="sky" size={44} iconSize={22} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Scanning new files only</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>Last scan: 3 weeks ago</Txt>
            </View>
          </View>
          <View style={{ marginTop: 12, backgroundColor: palette.field, borderRadius: 10, padding: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
            <Txt style={{ fontSize: 12, ...font(600), color: palette.textMuted }}>Existing clusters & learned links kept</Txt>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <InfoCard accent="lilac" icon="shield" text="Only un-indexed files are hashed — streaming SHA-256 on a worker thread keeps it light." />
        </View>
      </ScrollView>
    </View>
  );
}
