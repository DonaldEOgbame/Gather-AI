import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Txt, Segmented } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { getTodayTimetableSessions, type TimetableSessionRow } from "@/db";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const ACCENTS: AccentName[] = ["lemon", "mint", "peach", "sky", "lilac"];

function buildWeekStrip(today: Date): { letter: string; num: number; active: boolean; dow: number }[] {
  const todayDow = today.getDay();
  const monday = new Date(today);
  // Start from Monday of current week
  monday.setDate(today.getDate() - ((todayDow + 6) % 7));
  return [1, 2, 3, 4, 5].map((offset) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset - 1);
    const dow = d.getDay();
    return { letter: DAY_LETTER[dow], num: d.getDate(), active: dow === todayDow, dow };
  });
}

/** Student · Schedule (design 64): week strip + day agenda wired to local timetable DB. */
export default function ScheduleScreen() {
  const { palette, scheme } = useTheme();
  const [view, setView] = useState<"week" | "agenda">("agenda");
  const [selectedDow, setSelectedDow] = useState(new Date().getDay());
  const [classes, setClasses] = useState<(TimetableSessionRow & { course_name: string })[]>([]);
  const today = new Date();
  const strip = buildWeekStrip(today);

  useFocusEffect(useCallback(() => {
    getTodayTimetableSessions(selectedDow).then(setClasses);
  }, [selectedDow]));

  const dayLabel = DAY_NAMES[selectedDow];
  const weekLabel = `Week of ${today.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Schedule</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>{weekLabel}</Txt>
        </View>
        <View style={{ width: 160 }}>
          <Segmented value={view} onChange={setView} options={[{ key: "week", label: "Week" }, { key: "agenda", label: "Agenda" }]} />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 7, paddingHorizontal: 24, marginTop: 16 }}>
        {strip.map(({ letter, num, active, dow }, i) => (
          <Pressable
            key={i}
            onPress={() => setSelectedDow(dow)}
            style={{ flex: 1, borderRadius: 14, backgroundColor: dow === selectedDow ? palette.primary : palette.card, paddingVertical: 10, alignItems: "center", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
          >
            <Txt style={{ fontSize: 11, ...font(700), color: dow === selectedDow ? "rgba(255,255,255,0.6)" : palette.textFaint }}>{letter}</Txt>
            <Txt style={{ fontSize: 16, ...font(800), color: dow === selectedDow ? palette.primaryText : palette.text, marginTop: 2 }}>{num}</Txt>
            {active && dow !== selectedDow && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.primary, marginTop: 3 }} />}
          </Pressable>
        ))}
      </View>

      <Txt variant="faint" style={{ paddingHorizontal: 24, letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>
        {dayLabel.toUpperCase()} · {classes.length} CLASS{classes.length !== 1 ? "ES" : ""}
      </Txt>

      {classes.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
          <Icon name="check" size={36} color={palette.textFaint} width={1.5} />
          <Txt variant="muted" style={{ fontSize: 14, ...font(600), marginTop: 10 }}>No classes this day</Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
          {classes.map((c, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <View key={c.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ alignItems: "center" }}>
                  <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>{c.start_time.split(":")[0]}</Txt>
                  <Txt style={{ fontSize: 11, ...font(700), color: palette.textFaint }}>{c.start_time.split(":")[1]}</Txt>
                </View>
                <View style={{ width: 3, height: 38, borderRadius: 2, backgroundColor: palette.accents[accent].fg }} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{c.course_name}</Txt>
                  <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text, marginTop: 2 }}>{c.room}</Txt>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.accents.mint.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
                  <Icon name="check" size={12} color={palette.accents.mint.fg} width={2.6} />
                  <Txt style={{ fontSize: 10.5, ...font(800), color: palette.accents.mint.fg }}>Ready</Txt>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
