/**
 * Icon system — a direct port of the line-icon set defined in the Gather
 * design canvas ("Gather - Mobile App.dc.html"). Each glyph is a 24×24 viewBox
 * drawn with the same stroke geometry as the design's `ic()` helper, so screens
 * match the canvas pixel-for-pixel.
 *
 * A glyph is a list of primitives: a bare string is a <Path d="…">, an object
 * { t, a } is an arbitrary element (rect/circle/path) with attributes.
 */
import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { useTheme } from "@/theme";

type Prim = string | { t: "rect" | "circle" | "path"; a: Record<string, number | string> };

// Ported verbatim from the design canvas icon dictionary (`P`).
const P: Record<string, Prim[]> = {
  // "Gathered stack": a box with two progressively shorter, fainter lines
  // settling above it (design P.logo — loose sheets gathered into one stack).
  logo: [
    { t: "rect", a: { x: 4, y: 11, width: 16, height: 8, rx: 2 } },
    { t: "path", a: { d: "M6.5 8.5h11", opacity: 0.8 } },
    { t: "path", a: { d: "M9 6h6", opacity: 0.55 } },
  ],
  book: [{ t: "rect", a: { x: 4, y: 3, width: 13, height: 17, rx: 2 } }, "M8 3v17"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M13.7 21a2 2 0 0 1-3.4 0"],
  mail: ["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M3 7l9 6 9-6"],
  lock: [{ t: "rect", a: { x: 4, y: 11, width: 16, height: 10, rx: 2 } }, "M8 11V7a4 4 0 0 1 8 0v4"],
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7", { t: "circle", a: { cx: 12, cy: 12, r: 3 } }],
  search: [{ t: "circle", a: { cx: 11, cy: 11, r: 7 } }, "M21 21l-4-4"],
  back: ["M15 5l-7 7 7 7"],
  bookmark: ["M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17l-6-4-6 4z"],
  folder: ["M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v4h4"],
  check: ["M5 12l4 4 10-10"],
  clock: [{ t: "circle", a: { cx: 12, cy: 13, r: 8 } }, "M12 9v4l2.5 2", "M9 2h6"],
  download: ["M12 4v12", "M7 11l5 5 5-5", "M5 20h14"],
  upload: ["M12 16V4", "M7 9l5-5 5 5", "M5 20h14"],
  plus: ["M12 5v14M5 12h14"],
  chev: ["M9 6l6 6-6 6"],
  home: ["M3 11l9-7 9 7v8a2 2 0 0 1-2 2h-3v-6h-8v6H5a2 2 0 0 1-2-2z"],
  stack: ["M4 5h5v14H4zM10 5h5v14h-5z", "M16 6l3.5 1-3 13L17 19"],
  user: [{ t: "circle", a: { cx: 12, cy: 8, r: 4 } }, "M4 21a8 8 0 0 1 16 0"],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    { t: "circle", a: { cx: 9, cy: 7, r: 4 } },
    "M22 21v-2a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.8",
  ],
  gear: [
    { t: "circle", a: { cx: 12, cy: 12, r: 3 } },
    "M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z",
  ],
  building: ["M3 21h18", "M6 21V4h9v17", "M15 21V9h3v12", "M9 8h3M9 12h3M9 16h3"],
  sparkle: [
    "M12 3l1.7 4.5L18 9l-4.3 1.5L12 15l-1.7-4.5L6 9l4.3-1.5z",
    "M19 14l.7 1.8L21 17l-1.3.5L19 19l-.7-1.5L17 17l1.3-.7z",
  ],
  filter: ["M4 6h16M7 12h10M10 18h4"],
  sort: ["M4 7h11M4 12h7M4 17h4", "M18 7v12M18 19l3-3M18 19l-3-3"],
  trash: ["M4 7h16", "M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", "M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"],
  shield: ["M12 3l8 3v6c0 4-3.4 7.4-8 9-4.6-1.6-8-5-8-9V6z"],
  hash: ["M4 9h16M4 15h16M10 3v18M14 3v18"],
  edit: ["M4 20h4l10-10a2 2 0 0 0-3-3L5 17z", "M13.5 6.5l3 3"],
  share: ["M12 16V4", "M8 8l4-4 4 4", "M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"],
  cloud: ["M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 18z"],
  calendar: [{ t: "rect", a: { x: 4, y: 5, width: 16, height: 16, rx: 2 } }, "M4 9h16M9 3v4M15 3v4"],
  grid: [
    { t: "rect", a: { x: 4, y: 4, width: 7, height: 7, rx: 1 } },
    { t: "rect", a: { x: 13, y: 4, width: 7, height: 7, rx: 1 } },
    { t: "rect", a: { x: 4, y: 13, width: 7, height: 7, rx: 1 } },
    { t: "rect", a: { x: 13, y: 13, width: 7, height: 7, rx: 1 } },
  ],
  sun: [
    { t: "circle", a: { cx: 12, cy: 12, r: 4 } },
    "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",
  ],
  image: [
    { t: "rect", a: { x: 3, y: 4, width: 18, height: 16, rx: 2 } },
    { t: "circle", a: { cx: 8.5, cy: 9.5, r: 1.8 } },
    "M3 17l5-4 4 3 3-3 6 5",
  ],
  camera: [
    "M5 7h3l1.5-2h5L16 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z",
    { t: "circle", a: { cx: 12, cy: 13, r: 3.2 } },
  ],
  refresh: ["M3 12a9 9 0 0 1 15-6.7L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-15 6.7L3 16", "M3 21v-5h5"],
  logout: ["M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4", "M16 17l5-5-5-5", "M21 12H9"],
  megaphone: ["M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z", "M15 8a5 5 0 0 1 0 8"],
  // Not in the original canvas dictionary; added for the search clear-affordance.
  close: ["M6 6l12 12M18 6L6 18"],
};

export type IconName = keyof typeof P;

export interface IconProps {
  name: IconName;
  /** Square size in px (design default 22). */
  size?: number;
  /** Stroke color. Defaults to the theme ink (design default 1.9 width). */
  color?: string;
  /** Stroke width (design default 1.9). */
  width?: number;
}

export function Icon({ name, size = 22, color, width = 1.9 }: IconProps) {
  const { palette } = useTheme();
  const stroke = color ?? palette.text;
  const prims = P[name] ?? [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {prims.map((d, i) => {
        if (typeof d === "string") {
          return (
            <Path
              key={i}
              d={d}
              stroke={stroke}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        const common = { stroke: stroke, strokeWidth: width, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
        if (d.t === "rect") return <Rect key={i} {...(d.a as any)} {...common} />;
        if (d.t === "circle") return <Circle key={i} {...(d.a as any)} {...common} />;
        return <Path key={i} {...(d.a as any)} {...common} />;
      })}
    </Svg>
  );
}
