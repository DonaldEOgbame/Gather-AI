import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon, StatusPill } from "@/components/ui";
import { useTheme, font } from "@/theme";
import { useSessions, useInstitution } from "@/hooks/queries";
import type { AcademicSessionOut, SemesterOut } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "";
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

function semesterLabel(sem: SemesterOut) {
  const name = sem.term === "first" ? "First Semester" : "Second Semester";
  const range = formatDateRange(sem.start_date, sem.end_date);
  const extra = sem.registration_open ? "· registration open" : sem.status === "upcoming" ? "· opens later" : "";
  return { name, sub: [range, extra].filter(Boolean).join(" ") };
}

/** Admin · Sessions (design 77): active session with its two semesters + archive. */
export default function SessionsScreen({ navigation }: RootScreen<"Sessions">) {
  const { palette, scheme } = useTheme();
  const { data: sessions, isLoading } = useSessions();
  const { data: institution } = useInstitution();

  const active = sessions?.find((s) => s.status === "active");
  const past = sessions?.filter((s) => s.status === "archived") ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Sessions</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>
          {institution?.name ?? "Your institution"}
        </Txt>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>ACTIVE SESSION</Txt>
          {active ? (
            <ActiveSessionCard session={active} />
          ) : (
            <Txt variant="muted">No active session.</Txt>
          )}

          {past.length > 0 && (
            <>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PAST SESSIONS</Txt>
              <View style={{ gap: 10 }}>
                {past.map((s) => (
                  <View key={s.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="calendar" accent="lemon" size={40} iconSize={20} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{s.name}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 2 }}>
                        {formatDateRange(s.start_date, s.end_date)} · archived
                      </Txt>
                    </View>
                    <StatusPill label="Archived" accent="lemon" />
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <Button title="New academic session" onPress={() => navigation.navigate("CreateSession")} />
      </View>
    </View>
  );
}

function ActiveSessionCard({ session }: { session: AcademicSessionOut }) {
  const { palette, scheme } = useTheme();
  const sems = session.semesters ?? [];
  return (
    <View style={{ backgroundColor: palette.card, borderRadius: 18, overflow: "hidden", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
      <View style={{ backgroundColor: palette.accents.mint.bg, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TinyIcon icon="calendar" accent="mint" size={46} iconSize={23} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>{session.name}</Txt>
          <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>
            {formatDateRange(session.start_date, session.end_date)}
          </Txt>
        </View>
        <StatusPill label="Active" accent="mint" />
      </View>
      {sems.map((sem, i) => {
        const { name, sub } = semesterLabel(sem);
        const isActive = sem.status === "active";
        return (
          <SemRow
            key={sem.id}
            top={i > 0}
            color={isActive ? palette.accents.mint.fg : palette.toggleTrack}
            title={name}
            sub={sub}
            pill={isActive ? "Active" : sem.status === "upcoming" ? "Upcoming" : "Archived"}
            pillAccent={isActive ? "mint" : "lemon"}
            titleColor={isActive ? palette.text : palette.textMuted}
          />
        );
      })}
    </View>
  );
}

function SemRow({ color, title, sub, pill, pillAccent, titleColor, top }: {
  color: string; title: string; sub: string; pill: string;
  pillAccent: "mint" | "lemon"; titleColor: string; top?: boolean;
}) {
  const { palette, scheme } = useTheme();
  return (
    <View style={{ padding: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderTopColor: top ? palette.border : "rgba(0,0,0,0.05)", borderTopWidth: 1 }}>
      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
      <View style={{ flex: 1 }}>
        <Txt style={{ fontSize: 14, ...font(800), color: titleColor }}>{title}</Txt>
        <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 2 }}>{sub}</Txt>
      </View>
      <StatusPill label={pill} accent={pillAccent} />
    </View>
  );
}
