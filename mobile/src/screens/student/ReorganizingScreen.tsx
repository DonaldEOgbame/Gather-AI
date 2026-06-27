import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Txt, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

/** Student · Reorganizing library (design 87): semester-transition progress. */
export default function ReorganizingScreen() {
  const { palette, scheme } = useTheme();
  const pct = 68;
  const R = 64;
  const C = 2 * Math.PI * R;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 34 }}>
      <View style={{ width: 150, height: 150, marginBottom: 22 }}>
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle cx={75} cy={75} r={R} fill="none" stroke={palette.border} strokeWidth={11} />
          <Circle cx={75} cy={75} r={R} fill="none" stroke={palette.primary} strokeWidth={11} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 75 75)" />
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Icon name="refresh" size={30} color={palette.text} />
          <Txt style={{ fontSize: 16, ...font(800), color: palette.text, marginTop: 4 }}>{pct}%</Txt>
        </View>
      </View>
      <Txt style={{ fontSize: 21, ...font(800), color: palette.text, textAlign: "center" }}>Reorganizing your library</Txt>
      <Txt variant="muted" style={{ fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
        Filing your offline files under the new semester. No re-downloads — just renaming folders.
      </Txt>

      <View style={{ width: "100%", marginTop: 22, gap: 8 }}>
        {[
          { path: "…/2025-2026/First/CSC305/", icon: "clock" as const, accent: "lemon" as const, isNew: false },
          { path: "…/2025-2026/Second/CSC401/", icon: "folder" as const, accent: "mint" as const, isNew: true },
        ].map((r) => (
          <View key={r.path} style={{ backgroundColor: palette.card, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <Icon name={r.icon} size={16} color={palette.accents[r.accent].fg} />
            <Txt style={{ flex: 1, fontSize: 12, ...font(700), color: r.isNew ? palette.text : palette.textMuted }}>{r.path}</Txt>
            {r.isNew ? <StatusPill label="New" accent="mint" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
