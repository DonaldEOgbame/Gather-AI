import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import {
  listFolders,
  listPlacements,
  relinkToCourse,
  recordMapping,
  type FolderRow,
  type PlacementRow,
} from "@/db";
import { useQueryClient } from "@tanstack/react-query";

const ACCENTS: AccentName[] = ["mint", "sky", "peach", "lemon", "lilac"];

/** Workflow · Smart cluster → link to course (design 29): wire to local DB + recordMapping. */
export default function SmartClusterScreen({ route, navigation }: RootScreen<"SmartCluster">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();

  const folderId = (route.params as any)?.folderId as string | undefined;
  const name = route.params?.name ?? "Uncategorized cluster";

  const [files, setFiles] = useState<PlacementRow[]>([]);
  const [courses, setCourses] = useState<(FolderRow & { count: number })[]>([]);
  const [pick, setPick] = useState<number | null>(null);
  const [linking, setLinking] = useState(false);

  useFocusEffect(useCallback(() => {
    listFolders().then((rows) => {
      const courseFolders = rows.filter((f) => f.kind === "course" && f.course_id);
      setCourses(courseFolders);
    });

    if (folderId) {
      listPlacements(folderId).then(setFiles);
    }
  }, [folderId]));

  // Extract cluster keywords from file names (naive: unique words > 4 chars)
  const allWords = files.flatMap((f) => f.display_name.replace(/\.[^.]+$/, "").split(/[\s_\-]+/));
  const keywords = [...new Set(allWords.filter((w) => w.length > 4))].slice(0, 5);

  const link = async () => {
    if (pick === null || !courses[pick]?.course_id) return;
    const targetCourse = courses[pick];
    setLinking(true);
    try {
      for (const f of files) {
        await relinkToCourse(f.id, targetCourse.id, targetCourse.course_id!);
      }
      // Teach the matcher: record each keyword → courseId
      for (const kw of keywords) {
        await recordMapping(kw, targetCourse.course_id!);
      }
      await qc.invalidateQueries({ queryKey: ["placements"] });
      Alert.alert("Linked", `${files.length} file${files.length !== 1 ? "s" : ""} moved and the matcher learned this mapping.`);
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not link files.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        <TinyIcon icon="folder" accent="lemon" size={52} iconSize={26} />
        <Txt variant="title" style={{ fontSize: 21, marginTop: 12 }}>{name}</Txt>
        <Txt variant="muted" style={{ fontSize: 13, marginTop: 3 }}>Auto-grouped · not matched to a course</Txt>

        {keywords.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
            {keywords.map((k) => (
              <View key={k} style={{ backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>{k}</Txt>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 18, gap: 10 }}>
          {files.length === 0 ? (
            <Txt variant="faint" style={{ textAlign: "center", marginTop: 20 }}>No files in this cluster.</Txt>
          ) : (
            files.map((f, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <View key={f.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <TinyIcon icon="file" accent={accent} size={44} iconSize={22} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{f.display_name}</Txt>
                    {f.topic ? (
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{f.topic}</Txt>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, shadowColor: palette.shadow, shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: -10 }, elevation: scheme === "dark" ? 0 : 12 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 14 }} />
        <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>Link to a course</Txt>
        <Txt variant="faint" style={{ fontSize: 12.5, ...font(500), marginTop: 3, marginBottom: 12 }}>Teaches Gather to auto-sort these next time.</Txt>
        {courses.length === 0 ? (
          <Txt variant="faint" style={{ textAlign: "center", paddingVertical: 10 }}>No course folders yet.</Txt>
        ) : (
          courses.map((c, i) => {
            const sel = pick === i;
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <Pressable key={c.id} onPress={() => setPick(i)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: sel ? palette.field : "transparent" }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                  <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{c.name.slice(0, 3).toUpperCase()}</Txt>
                </View>
                <Txt style={{ flex: 1, fontSize: 14, ...font(700), color: palette.text }}>{c.name}</Txt>
                {sel ? <Icon name="check" size={20} color={palette.text} width={2.4} /> : <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.border }} />}
              </Pressable>
            );
          })
        )}
        <View style={{ marginTop: 12 }}>
          <Button
            title={linking ? "Linking…" : `Link & move ${files.length} file${files.length !== 1 ? "s" : ""}`}
            disabled={pick === null || linking || files.length === 0}
            onPress={link}
          />
        </View>
      </View>
    </View>
  );
}
