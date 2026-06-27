import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, EmptyState, Avatar, SectionHeader, TinyIcon, StatusPill, IconButton } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import { useCourses } from "@/hooks/queries";
import { useAuth } from "@/stores/auth";
import { materialsApi, timetableApi } from "@/api/endpoints";
import { getTodayTimetableSessions } from "@/db";

const QUICK: [Parameters<typeof Icon>[0]["name"], string, string][] = [
  ["upload", "Upload", "UploadMaterial"],
  ["check", "Publish", "PublishSheet"],
  ["bell", "Announce", "AnnouncementCompose"],
  ["grid", "Analytics", "CourseAnalytics"],
];

/** Lecturer Home (Module 8 · design 19): courses, draft count, timetable strip, quick actions. */
export default function LecturerHomeTab() {
  const { palette, scheme } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuth((s) => s.user);
  const { data: courses, refetch, isLoading } = useCourses();
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
  const [timetable, setTimetable] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrafts = useCallback(async () => {
    if (!courses?.length) return;
    const counts: Record<string, number> = {};
    await Promise.allSettled(
      courses.map(async (c) => {
        const mats = await materialsApi.list(c.id);
        counts[c.id] = mats.filter((m) => m.status === "draft").length;
      })
    );
    setDraftCounts(counts);
  }, [courses]);

  const loadTimetable = useCallback(async () => {
    try {
      const slots = await timetableApi.getToday();
      setTimetable(slots);
    } catch {
      const dow = (new Date().getDay() + 6) % 7;
      try {
        const local = await getTodayTimetableSessions(dow);
        setTimetable(local.map((s) => ({
          id: s.id,
          course_id: s.course_id,
          course_code: s.course_name,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
        })));
      } catch { /* no timetable */ }
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  useEffect(() => {
    if (courses?.length) loadDrafts();
  }, [courses, loadDrafts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refetch(), loadTimetable()]);
    await loadDrafts();
    setRefreshing(false);
  };

  const totalDrafts = Object.values(draftCounts).reduce((n, c) => n + c, 0);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={user?.full_name ?? "?"} size={46} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text }}>
              {user?.title ? `${user.title} ` : ""}{user?.full_name ?? "Lecturer"}
            </Txt>
            <Txt variant="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
              {courses?.length ?? 0} assigned course{(courses?.length ?? 0) === 1 ? "" : "s"}
              {totalDrafts > 0 ? ` · ${totalDrafts} draft${totalDrafts > 1 ? "s" : ""}` : ""}
            </Txt>
          </View>
          <IconButton icon="bell" dot onPress={() => nav.navigate("NotificationCenter")} />
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
          {QUICK.map(([icon, label, route]) => (
            <Pressable
              key={label}
              onPress={() => nav.navigate(route)}
              style={{ flex: 1, backgroundColor: palette.card, borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 7, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
            >
              <Icon name={icon} size={22} color={palette.text} />
              <Txt style={{ fontSize: 11.5, ...font(700), color: palette.textMuted }}>{label}</Txt>
            </Pressable>
          ))}
        </View>

        {/* Today's classes */}
        {timetable.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <SectionHeader title="Today's classes" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {timetable.map((slot) => {
                  const a = palette.accents[accentFor(slot.course_id ?? slot.id)];
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => nav.navigate("TimetableEditor", { offeringId: slot.course_id, code: slot.course_code })}
                      style={{ backgroundColor: a.bg, borderRadius: 18, padding: 14, width: 160, height: 92, justifyContent: "space-between" }}
                    >
                      <Txt style={{ ...font(800), color: a.fg, fontSize: 13 }}>{slot.course_code ?? "Class"}</Txt>
                      <View>
                        <Txt style={{ fontSize: 12, ...font(600), color: palette.text }}>{slot.start_time}–{slot.end_time}</Txt>
                        <Txt style={{ fontSize: 11, ...font(600), color: a.fg }}>{slot.room ?? "TBD"}</Txt>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Pending actions badge */}
        {totalDrafts > 0 && (
          <Pressable
            onPress={() => nav.navigate("PendingActions")}
            style={{ marginTop: 22, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.accents.lemon.bg, borderRadius: 18, padding: 15 }}
          >
            <TinyIcon icon="clock" accent="lemon" size={42} iconSize={21} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>
                {totalDrafts} draft{totalDrafts > 1 ? "s" : ""} waiting
              </Txt>
              <Txt style={{ fontSize: 12, ...font(600), color: palette.accents.lemon.fg, marginTop: 2 }}>
                Review and publish to make them visible
              </Txt>
            </View>
            <Icon name="chev" size={18} color={palette.accents.lemon.fg} />
          </Pressable>
        )}

        {/* Courses list */}
        <View style={{ marginTop: 22 }}>
          <SectionHeader title="Your courses" action={{ label: "Manage", onPress: () => nav.navigate("Courses") }} />
        </View>

        {!courses?.length ? (
          <EmptyState icon="book" title="No assigned courses" body="Courses you teach or co-teach will appear here." />
        ) : (
          <View style={{ gap: 11 }}>
            {courses.map((item) => {
              const a = palette.accents[accentFor(item.id)];
              const drafts = draftCounts[item.id] ?? 0;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => nav.navigate("OfferingDetail", { offeringId: item.id, code: item.code, title: item.title })}
                  style={({ pressed }) => ({
                    backgroundColor: palette.card,
                    borderRadius: 18,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 13,
                    opacity: pressed ? 0.85 : 1,
                    shadowColor: palette.shadow,
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: scheme === "dark" ? 0 : 1,
                  })}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 13, ...font(800), color: a.fg }}>{item.code.slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt style={{ fontSize: 12, ...font(800), color: palette.textFaint }}>{item.code}</Txt>
                    <Txt numberOfLines={1} style={{ fontSize: 15, ...font(700), color: palette.text, marginTop: 2 }}>{item.title}</Txt>
                  </View>
                  {drafts > 0 && (
                    <StatusPill label={`${drafts} draft${drafts > 1 ? "s" : ""}`} accent="lemon" />
                  )}
                  <Icon name="chev" size={18} color={palette.textFaint} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
