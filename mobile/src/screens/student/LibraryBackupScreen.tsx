import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

const STATUS: [string, string, boolean][] = [
  ["Last backup", "Never", true],
  ["Size", "820 MB ready", false],
  ["Network", "Wi-Fi only", false],
];

/** Student · Personal library backup (design 67): opt-in zero-knowledge backup. */
export default function LibraryBackupScreen() {
  const { palette } = useTheme();
  const [on, setOn] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Personal library backup</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Toggle card */}
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="cloud" accent="sky" size={44} iconSize={22} />
            <View>
              <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text }}>Cloud backup</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{on ? "On" : "Off by default"}</Txt>
            </View>
          </View>
          <Toggle value={on} onValueChange={setOn} label="Cloud backup" />
        </View>

        <View style={{ marginTop: 14, backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="shield" size={20} color={palette.accents.mint.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 19, ...font(500), color: palette.text }}>
            Zero-knowledge: encrypted on your phone before upload. We store ciphertext only — no one else can read it.
          </Txt>
        </View>

        {!on && (
          <View style={{ marginTop: 14, backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
            <Icon name="bell" size={20} color={palette.accents.lemon.fg} />
            <Txt style={{ flex: 1, fontSize: 13, lineHeight: 19, ...font(700), color: palette.text }}>
              Backup is off — your organized personal files live only on this phone and aren't backed up.
            </Txt>
          </View>
        )}

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>STATUS</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          {STATUS.map(([label, val, danger], i) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: "#F1F2F4" }}>
              <Txt style={{ fontSize: 14, ...font(500), color: palette.textMuted }}>{label}</Txt>
              <Txt style={{ fontSize: 14, ...font(700), color: danger ? palette.danger : palette.text }}>{val}</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Back up now" disabled={!on} onPress={() => Alert.alert("Backing up", "Encrypting & uploading 820 MB on Wi-Fi.")} />
        </View>
      </ScrollView>
    </View>
  );
}
