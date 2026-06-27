/**
 * Module 14: theming with Light/Dark/System, accessible contrast, and
 * no color-only status indicators (each status also carries a label/icon).
 *
 * Token values are lifted verbatim from the Gather design canvas
 * ("Gather - Mobile App.dc.html" LIGHT/DARK theme objects, mirrored in
 * README.md "Design Tokens"). Both themes share the same token NAMES — only
 * the values differ — so every screen reads `palette.*` and never forks per
 * mode. Dark mode is driven by the OS via `useColorScheme()` (see useTheme).
 *
 * KEY DUAL-ROLE NOTE (from the design README): in LIGHT mode `INK` (#14171C)
 * is BOTH the primary text colour AND the strong fill (pill buttons, hero
 * panels, active chips, toggle-on). In DARK those two roles diverge — text
 * becomes light (`text`/INK = #E7EAEF) while fills become an elevated grey
 * (`fill`/FILL = #30363F). White text/icons sitting on `fill`/`hero` stay
 * white in BOTH modes. The `primary`/`primaryText` pair encodes exactly this
 * split, so reading them blindly never produces black-on-black.
 */
import { useColorScheme } from "react-native";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";
export type Density = "compact" | "comfortable";

/**
 * Accent set for category/course cards — soft pastels (mint / lemon / lilac /
 * peach / sky / blush). `bg` tints a card, `fg` is the readable on-tint text.
 * Pick a stable accent per item via accentFor().
 */
export interface Accent {
  bg: string;
  fg: string;
}
export type AccentName = "mint" | "lemon" | "lilac" | "peach" | "sky" | "blush";

export interface Palette {
  /** Page background (design BG). */
  bg: string;
  /** Card / sheet / tab-bar surface (design SURF). */
  card: string;
  /** Hairlines, dividers, progress tracks (design BORDER). */
  border: string;
  /** Field border, tab-bar top border, row dividers (design HAIR). */
  fieldBorder: string;
  /** Filled input / subtle fill (design FIELD). */
  field: string;
  /** Primary text (design INK). */
  text: string;
  /** Secondary text (design MUT). */
  textMuted: string;
  /** Tertiary/faint text, captions, inactive icons (design MUT2). */
  textFaint: string;
  /**
   * Strong-fill colour for pill buttons / hero panels / active chips /
   * toggles-on / dots. Light = INK; dark = elevated grey FILL. NOT the same as
   * `text` in dark mode — see the dual-role note above.
   */
  primary: string;
  /** On-`primary` text/icon colour. White in both modes. */
  primaryText: string;
  /** Strong fill alias (design FILL) — identical to `primary`; kept for clarity. */
  fill: string;
  /** Full-screen dark backgrounds: App lock, restricted viewer (design HERO). */
  hero: string;
  /** On-`hero` text/icon colour. White in both modes. */
  heroText: string;
  /** Icon-tile background on coloured accent cards (design GLASS). */
  glass: string;
  /** Toggle off-track (design TOG). */
  toggleTrack: string;
  /** Tab-bar inactive icon/label (design TABO). */
  tabInactive: string;
  /** Destructive text/fill (design DANGER). */
  danger: string;
  /** Danger soft background (design DSOFT). */
  dangerSoft: string;
  /** Danger soft border (design DSOFT2). */
  dangerSoftBorder: string;
  /** Mint foreground convenience (design ACC.mint[1]) — success semantics. */
  success: string;
  /** Lemon foreground convenience (design ACC.lemon[1]) — warning semantics. */
  warning: string;
  /** Soft drop-shadow colour for cards. Effectively invisible in dark. */
  shadow: string;
  accents: Record<AccentName, Accent>;
}

// ---- LIGHT ---- (design LIGHT theme object)
const light: Palette = {
  bg: "#F7F8FA",
  card: "#FFFFFF",
  border: "#E8EAEE",
  fieldBorder: "#EDEFF3",
  field: "#F4F5F7",
  text: "#14171C",
  textMuted: "#5C6470",
  textFaint: "#9AA1AC",
  primary: "#14171C", // FILL == INK in light
  primaryText: "#FFFFFF",
  fill: "#14171C",
  hero: "#14171C",
  heroText: "#FFFFFF",
  glass: "rgba(255,255,255,.6)",
  toggleTrack: "#D3D7DE",
  tabInactive: "#AEB4BE",
  danger: "#C8372D",
  dangerSoft: "#F1D4D1",
  dangerSoftBorder: "#FBE3E0",
  success: "#1E7A46",
  warning: "#8A6D12",
  shadow: "rgba(20,25,40,.05)",
  accents: {
    mint: { bg: "#DCF2E4", fg: "#1E7A46" },
    lemon: { bg: "#FBF1CE", fg: "#8A6D12" },
    lilac: { bg: "#E9E2F8", fg: "#5A45A8" },
    peach: { bg: "#FBE3D6", fg: "#9A4F23" },
    sky: { bg: "#DCEAF8", fg: "#2C5B8A" },
    blush: { bg: "#FADCE6", fg: "#9A3358" },
  },
};

// ---- DARK ---- (design DARK theme object)
const dark: Palette = {
  bg: "#0E1116",
  card: "#181C22",
  border: "#2A2F38",
  fieldBorder: "#262B33",
  field: "#20252D",
  text: "#E7EAEF", // INK is now LIGHT
  textMuted: "#AEB5C0",
  textFaint: "#7C8492",
  primary: "#30363F", // FILL diverges from text — elevated grey
  primaryText: "#FFFFFF", // white stays white on fill
  fill: "#30363F",
  hero: "#14171C", // HERO stays the same deep ink in both modes
  heroText: "#FFFFFF",
  glass: "rgba(0,0,0,.28)",
  toggleTrack: "#3A4049",
  tabInactive: "#7C8492",
  danger: "#F2685C",
  dangerSoft: "#3A2422",
  dangerSoftBorder: "#3A2422",
  success: "#73D49E",
  warning: "#E4C969",
  shadow: "transparent", // shadows invisible in dark; separation via SURF/BORDER
  accents: {
    mint: { bg: "#16291F", fg: "#73D49E" },
    lemon: { bg: "#2A2614", fg: "#E4C969" },
    lilac: { bg: "#221C33", fg: "#B9A9ED" },
    peach: { bg: "#2C1F18", fg: "#E3A47F" },
    sky: { bg: "#16242F", fg: "#92C4ED" },
    blush: { bg: "#2C1820", fg: "#EA94B0" },
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
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem("theme_mode", mode).catch(() => {});
  },
  setDensity: (density) => set({ density }),
  setTextScale: (textScale) => set({ textScale }),
}));

/**
 * Resolves the active palette. `mode` defaults to "system" so the app follows
 * the OS appearance in real time — `useColorScheme()` re-renders consumers when
 * the device toggles light/dark. A manual override ("light"/"dark") wins when
 * set, but "system" is the default per the design brief.
 */
export function useTheme() {
  const system = useColorScheme();
  const { mode, density, textScale } = useThemePrefs();
  const resolved = mode === "system" ? system ?? "light" : mode;
  const palette = resolved === "dark" ? dark : light;
  return { palette, scheme: resolved, density, textScale };
}

