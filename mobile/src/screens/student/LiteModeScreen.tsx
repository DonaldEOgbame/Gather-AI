import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, Toggle, Segmented } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, useThemePrefs } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { libraryStats } from "@/db";

const LITE_MODE_KEY = "lite_mode_enabled";
const SCAN_PROGRESS_KEY = "scan_progress";

/** Student · Lite mode (design 72): low-end device performance + scan progress. */
export default function LiteModeScreen() {
  const { palette, scheme } = useTheme();
  const { mode, setMode } = useThemePrefs();
  const [lite, setLite] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [progress, setProgress] = useState<{ batch: number; total: number } | null>(null);

  useFocusEffect(useCallback(() => {
    AsyncStorage.multiGet([LITE_MODE_KEY, SCAN_PROGRESS_KEY]).then(([[, lm], [, sp]]) => {
      if (lm !== null) setLite(lm === "true");
      if (sp) {
        try { setProgress(JSON.parse(sp)); } catch { /* ignore */ }
      }
    });
    libraryStats().then((s) => setTotalFiles(s.uniqueContent));
  }, []));

  const toggleLite = async (v: boolean) => {
    setLite(v);
    await AsyncStorage.setItem(LITE_MODE_KEY, String(v));
  };

  const cancelScan = () => {
    Alert.alert("Cancel scan", "Stop the current scan?", [
      { text: "Keep scanning", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(SCAN_PROGRESS_KEY);
          setProgress(null);
        },
      },
    ]);
  };

  const pct = progress ? Math.round((progress.batch / progress.total) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Performance & Appearance</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="sun" accent="lemon" size={44} iconSize={22} />
            <View>
              <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text }}>Lite mode</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>Skip thumbnails · smaller batches</Txt>
            </View>
          </View>
          <Toggle value={lite} onValueChange={toggleLite} label="Lite mode" />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>APPEARANCE</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text, marginBottom: 12 }}>Theme</Txt>
          <Segmented
            value={mode}
            options={[
              { key: "system", label: "System" },
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
            ]}
            onChange={(m) => setMode(m)}
          />
        </View>

        {totalFiles > 0 && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>
              {progress ? `SCANNING ${totalFiles} FILES` : `${totalFiles} FILES INDEXED`}
            </Txt>
            <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              {progress ? (
                <>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Hashing batch {progress.batch} of {progress.total}</Txt>
                    <Txt style={{ fontSize: 14, ...font(800), color: palette.text }}>{pct}%</Txt>
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: palette.border, overflow: "hidden" }}>
                    <View style={{ height: 10, borderRadius: 5, width: `${pct}%`, backgroundColor: palette.primary }} />
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Scan complete</Txt>
                  <Txt style={{ fontSize: 14, ...font(800), color: palette.accents.mint.fg }}>100%</Txt>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 }}>
                <Icon name="clock" size={16} color={palette.textFaint} />
                <Txt style={{ fontSize: 12, ...font(500), color: palette.textMuted }}>Runs in the background — keep using the app.</Txt>
              </View>
            </View>
          </>
        )}

        {progress && (
          <View style={{ marginTop: 14 }}>
            <Button title="Cancel scan" variant="ghost" onPress={cancelScan} />
          </View>
        )}

        <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={17} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(600), color: palette.text }}>
            Hashing streams on a worker thread, so even older phones stay responsive.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
