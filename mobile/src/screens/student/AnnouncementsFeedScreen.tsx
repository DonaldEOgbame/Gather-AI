import React from "react";
import { ScrollView, View } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const EARLIER: [string, string][] = [
  ["Week 8 slides are up", "Dr. Hopper · 3 days ago"],
  ["Lab 3 groups posted", "Dr. Hopper · 1 week ago"],
  ["Welcome to CSC101", "Dr. Hopper · 3 weeks ago"],
];

/** Student · Announcements feed (design 61): pinned + earlier course notices. */
export default function AnnouncementsFeedScreen({ route }: RootScreen<"AnnouncementsFeed">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4, fontSize: 22 }}>{code}</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Pinned */}
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 18, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="bookmark" size={16} color={palette.accents.lemon.fg} />
            <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.lemon.fg, letterSpacing: 0.5 }}>PINNED</Txt>
          </View>
          <Txt style={{ fontSize: 16, ...font(800), color: palette.text }}>Midterm moved to Week 9</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 20, ...font(500), color: palette.text, marginTop: 6 }}>
            The midterm is now in Week 9, same venue. Review the recursion section beforehand.
          </Txt>
          <Txt style={{ fontSize: 11.5, ...font(700), color: palette.accents.lemon.fg, marginTop: 10 }}>Dr. Hopper · 2h ago</Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>EARLIER</Txt>
        <View style={{ gap: 11 }}>
          {EARLIER.map(([title, meta]) => (
            <View key={title} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 15, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{title}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 4 }}>{meta}</Txt>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
