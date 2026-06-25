import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";

const CS_CODES = [
  ["CSC101", "Intro to Computer Science"],
  ["CSC305", "Algorithms"],
  ["CSC410", "Distributed Systems"],
];
const DEPTS: [string, string, AccentName][] = [
  ["Mathematics", "6 codes · 9 lecturers", "lemon"],
  ["Biology", "7 codes · 11 lecturers", "mint"],
  ["Law", "5 codes · 8 lecturers", "lilac"],
];

/** Admin · Structure / departments (design 44): expandable dept → course codes. */
export default function DepartmentsScreen() {
  const { palette } = useTheme();
  const [tab, setTab] = useState("Departments");
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Structure</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>24 departments · 142 courses</Txt>
        </View>
        <Pressable onPress={() => Alert.alert("Add", "Add a department, course or code.")} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
        <ChipRow>
          {["Departments", "Courses", "Codes"].map((t) => (
            <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </ChipRow>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Expandable CS card */}
        <View style={{ backgroundColor: palette.card, borderRadius: 18, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Pressable onPress={() => setExpanded((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}>
            <TinyIcon icon="building" accent="sky" size={44} iconSize={22} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>Computer Science</Txt>
              <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>8 course codes · 12 lecturers</Txt>
            </View>
            <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}>
              <Icon name="chev" size={18} color={palette.textFaint} />
            </View>
          </Pressable>
          {expanded && (
            <View style={{ borderTopColor: "#F1F2F4", borderTopWidth: 1, paddingHorizontal: 15, paddingBottom: 12 }}>
              {CS_CODES.map(([code, title], i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: palette.accents.sky.fg }} />
                  <Txt style={{ fontSize: 13, ...font(800), color: palette.text, width: 64 }}>{code}</Txt>
                  <Txt style={{ fontSize: 12.5, ...font(500), color: palette.textMuted, flex: 1 }}>{title}</Txt>
                </View>
              ))}
            </View>
          )}
        </View>

        {DEPTS.map(([name, sub, accent], i) => (
          <Pressable key={i} onPress={() => setExpanded(false)} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <TinyIcon icon="building" accent={accent} size={40} iconSize={20} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{name}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>{sub}</Txt>
            </View>
            <Icon name="chev" size={18} color={palette.textFaint} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
