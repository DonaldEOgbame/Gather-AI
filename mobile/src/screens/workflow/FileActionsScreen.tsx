import React from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, TinyIcon } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const ACTIONS: [IconName, string, boolean][] = [
  ["file", "Open", false],
  ["check", "Mark as read", false],
  ["bookmark", "Bookmark", false],
  ["share", "Share", false],
  ["folder", "Move to course", false],
  ["sparkle", "File info", false],
  ["trash", "Delete local copy", true],
];

/** Workflow · File actions sheet (design 38): long-press context menu. */
export default function FileActionsScreen({ route, navigation }: RootScreen<"FileActions">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "Lecture 12 — Recursion.pdf";
  const meta = route.params?.meta ?? "CSC101 · Week 12 · v2 · 2.4 MB";
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 14 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 8, paddingBottom: 12, borderBottomColor: "#F1F2F4", borderBottomWidth: 1 }}>
          <TinyIcon icon="file" accent="peach" size={42} iconSize={21} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 2 }}>{meta}</Txt>
          </View>
        </View>
        <View style={{ paddingTop: 6 }}>
          {ACTIONS.map(([icon, label, danger]) => (
            <Pressable
              key={label}
              onPress={() => { Alert.alert(label, title); navigation.goBack(); }}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: pressed ? palette.field : "transparent" })}
            >
              <Icon name={icon} size={21} color={danger ? palette.danger : palette.text} />
              <Txt style={{ fontSize: 15.5, ...font(600), color: danger ? palette.danger : palette.text }}>{label}</Txt>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
