import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery } from "@tanstack/react-query";
import { materialsApi } from "@/api/endpoints";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtBytes(b?: number): string {
  if (!b) return "—";
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Student · Versions (design 31): file version history for a course material. */
export default function VersionsScreen({ route }: RootScreen<"Versions">) {
  const { palette, scheme } = useTheme();
  const code = route.params?.code ?? "";
  const materialId = (route.params as any)?.materialId as string | undefined;
  const offeringId = (route.params as any)?.offeringId as string | undefined;
  const fileName = route.params?.fileName ?? "File";

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["materials", offeringId],
    queryFn: () => materialsApi.list(offeringId!),
    enabled: !!offeringId,
  });

  // Current = the matching material; archived = same week, different ID
  const current = materials.find((m) => m.id === materialId) ?? null;
  const week = current?.week;
  const archived = materials.filter(
    (m) => m.id !== materialId && (week == null || m.week === week) && m.status !== "published"
  );

  const displayLabel = `${code || (current?.offering_code ?? "—")} · Week ${week ?? "—"}`;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Versions</Txt>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint, marginTop: 12 }}>{displayLabel}</Txt>
        <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 2 }}>{current?.title ?? fileName}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={20} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19, ...font(500), color: palette.text }}>
            {archived.length > 0
              ? "Lecturer updated this file. The old version was archived automatically — you'll never open the wrong one."
              : "This is the only version of this file."}
          </Txt>
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="History" />
        </View>
        <View style={{ gap: 11 }}>
          {current && (
            <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: palette.accents.mint.fg, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <TinyIcon icon="file" accent="mint" size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Current · Latest</Txt>
                  <StatusPill label="Latest" accent="mint" />
                </View>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>
                  {current.updated_at ? `Updated ${timeAgo(current.updated_at)}` : "Active"}{current.size_bytes ? ` · ${fmtBytes(current.size_bytes)}` : ""}
                </Txt>
              </View>
              <Pressable onPress={() => Alert.alert("Open", "Opening current version")} style={{ backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 }}>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.primaryText }}>Open</Txt>
              </Pressable>
            </View>
          )}
          {archived.map((m) => (
            <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <TinyIcon icon="trash" accent="peach" size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Archived · {m.title}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>Replaced · kept offline</Txt>
              </View>
              <Pressable onPress={() => Alert.alert("Compare", `Compare with ${m.title}`)} style={{ borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: 16, paddingVertical: 9 }}>
                <Txt style={{ fontSize: 13, ...font(700), color: palette.text }}>Compare</Txt>
              </Pressable>
            </View>
          ))}
          {!current && archived.length === 0 && (
            <Txt variant="faint" style={{ textAlign: "center", marginTop: 20 }}>No version history available offline.</Txt>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
