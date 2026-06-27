import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/** Reset password (design 04 flow): complete the reset with the emailed code +
 * a new password. Mirrors the Activate screen, but hits the public reset route. */
export default function ResetPasswordScreen({ route, navigation }: AuthScreen<"ResetPassword">) {
  const { palette } = useTheme();
  const [token, setToken] = useState(route.params?.token ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onReset() {
    if (pw !== pw2) return setErr("Passwords don't match");
    if (pw.length < 8) return setErr("Use at least 8 characters");
    setLoading(true);
    setErr(null);
    try {
      await authApi.resetPasswordPublic(token.trim(), pw);
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ flex: 1, paddingHorizontal: 30, justifyContent: "center" }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={30} color={palette.accents.mint.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 24 }}>Password updated</Txt>
          <Txt variant="muted" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            Your password has been reset and other devices were signed out. Sign in to continue.
          </Txt>
          <Button title="Go to sign in" onPress={() => navigation.navigate("Login")} style={{ marginTop: 28 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 30, paddingTop: 6 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.sky.bg, alignItems: "center", justifyContent: "center", marginTop: 22 }}>
            <Icon name="lock" size={28} color={palette.accents.sky.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 24 }}>Set a new password</Txt>
          <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
            Enter the reset code from your email and choose a new password.
          </Txt>

          {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

          <View style={{ marginTop: 26 }}>
            <Field label="Reset code" icon="hash" hint="From your reset email" autoCapitalize="none" value={token} onChangeText={setToken} />
            <Field label="New password" icon="lock" rightIcon="eye" onRightIconPress={() => setShowPw((v) => !v)} secureTextEntry={!showPw} value={pw} onChangeText={setPw} />
            <Field label="Confirm password" icon="lock" secureTextEntry={!showPw} value={pw2} onChangeText={setPw2} />
          </View>

          <Button title="Reset password" onPress={onReset} loading={loading} disabled={!token || !pw} style={{ marginTop: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
