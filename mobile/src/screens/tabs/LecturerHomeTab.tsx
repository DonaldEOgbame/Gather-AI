import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, EmptyState, Avatar, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import { useCourses } from "@/hooks/queries";
import { useAuth } from "@/stores/auth";

/** Lecturer Home (Module 8 · design 19): assigned courses, draft badges. */
export default function LecturerHomeTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuth((s) => s.user);
  const { data: courses, refetch } = useCourses();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={user?.full_name ?? "?"} size={46} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text }}>{user?.title} {user?.full_name}</Txt>
            <Txt variant="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{courses?.length ?? 0} assigned course{(courses?.length ?? 0) === 1 ? "" : "s"}</Txt>
          </View>
          <Pressable
            onPress={() => nav.navigate("NotificationCenter")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.card, alignItems: "center", justifyContent: "center", shadowColor: "#141928", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
          >
            <Icon name="bell" size={22} color={palette.text} />
            <View style={{ position: "absolute", top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger, borderWidth: 2, borderColor: palette.card }} />
          </Pressable>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionHeader title="Your courses" action={{ label: "Manage", onPress: () => nav.navigate("Courses") }} />
        </View>

        {!courses?.length ? (
          <EmptyState icon="book" title="No assigned courses" body="Courses you teach or co-teach will appear here." />
        ) : (
          <View style={{ gap: 11 }}>
            {courses.map((item) => {
              const a = palette.accents[accentFor(item.id)];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => nav.navigate("CourseDetail", { courseId: item.id, code: item.code, title: item.title })}
                  style={({ pressed }) => ({ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, opacity: pressed ? 0.85 : 1, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 })}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 13, ...font(800), color: a.fg }}>{item.code.slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt style={{ fontSize: 12, ...font(800), color: palette.textFaint }}>{item.code}</Txt>
                    <Txt numberOfLines={1} style={{ fontSize: 15, ...font(700), color: palette.text, marginTop: 2 }}>{item.title}</Txt>
                  </View>
                  <Icon name="chev" size={18} color={palette.textFaint} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
