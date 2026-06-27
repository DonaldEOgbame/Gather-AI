import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

/**
 * Frame 01 · Launch — the cold-start splash. Logo lockup centered, version
 * footer pinned to the bottom. Auto-advances to onboarding after a beat, or on
 * tap. Rendered as the first step of the onboarding flow (see OnboardingScreen).
 */
export default function LaunchScreen({ onDone }: { onDone?: () => void }) {
  const { palette } = useTheme();

  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <Pressable onPress={onDone} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel="Continue">
        {/* Logo lockup */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 26 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: palette.fill,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: palette.shadow,
              shadowOpacity: 0.45,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 18 },
            }}
          >
            <Icon name="logo" size={44} color={palette.primaryText} width={1.7} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Txt style={{ fontSize: 34, ...font(800), letterSpacing: -0.6, color: palette.text }}>Gather</Txt>
            <Txt variant="muted" style={{ fontSize: 15, ...font(500), marginTop: 8 }}>
              Your course library, organized.
            </Txt>
          </View>
        </View>

        {/* Version footer */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 56, alignItems: "center", gap: 18 }}>
          <View style={{ flexDirection: "row", gap: 7 }}>
            {[palette.text, palette.toggleTrack, palette.toggleTrack].map((c, i) => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c }} />
            ))}
          </View>
          <Txt variant="faint" style={{ fontSize: 12, ...font(600), letterSpacing: 0.5 }}>
            VERSION 1.0 · ANDROID-FIRST
          </Txt>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
