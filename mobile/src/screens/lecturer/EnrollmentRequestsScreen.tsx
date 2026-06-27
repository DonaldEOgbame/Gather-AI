import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, Button, Avatar, StatusPill } from "@/components/ui";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useEnrollments } from "@/hooks/queries";
import { enrollmentApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";

/** Lecturer · Enrollment requests (design 53): approve/reject the join queue. */
export default function EnrollmentRequestsScreen({ route }: RootScreen<"EnrollmentRequests">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";

  const { data: enrollments = [], isLoading } = useEnrollments(offeringId);
  const pending = enrollments.filter((e) => e.status === "pending");

  const act = async (requestId: string, approve: boolean) => {
    try {
      await enrollmentApi.actOnRequest(requestId, approve);
      await qc.invalidateQueries({ queryKey: ["enrollments", offeringId] });
    } catch { /* ignore */ }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Requests</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
          <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>{pending.length} students waiting</Txt>
          <StatusPill label="Approval mode" accent="lemon" />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
          {pending.map((e) => (
            <View key={e.enrollment_id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 15, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={e.full_name} size={42} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{e.full_name}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{e.matric_or_staff_id ?? e.email}</Txt>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Approve" onPress={() => act(e.enrollment_id, true)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Reject" variant="danger-ghost" onPress={() => act(e.enrollment_id, false)} />
                </View>
              </View>
            </View>
          ))}
          {pending.length === 0 && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>All caught up — no pending requests.</Txt>
          )}
        </ScrollView>
      )}
    </View>
  );
}
