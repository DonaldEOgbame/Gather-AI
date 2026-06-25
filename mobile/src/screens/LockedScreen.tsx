import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/theme";
import { useAuth } from "@/stores/auth";
import { biometricUnlock } from "@/services/permissions";

/** Module 6D · design 41: suspended users + biometric app-lock share this screen. */
export default function LockedScreen({ reason }: { reason: "suspended" | "biometric" }) {
  const { palette } = useTheme();
  const logout = useAuth((s) => s.logout);
  const setUnlocked = useAuth((s) => s.setUnlocked);
  const biometric = reason === "biometric";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 18 }}>
        <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: biometric ? palette.primary : palette.accents.blush.bg, alignItems: "center", justifyContent: "center" }}>
          <Icon name="lock" size={40} color={biometric ? "#fff" : palette.accents.blush.fg} width={1.8} />
        </View>
        <Txt variant="display" style={{ textAlign: "center" }}>
          {biometric ? "Gather is locked" : "Account suspended"}
        </Txt>
        {!biometric && (
          <Txt variant="muted" style={{ textAlign: "center", fontSize: 15, lineHeight: 22 }}>
            Your account has been suspended by an administrator. Contact your institution for help.
          </Txt>
        )}
        <View style={{ width: "100%", marginTop: 4 }}>
          {biometric ? (
            <Button title="Unlock" icon="shield" onPress={() => biometricUnlock().then((ok) => ok && setUnlocked(true))} />
          ) : (
            <Button title="Sign out" variant="ghost" icon="logout" onPress={logout} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
