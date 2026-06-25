import React from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Student · Data-cost sheet (design 65): mobile-data warning before download. */
export default function DataCostScreen({ route, navigation }: RootScreen<"DataCost">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "Lecture 12 — Recursion.pdf";
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <TinyIcon icon="download" accent="sky" size={44} iconSize={22} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>PDF · 60 slides</Txt>
          </View>
        </View>

        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <Icon name="cloud" size={22} color={palette.accents.lemon.fg} />
          <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>This uses 4.2 MB on mobile data.</Txt>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button title="Download · 4.2 MB" icon="download" onPress={() => { Alert.alert("Downloading", "Saved offline."); navigation.goBack(); }} />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="Wait for Wi-Fi" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Don't ask on Wi-Fi" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F1F2F4" }}>
          <View>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>THIS SESSION</Txt>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 4 }}>18 MB</Txt>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>THIS MONTH</Txt>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 4 }}>410 MB</Txt>
          </View>
        </View>
      </View>
    </View>
  );
}
