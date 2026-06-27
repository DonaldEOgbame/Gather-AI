import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, InfoCard, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useOfferings, useInstitutionUsers } from "@/hooks/queries";
import { offeringsApi } from "@/api/endpoints";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { OfferingOut, UserOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

/** Admin · Lecturer handover (design 101): reassign offerings before offboarding. */
export default function HandoverScreen({ route }: RootScreen<"Handover">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const lecturerId = route.params?.lecturerId;

  // Fetch all offerings so we can find ones owned by this lecturer
  const { data: allOfferings, isLoading: loadingOfferings } = useOfferings();
  const { data: allUsers, isLoading: loadingUsers } = useInstitutionUsers("lecturer");

  const targetUser = (allUsers ?? []).find((u) => u.id === lecturerId);

  // For each offering the target lecturer is on, check if they're owner
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // offeringId -> newOwnerId
  const [acting, setActing] = useState<string | null>(null);

  // Offerings where this user is a lecturer (we need to check lecturer entries)
  // Since we don't have a direct query, filter by checking offering rosters
  const { data: lecturerOfferings, isLoading: loadingRosters } = useQuery<{ offering: OfferingOut; isOwner: boolean }[]>({
    queryKey: ["lecturer-offerings", lecturerId],
    queryFn: async () => {
      if (!lecturerId || !allOfferings) return [];
      const results: { offering: OfferingOut; isOwner: boolean }[] = [];
      for (const off of allOfferings) {
        try {
          const roster = await offeringsApi.listLecturers(off.id);
          const entry = roster.find((r) => r.lecturer_id === lecturerId);
          if (entry) {
            results.push({ offering: off, isOwner: entry.is_owner });
          }
        } catch {
          /* skip */
        }
      }
      return results;
    },
    enabled: !!lecturerId && !!allOfferings,
  });

  const ownedOfferings = (lecturerOfferings ?? []).filter((lo) => lo.isOwner);
  const remaining = ownedOfferings.filter((lo) => !assignments[lo.offering.id]);

  async function assign(offering: OfferingOut, newOwner: UserOut) {
    setActing(offering.id);
    try {
      // Add the new lecturer as owner (or update existing)
      const roster = await offeringsApi.listLecturers(offering.id);
      const existing = roster.find((r) => r.lecturer_id === newOwner.id);
      if (!existing) {
        await offeringsApi.addLecturer(offering.id, {
          lecturer_id: newOwner.id,
          is_owner: true,
          can_publish: true,
          can_manage_roster: true,
        });
      }
      setAssignments((prev) => ({ ...prev, [offering.id]: newOwner.id }));
      qc.invalidateQueries({ queryKey: ["roster", offering.id] });
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not assign owner.");
    } finally {
      setActing(null);
    }
  }

  function pickNewOwner(offering: OfferingOut) {
    const candidates = (allUsers ?? []).filter((u) => u.id !== lecturerId);
    if (candidates.length === 0) {
      return Alert.alert("No other lecturers", "Add another lecturer to the institution first.");
    }
    Alert.alert(
      "Assign new owner",
      `Select new owner for ${offering.code ?? offering.id}`,
      [
        { text: "Cancel", style: "cancel" },
        ...candidates.slice(0, 3).map((u) => ({
          text: u.display_name ?? u.full_name,
          onPress: () => assign(offering, u),
        })),
      ]
    );
  }

  const isLoading = loadingOfferings || loadingUsers || loadingRosters;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Remove lecturer</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
          <Avatar name={targetUser?.full_name ?? "Lecturer"} size={52} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>
              {targetUser?.full_name ?? (lecturerId ? "Lecturer" : "Select a lecturer")}
            </Txt>
            <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 2 }}>
              {ownedOfferings.length > 0 ? `Owner of ${ownedOfferings.length} offering${ownedOfferings.length !== 1 ? "s" : ""}` : "No owned offerings"}
            </Txt>
          </View>
        </View>

        {ownedOfferings.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <InfoCard accent="peach" icon="shield" text={`${targetUser?.full_name ?? "This lecturer"} owns ${ownedOfferings.length} offering${ownedOfferings.length !== 1 ? "s" : ""}. Reassign them before removing — materials stay intact.`} />
          </View>
        )}

        {isLoading ? (
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <ActivityIndicator color={palette.text} />
          </View>
        ) : ownedOfferings.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <Txt variant="muted">{lecturerId ? "No owned offerings found." : "No lecturer selected."}</Txt>
          </View>
        ) : (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>NEEDS A NEW OWNER</Txt>
            <View style={{ gap: 9 }}>
              {ownedOfferings.map(({ offering }) => {
                const newOwnerId = assignments[offering.id];
                const newOwner = newOwnerId ? (allUsers ?? []).find((u) => u.id === newOwnerId) : null;
                const isReady = !!newOwnerId;
                const isActing = acting === offering.id;
                const accent = accentFor(offering.id);
                return (
                  <View key={offering.id} style={{ backgroundColor: palette.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: isReady ? 1.5 : 0, borderColor: palette.accents.mint.fg, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                      <Txt style={{ fontSize: 11, ...font(800), color: palette.accents[accent].fg }}>
                        {(offering.code ?? "?").slice(0, 3)}
                      </Txt>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>
                        {offering.code} · {offering.title}
                      </Txt>
                      <Txt style={{ fontSize: 11.5, ...font(700), marginTop: 2, color: isReady ? palette.accents.mint.fg : palette.danger }}>
                        {isReady ? `→ ${newOwner?.full_name ?? "New owner set"}` : "No owner assigned"}
                      </Txt>
                    </View>
                    {isReady ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Avatar name={newOwner?.full_name ?? "?"} size={26} />
                        <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
                      </View>
                    ) : (
                      <Pressable
                        disabled={isActing}
                        onPress={() => pickNewOwner(offering)}
                        style={{ backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}
                      >
                        <Txt style={{ fontSize: 12.5, ...font(700), color: palette.primaryText }}>
                          {isActing ? "…" : "Assign…"}
                        </Txt>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <View style={{ borderRadius: 999, backgroundColor: remaining.length ? palette.border : palette.text, alignItems: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 15.5, ...font(700), color: remaining.length ? palette.textFaint : palette.primaryText }}>
            {remaining.length ? `Reassign ${remaining.length} more to continue` : ownedOfferings.length > 0 ? "All reassigned — safe to offboard" : "No action needed"}
          </Txt>
        </View>
      </View>
    </View>
  );
}
