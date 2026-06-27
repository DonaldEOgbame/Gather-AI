import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, Avatar, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useCurrentContext, usePendingRegistrations } from "@/hooks/queries";
import { registrationApi, offeringsApi } from "@/api/endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { StudentRegistrationOut, OfferingOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

/** Advisor/HOD · Registration approval (design 85): per-student registration review. */
export default function AdvisorApprovalScreen({ route }: RootScreen<"AdvisorApproval">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const { data: ctx, isLoading: loadingCtx } = useCurrentContext();
  const semId = ctx?.semester.id ?? "";

  const { data: pending, isLoading: loadingPending } = usePendingRegistrations(semId);

  const { data: offerings } = useQuery<OfferingOut[]>({
    queryKey: ["offerings", semId],
    queryFn: () => offeringsApi.list(semId),
    enabled: !!semId,
  });

  const [tab, setTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [acting, setActing] = useState<string | null>(null);

  async function act(reg: StudentRegistrationOut, approve: boolean) {
    setActing(reg.id);
    try {
      await registrationApi.actOnApproval(reg.id, { approve });
      qc.invalidateQueries({ queryKey: ["pending-registrations", semId] });
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Action failed.");
    } finally {
      setActing(null);
    }
  }

  const isLoading = loadingCtx || loadingPending;
  const displayed = (pending ?? []).filter((r) => {
    if (tab === "Pending") return r.status === "advisor_pending";
    if (tab === "Approved") return r.status === "active";
    return r.status === "rejected";
  });

  const courseCodesFor = (reg: StudentRegistrationOut) =>
    reg.items.map((item) => offerings?.find((o) => o.id === item.offering_id)?.code ?? "…").filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Approvals</Txt>
        {ctx && (
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {ctx.semester.term === "first" ? "First" : "Second"} Semester · {ctx.session.name}
          </Txt>
        )}
        <View style={{ marginTop: 16 }}>
          <ChipRow>
            {(["Pending", "Approved", "Rejected"] as const).map((t) => {
              const count =
                t === "Pending"
                  ? (pending ?? []).filter((r) => r.status === "advisor_pending").length
                  : t === "Approved"
                  ? (pending ?? []).filter((r) => r.status === "active").length
                  : (pending ?? []).filter((r) => r.status === "rejected").length;
              return (
                <Chip
                  key={t}
                  label={count > 0 ? `${t} ${count}` : t}
                  selected={tab === t}
                  onPress={() => setTab(t)}
                />
              );
            })}
          </ChipRow>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : displayed.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Txt variant="muted" style={{ textAlign: "center" }}>No {tab.toLowerCase()} registrations.</Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
          {displayed.map((reg) => {
            const codes = courseCodesFor(reg);
            const isOver = reg.total_credit_units > (ctx?.semester.credit_unit_cap ?? 24);
            const isActing = acting === reg.id;
            return (
              <View key={reg.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={reg.student_id} size={44} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>Student</Txt>
                    <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>
                      {reg.items.length} courses selected
                    </Txt>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Txt style={{ fontSize: 18, ...font(800), color: isOver ? palette.danger : palette.text }}>
                      {reg.total_credit_units}
                    </Txt>
                    <Txt style={{ fontSize: 10.5, ...font(700), color: palette.textFaint }}>units</Txt>
                  </View>
                </View>

                <View style={{ backgroundColor: isOver ? palette.accents.peach.bg : palette.accents.mint.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Icon name={isOver ? "shield" : "check"} size={16} color={isOver ? palette.accents.peach.fg : palette.accents.mint.fg} width={2.4} />
                  <Txt style={{ fontSize: 12, ...font(600), color: palette.text }}>
                    {isOver
                      ? `${reg.total_credit_units} units — over the ${ctx?.semester.credit_unit_cap ?? 24}-unit cap`
                      : `Within ${ctx?.semester.credit_unit_cap ?? 24}-unit cap${reg.is_late ? " · late registration" : ""}`}
                  </Txt>
                </View>

                {codes.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                    {codes.map((c, i) => (
                      <View key={i} style={{ backgroundColor: palette.field, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <Txt style={{ fontSize: 11.5, ...font(700), color: palette.textMuted }}>{c}</Txt>
                      </View>
                    ))}
                  </View>
                )}

                {tab === "Pending" && (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <Pressable
                      disabled={isActing}
                      onPress={() => act(reg, true)}
                      style={{ flex: 1.4, alignItems: "center", justifyContent: "center", backgroundColor: isActing ? palette.border : palette.primary, borderRadius: 12, paddingVertical: 12 }}
                    >
                      <Txt style={{ fontSize: 14, ...font(700), color: palette.primaryText }}>
                        {isActing ? "…" : "Approve registration"}
                      </Txt>
                    </Pressable>
                    <Pressable
                      disabled={isActing}
                      onPress={() => act(reg, false)}
                      style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: palette.border, paddingVertical: 12 }}
                    >
                      <Txt style={{ fontSize: 14, ...font(700), color: palette.textMuted }}>Return</Txt>
                    </Pressable>
                  </View>
                )}

                {tab === "Approved" && (
                  <View style={{ marginTop: 10, backgroundColor: palette.accents.mint.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Txt style={{ fontSize: 12, ...font(600), color: palette.accents.mint.fg }}>
                      Approved{reg.approved_at ? ` · ${new Date(reg.approved_at).toLocaleDateString()}` : ""}
                    </Txt>
                  </View>
                )}

                {tab === "Rejected" && (
                  <View style={{ marginTop: 10, backgroundColor: palette.accents.peach.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Txt style={{ fontSize: 12, ...font(600), color: palette.accents.peach.fg }}>Returned for revision</Txt>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
