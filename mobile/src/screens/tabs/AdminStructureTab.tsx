import React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, Button, TinyIcon, StatusPill } from "@/components/ui";
import { useTheme, font } from "@/theme";

/** Admin Structure (Module 8/15 · design 25): semester, departments, assignment. */
export default function AdminStructureTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 6 }}>
        <Txt variant="title">Structure</Txt>

        {/* Active semester */}
        <Pressable onPress={() => nav.navigate("Semesters")} style={{ marginTop: 16, backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TinyIcon icon="calendar" accent="mint" />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16, ...font(800), color: palette.text }}>Current semester</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Active</Txt>
          </View>
          <StatusPill label="Active" accent="mint" />
        </Pressable>

        <Txt variant="faint" style={{ marginTop: 20, marginBottom: 8, letterSpacing: 0.5, ...font(800) }}>MANAGE</Txt>

        <View style={{ gap: 10 }}>
          <Button title="Semesters" onPress={() => nav.navigate("Semesters")} />
          <Button title="Departments & courses" variant="ghost" onPress={() => nav.navigate("Departments")} />
          <Button title="Assign lecturers" variant="ghost" onPress={() => nav.navigate("AssignLecturers")} />
          <Button title="Enrollment & join codes" variant="ghost" onPress={() => nav.navigate("Enrollment")} />
          <Button title="Audit log" variant="ghost" onPress={() => nav.navigate("AuditLog")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
