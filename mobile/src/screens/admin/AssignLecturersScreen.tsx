import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Txt, TinyIcon, StatusPill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useRoster, useInstitutionUsers } from "@/hooks/queries";
import { offeringsApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import type { UserOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

/** Admin · Assign lecturers (design 46): owner + co-lecturers + add staff. */
export default function AssignLecturersScreen({ route }: RootScreen<"AssignLecturers">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "—";
  const title = route.params?.title ?? "Course";

  const { data: roster, isLoading: loadingRoster } = useRoster(offeringId);
  const { data: allUsers, isLoading: loadingUsers } = useInstitutionUsers("lecturer");

  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const assignedIds = new Set((roster ?? []).map((r) => r.lecturer_id));

  const filteredUsers = (allUsers ?? []).filter((u) => {
    if (assignedIds.has(u.id)) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      (u.matric_or_staff_id ?? "").toLowerCase().includes(q)
    );
  });

  async function add(user: UserOut) {
    if (!offeringId) return;
    setActing(user.id);
    try {
      await offeringsApi.addLecturer(offeringId, {
        lecturer_id: user.id,
        is_owner: false,
        can_publish: true,
        can_manage_roster: false,
      });
      qc.invalidateQueries({ queryKey: ["roster", offeringId] });
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not add lecturer.");
    } finally {
      setActing(null);
    }
  }

  async function remove(lecturerId: string, name: string) {
    if (!offeringId) return;
    Alert.alert("Remove", `Remove ${name} from ${code}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setActing(lecturerId);
          try {
            await offeringsApi.removeLecturer(offeringId, lecturerId);
            qc.invalidateQueries({ queryKey: ["roster", offeringId] });
          } catch (e: any) {
            Alert.alert("Failed", e?.message ?? "Could not remove lecturer.");
          } finally {
            setActing(null);
          }
        },
      },
    ]);
  }

  if (!offeringId) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <Txt variant="muted">No offering selected.</Txt>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Assign lecturers</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text, marginTop: 2 }}>{title}</Txt>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>ASSIGNED</Txt>
        {loadingRoster ? (
          <ActivityIndicator color={palette.text} style={{ marginVertical: 12 }} />
        ) : (roster ?? []).length === 0 ? (
          <Txt variant="muted">No lecturers assigned yet.</Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {(roster ?? []).map((entry) => {
              const user = (allUsers ?? []).find((u) => u.id === entry.lecturer_id);
              const name = user?.full_name ?? entry.lecturer_id;
              const staffId = user?.matric_or_staff_id ?? "";
              return (
                <View key={entry.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <Avatar name={name} size={42} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{name}</Txt>
                    <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>
                      {entry.is_owner ? "Head lecturer" : "Co-lecturer"}{staffId ? ` · ${staffId}` : ""}
                    </Txt>
                  </View>
                  {entry.is_owner ? (
                    <StatusPill label="Owner" accent="mint" />
                  ) : (
                    <Pressable
                      disabled={acting === entry.lecturer_id}
                      onPress={() => remove(entry.lecturer_id, name)}
                    >
                      <Txt style={{ fontSize: 13, ...font(700), color: palette.danger }}>
                        {acting === entry.lecturer_id ? "…" : "Remove"}
                      </Txt>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>ADD STAFF</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1, marginBottom: 12 }}>
          <Icon name="search" size={20} color={palette.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search staff by name or ID"
            placeholderTextColor={palette.textFaint}
            style={{ flex: 1, fontSize: 14.5, ...font(500), color: palette.text, paddingVertical: 0 }}
          />
        </View>

        {loadingUsers ? (
          <ActivityIndicator color={palette.text} style={{ marginVertical: 12 }} />
        ) : filteredUsers.length === 0 && search ? (
          <Txt variant="muted" style={{ textAlign: "center" }}>No staff matching "{search}".</Txt>
        ) : filteredUsers.length === 0 ? (
          <Txt variant="muted" style={{ textAlign: "center" }}>All lecturers already assigned.</Txt>
        ) : (
          <View style={{ gap: 6 }}>
            {filteredUsers.slice(0, 10).map((u) => (
              <View key={u.id} style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 4 }}>
                <Avatar name={u.full_name} size={38} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{u.full_name}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, marginTop: 1 }}>
                    {u.matric_or_staff_id ?? u.email}
                  </Txt>
                </View>
                <Pressable
                  disabled={acting === u.id}
                  onPress={() => add(u)}
                  style={{ borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: 16, paddingVertical: 7 }}
                >
                  <Txt style={{ fontSize: 13, ...font(700), color: palette.text }}>
                    {acting === u.id ? "…" : "Add"}
                  </Txt>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
