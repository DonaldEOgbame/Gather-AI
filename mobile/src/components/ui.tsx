/**
 * Shared UI primitives — a faithful port of the component vocabulary in the
 * Gather design canvas ("Gather - Mobile App.dc.html"): ink pill buttons,
 * bordered ghost buttons, accent "tinyIcon" tiles, white list cards, filled
 * labeled fields, dot status pills, the custom toggle and a phone status bar.
 *
 * Accessibility (Module 14): every interactive element carries an
 * accessibilityLabel/Role; status is never color-only (it always pairs the
 * accent dot with a text label).
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { useTheme, font, accentFor, type AccentName } from "@/theme";
import { Icon, type IconName } from "./Icon";

export function Screen({ children, style, ...rest }: ViewProps) {
  const { palette } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: palette.bg, padding: 16 }, style]} {...rest}>
      {children}
    </View>
  );
}

interface CardProps extends ViewProps {
  /** Soft pastel tint (design inspiration). When set, the border is dropped. */
  accent?: AccentName;
}
export function Card({ children, style, accent, ...rest }: CardProps) {
  const { palette } = useTheme();
  const tint = accent ? palette.accents[accent] : null;
  return (
    <View
      style={[
        {
          backgroundColor: tint ? tint.bg : palette.card,
          borderRadius: 18,
          padding: 14,
          // Soft drop shadow matching the design's listCard.
          shadowColor: "#141928",
          shadowOpacity: 0.05,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

interface TxtProps extends TextProps {
  variant?: "display" | "title" | "h2" | "body" | "muted" | "label" | "faint";
}
export function Txt({ variant = "body", style, ...rest }: TxtProps) {
  const { palette, textScale } = useTheme();
  // size / weight / color per design typography scale.
  const spec = {
    display: { size: 28, weight: 800 as const, color: palette.text, ls: -0.5 },
    title: { size: 24, weight: 800 as const, color: palette.text, ls: -0.4 },
    h2: { size: 18, weight: 800 as const, color: palette.text, ls: -0.2 },
    body: { size: 15, weight: 500 as const, color: palette.text, ls: 0 },
    muted: { size: 13, weight: 600 as const, color: palette.textMuted, ls: 0 },
    label: { size: 13, weight: 700 as const, color: palette.textMuted, ls: 0 },
    faint: { size: 12, weight: 600 as const, color: palette.textFaint, ls: 0 },
  }[variant];
  return (
    <Text
      style={[
        { color: spec.color, fontSize: spec.size * textScale, letterSpacing: spec.ls, ...font(spec.weight) },
        style,
      ]}
      {...rest}
    />
  );
}

interface BtnProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading icon (design pairs upload/share icons with labels). */
  icon?: IconName;
  style?: ViewStyle;
}
export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style }: BtnProps) {
  const { palette } = useTheme();
  // primary = ink pill; secondary/ghost = bordered pill; danger = red pill.
  const filled = variant === "primary" || variant === "danger";
  const bg = variant === "primary" ? palette.primary : variant === "danger" ? palette.danger : palette.card;
  const fg = filled ? palette.primaryText : palette.text;
  const bordered = variant === "secondary" || variant === "ghost";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bordered ? "transparent" : bg,
          borderColor: bordered ? palette.border : "transparent",
          borderWidth: bordered ? 1.5 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          paddingVertical: filled ? 16 : 14,
          paddingHorizontal: 22,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 48,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={{ color: fg, fontSize: filled ? 16 : 14, ...font(700) }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Rounded-square accent tile with a centered line icon (design `tinyIcon`). */
export function TinyIcon({
  icon,
  accent,
  size = 44,
  iconSize = 22,
}: {
  icon: IconName;
  accent: AccentName;
  size?: number;
  iconSize?: number;
}) {
  const { palette } = useTheme();
  const a = palette.accents[accent];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: a.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={iconSize} color={a.fg} />
    </View>
  );
}

/** White rounded list row: accent tile + title/subtitle + optional right slot. */
export function ListCard({
  icon,
  accent,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: IconName;
  accent: AccentName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const { palette } = useTheme();
  const body = (
    <>
      <TinyIcon icon={icon} accent={accent} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 14.5, color: palette.text, ...font(700) }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 12, color: palette.textFaint, marginTop: 3, ...font(600) }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? null}
    </>
  );
  const style: ViewStyle = {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#141928",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}>
        {body}
      </Pressable>
    );
  }
  return <View style={style}>{body}</View>;
}

/** Status pill — accent dot + label on a tinted background (never color-only). */
export function StatusPill({ label, accent }: { label: string; accent: AccentName }) {
  const { palette } = useTheme();
  const a = palette.accents[accent];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: a.bg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: a.fg }} />
      <Text style={{ color: a.fg, fontSize: 11, ...font(800) }}>{label}</Text>
    </View>
  );
}

/** Maps the app's lifecycle statuses to a design accent + label for StatusPill. */
const STATUS_ACCENT: Record<string, AccentName> = {
  live: "mint",
  active: "mint",
  open: "mint",
  scheduled: "lemon",
  invited: "lemon",
  draft: "sky",
  archived: "lilac",
  suspended: "blush",
  "app-only": "peach",
  "view-only": "blush",
};
export function LifecyclePill({ status }: { status: string }) {
  return <StatusPill label={status} accent={STATUS_ACCENT[status] ?? "sky"} />;
}

export function Avatar({ name, size = 40, ring }: { name: string; size?: number; ring?: string }) {
  const { palette } = useTheme();
  const init = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const accent = palette.accents[accentFor(name || "?")];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent.bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}
    >
      <Text style={{ color: accent.fg, fontSize: size * 0.38, ...font(800) }}>{init || "?"}</Text>
    </View>
  );
}

/** Design toggle — ink track when on, light track when off, white knob. */
export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange?: (v: boolean) => void; label?: string }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={onValueChange ? () => onValueChange(!value) : undefined}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        backgroundColor: value ? palette.primary : "#D3D7DE",
        padding: 3,
        alignItems: value ? "flex-end" : "flex-start",
        justifyContent: "center",
      }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" }} />
    </Pressable>
  );
}

export function EmptyState({
  title,
  body,
  cta,
  icon,
}: {
  title: string;
  body: string;
  cta?: { label: string; onPress: () => void };
  icon?: IconName;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 }}>
      {icon ? (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: palette.field,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <Icon name={icon} size={28} color={palette.textFaint} />
        </View>
      ) : null}
      <Txt variant="h2" style={{ textAlign: "center" }}>
        {title}
      </Txt>
      <Txt variant="muted" style={{ textAlign: "center", marginBottom: 8, lineHeight: 20 }}>
        {body}
      </Txt>
      {cta && <Button title={cta.label} onPress={cta.onPress} />}
    </View>
  );
}

/** Pill chip used in horizontal filter rows (design `chip`). */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: selected ? palette.primary : palette.card,
        borderColor: palette.border,
        borderWidth: selected ? 0 : 1,
      }}
    >
      <Text style={{ color: selected ? palette.primaryText : palette.textMuted, fontSize: 13, ...font(selected ? 700 : 600) }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Horizontal scrollable chip row. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>{children}</View>;
}

/** Section header with an optional right-aligned action link (design `sectionHd`). */
export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, marginTop: 4 }}>
      <Txt variant="h2">{title}</Txt>
      {action && (
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label}>
          <Text style={{ color: palette.textFaint, fontSize: 13, ...font(700) }}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Overlapping avatar stack for collaborators/participants (design inspiration). */
export function AvatarStack({ names, size = 30 }: { names: string[]; size?: number }) {
  const { palette } = useTheme();
  const shown = names.slice(0, 4);
  const extra = names.length - shown.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {shown.map((n, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -size / 3 }}>
          <View style={{ borderRadius: size / 2 + 2, borderWidth: 2, borderColor: palette.card }}>
            <Avatar name={n} size={size} />
          </View>
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{
            marginLeft: -size / 3,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: palette.card,
            backgroundColor: palette.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: palette.textMuted, fontSize: 11, ...font(700) }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

/** White rounded container for stacked SettingItems (design settings cards). */
export function SettingsGroup({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: 18,
          paddingHorizontal: 16,
          shadowColor: "#141928",
          shadowOpacity: 0.05,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A single row inside a SettingsGroup: accent tile + title/sub + right slot. */
export function SettingItem({
  icon,
  accent,
  title,
  sub,
  right,
  first,
  onPress,
}: {
  icon: IconName;
  accent: AccentName;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  first?: boolean;
  onPress?: () => void;
}) {
  const { palette } = useTheme();
  const body = (
    <>
      <TinyIcon icon={icon} accent={accent} size={38} iconSize={19} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14.5, color: palette.text, ...font(700) }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 11.5, color: palette.textFaint, marginTop: 1, ...font(500) }}>{sub}</Text> : null}
      </View>
      {right ?? null}
    </>
  );
  const style: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    borderTopWidth: first ? 0 : 1,
    borderTopColor: "#F1F2F4",
  };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}>
        {body}
      </Pressable>
    );
  }
  return <View style={style}>{body}</View>;
}

/** Pill segmented control on a filled track (design `seg`). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (k: T) => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: palette.field, borderRadius: 999, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: active ? palette.card : "transparent",
              shadowColor: "#141928",
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Text style={{ fontSize: 13, ...font(active ? 700 : 600), color: active ? palette.text : palette.textFaint }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Banner({ text, tone = "warning" }: { text: string; tone?: "warning" | "danger" | "info" }) {
  const { palette } = useTheme();
  const c = tone === "danger" ? palette.danger : tone === "info" ? palette.primary : palette.warning;
  return (
    <View style={{ backgroundColor: palette.card, borderLeftColor: c, borderLeftWidth: 3, padding: 12, borderRadius: 10, marginBottom: 12 }}>
      <Text style={{ color: palette.text, fontSize: 13, ...font(500) }}>{text}</Text>
    </View>
  );
}
