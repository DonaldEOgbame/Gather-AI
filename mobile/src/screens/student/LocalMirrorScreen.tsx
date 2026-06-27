import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import { listFolders, libraryStats, type FolderRow, type LibraryStats } from "@/db";

/** Settings · Local mirror (design 98): namespaced folder tree + incremental rescan. */
export default function LocalMirrorScreen(_: RootScreen<"LocalMirror">) {
  const { palette, scheme } = useTheme();
  const [folders, setFolders] = useState<(FolderRow & { count: number })[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, s] = await Promise.all([listFolders(), libraryStats()]);
      setFolders(f);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const courseFolders = folders.filter((f) => f.kind === "course");
  const lastScan = stats ? new Date().toLocaleDateString() : "—";

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <Txt variant="title" style={{ marginBottom: 16 }}>Local mirror</Txt>
          <View style={{ backgroundColor: palette.primary, borderRadius: 18, padding: 16 }}>
            <Txt style={{ fontSize: 11, ...font(800), color: "rgba(255,255,255,0.55)", letterSpacing: 0.5, marginBottom: 10 }}>FOLDER STRUCTURE</Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingBottom: 5 }}>
              <Icon name="folder" size={14} color="rgba(255,255,255,0.55)" />
              <Txt style={{ fontSize: 12.5, ...font(600), color: "rgba(255,255,255,0.7)" }}>/MyLibrary/</Txt>
            </View>
            {courseFolders.map((f) => (
              <View key={f.id} style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 14, paddingBottom: 5 }}>
                <Icon name={f.count > 0 ? "file" : "folder"} size={14} color={f.count > 0 ? palette.primaryText : "rgba(255,255,255,0.55)"} />
                <Txt style={{ fontSize: 12.5, ...font(f.count > 0 ? 800 : 600), color: f.count > 0 ? palette.primaryText : "rgba(255,255,255,0.7)" }}>
                  {f.name}{f.count > 0 ? ` · ${f.count} file${f.count !== 1 ? "s" : ""}` : "/"}
                </Txt>
              </View>
            ))}
            {courseFolders.length === 0 && (
              <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.5)", paddingLeft: 14 }}>No course folders yet</Txt>
            )}
          </View>

          <View style={{ marginTop: 14, backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <TinyIcon icon="refresh" accent="sky" size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>
                  {stats?.uniqueContent ?? 0} unique files indexed
                </Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>Last scan: {lastScan}</Txt>
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
      )}
    </View>
  );
}
