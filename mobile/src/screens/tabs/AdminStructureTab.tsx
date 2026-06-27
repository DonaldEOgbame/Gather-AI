import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, Button, TinyIcon, StatusPill, ListCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useCurrentContext, useDepartments, useCourses } from "@/hooks/queries";

/** Admin Structure (Module 8/15 · design 25): active semester + departments list. */
export default function AdminStructureTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const { data: ctx } = useCurrentContext();
  const { data: departments } = useDepartments();
  const { data: courses } = useCourses();

  const semLabel = ctx ? `${ctx.session.name}` : "No active semester";
  const semTerm = ctx ? `${ctx.semester.term === "first" ? "First" : "Second"} Semester` : "";
  const courseCount = courses?.length ?? 0;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt variant="title">Structure</Txt>
        <Pressable
          onPress={() => nav.navigate("Departments")}
          accessibilityRole="button"
          accessibilityLabel="Add"
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="plus" size={22} color={palette.primaryText} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Active semester */}
        <Pressable onPress={() => nav.navigate("Sessions")} style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TinyIcon icon="calendar" accent="mint" />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16, ...font(800), color: palette.text }}>{semLabel}</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>
              {semTerm ? `${semTerm} · ` : ""}{courseCount} course{courseCount === 1 ? "" : "s"}
            </Txt>
          </View>
          <StatusPill label="Active" accent="mint" />
        </Pressable>

        {/* Departments */}
        <Txt variant="faint" style={{ marginTop: 20, marginBottom: 8, letterSpacing: 0.5, ...font(800) }}>DEPARTMENTS</Txt>
        {!departments?.length ? (
          <Txt variant="muted">No departments yet — tap + to add one.</Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {departments.map((d) => (
              <ListCard
                key={d.id}
                icon="building"
                accent={accentFor(d.id)}
                title={d.name}
                subtitle="Courses & lecturers"
                onPress={() => nav.navigate("Departments")}
                right={<Icon name="chev" size={18} color={palette.textFaint} />}
              />
            ))}
          </View>
        )}

        {/* Add actions */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Button title="Add course" variant="ghost" onPress={() => nav.navigate("Departments")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Assign lecturer" variant="ghost" onPress={() => nav.navigate("AssignLecturers")} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
