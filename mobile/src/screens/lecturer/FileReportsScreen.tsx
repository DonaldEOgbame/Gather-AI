import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, StatusPill, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { reportsApi } from "@/api/endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Broken-file reports (design 55): triage student-reported files. */
export default function FileReportsScreen({ route }: RootScreen<"FileReports">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";
  const [resolving, setResolving] = useState<string | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["file-reports", offeringId],
    queryFn: () => reportsApi.listReports(offeringId),
    enabled: !!offeringId,
  });

  const openReports = (reports ?? []).filter((r: any) => r.status === "open");

  async function resolve(reportId: string, fileName: string) {
    setResolving(reportId);
    try {
      await reportsApi.resolveReport(reportId, "resolved");
      qc.invalidateQueries({ queryKey: ["file-reports", offeringId] });
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not resolve report.");
    } finally {
      setResolving(null);
    }
  }

  // Group reports by material_id
  const grouped = (reports ?? []).reduce((acc: Record<string, any[]>, r: any) => {
    if (!acc[r.material_id]) acc[r.material_id] = [];
    acc[r.material_id].push(r);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Reports</Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, marginTop: 14 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        {!isLoading && <StatusPill label={`${openReports.length} open`} accent={openReports.length > 0 ? "peach" : "mint"} />}
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : Object.keys(grouped).length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="muted">No reports yet.</Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
          {Object.entries(grouped).map(([materialId, reps]) => {
            const first = reps[0];
            const openCount = reps.filter((r: any) => r.status === "open").length;
            const accent = accentFor(materialId);
            const reasonCounts: Record<string, number> = {};
            reps.forEach((r: any) => {
              reasonCounts[r.reason] = (reasonCounts[r.reason] ?? 0) + 1;
            });
            const tags = Object.entries(reasonCounts).map(([reason, count]) =>
              count > 1 ? `${reason} ×${count}` : reason
            );
            return (
              <View key={materialId} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <TinyIcon icon="file" accent={accent} size={42} iconSize={21} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{first.material_title ?? materialId}</Txt>
                    <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{first.status}</Txt>
                  </View>
                  <StatusPill label={`${reps.length} report${reps.length !== 1 ? "s" : ""}`} accent={openCount > 0 ? "peach" : "mint"} />
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.fieldBorder }}>
                  {tags.map((t) => (
                    <View key={t} style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>{t}</Txt>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  {openCount > 0 && reps.filter((r: any) => r.status === "open").map((r: any) => (
                    <Pressable
                      key={r.id}
                      disabled={resolving === r.id}
                      onPress={() => resolve(r.id, first.material_title ?? materialId)}
                      style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: palette.border, paddingVertical: 11 }}
                    >
                      <Txt style={{ fontSize: 14, ...font(700), color: resolving === r.id ? palette.textFaint : palette.textMuted }}>
                        {resolving === r.id ? "Resolving…" : "Resolve"}
                      </Txt>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
