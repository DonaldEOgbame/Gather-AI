/**
 * Module 14: theming with Light/Dark/System, accessible contrast, and
 * no color-only status indicators (each status also carries a label/icon).
 */
import { useColorScheme } from "react-native";
import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type Density = "compact" | "comfortable";

/**
 * Accent set for category/course cards — soft pastels (design inspiration:
 * mint / lemon / lilac / peach / sky / blush). `bg` tints a card, `fg` is the
 * readable on-tint text. Pick a stable accent per item via accentFor().
 */
export interface Accent {
  bg: string;
  fg: string;
}
export type AccentName = "mint" | "lemon" | "lilac" | "peach" | "sky" | "blush";

export interface Palette {
  bg: string;
  card: string;
  border: string;
  /** Subtle inner border for fields/inputs (design FIELD border). */
  fieldBorder: string;
  /** Filled input background (design FIELD). */
  field: string;
  text: string;
  textMuted: string;
  /** Faint tertiary text / placeholders / inactive icons (design MUT2). */
  textFaint: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  accents: Record<AccentName, Accent>;
}

// Light palette tokens mirror the design canvas exactly:
// INK #14171C · MUT #5C6470 · MUT2 #9AA1AC · BORDER #E8EAEE · FIELD #F4F5F7 · BG #F7F8FA.
const light: Palette = {
  bg: "#F7F8FA",
  card: "#FFFFFF",
  border: "#E8EAEE",
  fieldBorder: "#ECEEF1",
  field: "#F4F5F7",
  text: "#14171C",
  textMuted: "#5C6470",
  textFaint: "#9AA1AC",
  // Neutral-ink primary (pill buttons), pastels carry the color.
  primary: "#14171C",
  primaryText: "#FFFFFF",
  danger: "#C8372D",
  success: "#1E7A46",
  warning: "#B26A00",
  accents: {
    mint: { bg: "#DCF2E4", fg: "#1E7A46" },
    lemon: { bg: "#FBF1CE", fg: "#8A6D12" },
    lilac: { bg: "#E9E2F8", fg: "#5A45A8" },
    peach: { bg: "#FBE3D6", fg: "#9A4F23" },
    sky: { bg: "#DCEAF8", fg: "#2C5B8A" },
    blush: { bg: "#FADCE6", fg: "#9A3358" },
  },
};

const dark: Palette = {
  bg: "#0F1216",
  card: "#171B21",
  border: "#262C35",
  fieldBorder: "#2B323C",
  field: "#1C2129",
  text: "#ECEFF3",
  textMuted: "#9AA4B2",
  textFaint: "#6B7480",
  primary: "#ECEFF3",
  primaryText: "#0F1216",
  danger: "#FF6B5E",
  success: "#4FCB82",
  warning: "#E0A33A",
  accents: {
    mint: { bg: "#16302280" as string, fg: "#4FCB82" },
    lemon: { bg: "#3A311380" as string, fg: "#E0C055" },
    lilac: { bg: "#2A234680" as string, fg: "#B6A4ED" },
    peach: { bg: "#3A241680" as string, fg: "#E59F73" },
    sky: { bg: "#16273A80" as string, fg: "#7FB0E0" },
    blush: { bg: "#3A1A2680" as string, fg: "#E589A8" },
  },
};

/**
 * Plus Jakarta Sans (design typeface). React Native can't synthesize weights
 * from a single family, so each weight is its own loaded family. `font()` maps a
 * numeric weight to the matching family name — use it everywhere instead of
 * `fontWeight` so text renders in Jakarta, not the platform default.
 */
export const FONT = {
  400: "PlusJakartaSans_400Regular",
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
} as const;

export type FontWeight = keyof typeof FONT;

export function font(weight: FontWeight = 400): { fontFamily: string } {
  return { fontFamily: FONT[weight] };
}

const ACCENT_ORDER: AccentName[] = ["mint", "lemon", "lilac", "peach", "sky", "blush"];

/** Stable accent for a string key (e.g. course id), so colors don't reshuffle. */
export function accentFor(key: string): AccentName {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENT_ORDER[h % ACCENT_ORDER.length];
}

interface ThemePrefs {
  mode: ThemeMode;
  density: Density;
  textScale: number; // 1.0 default; accessibility (Module 14)
  setMode: (m: ThemeMode) => void;
  setDensity: (d: Density) => void;
  setTextScale: (s: number) => void;
}

export const useThemePrefs = create<ThemePrefs>((set) => ({
  mode: "system",
  density: "comfortable",
  textScale: 1,
  setMode: (mode) => set({ mode }),
  setDensity: (density) => set({ density }),
  setTextScale: (textScale) => set({ textScale }),
}));

export function useTheme() {
  const system = useColorScheme();
  const { mode, density, textScale } = useThemePrefs();
  const resolved = mode === "system" ? system ?? "light" : mode;
  const palette = resolved === "dark" ? dark : light;
  return { palette, scheme: resolved, density, textScale };
}
