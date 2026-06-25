import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const PHOTOS: [AccentName, boolean][] = [
  ["mint", true], ["sky", true], ["lemon", false],
  ["lilac", true], ["peach", true], ["mint", true],
  ["sky", false], ["lemon", true], ["lilac", true],
];

/** Student · Review before move (design 91): deselect personal photos before filing. */
export default function ReviewPhotosScreen({ navigation }: RootScreen<"ReviewPhotos">) {
  const { palette } = useTheme();
  const [sel, setSel] = useState<boolean[]>(PHOTOS.map((p) => p[1]));
  const selected = sel.filter(Boolean).length;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <InfoCard accent="lilac" icon="sparkle" text={`Found ${PHOTOS.length} likely-academic images. Deselect anything personal — only checked photos move.`} />

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18, marginHorizontal: -5 }}>
          {PHOTOS.map(([accent], i) => (
            <View key={i} style={{ width: "33.333%", padding: 5 }}>
              <Pressable onPress={() => setSel((s) => s.map((v, j) => (j === i ? !v : v)))} style={{ aspectRatio: 1, borderRadius: 14, backgroundColor: palette.accents[accent].bg, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                <Icon name="image" size={26} color={palette.accents[accent].fg} />
                <View style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 12, backgroundColor: sel[i] ? palette.text : "rgba(255,255,255,0.85)", borderWidth: sel[i] ? 0 : 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                  {sel[i] ? <Icon name="check" size={14} color="#fff" width={2.6} /> : null}
                </View>
                {!sel[i] ? <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.55)" }} /> : null}
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{selected} of {PHOTOS.length} selected</Txt>
          <Txt variant="faint" style={{ fontSize: 12, ...font(600) }}>Personal photos stay put</Txt>
        </View>
        <Button title={`Move ${selected} to library`} onPress={() => { Alert.alert("Moved", `${selected} photos filed into your library.`); navigation.goBack(); }} />
      </View>
    </View>
  );
}
