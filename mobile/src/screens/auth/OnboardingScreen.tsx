import React, { useState } from "react";
import { Dimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { create } from "zustand";
import { Txt, Button, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { requestNotifications } from "@/services/permissions";
import { useAuth } from "@/stores/auth";

const { width: SCREEN_W } = Dimensions.get("window");

/** Persists whether onboarding/permission-priming has been completed. */
export const useOnboarding = create<{ done: boolean; finish: () => void; replay: () => void }>((set) => ({
  done: false,
  finish: () => set({ done: true }),
  replay: () => set({ done: false }),
}));

// Radial subject cluster from the design canvas: [dx, dy, size, label, accent].
const ORBIT: [number, number, number, string, AccentName][] = [
  [0, -150, 56, "CSC", "sky"],
  [128, -78, 48, "MTH", "lemon"],
  [150, 40, 42, "PHY", "mint"],
  [96, 128, 38, "ENG", "blush"],
  [-120, -88, 44, "BIO", "peach"],
  [-150, 36, 50, "LAW", "lilac"],
  [-96, 130, 40, "ART", "mint"],
  [24, 150, 36, "CHM", "sky"],
];

function ProgressDots({ active }: { active: number }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 7 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === active ? palette.primary : "#D3D7DE",
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { palette } = useTheme();
  const finish = useOnboarding((s) => s.finish);
  const role = useAuth((s) => s.user?.global_role);
  const [step, setStep] = useState<0 | 1>(0);
  const [storage, setStorage] = useState(true);
  const [notify, setNotify] = useState(true);

  // Orbit geometry — cap the band to a phone-ish width so chips don't fly off.
  const band = Math.min(SCREEN_W - 56, 316);
  const cx = band / 2;
  const cy = 156;

  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          {/* Radial cluster */}
          <View style={{ height: 312, width: band, alignSelf: "center", marginTop: 8 }}>
            <View style={{ position: "absolute", left: cx - 148, top: cy - 148, width: 296, height: 296, borderRadius: 148, borderWidth: 1.5, borderColor: "#EDEFF3" }} />
            <View style={{ position: "absolute", left: cx - 100, top: cy - 100, width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: "#E6E9EF" }} />
            {ORBIT.map(([dx, dy, size, label, accent], i) => {
              const a = palette.accents[accent];
              return (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: cx + dx - size / 2,
                    top: cy + dy - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size * 0.34,
                    backgroundColor: a.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#141928",
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 3,
                  }}
                >
                  <Txt style={{ color: a.fg, fontSize: size * 0.26, ...font(800) }}>{label}</Txt>
                </View>
              );
            })}
            <View
              style={{
                position: "absolute",
                left: cx - 54,
                top: cy - 54,
                width: 108,
                height: 108,
                borderRadius: 32,
                backgroundColor: palette.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#141928",
                shadowOpacity: 0.5,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 16 },
                elevation: 8,
              }}
            >
              <Icon name="logo" size={44} color="#fff" width={1.7} />
            </View>
          </View>

          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Txt style={{ fontSize: 26, lineHeight: 30, textAlign: "center", ...font(800), letterSpacing: -0.5, color: palette.text }}>
              One clean copy of everything
            </Txt>
            <Txt variant="muted" style={{ fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: "center", paddingHorizontal: 6 }}>
              Gather pulls in your scattered files, removes duplicates, and sorts them by course — ready offline.
            </Txt>
          </View>

          <View style={{ marginTop: "auto", gap: 16, paddingBottom: 24 }}>
            <ProgressDots active={0} />
            <Button title="Get started" onPress={() => setStep(1)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Permission priming (Module 6B): explain WHY before the OS prompt.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 6 }}>
        <Txt variant="faint" style={{ letterSpacing: 0.6, marginTop: 18, fontSize: 13, ...font(700) }}>
          STEP 2 OF 2
        </Txt>
        <Txt style={{ fontSize: 27, lineHeight: 31, marginTop: 12, ...font(800), letterSpacing: -0.5, color: palette.text }}>
          A couple of permissions
        </Txt>
        <Txt variant="muted" style={{ fontSize: 15, lineHeight: 22, marginTop: 10 }}>
          {role === "student"
            ? "We only touch folders you grant. Originals stay safe in a 30-day trash before anything is cleaned up."
            : "We'll ask for notifications so you're alerted to draft activity and roster changes."}
        </Txt>

        <PermissionCard
          icon="folder"
          accent="sky"
          title="Storage access"
          body="So we can scan and sort the course files you already have."
          value={storage}
          onChange={setStorage}
        />
        <PermissionCard
          icon="bell"
          accent="peach"
          title="Notifications"
          body="Get alerted the moment new material is published."
          value={notify}
          onChange={async (v) => {
            setNotify(v);
            if (v) await requestNotifications();
          }}
        />

        <View style={{ marginTop: "auto", gap: 12, paddingBottom: 24 }}>
          <Button title="Continue to Gather" onPress={finish} />
          <Txt variant="faint" onPress={finish} style={{ textAlign: "center", fontSize: 15, ...font(600), paddingVertical: 6 }}>
            Maybe later
          </Txt>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PermissionCard({
  icon,
  accent,
  title,
  body,
  value,
  onChange,
}: {
  icon: "folder" | "bell";
  accent: AccentName;
  title: string;
  body: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: palette.card,
        borderRadius: 22,
        padding: 18,
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
        shadowColor: "#141928",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={24} color={palette.accents[accent].fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontSize: 16, ...font(700), color: palette.text }}>{title}</Txt>
        <Txt variant="muted" style={{ fontSize: 13, lineHeight: 19, marginTop: 3 }}>
          {body}
        </Txt>
      </View>
      <Toggle value={value} onValueChange={onChange} label={title} />
    </View>
  );
}
