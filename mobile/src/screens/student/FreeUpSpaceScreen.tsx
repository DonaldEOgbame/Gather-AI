import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const EVICTABLE: [string, string][] = [
  ["CSC201 · Week 1–4", "420 MB · last opened 5 mo"],
  ["PHY110 · all weeks", "380 MB · last opened 4 mo"],
];

/** Settings · Storage auto-eviction (design 106): free space by evicting official files. */
export default function FreeUpSpaceScreen({ navigation }: RootScreen<"FreeUpSpace">) {
  const { palette } = useTheme();
  const [picked, setPicked] = useState<boolean[]>(EVICTABLE.map(() => true));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.text, borderRadius: 18, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 15, ...font(800), color: "#fff" }}>Device almost full</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: "rgba(255,255,255,0.6)" }}>1.2 GB free</Txt>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 12, flexDirection: "row", overflow: "hidden" }}>
            <View style={{ width: "62%", backgroundColor: palette.accents.sky.fg }} />
            <View style={{ width: "26%", backgroundColor: palette.accents.mint.fg }} />
          </View>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 11 }}>
            <Legend color={palette.accents.sky.fg} label="Official 5.1 GB" />
            <Legend color={palette.accents.mint.fg} label="Personal 2.1 GB" />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="mint" icon="shield" text="We can free space by evicting re-downloadable official files (oldest first). Your personal files are never touched." />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>SAFE TO EVICT · RE-DOWNLOADABLE</Txt>
        <View style={{ gap: 8 }}>
          {EVICTABLE.map(([title, sub], i) => (
            <Pressable key={title} onPress={() => setPicked((p) => p.map((v, j) => (j === i ? !v : v)))} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="cloud" accent="sky" size={38} iconSize={19} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{title}</Txt>
                <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{sub}</Txt>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: picked[i] ? palette.text : palette.border, backgroundColor: picked[i] ? palette.text : "transparent", alignItems: "center", justifyContent: "center" }}>
                {picked[i] ? <Icon name="check" size={13} color="#fff" width={2.6} /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <Button title="Free up 800 MB" onPress={() => { Alert.alert("Space freed", "Evicted files can be re-downloaded anytime."); navigation.goBack(); }} />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
      <Txt style={{ fontSize: 11.5, ...font(600), color: "rgba(255,255,255,0.7)" }}>{label}</Txt>
    </View>
  );
}
