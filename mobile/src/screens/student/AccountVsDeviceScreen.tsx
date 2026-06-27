import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { IconName } from "@/components/Icon";
import type { RootScreen } from "@/navigation/types";

const ACCOUNT: [IconName, AccentName, string][] = [
  ["bell", "sky", "Notification preferences"],
  ["grid", "lemon", "Organization preferences"],
  ["stack", "lilac", "Collections & bookmarks"],
];
const DEVICE: [IconName, AccentName, string][] = [
  ["lock", "lilac", "Biometric app-lock"],
  ["folder", "mint", "Scan locations"],
  ["cloud", "sky", "Wi-Fi-only downloads"],
  ["sun", "lemon", "Lite mode"],
  ["download", "peach", "Default scan action"],
];

/** Settings · Account vs device split (design 95): what syncs vs what stays local. */
export default function AccountVsDeviceScreen(_: RootScreen<"AccountVsDevice">) {
  const { palette, scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 18 }}>Settings</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon name="cloud" size={16} color={palette.accents.sky.fg} />
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>ACCOUNT — SYNCS EVERYWHERE</Txt>
        </View>
        <Group rows={ACCOUNT} badge="Synced" badgeIcon="cloud" badgeColor={palette.accents.sky.fg} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 8 }}>
          <Icon name="lock" size={16} color={palette.textFaint} />
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>THIS DEVICE ONLY</Txt>
        </View>
        <Group rows={DEVICE} badge="Local" badgeIcon="lock" badgeColor={palette.textFaint} />

        <View style={{ marginTop: 20 }}>
          <InfoCard accent="mint" icon="sparkle" text="A scan-location or biometric setting following you to another phone would be a bug — these stay put." />
        </View>
      </ScrollView>
    </View>
  );
}

function Group({ rows, badge, badgeIcon, badgeColor }: { rows: [IconName, AccentName, string][]; badge: string; badgeIcon: IconName; badgeColor: string }) {
  const { palette, scheme } = useTheme();
  return (
    <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
      {rows.map(([icon, accent, label], i) => (
        <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 13, borderTopColor: palette.border, borderTopWidth: i ? 1 : 0 }}>
          <TinyIcon icon={icon} accent={accent} size={38} iconSize={19} />
          <Txt style={{ flex: 1, fontSize: 14.5, ...font(700), color: palette.text }}>{label}</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name={badgeIcon} size={13} color={badgeColor} />
            <Txt style={{ fontSize: 11.5, ...font(700), color: badgeColor }}>{badge}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}
