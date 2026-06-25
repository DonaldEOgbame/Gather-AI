import React from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import { useTheme, font } from "@/theme";
import { Txt } from "./ui";
import { Icon, type IconName } from "./Icon";

interface Props extends TextInputProps {
  label: string;
  hint?: string;
  /** Optional leading glyph (design fields lead with mail/lock/etc.). */
  icon?: IconName;
  /** Optional trailing glyph (e.g. eye toggle on password fields). */
  rightIcon?: IconName;
  onRightIconPress?: () => void;
}
export function Field({ label, hint, icon, rightIcon, onRightIconPress, style, ...rest }: Props) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 8, marginBottom: 14 }}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: palette.field,
          borderColor: palette.fieldBorder,
          borderWidth: 1.5,
          borderRadius: 16,
          paddingHorizontal: 16,
          minHeight: 52,
        }}
      >
        {icon ? <Icon name={icon} size={20} color={palette.textFaint} /> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={palette.textFaint}
          style={[{ flex: 1, paddingVertical: 15, color: palette.text, fontSize: 15, ...font(500) }, style]}
          {...rest}
        />
        {rightIcon ? (
          <Pressable accessibilityRole="button" onPress={onRightIconPress} hitSlop={8}>
            <Icon name={rightIcon} size={20} color={palette.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Txt variant="muted">{hint}</Txt> : null}
    </View>
  );
}
