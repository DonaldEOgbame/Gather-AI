import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Txt, Button, EmptyState, Avatar, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import { useAuth } from "@/stores/auth";
import type { PendingApprovalOut } from "@/api/types";

/** Admin Users tab (Module 8 / 15 · design 24): pending approvals + roster import. */
export default function AdminUsersTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const institution = useAuth((s) => s.user?.institution_id);
  const [pending, setPending] = useState<PendingApprovalOut[]>([]);

  const reload = useCallback(async () => {
    try {
      setPending(await authApi.pendingApprovals());
    } catch {
      /* offline */
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function act(id: string, action: "approve" | "reject") {
    try {
      await authApi.actOnApproval(id, action);
      reload();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "");
    }
  }

  async function importRoster() {
    if (!institution) return;
    Alert.alert("Roster import", "Pick a CSV (name, email, matric/staff ID, role, department). Invites auto-send.", [
      {
        text: "Demo import 1 student",
        onPress: async () => {
          try {
            await authApi.rosterImport(institution, [
              { email: `student${Date.now()}@example.edu`, full_name: "New Student", matric_or_staff_id: `MAT${Date.now()}`, role: "student" },
            ]);
            Alert.alert("Imported", "Invitation sent.");
          } catch (e: any) {
            Alert.alert("Import failed", e?.message ?? "");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt variant="title">Users</Txt>
        <Pressable
          onPress={() => nav.navigate("RosterImport")}
          onLongPress={importRoster}
          accessibilityRole="button"
          accessibilityLabel="Import CSV"
          style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: palette.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <Icon name="upload" size={16} color="#fff" />
          <Txt style={{ color: "#fff", fontSize: 13, ...font(700) }}>Import CSV</Txt>
        </Pressable>
      </View>

      <Txt variant="faint" style={{ paddingHorizontal: 24, marginTop: 18, marginBottom: 8, letterSpacing: 0.5, ...font(800) }}>
        PENDING APPROVALS{pending.length ? ` · ${pending.length}` : ""}
      </Txt>

      {pending.length === 0 ? (
        <EmptyState icon="users" title="Nothing to review" body="Self-register requests that don't match the roster show up here." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
          {pending.map((item) => (
            <View key={item.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={item.full_name} size={42} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>{item.full_name}</Txt>
                  <Txt numberOfLines={1} style={{ fontSize: 12, ...font(500), color: palette.textFaint, marginTop: 2 }}>{item.email} · {item.matric_or_staff_id}</Txt>
                </View>
                <StatusPill label={item.requested_role} accent="lilac" />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Approve" onPress={() => act(item.id, "approve")} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Reject" variant="ghost" onPress={() => act(item.id, "reject")} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
