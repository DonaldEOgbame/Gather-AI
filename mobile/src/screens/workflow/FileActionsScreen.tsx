import React, { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, TinyIcon } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { setRead, setBookmarked, addTrash } from "@/db";
import { useQueryClient } from "@tanstack/react-query";

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
  const qc = useQueryClient();
  const title = route.params?.title ?? "Lecture 12 — Recursion.pdf";
  const meta = route.params?.meta ?? "";
  const placementId = (route.params as any)?.placementId as string | undefined;
  const physicalPath = (route.params as any)?.physicalPath as string | undefined;

  const handle = async (label: string) => {
    if (!placementId) {
      Alert.alert(label, title);
      navigation.goBack();
      return;
    }
    try {
      switch (label) {
        case "Mark as read":
          await setRead(placementId, true);
          break;
        case "Bookmark":
          await setBookmarked(placementId, true);
          break;
        case "Delete local copy":
          if (!physicalPath) break;
          await addTrash({ originUri: physicalPath, physicalPath, retentionDays: 30 });
          Alert.alert("Deleted", "Moved to trash. You have 30 days to recover it.");
          navigation.goBack();
          return;
        default:
          Alert.alert(label, title);
          navigation.goBack();
          return;
      }
      await qc.invalidateQueries({ queryKey: ["placements"] });
      navigation.goBack();
    } catch {
      Alert.alert("Error", `Could not ${label.toLowerCase()}.`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 14 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 8, paddingBottom: 12, borderBottomColor: palette.fieldBorder, borderBottomWidth: 1 }}>
          <TinyIcon icon="file" accent="peach" size={42} iconSize={21} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
            {!!meta && <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 2 }}>{meta}</Txt>}
          </View>
        </View>
        <View style={{ paddingTop: 6 }}>
          {ACTIONS.map(([icon, label, danger]) => (
            <Pressable
              key={label}
              onPress={() => handle(label)}
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
