import React, { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Pressable, View, ScrollView, RefreshControl, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, EmptyState, Chip, ChipRow, Button, StatusPill, Scrim, Sheet } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { accentFor, useTheme, font } from "@/theme";
import { useOfferings } from "@/hooks/queries";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/stores/auth";
import { enrollmentApi } from "@/api/endpoints";
import { listFolders, listBookmarks } from "@/db";
import type { OfferingOut } from "@/api/types";

/** Course list row from the design catalog: accent code-tile + meta + right slot. */
function CourseRow({ code, title, sub, accent, right, onPress }: { code: string; title: string; sub?: string; accent: ReturnType<typeof accentFor>; right?: React.ReactNode; onPress?: () => void }) {
  const { palette, scheme } = useTheme();
  const a = palette.accents[accent];
  const displayCode = code.toUpperCase().startsWith("CS") ? "CSC" : code.slice(0, 3).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
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
        <Txt style={{ fontSize: 13, ...font(800), color: a.fg }}>{displayCode}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt style={{ fontSize: 12, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt numberOfLines={1} style={{ fontSize: 15, ...font(700), color: palette.text, marginTop: 2 }}>{title}</Txt>
        {sub ? <Txt numberOfLines={1} style={{ fontSize: 12.5, ...font(500), color: palette.textMuted, marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      {right ?? <Icon name="chev" size={18} color={palette.textFaint} />}
    </Pressable>
  );
}

export default function CoursesTab() {
  const { palette } = useTheme();
  const { data, isLoading, refetch } = useOfferings();
  const nav = useNavigation<any>();
  const role = useAuth((s) => s.user?.global_role);
  const [filter, setFilter] = useState<"all" | "in_progress" | "offline" | "bookmarked">("all");

  const [joiningCourse, setJoiningCourse] = useState<OfferingOut | null>(null);
  const [codeVal, setCodeVal] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);

  const [offlineCourseIds, setOfflineCourseIds] = useState<Set<string>>(new Set());
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadDbStats() {
      try {
        const folders = await listFolders();
        const offlineIds = new Set<string>();
        folders.forEach(f => {
          if (f.kind === "course" && f.course_id && f.count > 0) {
            offlineIds.add(f.course_id);
          }
        });
        setOfflineCourseIds(offlineIds);

        const bookmarks = await listBookmarks();
        const bookmarkedIds = new Set<string>();
        bookmarks.forEach(b => {
          if (b.course_id) {
            bookmarkedIds.add(b.course_id);
          }
        });
        setBookmarkedCourseIds(bookmarkedIds);
      } catch (err) {
        console.warn("Failed to load local DB stats for courses tab:", err);
      }
    }
    if (role === "student" && data) {
      loadDbStats();
    }
  }, [data, role]);

  const filtered = data ?? [];

  const enrolledCourses = useMemo(() => {
    const active = filtered.filter((c) => c.enrollment_status === "active");
    if (filter === "in_progress") {
      return active;
    } else if (filter === "offline") {
      return active.filter((c) => offlineCourseIds.has(c.course_id || c.id));
    } else if (filter === "bookmarked") {
      return active.filter((c) => bookmarkedCourseIds.has(c.course_id || c.id));
    }
    return active; // all
  }, [filtered, filter, offlineCourseIds, bookmarkedCourseIds]);

  const pendingCourses = useMemo(() => filtered.filter((c) => c.enrollment_status === "pending"), [filtered]);
  const availableCourses = useMemo(() => filtered.filter((c) => c.enrollment_status === "unenrolled" && c.enrollment_mode !== "roster"), [filtered]);

  const openOffering = (item: OfferingOut) =>
    nav.navigate("OfferingDetail", {
      offeringId: item.id,
      code: item.code ?? "",
      title: item.title ?? "",
      sessionName: item.session_name ?? undefined,
      semesterTerm: item.semester_term ?? undefined,
    });

  const handleJoinPress = (course: OfferingOut) => {
    if (course.enrollment_mode === "code") {
      setJoiningCourse(course);
      setCodeVal("");
    } else if (course.enrollment_mode === "approval") {
      handleJoinApproval(course);
    }
  };

  const handleJoinApproval = (course: OfferingOut) => {
    Alert.alert("Request Enrollment", `Submit enrollment request for ${course.code}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Request",
        onPress: async () => {
          try {
            await enrollmentApi.enroll(course.id);
            refetch();
            Alert.alert("Request Sent", "Your request has been sent and is waiting for lecturer approval.");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to submit request.");
          }
        },
      },
    ]);
  };

  const submitJoinCode = async () => {
    if (!joiningCourse) return;
    if (!codeVal.trim()) return Alert.alert("Error", "Join code is required");
    setJoinBusy(true);
    try {
      const res: any = await enrollmentApi.enroll(joiningCourse.id, codeVal.trim().toUpperCase());
      setJoiningCourse(null);
      setCodeVal("");
      refetch();
      if (res.status === "active") Alert.alert("Success", `You are now enrolled in ${joiningCourse.code}!`);
      else Alert.alert("Request Sent", `Your enrollment request is pending.`);
    } catch (e: any) {
      Alert.alert("Enrollment Failed", e.message || "Invalid or expired join code.");
    } finally {
      setJoinBusy(false);
    }
  };

  if (isLoading)
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center" }}>
        <ActivityIndicator color={palette.text} />
      </SafeAreaView>
    );

  const isStudent = role === "student";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Txt variant="title">Courses</Txt>
          {isStudent && (
            <View style={{ flexDirection: "row", gap: 14 }}>
              <Txt onPress={() => nav.navigate("RegisterCourses")} style={{ fontSize: 13, ...font(700), color: palette.text }}>Register</Txt>
              <Txt onPress={() => nav.navigate("PastSemesters")} style={{ fontSize: 13, ...font(700), color: palette.textFaint }}>Past</Txt>
            </View>
          )}
        </View>
        <Txt variant="muted" style={{ fontSize: 14, ...font(500), marginTop: 2 }}>
          {isStudent ? `${enrolledCourses.length} enrolled` : `${filtered.length} assigned`}
        </Txt>
        {isStudent && (
          <View style={{ marginTop: 16 }}>
            <ChipRow>
              <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
              <Chip label="In progress" selected={filter === "in_progress"} onPress={() => setFilter("in_progress")} />
              <Chip label="Offline" selected={filter === "offline"} onPress={() => setFilter("offline")} />
              <Chip label="Bookmarked" selected={filter === "bookmarked"} onPress={() => setFilter("bookmarked")} />
            </ChipRow>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {isStudent ? (
          <View style={{ gap: 11 }}>
            {!enrolledCourses.length ? (
              <Txt variant="muted">You are not enrolled in any courses yet.</Txt>
            ) : (
              enrolledCourses.map((item) => (
                <CourseRow key={item.id} code={item.code ?? ""} title={item.title ?? ""} sub={item.session_name ?? undefined} accent={accentFor(item.id)} onPress={() => openOffering(item)} />
              ))
            )}

            {pendingCourses.length > 0 && (
              <>
                <Txt variant="label" style={{ marginTop: 10, letterSpacing: 0.5 }}>PENDING APPROVAL</Txt>
                {pendingCourses.map((item) => (
                  <CourseRow key={item.id} code={item.code ?? ""} title={item.title ?? ""} accent={accentFor(item.id)} right={<StatusPill label="Pending" accent="lemon" />} />
                ))}
              </>
            )}

            <Txt variant="label" style={{ marginTop: 10, letterSpacing: 0.5 }}>AVAILABLE TO JOIN</Txt>
            {!availableCourses.length ? (
              <Txt variant="muted">No other available courses to join.</Txt>
            ) : (
              availableCourses.map((item) => (
                <CourseRow
                  key={item.id}
                  code={item.code ?? ""}
                  title={item.title ?? ""}
                  accent={accentFor(item.id)}
                  right={
                    <Chip
                      label={item.enrollment_mode === "code" ? "Enter code" : "Join"}
                      selected
                      onPress={() => handleJoinPress(item)}
                    />
                  }
                />
              ))
            )}
          </View>
        ) : (
          <View style={{ gap: 11 }}>
            {!filtered.length ? (
              <EmptyState icon="book" title="No courses" body="Courses assigned to you will show up here." />
            ) : (
              filtered.map((item) => (
                <CourseRow key={item.id} code={item.code ?? ""} title={item.title ?? ""} sub={item.session_name ?? undefined} accent={accentFor(item.id)} onPress={() => openOffering(item)} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Enter Join Code Modal */}
      <Modal visible={joiningCourse !== null} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Scrim onPress={() => setJoiningCourse(null)} />
          <Sheet>
            <Txt variant="h2" style={{ fontSize: 22 }}>Enter join code</Txt>
            <Txt variant="muted" style={{ marginTop: 4, marginBottom: 16 }}>
              Type the registration code for {joiningCourse?.code}.
            </Txt>
            <Field label="Join code" icon="hash" placeholder="e.g. ZKFP8G" autoCapitalize="characters" value={codeVal} onChangeText={setCodeVal} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="ghost" onPress={() => setJoiningCourse(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Join" onPress={submitJoinCode} loading={joinBusy} />
              </View>
            </View>
          </Sheet>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
