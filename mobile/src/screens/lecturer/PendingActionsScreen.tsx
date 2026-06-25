import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, InfoCard } from "@/components/ui";
import type { IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

type State = "queued" | "synced" | "conflict";
const ACTIONS: [string, string, State, AccentName][] = [
  ["Publish Week 10 — Scheduling.pdf", "CSC401", "queued", "lemon"],
  ["Roster edit · +3 students", "CSC305", "queued", "lemon"],
  ["Announcement · “Midterm moved”", "CSC401", "synced", "mint"],
  ["Publish Week 9 quiz", "CSC305", "conflict", "peach"],
];
const ICON: Record<State, IconName> = { queued: "clock", synced: "check", conflict: "shield" };
const PILL: Record<State, string> = { queued: "Queued", synced: "Synced", conflict: "Conflict" };

/** Lecturer · Offline action queue (design 102): queued changes that sync on reconnect. */
export default function PendingActionsScreen(_: RootScreen<"PendingActions">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Pending actions</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Will sync when you reconnect</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <InfoCard accent="lemon" icon="cloud" text="You’re offline. 4 changes are queued and will retry automatically on reconnect." />

        <View style={{ marginTop: 18, gap: 10 }}>
          {ACTIONS.map(([title, code, state, accent]) => (
            <View key={title} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TinyIcon icon={ICON[state]} accent={accent} size={40} iconSize={20} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{title}</Txt>
                  <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{code}</Txt>
                </View>
                <StatusPill label={PILL[state]} accent={accent} />
              </View>
              {state === "conflict" && (
                <View style={{ marginTop: 11, backgroundColor: "#FBE3E0", borderRadius: 10, padding: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Txt style={{ fontSize: 11.5, ...font(600), color: palette.danger }}>Published elsewhere meanwhile</Txt>
                  <Pressable onPress={() => Alert.alert("Resolve conflict", "Keep your version or the one published on another device?")} hitSlop={6}>
                    <Txt style={{ fontSize: 12, ...font(800), color: palette.text }}>Resolve</Txt>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <Button title="Retry all now" variant="ghost" onPress={() => Alert.alert("Retrying", "Attempting to sync all queued changes…")} />
      </View>
    </View>
  );
}
