import React, { useCallback, useState } from "react";
import { Alert, ScrollView, View, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Txt, Button, Avatar, LifecyclePill, SettingsGroup, SettingItem } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { UserOut, GlobalRole, AccountStatus } from "@/api/types";

const ROLE_LABEL: Record<GlobalRole, string> = {
  admin: "Admin",
  lecturer: "Lecturer",
  student: "Student",
};

/** Admin · User detail (design 26): reset password / change role / suspend. */
export default function UserDetailScreen() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const userId: string = route.params?.userId;
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await authApi.getUser(userId));
    } catch (e: any) {
      Alert.alert("Couldn't load user", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetPassword = () =>
    Alert.alert("Reset password?", "Emails a reset link to the user.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send reset",
        onPress: async () => {
          setBusy(true);
          try {
            await authApi.resetPassword(userId);
            Alert.alert("Reset link sent", "The user has been emailed a password-reset link.");
          } catch (e: any) {
            Alert.alert("Failed", e?.message ?? "Try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const changeRole = () => {
    if (!user) return;
    const targets: GlobalRole[] = (["student", "lecturer", "admin"] as GlobalRole[]).filter(
      (r) => r !== user.global_role
    );
    Alert.alert(
      "Change role",
      `Move ${user.full_name} to a different role.`,
      [
        ...targets.map((r) => ({
          text: ROLE_LABEL[r],
          onPress: async () => {
            setBusy(true);
            try {
              setUser(await authApi.changeRole(userId, r));
            } catch (e: any) {
              Alert.alert("Failed", e?.message ?? "Try again.");
            } finally {
              setBusy(false);
            }
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const setStatus = (status: AccountStatus, verb: string) =>
    Alert.alert(`${verb} account?`, `${verb} ${user?.full_name ?? "this user"}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: verb,
        style: status === "suspended" ? "destructive" : "default",
        onPress: async () => {
          setBusy(true);
          try {
            setUser(await authApi.setStatus(userId, status));
          } catch (e: any) {
            Alert.alert("Failed", e?.message ?? "Try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const rows: [string, string][] = [
    [user.global_role === "student" ? "Matric number" : "Staff ID", user.matric_or_staff_id || "—"],
    ["Legal name", user.legal_name || user.full_name],
    ["Email", user.email],
    ["Member since", new Date(user.created_at).toLocaleDateString()],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>User</Txt>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", gap: 6 }}>
          <Avatar name={user.full_name} size={72} />
          <Txt variant="title" style={{ fontSize: 21, marginTop: 4 }}>{user.full_name}</Txt>
          <Txt variant="muted" style={{ fontSize: 13.5 }}>{user.email}</Txt>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <LifecyclePill status={user.status} />
            <LifecyclePill status={user.global_role} />
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <SettingsGroup>
            {rows.map(([k, v], i) => (
              <View
                key={k}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 13,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: palette.fieldBorder,
                }}
              >
                <Txt variant="muted" style={{ fontSize: 14 }}>{k}</Txt>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.text, maxWidth: "60%", textAlign: "right" }} numberOfLines={1}>{v}</Txt>
              </View>
            ))}
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 20, gap: 10 }}>
          <SettingsGroup>
            <SettingItem
              first
              icon="lock"
              accent="lemon"
              title="Reset password"
              sub="Emails a reset link to the user"
              right={<Icon name="chev" size={18} color={palette.textFaint} />}
              onPress={resetPassword}
            />
            <SettingItem
              icon="users"
              accent="sky"
              title="Change role"
              sub={`${ROLE_LABEL[user.global_role]} → Admin or Student`}
              right={<Icon name="chev" size={18} color={palette.textFaint} />}
              onPress={changeRole}
            />
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 16 }}>
          {user.status === "suspended" ? (
            <Button title="Reactivate account" variant="secondary" loading={busy} onPress={() => setStatus("active", "Reactivate")} />
          ) : (
            <Button title="Suspend account" variant="danger-ghost" loading={busy} onPress={() => setStatus("suspended", "Suspend")} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
