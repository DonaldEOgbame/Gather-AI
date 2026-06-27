import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { authApi } from "@/api/endpoints";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";

const POINTS: [string, string, string, AccentName][] = [
  ["lock", "On-device only", "Detection runs on your phone — no photos leave it", "mint"],
  ["eye", "You review first", "We show what we found before anything moves", "sky"],
  ["shield", "Personal photos protected", "Never moved without your per-batch confirmation", "lilac"],
];

/** Student · Camera-roll consent (design 90): on-device photo detection opt-in. */
export default function PhotoConsentScreen({ navigation }: RootScreen<"PhotoConsent">) {
  const { palette } = useTheme();
  const refreshUser = useAuth((s) => s.refreshUser);
  const [busy, setBusy] = useState(false);

  async function handleAllow() {
    setBusy(true);
    try {
      await authApi.patchMe({ photo_consent: true });
      await refreshUser();
      navigation.replace("ReviewPhotos");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save consent. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    try {
      await authApi.patchMe({ photo_consent: false });
      await refreshUser();
    } catch { /* non-critical */ }
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.card }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 26, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: palette.accents.lilac.bg, alignItems: "center", justifyContent: "center", marginTop: 24 }}>
          <Icon name="camera" size={34} color={palette.accents.lilac.fg} />
        </View>
        <Txt style={{ fontSize: 25, ...font(800), color: palette.text, letterSpacing: -0.4, marginTop: 22, lineHeight: 30 }}>
          Find your academic photos
        </Txt>
        <Txt variant="muted" style={{ fontSize: 14.5, ...font(500), marginTop: 10, lineHeight: 22 }}>
          We'll look at photos on this phone to find lecture snaps and whiteboard shots. Nothing is uploaded.
        </Txt>

        <View style={{ marginTop: 22, gap: 12 }}>
          {POINTS.map(([icon, title, sub, accent]) => (
            <View key={title} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <TinyIcon icon={icon as any} accent={accent} size={42} iconSize={21} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
                <Txt variant="faint" style={{ fontSize: 12.5, ...font(500), marginTop: 2, lineHeight: 17 }}>{sub}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />
        <Button title="Allow & scan photos" loading={busy} onPress={handleAllow} />
        <Pressable onPress={handleDecline} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 14.5, ...font(700) }}>Not now</Txt>
        </Pressable>
      </ScrollView>
    </View>
  );
}
