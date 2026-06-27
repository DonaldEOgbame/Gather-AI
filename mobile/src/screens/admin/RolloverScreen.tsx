import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, StatusPill, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { sessionsApi } from "@/api/endpoints";
import { useCurrentContext } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { SemesterTerm } from "@/api/types";
import type { RootScreen } from "@/navigation/types";

type StepState = "done" | "now" | "next";

/** Admin · Semester rollover (design 80): archive current semester → activate next. */
export default function RolloverScreen({ navigation }: RootScreen<"Rollover">) {
  const { palette } = useTheme();
  const { data: ctx } = useCurrentContext();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const session = ctx?.session;
  const activeSem = ctx?.semester;
  const nextTerm: SemesterTerm | null = activeSem?.term === "first" ? "second" : null;
  const nextSem = session?.semesters?.find((s) => s.term === nextTerm);

  const steps: [string, string, StepState][] = [
    [
      `Archive ${activeSem?.term === "first" ? "First" : "Second"} Semester`,
      "Current offerings become read-only",
      "now",
    ],
    [
      `Activate ${nextTerm === "second" ? "Second" : "First"} Semester`,
      'Becomes "current" for everyone',
      "next",
    ],
    ["Bulk-create offerings", "Clone from current, optional", "next"],
    ["Open registration", "Start the student window", "next"],
  ];

  async function handleContinue() {
    if (!session || !activeSem || !nextTerm) {
      return Alert.alert("Nothing to roll over", "No active semester or no next semester found.");
    }
    setBusy(true);
    try {
      await sessionsApi.archiveSession(session.id);
      await sessionsApi.activateSemester(session.id, nextTerm);
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["current-context"] });
      Alert.alert(
        `${nextTerm === "second" ? "Second" : "First"} Semester active`,
        "Registration can now be opened."
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Rollover failed", e?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Semester rollover</Txt>
        <InfoCard accent="lemon" icon="shield" text="This archives the current semester. Students keep read-only access — nothing is deleted." />

        <View style={{ marginTop: 20 }}>
          {steps.map(([title, sub, state], i) => {
            const circleBg =
              state === "done" ? palette.accents.mint.fg
              : state === "now" ? palette.text
              : palette.card;
            return (
              <View key={title} style={{ flexDirection: "row", gap: 13 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: circleBg, borderWidth: state === "next" ? 2 : 0, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                    {state === "done" ? (
                      <Icon name="check" size={17} color={palette.primaryText} width={2.6} />
                    ) : (
                      <Txt style={{ fontSize: 14, ...font(800), color: state === "now" ? palette.primaryText : palette.textFaint }}>{i + 1}</Txt>
                    )}
                  </View>
                  {i < steps.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: palette.fieldBorder, marginTop: 4 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 22 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Txt style={{ fontSize: 15, ...font(800), color: state === "next" ? palette.textMuted : palette.text }}>{title}</Txt>
                    {state === "now" ? <StatusPill label="Now" accent="sky" /> : state === "done" ? <StatusPill label="Done" accent="mint" /> : null}
                  </View>
                  <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 3 }}>{sub}</Txt>
                </View>
              </View>
            );
          })}
        </View>

        {!nextTerm && (
          <Txt variant="muted" style={{ marginTop: 12 }}>
            This is the second semester — no further rollover available in this session.
          </Txt>
        )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <Button
          title={nextTerm ? `Continue → activate ${nextTerm === "second" ? "Second" : "First"}` : "No rollover available"}
          loading={busy}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}
