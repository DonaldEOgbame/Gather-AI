import React from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Workflow · Save to Gather (design 27): the OS share-sheet target. */
export default function ShareToGatherScreen({ navigation }: RootScreen<"ShareToGather">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 16 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={20} color="#fff" width={1.7} />
          </View>
          <Txt style={{ fontSize: 18, ...font(800), color: palette.text }}>Save to Gather</Txt>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.field, borderRadius: 14, padding: 12 }}>
          <TinyIcon icon="file" accent="peach" size={38} iconSize={19} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>week6_lab_FINAL.pdf</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 1 }}>480 KB · from Gmail</Txt>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 8 }}>
          <Icon name="sparkle" size={16} color={palette.accents.lilac.fg} />
          <Txt style={{ fontSize: 12, ...font(800), color: palette.accents.lilac.fg, letterSpacing: 0.4 }}>GATHER DETECTED</Txt>
          <Txt variant="faint" style={{ fontSize: 11, ...font(700), marginLeft: "auto" }}>94% sure</Txt>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Course", value: "BIO202", accent: "mint" as const, flex: 1.4 },
            { label: "Week", value: "6", accent: "sky" as const, flex: 1 },
          ].map((s) => (
            <Pressable key={s.label} onPress={() => Alert.alert(s.label, "Pick a different value")} style={{ flex: s.flex, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.accents[s.accent].bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 11, ...font(700), color: palette.accents[s.accent].fg }}>{s.label}</Txt>
                <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>{s.value}</Txt>
              </View>
              <Icon name="chev" size={16} color={palette.accents[s.accent].fg} />
            </Pressable>
          ))}
        </View>

        <Txt variant="faint" style={{ fontSize: 12.5, ...font(500), textAlign: "center", marginTop: 14 }}>
          Goes to your Drafts — publish whenever you're ready.
        </Txt>
        <View style={{ marginTop: 16 }}>
          <Button title="Save to drafts" onPress={() => { Alert.alert("Saved", "Added to your Drafts."); navigation.goBack(); }} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 14 }}>
          <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>Open Gather instead</Txt>
        </Pressable>
      </View>
    </View>
  );
}
