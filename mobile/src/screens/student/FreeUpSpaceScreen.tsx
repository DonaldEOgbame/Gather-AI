import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View, ActivityIndicator } from "react-native";
import { Txt, Button, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import { libraryStats, getDb, type LibraryStats } from "@/db";
import * as FileSystem from "expo-file-system";

interface EvictableItem {
  sha256: string;
  physical_path: string;
  size_bytes: number;
  course_label: string;
}

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Settings · Storage auto-eviction (design 106): free space by evicting official files. */
export default function FreeUpSpaceScreen({ navigation }: RootScreen<"FreeUpSpace">) {
  const { palette, scheme } = useTheme();
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [evictable, setEvictable] = useState<EvictableItem[]>([]);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await libraryStats();
      setStats(s);
      const db = await getDb();
      const rows = await db.getAllAsync<any>(
        `SELECT c.sha256, c.physical_path, c.size_bytes,
                COALESCE(f.name, p.course_id, 'Personal') as course_label
         FROM content c
         LEFT JOIN placement p ON p.sha256 = c.sha256 AND p.course_id IS NOT NULL
         LEFT JOIN folder f ON f.course_id = p.course_id AND f.kind = 'course'
         WHERE p.course_id IS NOT NULL
         GROUP BY c.sha256
         ORDER BY c.size_bytes DESC
         LIMIT 20`
      );
      setEvictable(rows);
      setPicked(rows.map(() => true));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalSelected = evictable
    .filter((_, i) => picked[i])
    .reduce((sum, e) => sum + e.size_bytes, 0);

  const evict = async () => {
    const toEvict = evictable.filter((_, i) => picked[i]);
    const db = await getDb();
    for (const e of toEvict) {
      try { await FileSystem.deleteAsync(e.physical_path, { idempotent: true }); } catch { /* ignore */ }
      await db.runAsync(`DELETE FROM content WHERE sha256 = ?`, [e.sha256]);
      await db.runAsync(`DELETE FROM placement WHERE sha256 = ?`, [e.sha256]);
    }
    Alert.alert("Space freed", `${fmtBytes(totalSelected)} freed. Files can be re-downloaded anytime.`);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const totalBytes = stats?.bytesStored ?? 0;
  const officialPct = evictable.reduce((s, e) => s + e.size_bytes, 0) / Math.max(totalBytes, 1);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Storage</Txt>
        <View style={{ backgroundColor: palette.primary, borderRadius: 18, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.primaryText }}>Library storage</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: "rgba(255,255,255,0.6)" }}>{fmtBytes(totalBytes)} used</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 12, flexDirection: "row", overflow: "hidden" }}>
            <View style={{ width: `${Math.min(officialPct * 100, 100)}%`, backgroundColor: palette.accents.sky.fg }} />
            <View style={{ flex: 1, backgroundColor: palette.accents.mint.fg }} />
          </View>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 11 }}>
            <Legend color={palette.accents.sky.fg} label={`Official ${fmtBytes(evictable.reduce((s, e) => s + e.size_bytes, 0))}`} />
            <Legend color={palette.accents.mint.fg} label={`Total ${fmtBytes(totalBytes)}`} />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="mint" icon="shield" text="We can free space by evicting re-downloadable official files. Your personal files are never touched." />
        </View>

        {evictable.length > 0 && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>SAFE TO EVICT · RE-DOWNLOADABLE</Txt>
            <View style={{ gap: 8 }}>
              {evictable.map((e, i) => (
                <Pressable key={e.sha256} onPress={() => setPicked((p) => p.map((v, j) => j === i ? !v : v))} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <TinyIcon icon="cloud" accent="sky" size={38} iconSize={19} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{e.course_label}</Txt>
                    <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{fmtBytes(e.size_bytes)}</Txt>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: picked[i] ? palette.text : palette.border, backgroundColor: picked[i] ? palette.text : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {picked[i] ? <Icon name="check" size={13} color={palette.primaryText} width={2.6} /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {evictable.length === 0 && (
          <Txt variant="muted" style={{ textAlign: "center", marginTop: 40 }}>Nothing safe to evict right now.</Txt>
        )}
      </ScrollView>

      {evictable.length > 0 && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
          <Button
            title={`Free up ${fmtBytes(totalSelected)}`}
            disabled={totalSelected === 0}
            onPress={evict}
          />
        </View>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
      <Txt style={{ fontSize: 11.5, ...font(600), color: "rgba(255,255,255,0.7)" }}>{label}</Txt>
    </View>
  );
}
