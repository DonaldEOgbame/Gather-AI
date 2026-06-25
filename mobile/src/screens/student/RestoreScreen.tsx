import React, { useState } from "react";
import { Alert, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Student · Restore on new device (design 68): official vs personal data split. */
export default function RestoreScreen({ navigation }: RootScreen<"Restore">) {
  const { palette } = useTheme();
  const [wifi, setWifi] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}>
        <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: palette.accents.sky.bg, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon name="cloud" size={40} color={palette.accents.sky.fg} />
        </View>
        <Txt variant="display" style={{ textAlign: "center" }}>Welcome back, Ada</Txt>
        <Txt variant="muted" style={{ fontSize: 14.5, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
          Two separate things happen on a new device.
        </Txt>

        {/* Official */}
        <View style={{ width: "100%", backgroundColor: palette.accents.mint.bg, borderRadius: 16, padding: 14, marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={20} color={palette.accents.mint.fg} width={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, ...font(800), color: palette.text }}>Official course files</Txt>
            <Txt style={{ fontSize: 12, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Re-downloaded automatically — done</Txt>
          </View>
        </View>

        {/* Personal */}
        <View style={{ width: "100%", backgroundColor: palette.card, borderRadius: 18, padding: 18, marginTop: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TinyIcon icon="folder" accent="lilac" size={46} iconSize={23} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>Personal library</Txt>
              <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 2 }}>820 MB · 312 files · opt-in</Txt>
            </View>
            <StatusPill label="Opt-in" accent="lilac" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text }}>Wi-Fi only</Txt>
            <Toggle value={wifi} onValueChange={setWifi} label="Wi-Fi only" />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
        <Button title="Restore 820 MB" onPress={() => { Alert.alert("Restoring", "Decrypting personal library."); navigation.goBack(); }} />
        <Txt variant="faint" onPress={() => navigation.goBack()} style={{ textAlign: "center", fontSize: 14, ...font(700), marginTop: 14 }}>
          Skip — keep this device fresh
        </Txt>
      </View>
    </View>
  );
}
