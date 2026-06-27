import React, { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { addPlacement, listFolders, UNSORTED_FOLDER_ID } from "@/db";
import { offeringsApi } from "@/api/endpoints";
import type { AccentName } from "@/theme";

const ACCENTS: AccentName[] = ["mint", "sky", "peach", "lemon", "lilac"];

/** Workflow · Save to Gather (design 27): OS share-sheet target; suggests course from DB. */
export default function ShareToGatherScreen({ route, navigation }: RootScreen<"ShareToGather">) {
  const { palette } = useTheme();
  const qc = useQueryClient();

  // Shared file metadata from OS share intent (route params or defaults)
  const sharedName = (route.params as any)?.name as string | undefined ?? "week6_lab_FINAL.pdf";
  const sharedSize = (route.params as any)?.size as number | undefined;
  const sharedFrom = (route.params as any)?.from as string | undefined ?? "Share sheet";

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load local course folders (from offline DB) to suggest course
  const [courseFolders, setCourseFolders] = useState<{ id: string; name: string; course_id: string | null }[]>([]);
  useFocusEffect(useCallback(() => {
    listFolders().then((rows) => {
      const courses = rows.filter((f) => f.kind === "course" && f.course_id);
      setCourseFolders(courses as any);
      // Auto-select first course as suggestion
      if (courses.length > 0 && !selectedCourseId) {
        setSelectedCourseId((courses[0] as any).course_id);
      }
    });
  }, []));

  const saveToDrafts = async () => {
    setSaving(true);
    try {
      let folderId = UNSORTED_FOLDER_ID;
      if (selectedCourseId) {
        const folder = courseFolders.find((f) => f.course_id === selectedCourseId);
        if (folder) folderId = folder.id;
      }
      const sha = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        sharedName + (sharedSize ?? 0) + Date.now()
      );
      await addPlacement({
        sha256: sha,
        folderId,
        displayName: sharedName,
        originalName: sharedName,
        courseId: selectedCourseId ?? null,
        week: selectedWeek ?? null,
        restriction: "open",
      });
      await qc.invalidateQueries({ queryKey: ["placements"] });
      Alert.alert("Saved", "Added to your Drafts.");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not save the file.");
    } finally {
      setSaving(false);
    }
  };

  const suggestedCourse = courseFolders.find((f) => f.course_id === selectedCourseId);

  function fmtBytes(b?: number): string {
    if (!b) return "—";
    if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
    return `${(b / 1e3).toFixed(0)} KB`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 16 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={20} color={palette.primaryText} width={1.7} />
          </View>
          <Txt style={{ fontSize: 18, ...font(800), color: palette.text }}>Save to Gather</Txt>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.field, borderRadius: 14, padding: 12 }}>
          <TinyIcon icon="file" accent="peach" size={38} iconSize={19} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{sharedName}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 1 }}>
              {sharedSize != null ? fmtBytes(sharedSize) : "—"} · from {sharedFrom}
            </Txt>
          </View>
        </View>

        {courseFolders.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 8 }}>
              <Icon name="sparkle" size={16} color={palette.accents.lilac.fg} />
              <Txt style={{ fontSize: 12, ...font(800), color: palette.accents.lilac.fg, letterSpacing: 0.4 }}>GATHER DETECTED</Txt>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  const next = courseFolders[(courseFolders.findIndex((f) => f.course_id === selectedCourseId) + 1) % courseFolders.length];
                  setSelectedCourseId(next?.course_id ?? null);
                }}
                style={{ flex: 1.4, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.accents.mint.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 11, ...font(700), color: palette.accents.mint.fg }}>Course</Txt>
                  <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>{suggestedCourse?.name ?? "—"}</Txt>
                </View>
                <Icon name="chev" size={16} color={palette.accents.mint.fg} />
              </Pressable>
              <Pressable
                onPress={() => setSelectedWeek((w) => (w == null ? 1 : w < 14 ? w + 1 : null))}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.accents.sky.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 11, ...font(700), color: palette.accents.sky.fg }}>Week</Txt>
                  <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>{selectedWeek ?? "—"}</Txt>
                </View>
                <Icon name="chev" size={16} color={palette.accents.sky.fg} />
              </Pressable>
            </View>
          </>
        )}

        <Txt variant="faint" style={{ fontSize: 12.5, ...font(500), textAlign: "center", marginTop: 14 }}>
          Goes to your library — link to a course whenever you're ready.
        </Txt>
        <View style={{ marginTop: 16 }}>
          <Button title={saving ? "Saving…" : "Save to drafts"} disabled={saving} onPress={saveToDrafts} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>Open Gather instead</Txt>
        </Pressable>
      </View>
    </View>
  );
}
