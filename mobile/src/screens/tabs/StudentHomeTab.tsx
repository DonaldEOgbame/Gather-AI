import React, { useMemo, useState, useEffect } from "react";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, EmptyState, Avatar, Chip, ChipRow, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import { useCourses } from "@/hooks/queries";
import { useAuth } from "@/stores/auth";
import { timetableApi } from "@/api/endpoints";
import { insertTimetableSession, clearTimetableSessions, getTodayTimetableSessions } from "@/db";

/** Round white icon button with optional unread dot (design header bell). */
function IconButton({ icon, onPress, dot }: { icon: "bell"; onPress: () => void; dot?: boolean }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: palette.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#141928",
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <Icon name={icon} size={22} color={palette.text} />
      {dot ? (
        <View style={{ position: "absolute", top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger, borderWidth: 2, borderColor: palette.card }} />
      ) : null}
    </Pressable>
  );
}

/** Colored course tile from the design home grid. */
function CourseCard({ code, title, subtitle, accent, onPress }: { code: string; title: string; subtitle?: string; accent: ReturnType<typeof accentFor>; onPress: () => void }) {
  const { palette } = useTheme();
  const a = palette.accents[accent];
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${code} ${title}`}>
      <View style={{ backgroundColor: a.bg, borderRadius: 22, padding: 16, minHeight: 124, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.65)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="book" size={17} color={a.fg} width={1.8} />
          </View>
          <Txt style={{ fontSize: 12, ...font(800), color: a.fg }}>{code}</Txt>
        </View>
        <View>
          <Txt numberOfLines={2} style={{ fontSize: 15, lineHeight: 19, ...font(700), color: palette.text, marginTop: 10 }}>{title}</Txt>
          {subtitle ? <Txt style={{ fontSize: 12, ...font(600), color: a.fg, marginTop: 6 }}>{subtitle}</Txt> : null}
        </View>
      </View>
    </Pressable>
  );
}

/** Student Home (Module 8 · design 07): greeting, search, subject chips, course grid. */
export default function StudentHomeTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuth((s) => s.user);
  const { data: courses, refetch } = useCourses();
  const [subject, setSubject] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<any[]>([]);

  const fetchTimetable = async () => {
    try {
      const slots = await timetableApi.getToday();
      setTimetable(slots);
      await clearTimetableSessions();
      for (const s of slots) {
        await insertTimetableSession({
          id: s.id,
          course_id: s.course_id,
          day_of_week: s.weekday,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
        });
      }
    } catch (e) {
      console.warn("Failed to sync timetable, fallback to SQLite:", e);
      const localNow = new Date();
      let day = localNow.getDay() - 1;
      if (day < 0) day = 6;
      try {
        const localSlots = await getTodayTimetableSessions(day);
        setTimetable(
          localSlots.map((ls) => ({
            id: ls.id,
            course_id: ls.course_id,
            course_code: ls.course_name,
            course_title: "",
            start_time: ls.start_time,
            end_time: ls.end_time,
            room: ls.room,
          }))
        );
      } catch (sqle) {
        console.error("SQLite query failed:", sqle);
      }
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleRefresh = async () => {
    await refetch();
    await fetchTimetable();
  };

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (courses ?? []).forEach((c) => {
      const m = c.code.match(/^[A-Za-z]+/);
      if (m) s.add(m[0].toUpperCase());
    });
    return [...s].sort();
  }, [courses]);

  const filtered = useMemo(
    () => (courses ?? []).filter((c) => !subject || c.code.toUpperCase().startsWith(subject)),
    [courses, subject]
  );

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // Pair courses into rows of two for the grid.
  const rows: typeof filtered[] = [];
  for (let i = 0; i < filtered.length; i += 2) rows.push(filtered.slice(i, i + 2));

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="muted" style={{ fontSize: 14, ...font(500) }}>{today}</Txt>
            <Txt variant="title" style={{ marginTop: 2 }}>Hi, {user?.full_name?.split(" ")[0] ?? "there"} 👋</Txt>
          </View>
          <IconButton icon="bell" dot onPress={() => nav.navigate("NotificationCenter")} />
          <Avatar name={user?.full_name ?? "?"} size={44} />
        </View>

        {/* Search */}
        <Pressable
          onPress={() => nav.navigate("Search")}
          accessibilityRole="search"
          style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 18, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Icon name="search" size={20} color={palette.textFaint} />
          <Txt variant="faint" style={{ fontSize: 15 }}>Search materials, courses…</Txt>
        </Pressable>

        {/* Subject chips */}
        {subjects.length > 1 && (
          <View style={{ marginTop: 16 }}>
            <ChipRow>
              <Chip label="All" selected={subject === null} onPress={() => setSubject(null)} />
              {subjects.map((s) => (
                <Chip key={s} label={s} selected={subject === s} onPress={() => setSubject(s)} />
              ))}
            </ChipRow>
          </View>
        )}

        {/* Today's schedule strip */}
        {timetable.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <SectionHeader title="Today's schedule" action={{ label: "Ready for today", onPress: () => nav.navigate("ReadyToday") }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {timetable.map((slot) => {
                  const a = palette.accents[accentFor(slot.course_id)];
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => {
                        const c = courses?.find((course) => course.id === slot.course_id);
                        nav.navigate("CourseDetail", { courseId: slot.course_id, code: slot.course_code || c?.code || "Course", title: slot.course_title || c?.title || "" });
                      }}
                      style={{ backgroundColor: a.bg, borderRadius: 18, padding: 14, width: 160, height: 92, justifyContent: "space-between" }}
                    >
                      <View>
                        <Txt style={{ ...font(800), color: a.fg, fontSize: 13 }}>{slot.course_code || "Class"}</Txt>
                        <Txt style={{ fontSize: 12, ...font(600), color: palette.text, marginTop: 2 }}>{slot.start_time} – {slot.end_time}</Txt>
                      </View>
                      <Txt style={{ fontSize: 11, ...font(600), color: a.fg }}>📍 {slot.room || "TBD"}</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Courses grid */}
        <View style={{ marginTop: 22 }}>
          <SectionHeader title="Your courses" action={{ label: "See all", onPress: () => nav.navigate("Courses") }} />
        </View>
        {!filtered.length ? (
          <EmptyState icon="book" title="No courses yet" body="Your enrolled courses will show up here." />
        ) : (
          <View style={{ gap: 13 }}>
            {rows.map((pair, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: 13 }}>
                {pair.map((item) => (
                  <CourseCard
                    key={item.id}
                    code={item.code}
                    title={item.title}
                    accent={accentFor(item.id)}
                    onPress={() => nav.navigate("CourseDetail", { courseId: item.id, code: item.code, title: item.title })}
                  />
                ))}
                {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
