import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, InfoCard } from "@/components/ui";
import type { IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "pending_action_queue";

type State = "queued" | "synced" | "conflict";
interface PendingAction {
  id: string;
  title: string;
  code: string;
  state: State;
  accent: AccentName;
}

const ICON: Record<State, IconName> = { queued: "clock", synced: "check", conflict: "shield" };
const PILL: Record<State, string> = { queued: "Queued", synced: "Synced", conflict: "Conflict" };

/** Lecturer · Offline action queue (design 102): queued changes that sync on reconnect. */
export default function PendingActionsScreen(_: RootScreen<"PendingActions">) {
  const { palette, scheme } = useTheme();
  const [actions, setActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(QUEUE_KEY).then((raw) => {
      if (raw) {
        try { setActions(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
  }, []);

  const retryAll = async () => {
    const updated = actions.map((a) => ({ ...a, state: "synced" as State, accent: "mint" as AccentName }));
    setActions(updated);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    Alert.alert("Synced", "All queued changes have been applied.");
  };

  const resolve = async (id: string) => {
    const updated = actions.map((a) => a.id === id ? { ...a, state: "synced" as State, accent: "mint" as AccentName } : a);
    setActions(updated);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Pending actions</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Will sync when you reconnect</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {actions.length === 0 ? (
          <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>No pending actions — all synced.</Txt>
        ) : (
          <>
            <InfoCard accent="lemon" icon="cloud" text={`You're offline. ${actions.length} changes are queued and will retry automatically on reconnect.`} />
            <View style={{ marginTop: 18, gap: 10 }}>
              {actions.map((a) => (
                <View key={a.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TinyIcon icon={ICON[a.state]} accent={a.accent} size={40} iconSize={20} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{a.title}</Txt>
                      <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{a.code}</Txt>
                    </View>
                    <StatusPill label={PILL[a.state]} accent={a.accent} />
                  </View>
                  {a.state === "conflict" && (
                    <View style={{ marginTop: 11, backgroundColor: palette.dangerSoft, borderRadius: 10, padding: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Txt style={{ fontSize: 11.5, ...font(600), color: palette.danger }}>Published elsewhere meanwhile</Txt>
                      <Pressable onPress={() => resolve(a.id)} hitSlop={6}>
                        <Txt style={{ fontSize: 12, ...font(800), color: palette.text }}>Resolve</Txt>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {actions.length > 0 && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
          <Button title="Retry all now" variant="ghost" onPress={retryAll} />
        </View>
      )}
    </View>
  );
}
