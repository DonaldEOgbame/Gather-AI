import React, { useCallback, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Txt, Button, EmptyState, SectionHeader, ListCard } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import { listFolders, listScanSkips, listCollections, createCollection, type FolderRow, type CollectionRow } from "@/db";
import { resolveFileSource } from "@/scan/fileSource";
import { runScan, type ScanProgress, type ScanResult } from "@/scan/engine";
import { coursesApi } from "@/api/endpoints";
import { formatBytes } from "@/util/format";

function StatTile({ value, label, fg }: { value: string; label: string; fg?: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
      <Txt style={{ fontSize: 18, ...font(800), color: fg ?? palette.text }}>{value}</Txt>
      <Txt style={{ fontSize: 12, ...font(600), color: palette.textFaint, marginTop: 2 }}>{label}</Txt>
    </View>
  );
}

/** My Library (Module 9 / 3 · design 09). Scan & Sort + smart folders + collections. */
export default function LibraryTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [folders, setFolders] = useState<(FolderRow & { count: number })[]>([]);
  const [collections, setCollections] = useState<(CollectionRow & { count: number })[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [skips, setSkips] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const cancelRef = useRef(false);

  const reload = useCallback(async () => {
    setFolders(await listFolders());
    setCollections(await listCollections());
    setSkips((await listScanSkips()).length);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function startScan() {
    setScanning(true);
    setResult(null);
    cancelRef.current = false;
    try {
      const source = await resolveFileSource();
      const courses = await coursesApi.list().catch(() => []);
      const res = await runScan(source, courses, { onProgress: setProgress, isCancelled: () => cancelRef.current });
      setResult(res);
      await reload();
    } catch (e: any) {
      if (e?.message === "all-files-access-denied") {
        Alert.alert("Storage access needed", "Grant “All files access” in settings to scan your phone, or import files manually.");
      } else {
        Alert.alert("Scan failed", e?.message ?? "Unknown error");
      }
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }

  const totalFiles = folders.reduce((n, f) => n + f.count, 0);
  const hasContent = totalFiles > 0;

  // ---- Organizing state (design 10) ----
  if (scanning) {
    const pct = progress?.total ? Math.round((progress.processed / progress.total) * 100) : 0;
    const R = 78;
    const C = 2 * Math.PI * R;
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
          <View style={{ width: 180, height: 180, marginBottom: 8 }}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle cx={90} cy={90} r={R} fill="none" stroke="#E6E9EF" strokeWidth={12} />
              <Circle cx={90} cy={90} r={R} fill="none" stroke={palette.primary} strokeWidth={12} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 90 90)" />
            </Svg>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
              <Txt style={{ fontSize: 38, ...font(800), color: palette.text }}>{pct}%</Txt>
              <Txt style={{ fontSize: 13, ...font(600), color: palette.textFaint }}>organizing</Txt>
            </View>
          </View>
          <Txt style={{ fontSize: 20, ...font(800), color: palette.text, marginTop: 12 }}>Sorting your files…</Txt>
          <Txt numberOfLines={1} variant="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{progress?.current ?? "Scanning"}</Txt>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 22, width: "100%" }}>
            <StatTile value={String(progress?.organized ?? 0)} label="organized" fg={palette.accents.mint.fg} />
            <StatTile value={String(progress?.deduped ?? 0)} label="duplicates" fg={palette.accents.lemon.fg} />
            <StatTile value={String(progress?.skipped ?? 0)} label="skipped" fg={palette.accents.peach.fg} />
          </View>
          <View style={{ marginTop: 28, width: "100%" }}>
            <Button title="Cancel" variant="danger" onPress={() => { cancelRef.current = true; }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title">My Library</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Offline · auto-organized</Txt>

        {/* Ink hero CTA */}
        <Pressable
          onPress={startScan}
          accessibilityRole="button"
          accessibilityLabel="Organize my phone"
          style={{ marginTop: 16, backgroundColor: palette.primary, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkle" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16, ...font(700), color: "#fff" }}>Organize my phone</Txt>
            <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Scan · de-dupe · sort by course</Txt>
          </View>
          <Icon name="chev" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Stat tiles */}
        {(result || hasContent) && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <StatTile value={result ? formatBytes(result.bytesSaved) : "—"} label="saved" fg={palette.accents.mint.fg} />
            <StatTile value={String(totalFiles)} label="files" fg={palette.accents.sky.fg} />
            <StatTile value={String(skips)} label="to review" fg={palette.accents.lemon.fg} />
          </View>
        )}

        {skips > 0 && (
          <Pressable onPress={() => Alert.alert("Couldn't process", `${skips} file(s) skipped.`)}>
            <Txt variant="muted" style={{ marginTop: 10 }}>Couldn't process ({skips}) — tap to view</Txt>
          </Pressable>
        )}

        {/* Smart folders */}
        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Smart folders" />
        </View>
        {!hasContent ? (
          <EmptyState
            icon="folder"
            title="Your library is empty"
            body="Tap “Organize my phone” to scan, de-duplicate and sort the course files you already have. Originals are kept safe for 30 days."
            cta={{ label: "Organize my phone", onPress: startScan }}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {folders.map((item) => (
              <ListCard
                key={item.id}
                icon="folder"
                accent={accentFor(item.id)}
                title={item.name}
                subtitle={`${item.kind === "smart" ? "Smart folder" : item.kind === "course" ? "Course" : item.kind} · ${item.count} file${item.count === 1 ? "" : "s"}`}
                right={<Icon name="chev" size={18} color={palette.textFaint} />}
                onPress={() => nav.navigate("FolderDetail", { folderId: item.id, name: item.name })}
              />
            ))}
          </View>
        )}

        {/* Collections */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Bookmark collections" action={!showCreate ? { label: "+ Create", onPress: () => setShowCreate(true) } : undefined} />
        </View>
        {showCreate && (
          <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <Field label="Collection name" placeholder="e.g. Exam prep" value={newCollName} onChangeText={setNewCollName} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save"
                  onPress={async () => {
                    if (!newCollName.trim()) return;
                    await createCollection(newCollName.trim());
                    setNewCollName("");
                    setShowCreate(false);
                    await reload();
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="ghost" onPress={() => { setNewCollName(""); setShowCreate(false); }} />
              </View>
            </View>
          </View>
        )}
        {collections.length === 0 ? (
          <Txt variant="muted" style={{ textAlign: "center", marginVertical: 12 }}>No bookmark collections yet.</Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {collections.map((item) => (
              <ListCard
                key={item.id}
                icon="bookmark"
                accent={accentFor(item.id)}
                title={item.name}
                subtitle={`Collection · ${item.count} file${item.count === 1 ? "" : "s"}`}
                right={<Icon name="chev" size={18} color={palette.textFaint} />}
                onPress={() => nav.navigate("FolderDetail", { folderId: item.id, name: item.name, isCollection: true })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
