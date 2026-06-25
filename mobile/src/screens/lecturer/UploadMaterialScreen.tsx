import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Upload material (design 57): file check + placement before publish. */
export default function UploadMaterialScreen({ route, navigation }: RootScreen<"UploadMaterial">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Upload material</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Picked file */}
        <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <TinyIcon icon="file" accent="peach" size={44} iconSize={22} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Lecture 12 — Recursion.pdf</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>2.4 MB · PDF</Txt>
          </View>
          <Icon name="check" size={20} color={palette.accents.mint.fg} width={2.4} />
        </View>

        <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
          <Txt style={{ fontSize: 12.5, ...font(600), color: palette.text }}>PDF · 2.4 MB — within 50 MB limit</Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>COURSE STORAGE</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{code}</Txt>
            <Txt variant="faint" style={{ fontSize: 12.5, ...font(700) }}>1.2 / 2 GB</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: "#EAECEF", overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, width: "60%", backgroundColor: palette.primary }} />
          </View>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PLACEMENT</Txt>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: palette.accents.mint.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Txt style={{ fontSize: 11, ...font(700), color: palette.accents.mint.fg }}>Week</Txt>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>12</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: palette.accents.peach.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Txt style={{ fontSize: 11, ...font(700), color: palette.accents.peach.fg }}>Sharing</Txt>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>Open</Txt>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
          <View style={{ flex: 1.5 }}>
            <Button title="Publish now" onPress={() => { Alert.alert("Published", "Material is live."); navigation.goBack(); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Save draft" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
