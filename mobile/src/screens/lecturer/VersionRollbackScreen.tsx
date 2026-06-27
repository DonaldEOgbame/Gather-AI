import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { materialsApi } from "@/api/endpoints";

function PillBtn({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  const { palette, scheme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 10, borderWidth: ghost ? 1.5 : 0, borderColor: palette.border, backgroundColor: ghost ? "transparent" : palette.field, paddingHorizontal: 13, paddingVertical: 8 }}>
      <Txt style={{ fontSize: 12.5, ...font(700), color: ghost ? palette.textMuted : palette.text }}>{label}</Txt>
    </Pressable>
  );
}

/** Lecturer · Version rollback (design 59): re-point the live file to a prior version. */
export default function VersionRollbackScreen({ route }: RootScreen<"VersionRollback">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const code = route.params?.code ?? "CSC101 · Week 12";
  const fileName = route.params?.fileName ?? "Lecture 12 — Recursion.pdf";
  const materialId = (route.params as any)?.materialId as string | undefined;
  const offeringId = (route.params as any)?.offeringId as string | undefined;

  // Fetch all materials for this offering and show same-week ones as "history"
  const { data: siblings = [], isLoading } = useQuery<any[]>({
    queryKey: ["materials", offeringId],
    queryFn: () => materialsApi.list(offeringId!),
    enabled: !!offeringId,
  });

  const current = siblings.find((m: any) => m.id === materialId);
  const others = siblings.filter((m: any) => m.id !== materialId && m.week === current?.week);

  const rollback = async (m: any) => {
    Alert.alert(
      "Rollback",
      `Make "${m.title}" the live version?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rollback",
          style: "destructive",
          onPress: async () => {
            try {
              await materialsApi.publish(m.id, null);
              if (current) await materialsApi.update(current.id, { status: "draft" });
              await qc.invalidateQueries({ queryKey: ["materials", offeringId] });
              Alert.alert("Done", `"${m.title}" is now live.`);
            } catch {
              Alert.alert("Error", "Rollback failed.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Version history</Txt>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint, marginTop: 12 }}>{code}</Txt>
        <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 2 }}>{fileName}</Txt>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {current && (
            <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: palette.accents.mint.fg, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <TinyIcon icon="file" accent="mint" size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Current · live</Txt>
                  <StatusPill label="Live" accent="mint" />
                </View>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{current.original_filename} · {Math.round((current.size_bytes ?? 0) / 1024)} KB</Txt>
              </View>
            </View>
          )}

          {others.length > 0 && (
            <View style={{ gap: 11, marginTop: 11 }}>
              {others.map((m: any, idx: number) => {
                const accent: AccentName = idx % 2 === 0 ? "sky" : "lemon";
                return (
                  <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="clock" accent={accent} size={44} iconSize={22} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{m.title}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{m.original_filename}</Txt>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <PillBtn label="Rollback" onPress={() => rollback(m)} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {others.length === 0 && !isLoading && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>No prior versions for this week.</Txt>
          )}

          <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
            <Icon name="sparkle" size={17} color={palette.accents.sky.fg} />
            <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(600), color: palette.text }}>
              Rollback re-points the live file. Students get the Stale Sweeper update automatically.
            </Txt>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
