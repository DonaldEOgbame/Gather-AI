import React from "react";
import { Pressable, View } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";

const BODY = [
  "The base case terminates the recursion and returns a concrete value.",
  "Each frame adds to the call stack — depth drives memory cost.",
  "Memoization caches sub-results to avoid recomputation.",
];

function Badge({ icon, label }: { icon: "eye" | "lock"; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 }}>
      <Icon name={icon} size={13} color="#fff" />
      <Txt style={{ fontSize: 11, ...font(800), color: "#fff" }}>{label}</Txt>
    </View>
  );
}

/** Student · Restricted viewer (design 63): dark view-only chrome + tiled watermark. */
export default function RestrictedViewerScreen({ route, navigation }: RootScreen<"RestrictedViewer">) {
  const { palette } = useTheme();
  const user = useAuth((s) => s.user);
  const title = route.params?.title ?? "Exam prep 2026.pdf";
  const code = route.params?.code ?? "CSC101";
  const mark = `${user?.full_name ?? "Ada Lovelace"} · ${user?.matric_or_staff_id ?? "CSC/19/0421"}`;
  return (
    <View style={{ flex: 1, backgroundColor: palette.primary }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 24, paddingTop: 12 }}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 15, ...font(800), color: "#fff" }}>{title}</Txt>
          <Txt style={{ fontSize: 12, ...font(600), color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{code} · page 3 of 24</Txt>
        </View>
        <View style={{ gap: 6, alignItems: "flex-end" }}>
          <Badge icon="eye" label="View-only" />
          <Badge icon="lock" label="Screenshots off" />
        </View>
      </View>

      {/* Document */}
      <View style={{ flex: 1, margin: 24, backgroundColor: "#fff", borderRadius: 16, padding: 22, overflow: "hidden" }}>
        {/* Tiled watermark */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <View style={{ transform: [{ rotate: "-28deg" }], gap: 28 }}>
            {Array.from({ length: 8 }).map((_, r) => (
              <View key={r} style={{ flexDirection: "row", gap: 24, justifyContent: "center" }}>
                {Array.from({ length: 3 }).map((_, c) => (
                  <Txt key={c} style={{ fontSize: 12, ...font(800), color: palette.text, opacity: 0.1 }}>{mark}</Txt>
                ))}
              </View>
            ))}
          </View>
        </View>

        <Txt style={{ fontSize: 16, ...font(800), color: palette.text }}>Discounting & Recursion</Txt>
        {BODY.map((t, i) => (
          <Txt key={i} style={{ fontSize: 13, lineHeight: 21, ...font(500), color: palette.textMuted, marginTop: 12 }}>{t}</Txt>
        ))}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingBottom: 28 }}>
        <Icon name="lock" size={16} color="rgba(255,255,255,0.5)" />
        <Txt style={{ flex: 1, fontSize: 12, ...font(500), color: "rgba(255,255,255,0.55)" }}>
          Sharing, export and screenshots are off for this file.
        </Txt>
      </View>
    </View>
  );
}
