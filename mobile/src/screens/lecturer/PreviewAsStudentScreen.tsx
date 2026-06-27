import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { offeringsApi, materialsApi } from "@/api/endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBytes } from "@/util/format";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Preview as student (design 94): see a draft exactly as students will. */
export default function PreviewAsStudentScreen({ route, navigation }: RootScreen<"PreviewAsStudent">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId;
  const code = route.params?.code ?? "CSC401 · Software Engineering";
  const [publishing, setPublishing] = useState(false);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["preview-as-student", offeringId],
    queryFn: () => offeringsApi.previewAsStudent(offeringId!),
    enabled: !!offeringId,
  });

  const drafts = (materials ?? []).filter((m) => m.status === "draft");

  async function publishAll() {
    if (!offeringId || drafts.length === 0) {
      Alert.alert("Published", "Materials are now live for students.");
      navigation.goBack();
      return;
    }
    setPublishing(true);
    try {
      await materialsApi.publishBatch(drafts.map((m) => m.id), null);
      qc.invalidateQueries({ queryKey: ["materials", offeringId] });
      Alert.alert("Published", `${drafts.length} material${drafts.length !== 1 ? "s" : ""} are now live for students.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Preview banner */}
      <View style={{ backgroundColor: palette.accents.lilac.fg, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Icon name="eye" size={17} color={palette.primaryText} />
        <Txt style={{ flex: 1, fontSize: 12.5, ...font(700), color: palette.primaryText }}>Preview — exactly what students see</Txt>
        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
          <Txt style={{ fontSize: 11, ...font(800), color: palette.primaryText }}>
            {drafts.length > 0 ? `${drafts.length} draft${drafts.length !== 1 ? "s" : ""}` : "No drafts"}
          </Txt>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={palette.text} />
          </View>
        ) : (materials ?? []).length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Txt variant="muted">No materials to preview.</Txt>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {(materials ?? []).map((m) => {
                const accent = accentFor(m.id);
                return (
                  <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                      <TinyIcon icon="file" accent={accent} size={46} iconSize={23} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Txt numberOfLines={1} style={{ fontSize: 14, ...font(800), color: palette.text }}>{m.title || m.original_filename}</Txt>
                        <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{formatBytes(m.size_bytes)}</Txt>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <StatusPill label={`Week ${m.week}`} accent="sky" />
                      {m.restriction !== "none" && <StatusPill label={m.restriction} accent="lemon" />}
                      <StatusPill label={m.status} accent={m.status === "live" ? "mint" : "peach"} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ marginTop: 14 }}>
              <InfoCard accent="mint" icon="check" text="Right week, right restriction. Catch wrong-week / wrong-restriction before publish." />
            </View>
          </ScrollView>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1.5 }}>
          <Button
            title={drafts.length > 0 ? `Publish ${drafts.length} draft${drafts.length !== 1 ? "s" : ""}` : "Looks right"}
            loading={publishing}
            onPress={publishAll}
          />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Back to edit</Txt>
        </Pressable>
      </View>
    </View>
  );
}
