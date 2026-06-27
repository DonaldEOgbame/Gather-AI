import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, Segmented, TinyIcon, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { materialsApi } from "@/api/endpoints";
import { enqueueAction, isOfflineError } from "@/api/offlineQueue";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Publish sheet (design 21): confirm batch publish or schedule. */
export default function PublishSheetScreen({ route, navigation }: RootScreen<"PublishSheet">) {
  const { palette } = useTheme();
  const user = useAuth((s) => s.user);
  const publishedAs = user ? `${user.title ? `${user.title} ` : ""}${user.full_name}` : "you";
  const ids = route.params?.ids ?? [];
  const code = route.params?.code ?? "CSC101";
  const week = route.params?.week ?? 12;
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    try {
      const releaseAt = when === "schedule" ? new Date(Date.now() + 3600_000).toISOString() : null;
      if (ids.length) await materialsApi.publishBatch(ids, releaseAt);
      navigation.goBack();
      Alert.alert(when === "schedule" ? "Scheduled" : "Published", "Students get a single digest notification per course.");
    } catch (e: any) {
      if (isOfflineError(e)) {
        await enqueueAction(
          when === "schedule" ? `Schedule: ${ids.length} file(s)` : `Publish: ${ids.length} file(s)`,
          `${code} · Week ${week}`
        );
        Alert.alert("Queued", "You're offline. This will publish automatically when you reconnect.");
        navigation.goBack();
      } else {
        Alert.alert("Failed", e?.message ?? "Check permissions");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.35)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 18 }} />
        <Txt variant="h2" style={{ fontSize: 22 }}>Publish {ids.length || 2} material{(ids.length || 2) === 1 ? "" : "s"}</Txt>
        <Txt variant="muted" style={{ marginTop: 3 }}>To {code} · Week {week}</Txt>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.field, borderRadius: 16, padding: 16, marginTop: 20 }}>
          <TinyIcon icon="calendar" accent="sky" />
          <View style={{ flex: 1 }}>
            <Txt variant="faint" style={{ fontSize: 13, ...font(600) }}>Release</Txt>
            <Txt style={{ fontSize: 16, ...font(700), color: palette.text, marginTop: 1 }}>{when === "now" ? "Now" : "In 1 hour"}</Txt>
          </View>
          <View style={{ width: 180 }}>
            <Segmented value={when} onChange={setWhen} options={[{ key: "now", label: "Now" }, { key: "schedule", label: "Schedule" }]} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 16, marginTop: 12 }}>
          <Icon name="bell" size={20} color={palette.accents.mint.fg} />
          <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19, ...font(500), color: palette.text }}>
            Students get a single digest notification per course — not one ping per file.
          </Txt>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
          <Avatar name={user?.full_name ?? "Lecturer"} size={32} />
          <Txt variant="muted" style={{ fontSize: 13.5, ...font(600) }}>Published as {publishedAs}</Txt>
        </View>

        <View style={{ marginTop: 22 }}>
          <Button title={when === "schedule" ? "Schedule release" : "Publish now"} loading={busy} onPress={publish} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 15, ...font(700) }}>Cancel</Txt>
        </Pressable>
      </View>
    </View>
  );
}
