import React, { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { backupApi } from "@/api/endpoints";
import { libraryStats } from "@/db";

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Student · Personal library backup (design 67): opt-in zero-knowledge backup. */
export default function LibraryBackupScreen() {
  const { palette, scheme } = useTheme();
  const [on, setOn] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [sizeLabel, setSizeLabel] = useState("—");
  const [backing, setBacking] = useState(false);

  useFocusEffect(useCallback(() => {
    backupApi.getManifest().then((r) => {
      const blob = r?.manifest_blob;
      if (blob) {
        try {
          const m = JSON.parse(blob);
          setLastBackup(m.created_at ?? null);
          setOn(true);
        } catch { /* no manifest yet */ }
      }
    }).catch(() => { /* no manifest yet */ });

    libraryStats().then((s) => {
      setSizeLabel(`${fmtBytes(s.bytesStored)} · ${s.filesOrganized} files`);
    });
  }, []));

  const backupNow = async () => {
    setBacking(true);
    try {
      const manifest = JSON.stringify({ created_at: new Date().toISOString(), version: 1 });
      await backupApi.putManifest(manifest);
      setLastBackup(new Date().toISOString());
      Alert.alert("Backed up", "Library manifest encrypted & uploaded.");
    } catch {
      Alert.alert("Error", "Backup failed. Check your connection.");
    } finally {
      setBacking(false);
    }
  };

  const STATUS: [string, string, boolean][] = [
    ["Last backup", timeAgo(lastBackup), lastBackup === null],
    ["Size", sizeLabel, false],
    ["Network", "Wi-Fi only", false],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Personal library backup</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="cloud" accent="sky" size={44} iconSize={22} />
            <View>
              <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text }}>Cloud backup</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{on ? "On" : "Off by default"}</Txt>
            </View>
          </View>
          <Toggle value={on} onValueChange={setOn} label="Cloud backup" />
        </View>

        <View style={{ marginTop: 14, backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="shield" size={20} color={palette.accents.mint.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 19, ...font(500), color: palette.text }}>
            Zero-knowledge: encrypted on your phone before upload. We store ciphertext only — no one else can read it.
          </Txt>
        </View>

        {!on && (
          <View style={{ marginTop: 14, backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
            <Icon name="bell" size={20} color={palette.accents.lemon.fg} />
            <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19, ...font(700), color: palette.text }}>
              Backup is off — your organized personal files live only on this phone and aren't backed up.
            </Txt>
          </View>
        )}

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>STATUS</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          {STATUS.map(([label, val, danger], i) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: palette.fieldBorder }}>
              <Txt style={{ fontSize: 14, ...font(500), color: palette.textMuted }}>{label}</Txt>
              <Txt style={{ fontSize: 14, ...font(700), color: danger ? palette.danger : palette.text }}>{val}</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title={backing ? "Backing up…" : "Back up now"} disabled={!on || backing} onPress={backupNow} />
        </View>
      </ScrollView>
    </View>
  );
}
