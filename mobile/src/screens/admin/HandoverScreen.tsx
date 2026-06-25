import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Avatar, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";

type Offering = { code: string; title: string; owner: string | null };
const INITIAL: Offering[] = [
  { code: "CSC401", title: "Software Engineering", owner: null },
  { code: "CSC305", title: "Data Structures", owner: "Dr. K. Okeke" },
  { code: "CSC502", title: "Compilers", owner: null },
];

/** Admin · Lecturer handover (design 101): reassign offerings before offboarding. */
export default function HandoverScreen(_: RootScreen<"Handover">) {
  const { palette } = useTheme();
  const [offerings, setOfferings] = useState(INITIAL);
  const remaining = offerings.filter((o) => !o.owner).length;

  const assign = (code: string) =>
    Alert.alert("Assign new owner", `Reassign ${code}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Dr. K. Okeke", onPress: () => setOfferings((os) => os.map((o) => (o.code === code ? { ...o, owner: "Dr. K. Okeke" } : o))) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
          <Avatar name="Grace Hopper" size={52} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 17, ...font(800), color: palette.text }}>Dr. Grace Hopper</Txt>
            <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 2 }}>Computer Science · owner of 3 offerings</Txt>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <InfoCard accent="peach" icon="shield" text="She owns 3 active offerings. Reassign them before she can be removed — materials stay intact." />
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>NEEDS A NEW OWNER</Txt>
        <View style={{ gap: 9 }}>
          {offerings.map((o) => {
            const set = !!o.owner;
            return (
              <View key={o.code} style={{ backgroundColor: palette.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: set ? 1.5 : 0, borderColor: palette.accents.mint.fg, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents.sky.bg, alignItems: "center", justifyContent: "center" }}>
                  <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.sky.fg }}>{o.code.slice(0, 3)}</Txt>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt numberOfLines={1} style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{o.code} · {o.title}</Txt>
                  <Txt style={{ fontSize: 11.5, ...font(700), marginTop: 2, color: set ? palette.accents.mint.fg : palette.danger }}>{set ? "New owner set" : "No owner yet"}</Txt>
                </View>
                {set ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Avatar name="K Okeke" size={26} />
                    <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
                  </View>
                ) : (
                  <Pressable onPress={() => assign(o.code)} style={{ backgroundColor: palette.text, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
                    <Txt style={{ fontSize: 12.5, ...font(700), color: "#fff" }}>Assign…</Txt>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg }}>
        <View style={{ borderRadius: 999, backgroundColor: remaining ? "#EAECEF" : palette.text, alignItems: "center", paddingVertical: 16 }}>
          <Txt style={{ fontSize: 15.5, ...font(700), color: remaining ? palette.textFaint : "#fff" }}>
            {remaining ? `Reassign ${remaining} more to continue` : "Remove lecturer"}
          </Txt>
        </View>
      </View>
    </View>
  );
}
