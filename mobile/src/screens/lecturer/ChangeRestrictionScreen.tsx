import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const LEVELS: [string, string, AccentName][] = [
  ["Open", "Download & keep anywhere", "mint"],
  ["App-only", "Opens only inside Gather", "sky"],
  ["View-only", "No download, watermarked", "lilac"],
];

/** Lecturer · Retroactive restriction change (design 104): tighten future downloads. */
export default function ChangeRestrictionScreen({ route, navigation }: RootScreen<"ChangeRestriction">) {
  const { palette } = useTheme();
  const fileName = route.params?.fileName ?? "Lecture 8 — Sorting.pdf";
  const [sel, setSel] = useState(1);
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>Change restriction level</Txt>
        <Txt style={{ fontSize: 13, ...font(600), color: palette.textMuted, marginTop: 4 }}>{fileName}</Txt>

        <View style={{ marginTop: 16, gap: 10 }}>
          {LEVELS.map(([title, sub, accent], i) => {
            const on = sel === i;
            return (
              <Pressable key={title} onPress={() => setSel(i)} style={{ backgroundColor: on ? palette.field : palette.card, borderWidth: 1.5, borderColor: on ? palette.text : palette.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TinyIcon icon="lock" accent={accent} size={40} iconSize={20} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>{sub}</Txt>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? palette.text : "transparent", borderWidth: on ? 0 : 2, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                  {on ? <Icon name="check" size={13} color="#fff" width={2.6} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="lemon" icon="shield" text="Tightening applies to future downloads only. Copies students already exported as Open can’t be recalled." />
        </View>
        <View style={{ marginTop: 16 }}>
          <Button title="Apply to future downloads" onPress={() => { Alert.alert("Restriction updated", `${fileName} is now ${LEVELS[sel][0]}.`); navigation.goBack(); }} />
        </View>
      </View>
    </View>
  );
}
