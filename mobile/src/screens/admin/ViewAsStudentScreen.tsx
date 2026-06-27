import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery } from "@tanstack/react-query";
import { offeringsApi, authApi } from "@/api/endpoints";

/** Admin · View-as-student (design 103): audited, read-only impersonation for support. */
export default function ViewAsStudentScreen({ navigation, route }: RootScreen<"ViewAsStudent">) {
  const { palette, scheme } = useTheme();
  const offeringId = route.params?.code ?? "";
  const studentId = route.params?.studentId ?? "";

  const { data: materials = [], isLoading } = useQuery<any[]>({
    queryKey: ["preview-as-student", offeringId],
    queryFn: () => offeringsApi.previewAsStudent(offeringId),
    enabled: !!offeringId,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["institution-users"],
    queryFn: () => authApi.listUsers(),
  });

  const student = users.find((u: any) => u.id === studentId);
  const studentName = student?.display_name ?? student?.full_name ?? "Student";

  const byWeek = materials.reduce<Record<number, typeof materials>>((acc, m) => {
    (acc[m.week] = acc[m.week] ?? []).push(m);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ backgroundColor: palette.danger, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Icon name="eye" size={17} color={palette.primaryText} />
        <Txt style={{ flex: 1, fontSize: 12.5, ...font(700), color: palette.primaryText }}>Viewing as {studentName} · read-only</Txt>
        <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
          <Txt style={{ fontSize: 12.5, ...font(800), color: palette.primaryText }}>Exit</Txt>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {student && (
            <View style={{ marginBottom: 16, backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <Avatar name={studentName} size={42} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{studentName}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>{student.email}</Txt>
              </View>
            </View>
          )}

          {!offeringId && (
            <InfoCard accent="lemon" icon="sparkle" text="Navigate here from an offering to preview it as a student." />
          )}

          {offeringId && materials.length === 0 && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>No published materials visible to students yet.</Txt>
          )}

          {Object.entries(byWeek).sort(([a], [b]) => Number(a) - Number(b)).map(([week, mats]) => (
            <View key={week}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>WEEK {week}</Txt>
              <View style={{ gap: 8 }}>
                {mats.map((m: any) => (
                  <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <Icon name="check" size={17} color={palette.accents.mint.fg} width={2.4} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 13.5, ...font(800), color: palette.text }}>{m.title}</Txt>
                      <Txt style={{ fontSize: 11.5, ...font(600), marginTop: 1, color: palette.textFaint }}>{m.original_filename}</Txt>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={{ marginTop: 18 }}>
            <InfoCard accent="lilac" icon="shield" text="Every impersonation is read-only and written to the audit log — who, when, whose account." />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
