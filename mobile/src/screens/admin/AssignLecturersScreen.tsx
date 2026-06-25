import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const STAFF: [string, string, AccentName][] = [
  ["Tunde Bello", "STF-2291", "sky"],
  ["Femi Okoro", "STF-2410", "lemon"],
];

/** Admin · Assign lecturers (design 46): owner + co-lecturers + add staff. */
export default function AssignLecturersScreen({ route }: RootScreen<"AssignLecturers">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  const title = route.params?.title ?? "Intro to Computer Science";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Assign lecturers</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text, marginTop: 2 }}>{title}</Txt>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>ASSIGNED</Txt>
        <View style={{ gap: 10 }}>
          <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <Avatar name="Grace Hopper" size={42} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>Dr. Grace Hopper</Txt>
              <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>Head lecturer · STF-1142</Txt>
            </View>
            <StatusPill label="Owner" accent="mint" />
          </View>
          <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <Avatar name="Aisha Khan" size={42} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>Aisha Khan</Txt>
              <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>Co-lecturer · STF-2008</Txt>
            </View>
            <Pressable onPress={() => Alert.alert("Remove", "Remove Aisha Khan from CSC101?")}>
              <Txt style={{ fontSize: 13, ...font(700), color: palette.danger }}>Remove</Txt>
            </Pressable>
          </View>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>ADD STAFF</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Icon name="search" size={20} color={palette.textFaint} />
          <Txt variant="faint" style={{ fontSize: 14.5 }}>Search staff by name or ID</Txt>
        </View>
        <View style={{ marginTop: 14, gap: 6 }}>
          {STAFF.map(([name, id, accent], i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 4 }}>
              <Avatar name={name} size={38} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{id}</Txt>
              </View>
              <Pressable onPress={() => Alert.alert("Added", `${name} added as co-lecturer.`)} style={{ borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: 16, paddingVertical: 7 }}>
                <Txt style={{ fontSize: 13, ...font(700), color: palette.text }}>Add</Txt>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
