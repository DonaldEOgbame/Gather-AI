import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const SESSIONS: [string, string, string, boolean][] = [
  ["Mon", "09:00 – 11:00", "Hall B · Lecture", true],
  ["Wed", "11:00 – 13:00", "Lab 3 · Practical", false],
  ["Fri", "14:00 – 15:00", "Hall A · Tutorial", false],
];

/** Admin · Timetable editor (design 52): institution meeting times + conflicts. */
export default function TimetableEditorScreen({ route }: RootScreen<"TimetableEditor">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title" style={{ fontSize: 19 }}>Timetable</Txt>
          <Txt variant="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{code} · Fall 2026</Txt>
        </View>
        <Pressable onPress={() => Alert.alert("Import CSV", "Pick a timetable CSV.")} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Icon name="upload" size={16} color={palette.textFaint} />
          <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>CSV</Txt>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Conflict banner */}
        <View style={{ backgroundColor: palette.accents.peach.bg, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name="bell" size={18} color={palette.accents.peach.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
            Institution-wide conflict: Hall B double-booked Mon 09:00 — clashes with MTH204.
          </Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>SESSIONS · INSTITUTION TIME</Txt>
        <View style={{ gap: 10 }}>
          {SESSIONS.map(([day, time, place, conflict], i) => (
            <View key={i} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: conflict ? palette.accents.peach.fg : "transparent", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Txt style={{ width: 42, textAlign: "center", fontSize: 14, ...font(800), color: palette.text }}>{day}</Txt>
              <View style={{ width: 1, height: 36, backgroundColor: "#F1F2F4" }} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{time}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{place}</Txt>
              </View>
              <Icon name="edit" size={18} color={palette.textFaint} />
            </View>
          ))}
        </View>

        <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), textAlign: "center", marginTop: 16, marginBottom: 12, lineHeight: 16 }}>
          Admin / registry sets class meeting times. Lecturers schedule material release, not meetings.
        </Txt>
        <Button title="Add session" onPress={() => Alert.alert("Add session", "Create a new meeting slot.")} />
      </ScrollView>
    </View>
  );
}
