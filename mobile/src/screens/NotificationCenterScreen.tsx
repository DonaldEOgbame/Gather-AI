import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Txt, EmptyState, TinyIcon } from "@/components/ui";
import { useTheme, accentFor, font } from "@/theme";
import { useNotifications } from "@/hooks/queries";
import { notifApi } from "@/api/endpoints";
import { relativeTime } from "@/util/format";

/** In-app notification center (Module 11 · design 15) — full history. */
export default function NotificationCenterScreen() {
  const { data, refetch } = useNotifications();
  const { palette } = useTheme();

  async function markAll() {
    await notifApi.markAllRead();
    refetch();
  }

  const hasUnread = data?.some((n) => !n.read_at);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
        <Txt variant="title" style={{ fontSize: 22 }}>Notifications</Txt>
        {hasUnread && (
          <Pressable onPress={markAll} accessibilityRole="button">
            <Txt style={{ fontSize: 13, ...font(700), color: palette.accents.sky.fg }}>Mark all read</Txt>
          </Pressable>
        )}
      </View>

      {!data?.length ? (
        <EmptyState icon="bell" title="All caught up" body="New material and activity will show up here." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
          {data.map((item) => {
            const unread = !item.read_at;
            return (
              <Pressable
                key={item.id}
                onPress={async () => {
                  if (unread) {
                    await notifApi.markRead(item.id);
                    refetch();
                  }
                }}
                style={{
                  backgroundColor: unread ? palette.card : "transparent",
                  borderRadius: 18,
                  padding: 14,
                  flexDirection: "row",
                  gap: 13,
                  alignItems: "flex-start",
                  borderWidth: unread ? 0 : 1,
                  borderColor: palette.border,
                  shadowColor: "#141928",
                  shadowOpacity: unread ? 0.05 : 0,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: unread ? 1 : 0,
                }}
              >
                <TinyIcon icon="bell" accent={accentFor(item.title)} size={42} iconSize={20} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14.5, lineHeight: 20, color: palette.text }}>
                    <Txt style={{ ...font(800) }}>{item.title}</Txt>
                    {item.body ? <Txt style={{ ...font(500) }}>{`  ${item.body}`}</Txt> : null}
                  </Txt>
                  <Txt variant="faint" style={{ fontSize: 12, marginTop: 4 }}>{relativeTime(item.created_at)}</Txt>
                </View>
                {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accents.sky.fg, marginTop: 6 }} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
