import React, { useCallback, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Txt, TinyIcon, InfoCard, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { listScanSkips } from "@/db";
import type { PendingAction } from "@/api/offlineQueue";

const QUEUE_KEY = "pending_action_queue";

/** Student · Offline & errors (design 42): failed uploads (queue), unprocessable
 * files (scan skips), and the offline banner — all from real local state. */
export default function OfflineErrorsScreen() {
  const { palette, scheme } = useTheme();
  const [queue, setQueue] = useState<PendingAction[]>([]);
  const [skips, setSkips] = useState<{ id: string; uri: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [raw, s] = await Promise.all([AsyncStorage.getItem(QUEUE_KEY), listScanSkips()]);
      setQueue(raw ? JSON.parse(raw) : []);
      setSkips(s);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const retry = async (id: string) => {
    const updated = queue.map((a) => (a.id === id ? { ...a, state: "synced" as const, accent: "mint" as const } : a));
    setQueue(updated);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  };

  const failed = queue.filter((q) => q.state !== "synced");

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Sync & errors</Txt>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <InfoCard accent="lemon" icon="cloud" text="When you're offline, actions queue here and sync later — nothing is lost." />

          {failed.length > 0 && (
            <>
              <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>QUEUED / FAILED</Txt>
              <View style={{ gap: 10 }}>
                {failed.map((a) => (
                  <View key={a.id} style={row(palette, scheme)}>
                    <TinyIcon icon="upload" accent="peach" size={42} iconSize={20} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{a.title}</Txt>
                      <Txt style={{ fontSize: 12, ...font(700), color: a.state === "conflict" ? palette.danger : palette.textFaint, marginTop: 2 }}>
                        {a.state === "conflict" ? "Conflict — needs resolve" : "Waiting to sync"}
                      </Txt>
                    </View>
                    <Txt onPress={() => retry(a.id)} style={{ fontSize: 13, ...font(700), color: palette.text }}>Retry</Txt>
                  </View>
                ))}
              </View>
            </>
          )}

          {skips.length > 0 && (
            <>
              <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>COULDN'T PROCESS ({skips.length})</Txt>
              <View style={{ gap: 10 }}>
                {skips.map((s) => (
                  <View key={s.id} style={row(palette, scheme)}>
                    <TinyIcon icon="trash" accent="lemon" size={42} iconSize={20} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{s.uri.split("/").pop()}</Txt>
                      <Txt variant="muted" style={{ fontSize: 12, marginTop: 2 }}>{s.reason}</Txt>
                    </View>
                    <Icon name="chev" size={18} color={palette.textFaint} />
                  </View>
                ))}
              </View>
            </>
          )}

          {failed.length === 0 && skips.length === 0 && (
            <View style={{ marginTop: 24, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.border, padding: 24, alignItems: "center", gap: 6 }}>
              <TinyIcon icon="check" accent="mint" size={48} iconSize={24} />
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text, marginTop: 4 }}>Everything is synced</Txt>
              <Txt variant="muted" style={{ fontSize: 12.5 }}>No failed uploads or unreadable files.</Txt>
            </View>
          )}

          {failed.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Button title="Retry all" variant="ghost" onPress={() => failed.forEach((a) => retry(a.id))} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const row = (palette: any, scheme: string) => ({
  backgroundColor: palette.card,
  borderRadius: 16,
  padding: 14,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 12,
  shadowColor: palette.shadow,
  shadowOpacity: 0.05,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: scheme === "dark" ? 0 : 1,
});
