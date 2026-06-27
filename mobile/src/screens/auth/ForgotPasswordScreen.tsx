import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/** Forgot password (design 04 "Forgot?"): request a reset link by email.
 * Always reports success regardless of whether the email exists (no enumeration). */
export default function ForgotPasswordScreen({ navigation }: AuthScreen<"ForgotPassword">) {
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setErr(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <View style={{ flex: 1, paddingHorizontal: 30, justifyContent: "center" }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center" }}>
            <Icon name="mail" size={28} color={palette.accents.mint.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 24 }}>Check your email</Txt>
          <Txt variant="muted" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            If an account exists for that address, we've sent a reset link. It's valid for 1 hour.
          </Txt>
          <Button title="Enter reset code" onPress={() => navigation.navigate("ResetPassword")} style={{ marginTop: 28 }} />
          <Txt onPress={() => navigation.navigate("Login")} variant="muted" style={{ textAlign: "center", marginTop: 18, ...font(700), fontSize: 14 }}>
            Back to sign in
          </Txt>
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
          <Txt variant="display" style={{ marginTop: 24 }}>Forgot password?</Txt>
          <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
            Enter your institution email and we'll send a reset link.
          </Txt>

          {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

          <View style={{ marginTop: 26 }}>
            <Field
              label="Email"
              icon="mail"
              placeholder="ada.lovelace@uni.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Button title="Send reset link" onPress={onSubmit} loading={loading} disabled={!email} style={{ marginTop: 16 }} />

          <Txt onPress={() => navigation.navigate("ResetPassword")} variant="muted" style={{ textAlign: "center", marginTop: 18, ...font(700), fontSize: 14 }}>
            I already have a reset code
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
