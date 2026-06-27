import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useSessions } from "@/hooks/queries";

/** Student · Past semesters (design 70): archived, read-only terms. */
export default function PastSemestersScreen() {
  const { palette, scheme } = useTheme();
  const { data: sessions, isLoading } = useSessions();

  // Flatten all semesters into (sessionName, semLabel, status) tuples
  const allSemesters = (sessions ?? []).flatMap((s) =>
    s.semesters.map((sem) => ({
      id: sem.id,
      label: `${sem.term === "first" ? "First" : "Second"} Semester`,
      session: s.name,
      status: sem.status,
    }))
  );
  const past = allSemesters.filter((s) => s.status === "archived");

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title">Past Semesters</Txt>
        <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Archived — read-only</Txt>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Icon name="clock" size={19} color={palette.accents.lemon.fg} />
            <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
              Past semesters are read-only. Local files remain; new uploads are not allowed.
            </Txt>
          </View>

          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PAST SEMESTERS</Txt>
          {past.length === 0 ? (
            <Txt variant="muted" style={{ textAlign: "center" }}>No archived semesters yet.</Txt>
          ) : (
            <View style={{ gap: 11 }}>
              {past.map((s) => {
                const accent = accentFor(s.id);
                return (
                  <View key={s.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.92, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="calendar" accent={accent} size={42} iconSize={21} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>{s.label}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{s.session}</Txt>
                    </View>
                    <StatusPill label="Read-only" accent="lemon" />
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
