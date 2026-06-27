import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, Toggle, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useCourses, useCurrentContext, useOfferings } from "@/hooks/queries";
import { offeringsApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import type { CourseOut, OfferingOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

const CLONE_OPTS = [
  "Copy week structure + restriction defaults",
  "Copy teaching team (lecturers)",
];

/** Admin · Add offering + clone (design 79): catalog course → offering with optional clone. */
export default function AddOfferingScreen({ route, navigation }: RootScreen<"AddOffering">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: ctx } = useCurrentContext();
  const { data: existingOfferings } = useOfferings(ctx?.semester.id);

  const [selectedCourse, setSelectedCourse] = useState<CourseOut | null>(null);
  const [sourceOffering, setSourceOffering] = useState<OfferingOut | null>(null);
  const [clone, setClone] = useState(false);
  const [opts, setOpts] = useState<boolean[]>([false, false]);
  const [busy, setBusy] = useState(false);

  // Pre-select if launched from a course
  const prefilledCourse = useMemo(() => {
    if (route.params?.offeringId && existingOfferings) {
      return existingOfferings.find((o) => o.id === route.params!.offeringId) ?? null;
    }
    return null;
  }, [route.params, existingOfferings]);

  const displayCourse = selectedCourse ?? (prefilledCourse ? ({ id: prefilledCourse.course_id, code: prefilledCourse.code ?? "", title: prefilledCourse.title ?? "" } as CourseOut) : null);

  const semLabel = ctx
    ? `${ctx.semester.term === "first" ? "First" : "Second"} Semester · ${ctx.session.name}`
    : "Current semester";

  async function handleCreate() {
    if (!displayCourse) return Alert.alert("Required", "Select a course first.");
    if (!ctx) return Alert.alert("Error", "No active semester found.");
    setBusy(true);
    try {
      const offering = await offeringsApi.create({
        course_id: displayCourse.id,
        semester_id: ctx.semester.id,
      });
      if (clone && sourceOffering) {
        await offeringsApi.clone(offering.id, {
          source_offering_id: sourceOffering.id,
          opt_copy_settings: opts[0],
          opt_copy_team: opts[1],
        });
      }
      qc.invalidateQueries({ queryKey: ["offerings"] });
      Alert.alert("Offering created", `${displayCourse.code} has been added as a draft offering.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not create offering.");
    } finally {
      setBusy(false);
    }
  }

  if (loadingCourses) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 12 }}>Add offering</Txt>
        <Txt style={{ fontSize: 13, ...font(700), color: palette.textMuted }}>{semLabel}</Txt>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>CATALOG COURSE</Txt>
        {displayCourse ? (
          <Pressable
            onPress={() => setSelectedCourse(null)}
            style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderColor: palette.text, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: palette.accents[accentFor(displayCourse.id)].bg, alignItems: "center", justifyContent: "center" }}>
              <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accentFor(displayCourse.id)].fg }}>
                {(displayCourse.code ?? "").slice(0, 3)}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14, ...font(800), color: palette.text }}>
                {displayCourse.code} · {displayCourse.title}
              </Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>
                {displayCourse.credit_units ? `${displayCourse.credit_units} units` : "Tap to change"}
              </Txt>
            </View>
            <Icon name="chev" size={18} color={palette.textFaint} />
          </Pressable>
        ) : (
          <View style={{ gap: 8 }}>
            {(courses ?? []).slice(0, 12).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCourse(c)}
                style={{ backgroundColor: palette.card, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents[accentFor(c.id)].bg, alignItems: "center", justifyContent: "center" }}>
                  <Txt style={{ fontSize: 11, ...font(800), color: palette.accents[accentFor(c.id)].fg }}>{c.code.slice(0, 3)}</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{c.code} · {c.title}</Txt>
                  {c.credit_units ? <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{c.credit_units} units</Txt> : null}
                </View>
              </Pressable>
            ))}
            {!courses?.length && <Txt variant="muted">No courses in catalog.</Txt>}
          </View>
        )}

        <View style={{ marginTop: 18, backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <Icon name="refresh" size={18} color={palette.accents.lilac.fg} />
              <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>Clone from previous</Txt>
            </View>
            <Toggle value={clone} onValueChange={setClone} />
          </View>
          {clone && (
            existingOfferings && existingOfferings.length > 0 ? (
              <View style={{ gap: 6, marginTop: 12 }}>
                {existingOfferings.slice(0, 5).map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={() => setSourceOffering(o)}
                    style={{ backgroundColor: sourceOffering?.id === o.id ? palette.accents.mint.bg : palette.field, borderRadius: 12, padding: 11, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 }}
                  >
                    <TinyIcon icon="calendar" accent={sourceOffering?.id === o.id ? "mint" : "lemon"} size={36} iconSize={18} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>{o.code ?? "Course"}</Txt>
                      <Txt variant="faint" style={{ fontSize: 11, ...font(600), marginTop: 1 }}>{o.session_name ?? ""}</Txt>
                    </View>
                    {sourceOffering?.id === o.id && <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />}
                  </Pressable>
                ))}
              </View>
            ) : (
              <Txt variant="muted" style={{ marginTop: 10 }}>No previous offerings to clone from.</Txt>
            )
          )}
        </View>

        {clone && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>OPTIONAL — OFF BY DEFAULT</Txt>
            <View style={{ gap: 8 }}>
              {CLONE_OPTS.map((label, i) => (
                <Pressable key={label} onPress={() => setOpts((o) => o.map((v, j) => j === i ? !v : v))} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: opts[i] ? palette.text : palette.border, backgroundColor: opts[i] ? palette.text : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {opts[i] ? <Icon name="check" size={13} color={palette.primaryText} width={2.6} /> : null}
                  </View>
                  <Txt style={{ flex: 1, fontSize: 13, ...font(700), color: palette.text }}>{label}</Txt>
                </Pressable>
              ))}
              <View style={{ backgroundColor: palette.accents.peach.bg, borderRadius: 12, padding: 11, paddingHorizontal: 13, flexDirection: "row", gap: 9, alignItems: "flex-start", marginTop: 2 }}>
                <Icon name="shield" size={16} color={palette.accents.peach.fg} />
                <Txt style={{ flex: 1, fontSize: 11.5, ...font(600), lineHeight: 16, color: palette.text }}>Cloned as drafts. Enrollment & download counts are never copied.</Txt>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <Button
          title={clone && sourceOffering ? "Create offering · clone materials" : "Create offering"}
          loading={busy}
          onPress={handleCreate}
        />
      </View>
    </View>
  );
}
