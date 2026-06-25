import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { useTheme, font, type AccentName } from "@/theme";
import type { IconName } from "@/components/Icon";

const ENTRIES: [IconName, AccentName, string, string, string][] = [
  ["users", "sky", "Imported 840 users", "You · roster_fall2026.csv", "2m ago"],
  ["lock", "lemon", "Reset password", "You → Tunde Bello", "1h ago"],
  ["shield", "lilac", "Changed sharing policy", "External sharing → App-only", "3h ago"],
  ["user", "peach", "Suspended account", "You → Sam Ade", "Yesterday"],
  ["building", "mint", "Archived semester", "Spring 2026", "2d ago"],
];

/** Admin · Audit log (design 48): a vertical activity timeline. */
export default function AuditLogScreen() {
  const { palette } = useTheme();
  const [tab, setTab] = useState("All");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Audit log</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
        <ChipRow>
          {["All", "Users", "Roles", "Policy"].map((t) => (
            <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </ChipRow>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {ENTRIES.map(([icon, accent, title, sub, time], i) => (
          <View key={i} style={{ flexDirection: "row", gap: 13 }}>
            <View style={{ alignItems: "center" }}>
              <TinyIcon icon={icon} accent={accent} size={38} iconSize={19} />
              {i < ENTRIES.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: "#EDEFF3", marginTop: 4 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{title}</Txt>
              <Txt style={{ fontSize: 12.5, ...font(500), color: palette.textMuted, marginTop: 2 }}>{sub}</Txt>
              <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 3 }}>{time}</Txt>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
