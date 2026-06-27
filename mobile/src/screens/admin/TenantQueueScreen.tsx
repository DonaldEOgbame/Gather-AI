import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { coursesApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

type AccessRequest = {
  id: string;
  contact_name: string;
  contact_email: string;
  institution_name: string;
  status: string;
  created_at: string;
};

/** Super-admin · Tenant onboarding queue (design 81): provision institutions + mint first Admin. */
export default function TenantQueueScreen(_: RootScreen<"TenantQueue">) {
  const { palette, scheme } = useTheme();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await coursesApi.listAccessRequests();
      setRequests(data.filter((r) => r.status === "pending"));
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load access requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function approve(req: AccessRequest) {
    Alert.alert(
      "Provision institution",
      `Create "${req.institution_name}" and mint ${req.contact_email} as its first Admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Provision · mint Admin",
          onPress: async () => {
            setActing(req.id);
            try {
              await coursesApi.provisionInstitution({
                name: req.institution_name,
                admin_email: req.contact_email,
                admin_full_name: req.contact_name,
              });
              setRequests((prev) => prev.filter((r) => r.id !== req.id));
              Alert.alert("Provisioned", `${req.institution_name} is live. Its admin has been invited.`);
            } catch (e: any) {
              Alert.alert("Failed", e?.message ?? "Could not provision institution.");
            } finally {
              setActing(null);
            }
          },
        },
      ]
    );
  }

  function decline(req: AccessRequest) {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Access requests</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Super-admin · UniPortal</Txt>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <InfoCard accent="lilac" icon="shield" text="Invite-only. You provision each institution after a conversation and mint its first Admin." />

          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>
            PENDING VERIFICATION ({requests.length})
          </Txt>

          {requests.length === 0 ? (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 16 }}>No pending access requests.</Txt>
          ) : (
            <View style={{ gap: 11 }}>
              {requests.map((req) => {
                const accent = accentFor(req.id);
                const isActing = acting === req.id;
                const domain = req.contact_email.includes("@") ? req.contact_email.split("@")[1] : req.contact_email;
                return (
                  <View key={req.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 15, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                        <Icon name="building" size={22} color={palette.accents[accent].fg} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{req.institution_name}</Txt>
                        <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{domain}</Txt>
                      </View>
                    </View>
                    <View style={{ marginTop: 11, backgroundColor: palette.field, borderRadius: 10, padding: 8, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon name="user" size={15} color={palette.textFaint} />
                      <Txt style={{ fontSize: 12, ...font(700), color: palette.textMuted }}>{req.contact_name} · {req.contact_email}</Txt>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                      <Pressable
                        disabled={isActing}
                        onPress={() => approve(req)}
                        style={{ flex: 1.4, borderRadius: 12, backgroundColor: isActing ? palette.border : palette.text, alignItems: "center", paddingVertical: 11 }}
                      >
                        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.primaryText }}>{isActing ? "…" : "Approve · mint Admin"}</Txt>
                      </Pressable>
                      <Pressable
                        disabled={isActing}
                        onPress={() => decline(req)}
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
