import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useCurrentContext, useRegistrationOfferings } from "@/hooks/queries";
import { registrationApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import type { OfferingOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

/** Student · Register courses (design 83): credit-capped course selection. */
export default function RegisterCoursesScreen({ navigation }: RootScreen<"RegisterCourses">) {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const { data: ctx, isLoading: loadingCtx } = useCurrentContext();
  const { data: offerings, isLoading: loadingOfferings } = useRegistrationOfferings(ctx?.semester.id ?? "");
  const [selected, setSelected] = useState<OfferingOut[]>([]);
  const [busy, setBusy] = useState(false);

  const semLabel = ctx
    ? `${ctx.semester.term === "first" ? "First" : "Second"} Semester · ${ctx.session.name}`
    : "Current semester";

  const cap = ctx?.semester.credit_unit_cap ?? 24;

  const totalUnits = useMemo(
    () => selected.reduce((n, o) => n + (o.credit_units ?? 0), 0),
    [selected]
  );
  const pct = Math.min((totalUnits / cap) * 100, 100);

  const available = useMemo(
    () => (offerings ?? []).filter((o) => o.enrollment_status !== "active"),
    [offerings]
  );

  function toggle(offering: OfferingOut) {
    setSelected((prev) => {
      const already = prev.some((o) => o.id === offering.id);
      if (already) return prev.filter((o) => o.id !== offering.id);
      const newUnits = totalUnits + (offering.credit_units ?? 0);
      if (newUnits > cap) {
        navigation.navigate("OverTheCap");
        return prev;
      }
      return [...prev, offering];
    });
  }

  async function handleSubmit() {
    if (!ctx) return Alert.alert("Error", "No active semester.");
    if (selected.length === 0) return Alert.alert("None selected", "Select at least one course.");
    setBusy(true);
    try {
      await registrationApi.submit({
        semester_id: ctx.semester.id,
        offering_ids: selected.map((o) => o.id),
      });
      qc.invalidateQueries({ queryKey: ["my-registration", ctx.semester.id] });
      qc.invalidateQueries({ queryKey: ["registration-offerings", ctx.semester.id] });
      navigation.navigate("AwaitingAdvisor");
    } catch (e: any) {
      Alert.alert("Registration failed", e?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loadingCtx || loadingOfferings) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Register courses</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>{semLabel}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {ctx?.semester.registration_open === false && (
          <View style={{ backgroundColor: palette.accents.peach.bg, borderRadius: 14, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start", marginBottom: 12 }}>
            <Icon name="clock" size={19} color={palette.accents.peach.fg} />
            <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(700), color: palette.text }}>
              Registration is currently closed for this semester.
            </Txt>
          </View>
        )}

        {ctx?.semester.registration_open && (
          <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
            <Icon name="clock" size={19} color={palette.accents.lemon.fg} />
            <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(700), color: palette.text }}>
              Registration is open. Select your courses for this semester.
            </Txt>
          </View>
        )}

        {/* Units meter */}
        <View style={{ backgroundColor: palette.primary, borderRadius: 18, padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Txt style={{ fontSize: 22, ...font(800), color: "#fff" }}>{totalUnits} units</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: "rgba(255,255,255,0.6)" }}>cap {cap}</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 11, overflow: "hidden" }}>
            <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: "#fff" }} />
          </View>
          <Txt style={{ fontSize: 11.5, ...font(600), color: "rgba(255,255,255,0.65)", marginTop: 9 }}>
            {Math.max(cap - totalUnits, 0)} units left
          </Txt>
        </View>

        {/* Selected */}
        {selected.length > 0 && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>SELECTED</Txt>
              <Txt variant="muted" style={{ fontSize: 12 }}>{selected.length} course{selected.length !== 1 ? "s" : ""}</Txt>
            </View>
            <View style={{ gap: 9 }}>
              {selected.map((item) => (
                <View key={item.id} style={{ backgroundColor: palette.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents[accentFor(item.id)].bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 11, ...font(800), color: palette.accents[accentFor(item.id)].fg }}>{(item.code ?? "").slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{item.code} · {item.title}</Txt>
                    <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{item.credit_units ?? 0} units</Txt>
                  </View>
                  <Pressable onPress={() => toggle(item)} hitSlop={8}>
                    <Txt style={{ fontSize: 15, ...font(800), color: palette.textFaint }}>✕</Txt>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Available */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>AVAILABLE TO ADD</Txt>
        </View>
        {!available.length ? (
          <EmptyState icon="book" title="No courses available" body="No open offerings for this semester." />
        ) : (
          <View style={{ gap: 9 }}>
            {available.map((item) => {
              const isSelected = selected.some((s) => s.id === item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggle(item)}
                  style={{ backgroundColor: palette.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: isSelected ? 2 : 0, borderColor: palette.primary, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents[accentFor(item.id)].bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 11, ...font(800), color: palette.accents[accentFor(item.id)].fg }}>{(item.code ?? "").slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{item.code} · {item.title}</Txt>
                    <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{item.credit_units ?? 0} units</Txt>
                  </View>
                  {isSelected && <Icon name="check" size={18} color={palette.primary} width={2.4} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, borderTopColor: palette.border, borderTopWidth: 1 }}>
        <Button title="Submit to advisor" loading={busy} onPress={handleSubmit} />
      </View>
    </View>
  );
}
