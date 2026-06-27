import React from "react";
import { ScrollView, View } from "react-native";
import { Txt, StatusPill, Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useNavigation } from "@react-navigation/native";

/** Student · Join outcomes (design 73): one action, three results.
 * Explains what each join result means before/after attempting to join. */
export default function JoinOutcomesScreen() {
  const { palette, scheme } = useTheme();
  const nav = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Join — outcomes</Txt>
      <Txt variant="faint" style={{ paddingHorizontal: 24, ...font(800), letterSpacing: 0.5, marginTop: 14 }}>ONE ACTION, THREE RESULTS</Txt>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 13 }}
        showsVerticalScrollIndicator={false}
      >
        <OutcomeCard
          icon="check"
          accent="mint"
          title="Enrolled"
          sub="Roster or valid code — instant"
          pill={{ label: "Active", accent: "mint" }}
          border
          body="The course appears in your courses immediately."
        />
        <OutcomeCard
          icon="clock"
          accent="lemon"
          title="Pending approval"
          sub="Lecturer-approved mode"
          pill={{ label: "Pending", accent: "lemon" }}
          body="The course is greyed out with a Pending chip until the lecturer accepts."
        />
        <OutcomeCard
          icon="shield"
          accent="peach"
          title="Couldn't join"
          sub="Invalid / expired code, already enrolled, or full"
          body="Nothing changes — try another code or contact your lecturer."
        >
          <View style={{ marginTop: 12 }}>
            <Button title="Try another code" variant="ghost" onPress={() => nav.navigate("JoinCourse")} />
          </View>
        </OutcomeCard>
      </ScrollView>
    </View>
  );
}

function OutcomeCard({
  icon,
  accent,
  title,
  sub,
  pill,
  body,
  border,
  children,
}: {
  icon: IconName;
  accent: AccentName;
  title: string;
  sub: string;
  pill?: { label: string; accent: AccentName };
  body: string;
  border?: boolean;
  children?: React.ReactNode;
}) {
  const { palette, scheme } = useTheme();
  const a = palette.accents[accent];
  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: 18,
        padding: 16,
        borderWidth: border ? 1.5 : 0,
        borderColor: border ? a.fg : "transparent",
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: scheme === "dark" ? 0 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={20} color={a.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>{title}</Txt>
          <Txt variant="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</Txt>
        </View>
        {pill ? <StatusPill label={pill.label} accent={pill.accent} /> : null}
      </View>
      <Txt variant="muted" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 18 }}>{body}</Txt>
      {children}
    </View>
  );
}
