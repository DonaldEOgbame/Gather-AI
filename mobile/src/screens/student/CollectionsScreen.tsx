import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const COLLECTIONS: [string, string, AccentName][] = [
  ["Exam Prep", "8 files", "peach"],
  ["Labs", "12 files", "sky"],
  ["Readings", "6 files", "lemon"],
  ["To revise", "4 files", "lilac"],
];

/** Student · Collections (design 71): synced bookmark collections grid. */
export default function CollectionsScreen() {
  const { palette } = useTheme();
  const rows: typeof COLLECTIONS[] = [];
  for (let i = 0; i < COLLECTIONS.length; i += 2) rows.push(COLLECTIONS.slice(i, i + 2));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Collections</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Synced across devices</Txt>
        </View>
        <Pressable onPress={() => Alert.alert("New collection", "Name your collection.")} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={22} color="#fff" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
        {rows.map((pair, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
            {pair.map(([name, count, accent]) => (
              <Pressable key={name} onPress={() => Alert.alert(name, count)} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="bookmark" size={22} color={palette.accents[accent].fg} />
                  </View>
                  <Icon name="cloud" size={16} color={palette.textFaint} />
                </View>
                <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text, marginTop: 14 }}>{name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 3 }}>{count}</Txt>
              </Pressable>
            ))}
            {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
