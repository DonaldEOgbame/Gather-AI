import React from "react";
import { View } from "react-native";
import { useTheme } from "@/theme";

/**
 * Decorative QR placeholder matching the design canvas (deterministic 13×13
 * pattern with the three finder corners). Not a real encoder — swap for a true
 * QR lib when join codes need to be scannable.
 */
// A QR must stay dark-on-white in BOTH themes to scan, so the surface and
// modules are fixed inks — not theme tokens (which would invert and vanish).
const QR_SURFACE = "#FFFFFF";
const QR_MODULE = "#14171C";

export function QRCode({ size = 132, seed = 0 }: { size?: number; seed?: number }) {
  const { palette } = useTheme();
  const N = 13;
  const pad = size * 0.085;
  const cell = (size - pad * 2) / N;
  return (
    <View style={{ width: size, height: size, backgroundColor: QR_SURFACE, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: pad }}>
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: N * N }, (_, i) => {
          const x = i % N;
          const y = Math.floor(i / N);
          const corner = (x < 3 && y < 3) || (x > 9 && y < 3) || (x < 3 && y > 9);
          const on = corner ? true : (x * 7 + y * 13 + x * y + seed) % 5 < 2;
          return <View key={i} style={{ width: cell, height: cell, backgroundColor: on ? QR_MODULE : "transparent", borderRadius: 1 }} />;
        })}
      </View>
    </View>
  );
}
