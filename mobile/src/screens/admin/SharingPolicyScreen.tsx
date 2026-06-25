import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, Segmented, SettingsGroup, SettingItem, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

/** Admin · Sharing policy (design 49): the institution sharing ceiling. */
export default function SharingPolicyScreen() {
  const { palette } = useTheme();
  const [ceiling, setCeiling] = useState<"on" | "app" | "off">("on");
  const [watermark, setWatermark] = useState(false);
  const [block, setBlock] = useState(true);
  const [exportAllowed, setExportAllowed] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Sharing policy</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="shield" size={20} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(500), color: palette.text }}>
            This sets the institution ceiling. Lecturers can make files more restricted, never less.
          </Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>EXTERNAL SHARING CEILING</Txt>
        <Segmented value={ceiling} onChange={setCeiling} options={[{ key: "on", label: "On" }, { key: "app", label: "App-only" }, { key: "off", label: "Off" }]} />

        <View style={{ marginTop: 18 }}>
          <SettingsGroup>
            <SettingItem first icon="shield" accent="lilac" title="Force watermark" sub="Name + matric on restricted viewers" right={<Toggle value={watermark} onValueChange={setWatermark} label="Force watermark" />} />
            <SettingItem icon="eye" accent="peach" title="Block screenshots" sub="Android enforced · iOS detect-only" right={<Toggle value={block} onValueChange={setBlock} label="Block screenshots" />} />
            <SettingItem icon="download" accent="sky" title="Allow export to device" sub="Off for App-only / View-only files" right={<Toggle value={exportAllowed} onValueChange={setExportAllowed} label="Allow export" />} />
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 18, backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={18} color={palette.textFaint} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(500), color: palette.textMuted }}>
            Honest limit: this deters casual resharing, not a determined user. Watermarking is the real lever.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
