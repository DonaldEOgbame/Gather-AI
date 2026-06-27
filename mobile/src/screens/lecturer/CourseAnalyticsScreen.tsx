import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, TinyIcon, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useOfferingAnalytics } from "@/hooks/queries";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Course analytics (design 22): real download counts + top materials. */
export default function CourseAnalyticsScreen({ route }: RootScreen<"CourseAnalytics">) {
  const { palette, scheme } = useTheme();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "—";
  const title = route.params?.title ?? "Course";

  const { data, isLoading } = useOfferingAnalytics(offeringId);

  const top = data?.top_materials ?? [];
  const max = Math.max(...top.map((m) => m.download_count), 1);

  const stats = [
    { value: String(data?.total_files ?? 0), label: "files", accent: "mint" as const },
    { value: String(data?.total_downloads ?? 0), label: "downloads", accent: "sky" as const },
    { value: String(data?.enrolled_students ?? 0), label: "students", accent: "lilac" as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt variant="title" style={{ fontSize: 21, marginTop: 2 }}>{title}</Txt>

        {isLoading ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <ActivityIndicator color={palette.text} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {stats.map(({ value, label, accent }) => (
              <View key={label} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <Txt style={{ fontSize: 17, ...font(800), color: palette.accents[accent].fg }}>{value}</Txt>
                <Txt style={{ fontSize: 11.5, ...font(600), color: palette.textFaint, marginTop: 2 }}>{label}</Txt>
              </View>
            ))}
          </View>
        )}
      </View>

      {!isLoading && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <SectionHeader title="Top materials" />
          {top.length === 0 ? (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 16 }}>No materials published yet.</Txt>
          ) : (
            <View style={{ gap: 10 }}>
              {top.map((m) => {
                const accent = accentFor(m.id);
                return (
                  <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="file" accent={accent} size={42} iconSize={20} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>
                        {m.title || m.original_filename}
                      </Txt>
                      <Txt variant="faint" style={{ fontSize: 11, ...font(600), marginTop: 2 }}>Week {m.week}</Txt>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: palette.field, marginTop: 7, overflow: "hidden" }}>
                        <View style={{ height: 5, borderRadius: 3, width: `${(m.download_count / max) * 100}%`, backgroundColor: palette.accents[accent].fg }} />
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Icon name="download" size={15} color={palette.textFaint} />
                      <Txt style={{ fontSize: 13, ...font(800), color: palette.text }}>{m.download_count}</Txt>
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
