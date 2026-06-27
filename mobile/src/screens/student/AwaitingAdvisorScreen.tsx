import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, Button, Avatar, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useCurrentContext, useMyRegistration } from "@/hooks/queries";
import { offeringsApi } from "@/api/endpoints";
import { useQuery } from "@tanstack/react-query";
import type { RootScreen } from "@/navigation/types";

/** Student · Awaiting advisor (design 84): registration pending approval. */
export default function AwaitingAdvisorScreen({ navigation }: RootScreen<"AwaitingAdvisor">) {
  const { palette, scheme } = useTheme();
  const { data: ctx } = useCurrentContext();
  const { data: reg, isLoading } = useMyRegistration(ctx?.semester.id ?? "");

  const { data: offerings } = useQuery({
    queryKey: ["offerings", ctx?.semester.id],
    queryFn: () => offeringsApi.list(ctx?.semester.id),
    enabled: !!ctx?.semester.id,
  });

  const totalUnits = reg?.total_credit_units ?? 0;
  const cap = ctx?.semester.credit_unit_cap ?? 24;

  const submittedOfferings = (reg?.items ?? []).map((item) => {
    const match = offerings?.find((o) => o.id === item.offering_id);
    return match ?? { id: item.offering_id, code: "—", title: "Loading…", credit_units: 0 };
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  const statusLabel =
    reg?.status === "active" ? "Approved" : reg?.status === "rejected" ? "Returned" : "Reviewing";
  const statusAccent =
    reg?.status === "active" ? "mint" : reg?.status === "rejected" ? "peach" : "lemon";

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Registration</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: palette.accents.lemon.bg, alignItems: "center", justifyContent: "center" }}>
            <Icon name="clock" size={38} color={palette.accents.lemon.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 16 }}>Sent for approval</Txt>
          <Txt variant="muted" style={{ fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21, maxWidth: 280 }}>
            Your advisor reviews the whole registration before it's locked in.
          </Txt>
        </View>

        {reg && (
          <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <Avatar name="Advisor" size={42} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Academic Advisor</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>
                {ctx?.semester.term === "first" ? "First" : "Second"} Semester · {ctx?.session.name}
              </Txt>
            </View>
            <StatusPill label={statusLabel} accent={statusAccent} />
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>SUBMITTED</Txt>
          <Txt style={{ fontSize: 12, ...font(700), color: palette.accents.mint.fg }}>{totalUnits} / {cap} units</Txt>
        </View>

        {submittedOfferings.length === 0 ? (
          <Txt variant="muted" style={{ textAlign: "center", marginTop: 8 }}>No courses submitted yet.</Txt>
        ) : (
          <View style={{ gap: 8 }}>
            {submittedOfferings.map((o) => (
              <View key={o.id} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 11, opacity: 0.92, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accents.lemon.fg }} />
                <Txt style={{ width: 56, fontSize: 13, ...font(800), color: palette.textMuted }}>{o.code ?? "—"}</Txt>
                <Txt style={{ flex: 1, fontSize: 12.5, ...font(600), color: palette.textMuted }}>{o.title ?? "—"}</Txt>
                <StatusPill label={reg?.status === "active" ? "Approved" : "Pending"} accent={reg?.status === "active" ? "mint" : "lemon"} />
              </View>
            ))}
          </View>
        )}

        {reg?.status !== "active" && (
          <View style={{ marginTop: 18 }}>
            <Button title="Edit while window is open" variant="ghost" onPress={() => navigation.navigate("RegisterCourses")} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
