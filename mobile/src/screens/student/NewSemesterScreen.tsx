import React from "react";
import { View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const POINTS: [IconName, string][] = [
  ["book", "Your new courses are on Home"],
  ["folder", "Last semester moved to Past Semesters"],
  ["refresh", "Your library was re-organized"],
];

/** Student · New semester welcome (design 86): semester-transition splash. */
export default function NewSemesterScreen({ navigation }: RootScreen<"NewSemester">) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.primary, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="sparkle" size={32} color="#fff" />
        </View>
        <Txt style={{ fontSize: 17, ...font(600), color: "rgba(255,255,255,0.6)", marginTop: 24 }}>Welcome to</Txt>
        <Txt style={{ fontSize: 30, ...font(800), color: "#fff", letterSpacing: -0.5, marginTop: 2 }}>Second Semester</Txt>
        <Txt style={{ fontSize: 17, ...font(700), color: "rgba(255,255,255,0.75)", marginTop: 4 }}>2025 / 2026</Txt>

        <View style={{ marginTop: 26, gap: 12 }}>
          {POINTS.map(([icon, label]) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={20} color="#fff" />
              </View>
              <Txt style={{ flex: 1, fontSize: 14, ...font(600), color: "rgba(255,255,255,0.92)", lineHeight: 19 }}>{label}</Txt>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingBottom: 40 }}>
        <Button title="Explore this semester" variant="secondary" style={{ backgroundColor: "#fff" }} onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}
