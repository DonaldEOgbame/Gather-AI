import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View, ScrollView, RefreshControl, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, EmptyState, Chip, ChipRow, Button, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { accentFor, useTheme, font } from "@/theme";
import { useOfferings } from "@/hooks/queries";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/stores/auth";
import { enrollmentApi } from "@/api/endpoints";
import type { OfferingOut } from "@/api/types";

/** Course list row from the design catalog: accent code-tile + meta + right slot. */
function CourseRow({ code, title, sub, accent, right, onPress }: { code: string; title: string; sub?: string; accent: ReturnType<typeof accentFor>; right?: React.ReactNode; onPress?: () => void }) {
  const { palette } = useTheme();
  const a = palette.accents[accent];
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
        shadowColor: "#141928",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      })}
    >
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>
        <Txt style={{ fontSize: 13, ...font(800), color: a.fg }}>{code.slice(0, 3)}</Txt>
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

/** Module 8 · design 08: shared Courses tab — enrolled (student) or assigned (lecturer). */
export default function CoursesTab() {
  const { palette } = useTheme();
  const { data, isLoading, refetch } = useOfferings();
  const nav = useNavigation<any>();
  const role = useAuth((s) => s.user?.global_role);
  const [subject, setSubject] = useState<string | null>(null);

  const [joiningCourse, setJoiningCourse] = useState<OfferingOut | null>(null);
  const [codeVal, setCodeVal] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((c) => {
      const m = (c.code ?? "").match(/^[A-Za-z]+/);
      if (m) s.add(m[0].toUpperCase());
    });
    return [...s].sort();
  }, [data]);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => !subject || (c.code ?? "").toUpperCase().startsWith(subject)),
    [data, subject]
  );

  const enrolledCourses = useMemo(() => filtered.filter((c) => c.enrollment_status === "active"), [filtered]);
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
        <Txt variant="title">Courses</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>
          {isStudent ? `${enrolledCourses.length} enrolled` : `${filtered.length} assigned`}
        </Txt>
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
                    <Pressable onPress={() => handleJoinPress(item)} accessibilityRole="button" style={{ backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}>
                      <Txt style={{ color: palette.primaryText, fontSize: 13, ...font(700) }}>{item.enrollment_mode === "code" ? "Enter code" : "Join"}</Txt>
                    </Pressable>
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
        <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
