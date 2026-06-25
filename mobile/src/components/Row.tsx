import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import { Txt, Toggle } from "./ui";

export function SettingRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomColor: palette.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        {hint ? <Txt variant="muted">{hint}</Txt> : null}
      </View>
      <Toggle value={value} onValueChange={onValueChange} label={label} />
    </View>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <Txt variant="label" style={{ marginTop: 20, marginBottom: 4 }}>
      {title.toUpperCase()}
    </Txt>
  );
}
