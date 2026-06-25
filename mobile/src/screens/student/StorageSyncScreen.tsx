import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Segmented, SettingsGroup, SettingItem, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

const COURSES: [string, number][] = [
  ["CSC101", 1.2],
  ["PHY110", 0.9],
  ["MTH204", 0.6],
  ["BIO202", 0.4],
];

/** Student · Storage & sync (design 33): app usage + per-course + import rules. */
export default function StorageSyncScreen() {
  const { palette } = useTheme();
  const [onImport, setOnImport] = useState<"copy" | "move">("copy");
  const [autoDl, setAutoDl] = useState(true);
  const max = Math.max(...COURSES.map((c) => c[1]));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Storage & sync</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Ink usage card */}
        <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 26, ...font(800), color: "#fff" }}>4.2 GB</Txt>
            <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.6)" }}>used by Gather</Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" }}>
            <Icon name="sparkle" size={15} color="#fff" />
            <Txt style={{ fontSize: 12.5, ...font(700), color: "#fff" }}>1.4 GB saved by de-dup</Txt>
          </View>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 12 }}>BY COURSE</Txt>
        <View style={{ gap: 12 }}>
          {COURSES.map(([name, gb]) => (
            <View key={name} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Txt style={{ width: 64, fontSize: 13, ...font(700), color: palette.text }}>{name}</Txt>
              <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "#EAECEF", overflow: "hidden" }}>
                <View style={{ height: 8, borderRadius: 4, width: `${(gb / max) * 100}%`, backgroundColor: palette.primary }} />
              </View>
              <Txt style={{ width: 48, textAlign: "right", fontSize: 12, ...font(600), color: palette.textFaint }}>{gb} GB</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 22 }}>
          <SettingsGroup>
            <SettingItem first icon="download" accent="sky" title="On import" sub="Recommended — originals untouched" right={<View style={{ width: 150 }}><Segmented value={onImport} onChange={setOnImport} options={[{ key: "copy", label: "Copy" }, { key: "move", label: "Move" }]} /></View>} />
            <SettingItem icon="cloud" accent="mint" title="Auto-download" sub="Wi-Fi only" right={<Toggle value={autoDl} onValueChange={setAutoDl} label="Auto-download" />} />
            <SettingItem icon="folder" accent="lemon" title="Scan locations" sub="Downloads, Documents" right={<Icon name="chev" size={18} color={palette.textFaint} />} onPress={() => Alert.alert("Scan locations", "Choose folders to scan.")} />
            <SettingItem icon="trash" accent="peach" title="Clear local mirror" right={<Txt style={{ fontSize: 13, ...font(700), color: palette.danger }}>Clear</Txt>} onPress={() => Alert.alert("Clear local mirror?", "Published materials can be re-downloaded.")} />
          </SettingsGroup>
        </View>
      </ScrollView>
    </View>
  );
}
