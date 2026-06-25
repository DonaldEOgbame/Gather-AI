import React from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Preview as student (design 94): see a draft exactly as students will. */
export default function PreviewAsStudentScreen({ navigation }: RootScreen<"PreviewAsStudent">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Preview banner */}
      <View style={{ backgroundColor: palette.accents.lilac.fg, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Icon name="eye" size={17} color="#fff" />
        <Txt style={{ flex: 1, fontSize: 12.5, ...font(700), color: "#fff" }}>Preview — exactly what students see</Txt>
        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
          <Txt style={{ fontSize: 11, ...font(800), color: "#fff" }}>Draft</Txt>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>CSC401 · Software Engineering</Txt>
        <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 2 }}>Week 10 · Scheduling</Txt>

        <View style={{ marginTop: 16, backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="file" accent="peach" size={46} iconSize={23} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt numberOfLines={1} style={{ fontSize: 14, ...font(800), color: palette.text }}>Lecture 10 — Scheduling.pdf</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>2.1 MB · 48 slides</Txt>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <StatusPill label="Week 10" accent="sky" />
            <StatusPill label="App-only" accent="lemon" />
            <StatusPill label="Position 1" accent="mint" />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <InfoCard accent="mint" icon="check" text="Right week, right restriction, top of the list. Catch wrong-week / wrong-restriction before publish." />
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1.5 }}>
          <Button title="Looks right · publish" onPress={() => { Alert.alert("Published", "Week 10 is now live for students."); navigation.goBack(); }} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Back to edit</Txt>
        </Pressable>
      </View>
    </View>
  );
}
