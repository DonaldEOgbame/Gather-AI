import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { offeringsApi, materialsApi } from "@/api/endpoints";
import { useCurrentContext } from "@/hooks/queries";

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** Lecturer · Drafts hygiene (design 58): surfaces stale drafts before auto-trash. */
export default function DraftsHygieneScreen() {
  const { palette, scheme } = useTheme();
  const [tab, setTab] = useState("All");
  const { data: ctx } = useCurrentContext();

  const { data: offerings = [] } = useQuery<any[]>({
    queryKey: ["offerings", ctx?.semester?.id],
    queryFn: () => offeringsApi.list(ctx?.semester?.id),
    enabled: !!ctx?.semester?.id,
  });

  const offeringIds = offerings.map((o: any) => o.id);

  const { data: allMaterials = [], isLoading } = useQuery<any[]>({
    queryKey: ["all-drafts", offeringIds.join(",")],
    queryFn: async () => {
      const results = await Promise.all(offeringIds.map((id: string) => materialsApi.list(id)));
      return results.flat();
    },
    enabled: offeringIds.length > 0,
  });

  const drafts = allMaterials.filter((m: any) => m.status === "draft");
  const stale = drafts.filter((m: any) => daysSince(m.created_at ?? "") >= 14);
  const scheduled = allMaterials.filter((m: any) => m.status === "scheduled");

  const displayed = tab.startsWith("Stale") ? stale : tab.startsWith("Sched") ? scheduled : drafts;

  const ACCENT: Record<number, AccentName> = { 0: "peach", 1: "sky", 2: "lemon" };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Drafts</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>{drafts.length} total · {stale.length} stale</Txt>
        <View style={{ marginTop: 16 }}>
          <ChipRow>
            {[`All ${drafts.length}`, `Stale ${stale.length}`, `Scheduled ${scheduled.length}`].map((t) => (
              <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
            ))}
          </ChipRow>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {stale.length > 0 && (
            <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Icon name="clock" size={19} color={palette.accents.lemon.fg} />
              <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
                {stale.length} draft{stale.length > 1 ? "s are" : " is"} over 14 days old. Publish or they move to trash (recoverable).
              </Txt>
            </View>
          )}

          {displayed.length === 0 && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>No drafts here.</Txt>
          )}

          <View style={{ gap: 11 }}>
            {displayed.map((m: any, i: number) => {
              const age = daysSince(m.created_at ?? "");
              const isStale = age >= 14;
              const accent: AccentName = ACCENT[i % 3];
              return (
                <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <TinyIcon icon="file" accent={accent} size={42} iconSize={21} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Txt numberOfLines={1} style={{ flex: 1, fontSize: 14, ...font(700), color: palette.text }}>{m.title}</Txt>
                      {isStale && <StatusPill label="Stale" accent="lemon" />}
                    </View>
                    <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>
                      {age === 0 ? "Today" : `${age} day${age > 1 ? "s" : ""} ago`} · Week {m.week}
                    </Txt>
                  </View>
                  <Icon name="chev" size={18} color={palette.textFaint} />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
