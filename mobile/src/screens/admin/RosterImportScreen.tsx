import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

const MAPPING = [
  ["Name", "Full name"],
  ["Email", "Email address"],
  ["Matric / Staff ID", "matric_no"],
  ["Role", "role"],
  ["Department", "dept_code"],
];
const PREVIEW: [string, string, string, boolean][] = [
  ["Ada Lovelace", "Student · CSC", "lilac", true],
  ["Tunde Bello", "Lecturer · CSC", "sky", true],
  ["—", "Row 7 · missing email", "peach", false],
];

/** Admin · Roster CSV import (design 45): parsed file → mapping → preview. */
export default function RosterImportScreen() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Import roster</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Parsed file */}
        <View style={{ borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.border, backgroundColor: palette.card, padding: 18, flexDirection: "row", alignItems: "center", gap: 13 }}>
          <TinyIcon icon="upload" accent="sky" size={44} iconSize={22} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>roster_fall2026.csv</Txt>
            <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>842 rows · 12 KB</Txt>
          </View>
          <StatusPill label="Parsed" accent="mint" />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>COLUMN MAPPING</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          {MAPPING.map(([a, b], i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: "#F1F2F4" }}>
              <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{a}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Icon name="check" size={14} color={palette.accents.mint.fg} width={2.6} />
                <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>{b}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>PREVIEW</Txt>
          <Txt style={{ fontSize: 12, ...font(700), color: palette.danger }}>840 valid · 2 errors</Txt>
        </View>
        <View style={{ gap: 8 }}>
          {PREVIEW.map(([name, sub, accent, ok], i) => (
            <View key={i} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Avatar name={ok ? name : "!"} size={36} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: ok ? palette.text : palette.danger }}>{name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{sub}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Import 840 users" onPress={() => Alert.alert("Imported", "840 invitations queued; 2 error rows skipped.")} />
        </View>
      </ScrollView>
    </View>
  );
}
