import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { PendingApprovalOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

/** Super-admin · Tenant onboarding queue (design 81): provision institutions. */
export default function TenantQueueScreen({ navigation }: RootScreen<"TenantQueue">) {
  const { palette } = useTheme();
  const [pending, setPending] = useState<PendingApprovalOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await authApi.pendingApprovals();
      setPending(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load pending approvals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(item: PendingApprovalOut, action: "approve" | "reject") {
    setActing(item.id);
    try {
      await authApi.actOnApproval(item.id, action);
      setPending((prev) => prev.filter((p) => p.id !== item.id));
      Alert.alert(
        action === "approve" ? "Approved" : "Declined",
        action === "approve"
          ? `${item.full_name}'s request approved.`
          : `${item.full_name}'s request declined.`
      );
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Action failed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Access requests</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Pending user approvals</Txt>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <InfoCard accent="lilac" icon="shield" text="Approve or decline self-registration requests. Approved users become active immediately." />

          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>
            PENDING VERIFICATION ({pending.length})
          </Txt>

          {pending.length === 0 ? (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 16 }}>No pending requests.</Txt>
          ) : (
            <View style={{ gap: 11 }}>
              {pending.map((item) => {
                const accent = accentFor(item.id);
                const isActing = acting === item.id;
                return (
                  <View key={item.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 15, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                        <Icon name="user" size={22} color={palette.accents[accent].fg} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{item.full_name}</Txt>
                        <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{item.email}</Txt>
                      </View>
                    </View>
                    <View style={{ marginTop: 11, backgroundColor: palette.field, borderRadius: 10, padding: 8, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon name="user" size={15} color={palette.textFaint} />
                      <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>
                        Requested role: {item.requested_role}
                        {item.matric_or_staff_id ? ` · ID: ${item.matric_or_staff_id}` : ""}
                      </Txt>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                      <Pressable
                        disabled={isActing}
                        onPress={() => act(item, "approve")}
                        style={{ flex: 1.4, borderRadius: 12, backgroundColor: isActing ? palette.border : palette.text, alignItems: "center", paddingVertical: 11 }}
                      >
                        <Txt style={{ fontSize: 13.5, ...font(700), color: "#fff" }}>Approve</Txt>
                      </Pressable>
                      <Pressable
                        disabled={isActing}
                        onPress={() => act(item, "reject")}
                        style={{ flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", paddingVertical: 11 }}
                      >
                        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.textMuted }}>Decline</Txt>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
