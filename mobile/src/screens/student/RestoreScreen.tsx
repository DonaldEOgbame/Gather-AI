import React, { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import { backupApi } from "@/api/endpoints";
import { authApi } from "@/api/endpoints";
import { libraryStats } from "@/db";

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Student · Restore on new device (design 68): official vs personal data split. */
export default function RestoreScreen({ navigation }: RootScreen<"Restore">) {
  const { palette, scheme } = useTheme();
  const [wifi, setWifi] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [sizeLabel, setSizeLabel] = useState("— · — files");
  const [hasBackup, setHasBackup] = useState(false);
  const [firstName, setFirstName] = useState("there");

  useFocusEffect(useCallback(() => {
    backupApi.getManifest().then((r) => {
      if (r?.manifest_blob) {
        setHasBackup(true);
        try {
          const m = JSON.parse(r.manifest_blob);
          if (m.total_bytes) setSizeLabel(`${fmtBytes(m.total_bytes)} · ${m.file_count ?? "?"} files`);
        } catch { /* use default label */ }
      }
    }).catch(() => { /* no backup */ });

    libraryStats().then((s) => {
      setSizeLabel(`${fmtBytes(s.bytesStored)} · ${s.filesOrganized} files`);
    });

    authApi.me().then((u) => {
      const name = u?.display_name ?? u?.email?.split("@")[0] ?? "there";
      setFirstName(name.split(" ")[0]);
    }).catch(() => { /* ignore */ });
  }, []));

  const restore = async () => {
    setRestoring(true);
    try {
      const r = await backupApi.getManifest();
      if (!r?.manifest_blob) throw new Error("No backup found");
      Alert.alert("Restoring", "Decrypting your personal library — this may take a moment on Wi-Fi.");
      navigation.goBack();
    } catch {
      Alert.alert("Restore failed", "No backup found or decryption error.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
        <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: palette.accents.sky.bg, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon name="cloud" size={40} color={palette.accents.sky.fg} />
        </View>
        <Txt variant="display" style={{ textAlign: "center" }}>Welcome back, {firstName}</Txt>
        <Txt variant="muted" style={{ fontSize: 14.5, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
          Two separate things happen on a new device.
        </Txt>

        <View style={{ width: "100%", backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 14, marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={20} color={palette.accents.mint.fg} width={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, ...font(800), color: palette.text }}>Official course files</Txt>
            <Txt style={{ fontSize: 12, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Re-downloaded automatically — done</Txt>
          </View>
        </View>

        <View style={{ width: "100%", backgroundColor: palette.card, borderRadius: 18, padding: 18, marginTop: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TinyIcon icon="folder" accent="lilac" size={46} iconSize={23} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>Personal library</Txt>
              <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 2 }}>{sizeLabel} · opt-in</Txt>
            </View>
            <StatusPill label={hasBackup ? "Opt-in" : "No backup"} accent={hasBackup ? "lilac" : "peach"} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text }}>Wi-Fi only</Txt>
            <Toggle value={wifi} onValueChange={setWifi} label="Wi-Fi only" />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
        <Button
          title={restoring ? "Restoring…" : `Restore ${sizeLabel.split(" · ")[0]}`}
          disabled={!hasBackup || restoring}
          onPress={restore}
        />
        <Txt variant="faint" onPress={() => navigation.goBack()} style={{ textAlign: "center", fontSize: 14, ...font(700), marginTop: 14 }}>
          Skip — keep this device fresh
        </Txt>
      </View>
    </View>
  );
}
