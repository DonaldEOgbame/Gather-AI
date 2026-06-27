import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, Card, SettingsGroup, SettingItem, Toggle, Segmented } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { usePrefs } from "@/stores/prefs";

/** Student · Organization preferences (design 34). Wired to the prefs store
 * that the on-device scanner/organizer reads. */
export default function OrganizationScreen() {
  const { palette } = useTheme();
  const prefs = usePrefs();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Organization</Txt>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Smart renamer + naming template */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <Icon name="sparkle" size={18} color={palette.accents.lilac.fg} />
              <Txt variant="h2">Smart renamer</Txt>
            </View>
            <Toggle value={prefs.smartRenamer} onValueChange={(v) => prefs.set({ smartRenamer: v })} label="Smart renamer" />
          </View>

          <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 14, marginBottom: 6 }}>NAMING TEMPLATE</Txt>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {["{COURSE}", "{WEEK}", "{TOPIC}"].map((t) => (
              <View key={t} style={{ backgroundColor: palette.accents.lilac.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Txt style={{ fontSize: 12, ...font(700), color: palette.accents.lilac.fg }}>{t}</Txt>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 10, backgroundColor: palette.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="file" size={16} color={palette.textFaint} />
            <Txt style={{ fontSize: 12.5, ...font(600), color: palette.text }}>CSC101_Week12_Recursion.pdf</Txt>
          </View>
        </Card>

        <View style={{ marginTop: 14 }}>
          <SettingsGroup>
            <SettingItem
              first
              icon="grid"
              accent="mint"
              title="Smart clustering"
              sub="Group unmatched files by topic"
              right={<Toggle value={prefs.smartClustering} onValueChange={(v) => prefs.set({ smartClustering: v })} label="Smart clustering" />}
            />
            <SettingItem
              icon="book"
              accent="sky"
              title="Auto-apply learned links"
              sub='Remember "Link to course" choices'
              right={<Toggle value={prefs.autoApplyMappings} onValueChange={(v) => prefs.set({ autoApplyMappings: v })} label="Auto-apply learned links" />}
            />
          </SettingsGroup>
        </View>

        <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 20, marginBottom: 8 }}>DUPLICATE HANDLING</Txt>
        <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>When a file repeats</Txt>
            <Txt variant="muted" style={{ fontSize: 11.5, marginTop: 1 }}>One copy, many folders</Txt>
          </View>
          <View style={{ width: 150 }}>
            <Segmented
              value={prefs.duplicateHandling}
              onChange={(k) => prefs.set({ duplicateHandling: k })}
              options={[{ key: "alias", label: "Alias" }, { key: "keep-both", label: "Keep both" }]}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
