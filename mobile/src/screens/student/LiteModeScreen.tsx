import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

/** Student · Lite mode (design 72): low-end device performance + scan progress. */
export default function LiteModeScreen() {
  const { palette } = useTheme();
  const [lite, setLite] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Performance</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Lite toggle */}
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="sun" accent="lemon" size={44} iconSize={22} />
            <View>
              <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text }}>Lite mode</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>Skip thumbnails · smaller batches</Txt>
            </View>
          </View>
          <Toggle value={lite} onValueChange={setLite} label="Lite mode" />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>SCANNING 142 FILES</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Hashing batch 4 of 9</Txt>
            <Txt style={{ fontSize: 14, ...font(800), color: palette.text }}>63%</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: "#EAECEF", overflow: "hidden" }}>
            <View style={{ height: 10, borderRadius: 5, width: "63%", backgroundColor: palette.primary }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 }}>
            <Icon name="clock" size={16} color={palette.textFaint} />
            <Txt style={{ fontSize: 12, ...font(500), color: palette.textMuted }}>Runs in the background — keep using the app.</Txt>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Button title="Cancel scan" variant="ghost" onPress={() => Alert.alert("Cancel scan", "Stop the current scan?")} />
        </View>

        <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={17} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(600), color: palette.text }}>
            Hashing streams on a worker thread, so even older phones stay responsive.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
