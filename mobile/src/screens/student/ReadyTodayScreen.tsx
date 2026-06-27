import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, TinyIcon, SectionHeader, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { getTodayTimetableSessions, type TimetableSessionRow } from "@/db";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRECACHE_KEY = "nightly_precache_enabled";
const ACCENTS: AccentName[] = ["lemon", "mint", "peach", "sky", "lilac"];

/** Student · Ready for today (design 30): timetable pre-cache confirmation. */
export default function ReadyTodayScreen() {
  const { palette, scheme } = useTheme();
  const [classes, setClasses] = useState<(TimetableSessionRow & { course_name: string })[]>([]);
  const [precache, setPrecache] = useState(true);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const dow = new Date().getDay();
    setLoading(true);
    Promise.all([
      getTodayTimetableSessions(dow),
      AsyncStorage.getItem(PRECACHE_KEY),
    ]).then(([sessions, pref]) => {
      setClasses(sessions);
      if (pref !== null) setPrecache(pref === "true");
    }).finally(() => setLoading(false));
  }, []));

  const togglePrecache = async (v: boolean) => {
    setPrecache(v);
    await AsyncStorage.setItem(PRECACHE_KEY, String(v));
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="muted" style={{ fontSize: 14, ...font(500) }}>{today}</Txt>
        <Txt variant="title" style={{ marginTop: 2 }}>Ready for today</Txt>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={24} color={palette.primaryText} width={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15.5, ...font(700), color: palette.primaryText }}>
                {classes.length > 0 ? `${classes.length} class${classes.length > 1 ? "es" : ""} today` : "No classes today"}
              </Txt>
              <Txt style={{ fontSize: 12.5, ...font(500), color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {classes.length > 0 ? "Files ready from your library" : "Enjoy your day off"}
              </Txt>
            </View>
          </View>

          {classes.length > 0 && (
            <>
              <View style={{ marginTop: 22 }}>
                <SectionHeader title="Today's classes" />
              </View>
              <View style={{ gap: 11 }}>
                {classes.map((c, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  return (
                    <View key={c.id} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                      <View style={{ alignItems: "center" }}>
                        <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>{c.start_time.split(":")[0]}</Txt>
                        <Txt style={{ fontSize: 11, ...font(700), color: palette.textFaint }}>{c.start_time.split(":")[1]}</Txt>
                      </View>
                      <View style={{ width: 1, height: 36, backgroundColor: palette.fieldBorder }} />
                      <View style={{ flex: 1 }}>
                        <Txt style={{ fontSize: 12, ...font(800), color: palette.accents[accent].fg }}>{c.course_name}</Txt>
                        <Txt style={{ fontSize: 13.5, ...font(600), color: palette.text, marginTop: 2 }}>{c.room}</Txt>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.accents.mint.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
                        <Icon name="check" size={13} color={palette.accents.mint.fg} width={2.6} />
                        <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.mint.fg }}>Ready</Txt>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ marginTop: 16, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <TinyIcon icon="clock" accent="sky" size={38} iconSize={19} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>Nightly pre-cache</Txt>
              <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), marginTop: 1 }}>Wi-Fi only · 2:00 AM</Txt>
            </View>
            <Toggle value={precache} onValueChange={togglePrecache} label="Nightly pre-cache" />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
