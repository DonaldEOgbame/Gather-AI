import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const FILES: [string, string, AccentName][] = [
  ["Whiteboard_photo_1.jpg", "Contains “NPV = Cash Flow”", "peach"],
  ["Finance_cheatsheet.pdf", "Topic · discounting", "sky"],
  ["Prof_Johnson_rates.txt", "Topic · interest rates", "mint"],
];
const COURSES: [string, string, AccentName][] = [
  ["BIO202", "Cell Biology", "mint"],
  ["FIN201", "Intro to Finance", "sky"],
];

/** Workflow · Smart cluster → link to course (design 29). */
export default function SmartClusterScreen({ route, navigation }: RootScreen<"SmartCluster">) {
  const { palette } = useTheme();
  const name = route.params?.name ?? "Uncategorized — Finance";
  const [pick, setPick] = useState(1);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        <TinyIcon icon="folder" accent="lemon" size={52} iconSize={26} />
        <Txt variant="title" style={{ fontSize: 21, marginTop: 12 }}>{name}</Txt>
        <Txt variant="muted" style={{ fontSize: 13, marginTop: 3 }}>Auto-grouped · not matched to a course</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
          {["Finance", "Discount rate", "NPV"].map((k) => (
            <View key={k} style={{ backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>{k}</Txt>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18, gap: 10 }}>
          {FILES.map(([file, why, accent]) => (
            <View key={file} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon="file" accent={accent} size={44} iconSize={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{file}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 3 }}>{why}</Txt>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Link-to-course sheet */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, shadowColor: "#141928", shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: -10 }, elevation: 12 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 14 }} />
        <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>Link to a course</Txt>
        <Txt variant="faint" style={{ fontSize: 12.5, ...font(500), marginTop: 3, marginBottom: 12 }}>Teaches Gather to auto-sort these next time.</Txt>
        {COURSES.map(([code, title, accent], i) => {
          const sel = pick === i;
          return (
            <Pressable key={code} onPress={() => setPick(i)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: sel ? palette.field : "transparent" }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{code.slice(0, 3)}</Txt>
              </View>
              <Txt style={{ flex: 1, fontSize: 14, ...font(700), color: palette.text }}>{code} · {title}</Txt>
              {sel ? <Icon name="check" size={20} color={palette.text} width={2.4} /> : <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.border }} />}
            </Pressable>
          );
        })}
        <View style={{ marginTop: 12 }}>
          <Button title="Link & move 3 files" onPress={() => { Alert.alert("Linked", "Files moved and the matcher learned this mapping."); navigation.goBack(); }} />
        </View>
      </View>
    </View>
  );
}
