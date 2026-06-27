import React, { useCallback, useState } from "react";
import { Alert, ScrollView, View, ActivityIndicator } from "react-native";
import { Txt, Segmented, SettingsGroup, SettingItem, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { libraryStats, clearMirror, getDb, type LibraryStats } from "@/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/api/endpoints";

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Student · Storage & sync (design 33): app usage + per-course + import rules. */
export default function StorageSyncScreen() {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [courseStats, setCourseStats] = useState<{ name: string; bytes: number }[]>([]);
  const [onImport, setOnImport] = useState<"copy" | "move">("copy");
  const [autoDl, setAutoDl] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, prefs] = await Promise.all([
        libraryStats(),
        AsyncStorage.multiGet(["import_mode", "auto_dl"]),
      ]);
      setStats(s);
      if (prefs[0][1]) setOnImport(prefs[0][1] as "copy" | "move");
      if (prefs[1][1] !== null) setAutoDl(prefs[1][1] === "true");

      const db = await getDb();
      const rows = await db.getAllAsync<{ name: string; bytes: number }>(
        `SELECT COALESCE(f.name, p.course_id, 'Other') as name,
                SUM(c.size_bytes) as bytes
         FROM placement p
         JOIN content c ON c.sha256 = p.sha256
         LEFT JOIN folder f ON f.course_id = p.course_id AND f.kind = 'course'
         WHERE p.course_id IS NOT NULL
         GROUP BY p.course_id
         ORDER BY bytes DESC
         LIMIT 8`
      );
      setCourseStats(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveImportMode = async (mode: "copy" | "move") => {
    setOnImport(mode);
    await AsyncStorage.setItem("import_mode", mode);
  };

  const saveAutoDl = async (v: boolean) => {
    setAutoDl(v);
    await AsyncStorage.setItem("auto_dl", String(v));
  };

  const doClearMirror = () => {
    Alert.alert(
      "Clear local mirror?",
      "Published materials can be re-downloaded. Personal files placed here will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear", style: "destructive",
          onPress: async () => {
            await clearMirror();
            await qc.invalidateQueries();
            load();
          },
        },
      ]
    );
  };

  const totalBytes = stats?.bytesStored ?? 0;
  const savedBytes = stats?.bytesSaved ?? 0;
  const maxCourse = Math.max(...courseStats.map((c) => c.bytes), 1);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Storage & sync</Txt>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Txt style={{ fontSize: 26, ...font(800), color: palette.primaryText }}>{fmtBytes(totalBytes)}</Txt>
              <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.6)" }}>used by Gather</Txt>
            </View>
            {savedBytes > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" }}>
                <Icon name="sparkle" size={15} color={palette.primaryText} />
                <Txt style={{ fontSize: 12.5, ...font(700), color: palette.primaryText }}>{fmtBytes(savedBytes)} saved by de-dup</Txt>
              </View>
            )}
          </View>

          {courseStats.length > 0 && (
            <>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 12 }}>BY COURSE</Txt>
              <View style={{ gap: 12 }}>
                {courseStats.map((c) => (
                  <View key={c.name} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Txt style={{ width: 64, fontSize: 13, ...font(700), color: palette.text }} numberOfLines={1}>{c.name}</Txt>
                    <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.border, overflow: "hidden" }}>
                      <View style={{ height: 8, borderRadius: 4, width: `${(c.bytes / maxCourse) * 100}%`, backgroundColor: palette.primary }} />
                    </View>
                    <Txt style={{ width: 56, textAlign: "right", fontSize: 12, ...font(600), color: palette.textFaint }}>{fmtBytes(c.bytes)}</Txt>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ marginTop: 22 }}>
            <SettingsGroup>
              <SettingItem first icon="download" accent="sky" title="On import" sub="Recommended — originals untouched" right={<View style={{ width: 150 }}><Segmented value={onImport} onChange={saveImportMode} options={[{ key: "copy", label: "Copy" }, { key: "move", label: "Move" }]} /></View>} />
              <SettingItem icon="cloud" accent="mint" title="Auto-download" sub="Wi-Fi only" right={<Toggle value={autoDl} onValueChange={saveAutoDl} label="Auto-download" />} />
              <SettingItem icon="trash" accent="peach" title="Clear local mirror" right={<Txt style={{ fontSize: 13, ...font(700), color: palette.danger }}>Clear</Txt>} onPress={doClearMirror} />
            </SettingsGroup>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
