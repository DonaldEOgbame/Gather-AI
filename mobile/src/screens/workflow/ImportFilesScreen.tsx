import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { IconName } from "@/components/Icon";
import type { RootScreen } from "@/navigation/types";
import * as DocumentPicker from "expo-document-picker";
import * as Crypto from "expo-crypto";
import { addPlacement, UNSORTED_FOLDER_ID } from "@/db";
import { useQueryClient } from "@tanstack/react-query";

interface PickedFile {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
}

const SOURCES: [IconName, string, string, AccentName][] = [
  ["download", "From files", "Pick from Downloads or Drive", "sky"],
  ["share", "Share into Gather", "From any app's share sheet", "mint"],
];

function fmtBytes(b?: number): string {
  if (!b) return "—";
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Workflow · Import files (design 36): pick from device + import to local DB. */
export default function ImportFilesScreen({ navigation }: RootScreen<"ImportFiles">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const [source, setSource] = useState(0);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const toggle = (name: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const pick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      const picked: PickedFile[] = result.assets.map((a) => ({
        name: a.name,
        uri: a.uri,
        size: a.size,
        mimeType: a.mimeType ?? undefined,
      }));
      setFiles(picked);
      setSelected(new Set(picked.map((f) => f.name)));
    } catch {
      Alert.alert("Error", "Could not open the file picker.");
    }
  };

  const importFiles = async () => {
    const toImport = files.filter((f) => selected.has(f.name));
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      for (const f of toImport) {
        const sha = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          f.uri + f.name + (f.size ?? 0)
        );
        await addPlacement({
          sha256: sha,
          folderId: UNSORTED_FOLDER_ID,
          displayName: f.name,
          originalName: f.name,
          restriction: "open",
        });
      }
      await qc.invalidateQueries({ queryKey: ["placements"] });
      Alert.alert("Imported", `${toImport.length} file${toImport.length !== 1 ? "s" : ""} added to your library.`);
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Some files could not be imported.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Add to library</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {SOURCES.map(([icon, title, sub, accent], i) => (
            <Pressable key={title} onPress={() => { setSource(i); if (i === 0) pick(); }} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: source === i ? palette.primary : "transparent", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <TinyIcon icon={icon} accent={accent} size={44} iconSize={22} />
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 12 }}>{title}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 4, lineHeight: 16 }}>{sub}</Txt>
            </Pressable>
          ))}
        </View>

        {files.length > 0 && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 20, marginBottom: 8 }}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>SELECT FILES</Txt>
              <Txt style={{ fontSize: 12, ...font(700), color: palette.text }}>{selected.size} selected</Txt>
            </View>
            <View style={{ gap: 10 }}>
              {files.map((file, i) => {
                const sel = selected.has(file.name);
                const accent: AccentName = (["peach", "sky", "mint", "lemon", "lilac"] as AccentName[])[i % 5];
                return (
                  <Pressable key={file.name} onPress={() => toggle(file.name)} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="file" accent={accent} size={40} iconSize={20} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{file.name}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{fmtBytes(file.size)}</Txt>
                    </View>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: sel ? palette.primary : palette.card, borderWidth: sel ? 0 : 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                      {sel ? <Icon name="check" size={15} color={palette.primaryText} width={2.6} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {files.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 10 }}>
            <Icon name="download" size={36} color={palette.textFaint} width={1.5} />
            <Txt variant="muted" style={{ fontSize: 14, ...font(600) }}>Tap "From files" to pick documents</Txt>
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, borderTopColor: palette.border, borderTopWidth: 1 }}>
        <Button
          title={importing ? "Importing…" : `Import ${selected.size} file${selected.size === 1 ? "" : "s"}`}
          disabled={selected.size === 0 || importing}
          onPress={importFiles}
        />
      </View>
    </View>
  );
}
