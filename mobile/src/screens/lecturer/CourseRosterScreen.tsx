import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, View, ActivityIndicator } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Txt, Avatar, StatusPill, Toggle } from "@/components/ui";
import { useTheme, font } from "@/theme";
import { offeringsApi, authApi } from "@/api/endpoints";
import type { OfferingLecturerOut, UserOut } from "@/api/types";

/** Lecturer · Course roster (design 28): staff + 2-toggle permissions. */
export default function CourseRosterScreen() {
  const { palette, scheme } = useTheme();
  const route = useRoute<any>();
  const offeringId: string = route.params?.offeringId;
  const code: string = route.params?.code ?? "Course";

  const [members, setMembers] = useState<OfferingLecturerOut[]>([]);
  const [users, setUsers] = useState<Record<string, UserOut>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!offeringId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [roster, lecturers] = await Promise.all([
        offeringsApi.listLecturers(offeringId),
        authApi.listUsers("lecturer").catch(() => [] as UserOut[]),
      ]);
      setMembers(roster);
      setUsers(Object.fromEntries(lecturers.map((u) => [u.id, u])));
    } catch (e: any) {
      Alert.alert("Couldn't load roster", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (
    m: OfferingLecturerOut,
    field: "can_publish" | "can_manage_roster",
    value: boolean
  ) => {
    // optimistic
    setMembers((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, [field]: value } : x))
    );
    try {
      const updated = await offeringsApi.updateLecturer(offeringId, m.lecturer_id, {
        [field]: value,
      });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (e: any) {
      Alert.alert("Couldn't update", e?.message ?? "Try again.");
      load();
    }
  };

  const staffName = (id: string) => users[id]?.full_name ?? "Lecturer";

  const sorted = useMemo(
    () => [...members].sort((a, b) => Number(b.is_owner) - Number(a.is_owner)),
    [members]
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4, fontSize: 19 }}>Course roster</Txt>
      <Txt variant="muted" style={{ paddingHorizontal: 24, marginTop: 1, fontSize: 12.5 }}>
        {code} · {members.length} staff
      </Txt>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 12 }}>
            {sorted.map((m) => (
              <View
                key={m.id}
                style={{
                  backgroundColor: palette.card,
                  borderRadius: 18,
                  padding: 16,
                  shadowColor: palette.shadow,
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: scheme === "dark" ? 0 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={staffName(m.lecturer_id)} size={42} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>{staffName(m.lecturer_id)}</Txt>
                    <Txt variant="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                      {m.is_owner ? "Head lecturer" : "Teaching assistant"}
                    </Txt>
                  </View>
                  {m.is_owner ? <StatusPill label="Head" accent="mint" /> : null}
                </View>

                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: palette.fieldBorder, paddingTop: 4 }}>
                  <PermRow
                    label="Can publish"
                    value={m.can_publish}
                    onChange={(v) => toggle(m, "can_publish", v)}
                  />
                  <PermRow
                    label="Can manage roster"
                    value={m.can_manage_roster}
                    disabled={m.is_owner}
                    onChange={(v) => toggle(m, "can_manage_roster", v)}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function PermRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { palette, scheme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9 }}>
      <Txt style={{ fontSize: 13.5, ...font(600), color: value ? palette.text : palette.textFaint }}>{label}</Txt>
      <Toggle value={value} onValueChange={disabled ? undefined : onChange} label={label} />
    </View>
  );
}
