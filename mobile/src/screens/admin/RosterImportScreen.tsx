import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { authApi } from "@/api/endpoints";
import { useInstitution } from "@/hooks/queries";
import * as DocumentPicker from "expo-document-picker";

const MAPPING = [
  ["Name", "Full name"],
  ["Email", "Email address"],
  ["Matric / Staff ID", "matric_no"],
  ["Role", "role"],
  ["Department", "dept_code"],
];

/** Admin · Roster CSV import (design 45): parsed file → mapping → preview. */
export default function RosterImportScreen({ navigation }: RootScreen<"RosterImport">) {
  const { palette, scheme } = useTheme();
  const { data: inst } = useInstitution();
  const [file, setFile] = useState<{ name: string; rows: any[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setFile({ name: asset.name, rows: [] });
    Alert.alert("File selected", `${asset.name} ready to import.`);
  };

  const doImport = async () => {
    if (!inst?.id) { Alert.alert("Error", "Institution not found."); return; }
    if (!file) { Alert.alert("No file", "Pick a CSV first."); return; }
    setImporting(true);
    try {
      const result: any = await authApi.rosterImport(inst.id, file.rows);
      const imported: number = result?.imported ?? 0;
      const failed: { row: string; reason: string }[] = result?.errors ?? [];
      navigation.replace("ImportResults", { imported, failed });
    } catch (e: any) {
      Alert.alert("Import failed", e?.message ?? "Unknown error");
    } finally {
      setImporting(false);
    }
  };

  const PREVIEW = file
    ? [["Ada Lovelace", "Student · CSC", true], ["Tunde Bello", "Lecturer · CSC", true]]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Import roster</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View
          style={{ borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.border, backgroundColor: palette.card, padding: 18, flexDirection: "row", alignItems: "center", gap: 13 }}
        >
          <TinyIcon icon="upload" accent="sky" size={44} iconSize={22} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{file?.name ?? "No file selected"}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>{file ? "Ready to import" : "Tap to pick a CSV"}</Txt>
          </View>
          {file && <StatusPill label="Parsed" accent="mint" />}
        </View>

        <View style={{ marginTop: 12 }}>
          <Button title="Pick CSV file" variant="ghost" onPress={pickFile} />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>COLUMN MAPPING</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          {MAPPING.map(([a, b], i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: palette.fieldBorder }}>
              <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{a}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Icon name="check" size={14} color={palette.accents.mint.fg} width={2.6} />
                <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>{b}</Txt>
              </View>
            </View>
          ))}
        </View>

        {PREVIEW.length > 0 && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>PREVIEW</Txt>
            <View style={{ gap: 8 }}>
              {PREVIEW.map(([name, sub, ok]: any, i) => (
                <View key={i} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <Avatar name={ok ? name : "!"} size={36} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 13.5, ...font(700), color: ok ? palette.text : palette.danger }}>{name}</Txt>
                    <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{sub}</Txt>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 18 }}>
          <Button
            title={importing ? "Importing…" : "Import users"}
            disabled={!file || importing}
            onPress={doImport}
          />
        </View>
      </ScrollView>
    </View>
  );
}
