import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const TLDR = [
  "Recursion solves problems via smaller self-calls.",
  "Every recursion needs a base case to terminate.",
  "Stack depth drives memory cost.",
];
const TERMS = ["Base case", "Call stack", "Tail recursion", "Big-O", "Memoization"];

/** Student · Pre-download AI summary (design 32): TL;DR + key terms before download. */
export default function PreDownloadScreen({ route, navigation }: RootScreen<"PreDownload">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "Lecture 12 — Recursion.pdf";
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 16 }} />
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="file" accent="peach" size={44} iconSize={22} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt numberOfLines={1} style={{ fontSize: 15, ...font(800), color: palette.text }}>{title}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 2 }}>2.4 MB · 60 slides · PDF</Txt>
            </View>
          </View>

          {/* TL;DR */}
          <View style={{ backgroundColor: palette.accents.lilac.bg, borderRadius: 14, padding: 14, marginTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <Icon name="sparkle" size={17} color={palette.accents.lilac.fg} />
              <Txt style={{ fontSize: 13, ...font(800), color: palette.accents.lilac.fg }}>TL;DR</Txt>
            </View>
            {TLDR.map((b, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: i ? 6 : 0 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accents.lilac.fg, marginTop: 6 }} />
                <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, color: palette.text }}>{b}</Txt>
              </View>
            ))}
          </View>

          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>KEY TERMS</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {TERMS.map((k) => (
              <View key={k} style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                <Txt style={{ fontSize: 12, ...font(700), color: palette.text }}>{k}</Txt>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <View style={{ flex: 1.6 }}>
            <Button title="Download · 2.4 MB" icon="download" onPress={() => { Alert.alert("Downloading", "Saved offline."); navigation.goBack(); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Read online" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </View>
    </View>
  );
}
