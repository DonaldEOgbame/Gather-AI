import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/** Module 6A.1 / 15: institution-seeded user sets their own password via invite token. */
export default function ActivateScreen({ route, navigation }: AuthScreen<"Activate">) {
  const { palette } = useTheme();
  const [token, setToken] = useState(route.params?.token ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onActivate() {
    if (pw !== pw2) return setErr("Passwords don't match");
    if (pw.length < 8) return setErr("Use at least 8 characters");
    setLoading(true);
    setErr(null);
    try {
      await authApi.activate(token.trim(), pw);
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Activation failed");
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
          <Txt variant="display" style={{ marginTop: 24 }}>You're all set</Txt>
          <Txt variant="muted" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            Your account is active. Sign in to continue.
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
            <Icon name="shield" size={28} color={palette.accents.sky.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 24 }}>Activate your account</Txt>
          <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
            Set a password using the activation token from your invite email or SMS.
          </Txt>

          {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

          <View style={{ marginTop: 26 }}>
            <Field label="Activation token" icon="hash" hint="From your invite email/SMS" autoCapitalize="none" value={token} onChangeText={setToken} />
            <Field label="New password" icon="lock" rightIcon="eye" onRightIconPress={() => setShowPw((v) => !v)} secureTextEntry={!showPw} value={pw} onChangeText={setPw} />
            <Field label="Confirm password" icon="lock" secureTextEntry={!showPw} value={pw2} onChangeText={setPw2} />
          </View>

          <Button title="Activate" onPress={onActivate} loading={loading} disabled={!token || !pw} style={{ marginTop: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
