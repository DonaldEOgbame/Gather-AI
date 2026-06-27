import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { announcementsApi } from "@/api/endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RootScreen } from "@/navigation/types";

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return `${Math.floor(secs / 604800)}w ago`;
}

/** Student · Announcements feed (design 61): pinned + earlier course notices. */
export default function AnnouncementsFeedScreen({ route }: RootScreen<"AnnouncementsFeed">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements", offeringId],
    queryFn: () => announcementsApi.list(offeringId),
    enabled: !!offeringId,
  });

  async function markRead(id: string) {
    try {
      await announcementsApi.markRead(id);
      qc.invalidateQueries({ queryKey: ["announcements", offeringId] });
    } catch {
      /* non-critical */
    }
  }

  const pinned = (announcements ?? []).filter((a: any) => a.pinned);
  const earlier = (announcements ?? []).filter((a: any) => !a.pinned);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4, fontSize: 22 }}>{code}</Txt>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (announcements ?? []).length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="muted">No announcements yet.</Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {pinned.map((a: any) => (
            <Pressable key={a.id} onPress={() => markRead(a.id)}>
              <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 18, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon name="bookmark" size={16} color={palette.accents.lemon.fg} />
                  <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.lemon.fg, letterSpacing: 0.5 }}>PINNED</Txt>
                </View>
                <Txt style={{ fontSize: 16, ...font(800), color: palette.text }}>{a.title}</Txt>
                <Txt style={{ fontSize: 13, lineHeight: 20, ...font(500), color: palette.text, marginTop: 6 }}>{a.body}</Txt>
                <Txt style={{ fontSize: 11.5, ...font(700), color: palette.accents.lemon.fg, marginTop: 10 }}>{timeAgo(a.created_at)}</Txt>
              </View>
            </Pressable>
          ))}

          {earlier.length > 0 && (
            <>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: pinned.length ? 8 : 0, marginBottom: 8 }}>EARLIER</Txt>
              <View style={{ gap: 11 }}>
                {earlier.map((a: any) => (
                  <Pressable key={a.id} onPress={() => markRead(a.id)}>
                    <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 15, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                      <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{a.title}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 4 }}>{timeAgo(a.created_at)}</Txt>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
