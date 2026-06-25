import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, SettingsGroup, SettingItem } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { IconName } from "@/components/Icon";

const SYNCED: [IconName, AccentName, string][] = [
  ["bookmark", "mint", "Bookmarks"],
  ["check", "sky", "Read state"],
  ["book", "lemon", "Enrolled courses"],
  ["stack", "lilac", "Collections"],
  ["gear", "peach", "Settings"],
];
const LOCAL: [IconName, string][] = [
  ["folder", "Scanned personal files"],
  ["grid", "Smart clusters"],
];

/** Student · Synced across devices (design 69): what syncs vs what's local. */
export default function SyncInfoScreen() {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Sync</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>SYNCED EVERYWHERE</Txt>
        <SettingsGroup>
          {SYNCED.map(([icon, accent, title], i) => (
            <SettingItem key={title} first={i === 0} icon={icon} accent={accent} title={title} right={<Icon name="check" size={18} color={palette.accents.mint.fg} width={2.4} />} />
          ))}
        </SettingsGroup>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>LOCAL TO THIS DEVICE</Txt>
        <SettingsGroup>
          {LOCAL.map(([icon, title], i) => (
            <SettingItem
              key={title}
              first={i === 0}
              icon={icon}
              accent="peach"
              title={title}
              right={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Icon name="lock" size={14} color={palette.textFaint} />
                  <Txt variant="faint" style={{ fontSize: 12, ...font(700) }}>Local</Txt>
                </View>
              }
            />
          ))}
        </SettingsGroup>

        <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={17} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(600), color: palette.text }}>
            Personal files travel only via the opt-in backup — never silent sync. No more "where did my file go?"
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
