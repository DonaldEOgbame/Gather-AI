import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, SettingsGroup, SettingItem, Toggle, StatusPill, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { usePrefs } from "@/stores/prefs";
import { useAuth } from "@/stores/auth";
import { authApi } from "@/api/endpoints";
import { currentStatus, biometricAvailable, type PermissionStatus } from "@/services/permissions";

/** Student · Privacy & data (design 35). */
export default function PrivacyDataScreen() {
  const { palette } = useTheme();
  const prefs = usePrefs();
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);
  const [perm, setPerm] = useState<PermissionStatus | null>(null);
  const [bioOk, setBioOk] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    currentStatus().then(setPerm).catch(() => {});
    biometricAvailable().then(setBioOk);
  }, []);

  const toggleConsent = async (v: boolean) => {
    try {
      await authApi.patchMe({ photo_consent: v });
      await refreshUser();
    } catch (e: any) {
      Alert.alert("Couldn't update", e?.message ?? "Try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Privacy & data</Txt>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Icon name="shield" size={22} color={palette.accents.mint.fg} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>What leaves your device</Txt>
            <Txt style={{ fontSize: 12.5, ...font(500), color: palette.text, marginTop: 4, lineHeight: 18 }}>
              Organizing happens on your phone. Files go to the server only to make AI summaries, then aren't kept.
            </Txt>
          </View>
        </View>

        <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>PERMISSIONS</Txt>
        <SettingsGroup>
          <SettingItem
            first
            icon="folder"
            accent="sky"
            title="Storage access"
            sub="Downloads, Documents"
            right={<StatusPill label={perm?.storage === "granted" ? "Granted" : perm?.storage === "import-only" ? "Import-only" : "Off"} accent={perm?.storage === "granted" ? "mint" : "lemon"} />}
          />
          <SettingItem
            icon="bell"
            accent="peach"
            title="Notifications"
            right={<StatusPill label={perm?.notifications === "granted" ? "On" : "Off"} accent={perm?.notifications === "granted" ? "mint" : "lemon"} />}
          />
          <SettingItem
            icon="lock"
            accent="lilac"
            title="Biometric app-lock"
            sub={bioOk ? "Fingerprint to open" : "No biometrics enrolled"}
            right={<Toggle value={prefs.biometricLock} onValueChange={(v) => prefs.set({ biometricLock: v })} label="Biometric app-lock" />}
          />
          <SettingItem
            icon="camera"
            accent="mint"
            title="Find academic photos"
            sub="Scan camera roll for lecture snaps"
            right={<Toggle value={!!user?.photo_consent} onValueChange={toggleConsent} label="Photo consent" />}
          />
        </SettingsGroup>

        <View style={{ marginTop: 18 }}>
          <SettingsGroup>
            <SettingItem
              first
              icon="share"
              accent="mint"
              title="Export my data"
              right={<Icon name="chev" size={18} color={palette.textFaint} />}
              onPress={() => Alert.alert("Export requested", "We'll prepare your data export and email you a download link.")}
            />
            <SettingItem
              icon="grid"
              accent="lemon"
              title="Usage analytics"
              sub="Help improve Gather"
              right={<Toggle value={analytics} onValueChange={setAnalytics} label="Usage analytics" />}
            />
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 18 }}>
          <InfoCard accent="sky" icon="sparkle" text="Personal files never sync silently — only the opt-in encrypted backup leaves your device." />
        </View>
      </ScrollView>
    </View>
  );
}
