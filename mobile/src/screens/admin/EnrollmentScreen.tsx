import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, View } from "react-native";
import { Txt, Segmented, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { QRCode } from "@/components/QRCode";
import { useTheme, font } from "@/theme";
import { registrationApi, enrollmentApi } from "@/api/endpoints";
import { useEnrollments } from "@/hooks/queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RootScreen } from "@/navigation/types";

/** Admin/lecturer · Enrollment (design 47): mode + join code/QR + approvals. */
export default function EnrollmentScreen({ route }: RootScreen<"Enrollment">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";
  const title = route.params?.title ?? "Intro to CS";
  const [mode, setMode] = useState<"roster" | "code" | "approved">("code");
  const [acting, setActing] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const { data: enrollments, isLoading } = useEnrollments(offeringId);
  const { data: joinCode, refetch: refetchCode } = useQuery({
    queryKey: ["join-code", offeringId],
    queryFn: () => registrationApi.createJoinCode(offeringId, { expires_in_hours: 168, max_uses: 200 }),
    enabled: false,
  });

  const pending = (enrollments ?? []).filter((e) => e.status === "pending");
  const active = (enrollments ?? []).filter((e) => e.status === "active");

  async function generateCode() {
    if (!offeringId) return;
    setGeneratingCode(true);
    try {
      await refetchCode();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not generate join code.");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function actOnEnrollment(enrollmentId: string, approve: boolean, name: string) {
    setActing(enrollmentId);
    try {
      await enrollmentApi.actOnRequest(enrollmentId, approve);
      qc.invalidateQueries({ queryKey: ["enrollments", offeringId] });
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? `Could not ${approve ? "approve" : "reject"} enrollment.`);
    } finally {
      setActing(null);
    }
  }

  const displayCode = joinCode?.code ?? "—";

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Enrollment</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.textMuted }}>{code} · {title}</Txt>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>ENROLLMENT MODE</Txt>
        <Segmented
          value={mode}
          onChange={(k) => setMode(k)}
          options={[{ key: "roster", label: "Roster" }, { key: "code", label: "Code" }, { key: "approved", label: "Approved" }]}
        />

        {mode === "code" && (
          <View style={{ backgroundColor: palette.card, borderRadius: 20, padding: 18, marginTop: 18, alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            {joinCode ? (
              <>
                <QRCode size={132} />
                <Pressable
                  onPress={() => Share.share({ message: `Join code: ${displayCode}` })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.field, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }}
                >
                  <Txt style={{ fontSize: 22, ...font(800), color: palette.text, letterSpacing: 4 }}>{displayCode}</Txt>
                  <Icon name="share" size={18} color={palette.textFaint} />
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <StatusPill label="Expires in 7d" accent="lemon" />
                  <StatusPill label={`0 / ${joinCode.max_uses} used`} accent="sky" />
                </View>
              </>
            ) : (
              <Pressable
                onPress={generateCode}
                disabled={generatingCode}
                style={{ paddingVertical: 16, paddingHorizontal: 24, backgroundColor: palette.primary, borderRadius: 999 }}
              >
                <Txt style={{ fontSize: 14, ...font(700), color: palette.primaryText }}>
                  {generatingCode ? "Generating…" : "Generate join code"}
                </Txt>
              </Pressable>
            )}
          </View>
        )}

        {mode === "approved" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>ENROLLED ({active.length})</Txt>
            </View>
            {isLoading ? (
              <ActivityIndicator color={palette.text} />
            ) : active.length === 0 ? (
              <Txt variant="muted" style={{ textAlign: "center" }}>No enrolled students yet.</Txt>
            ) : (
              <View style={{ gap: 8 }}>
                {active.map((e) => (
                  <View key={e.enrollment_id} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <Avatar name={e.full_name} size={38} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{e.full_name}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{e.matric_or_staff_id ?? e.email}</Txt>
                    </View>
                    <StatusPill label="Enrolled" accent="mint" />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {mode === "roster" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 8 }}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>PENDING ({pending.length})</Txt>
            </View>
            {isLoading ? (
              <ActivityIndicator color={palette.text} />
            ) : pending.length === 0 ? (
              <Txt variant="muted" style={{ textAlign: "center" }}>No pending requests.</Txt>
            ) : (
              <View style={{ gap: 8 }}>
                {pending.map((e) => {
                  const isActing = acting === e.enrollment_id;
                  return (
                    <View key={e.enrollment_id} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                      <Avatar name={e.full_name} size={38} />
                      <View style={{ flex: 1 }}>
                        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{e.full_name}</Txt>
                        <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>{e.matric_or_staff_id ?? e.email}</Txt>
                      </View>
                      {isActing ? (
                        <ActivityIndicator color={palette.text} />
                      ) : (
                        <>
                          <Pressable onPress={() => actOnEnrollment(e.enrollment_id, true, e.full_name)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center" }}>
                            <Icon name="check" size={18} color={palette.accents.mint.fg} width={2.4} />
                          </Pressable>
                          <Pressable onPress={() => actOnEnrollment(e.enrollment_id, false, e.full_name)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: palette.field, alignItems: "center", justifyContent: "center" }}>
                            <Txt style={{ fontSize: 15, ...font(800), color: palette.textFaint }}>✕</Txt>
                          </Pressable>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
