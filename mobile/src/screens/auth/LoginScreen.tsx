import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Device from "expo-device";
import { Txt, Button, Banner } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import { tokenStore } from "@/api/storage";
import { useAuth } from "@/stores/auth";
import type { AuthScreen } from "@/navigation/types";

export default function LoginScreen({ navigation }: AuthScreen<"Login">) {
  const { palette, scheme } = useTheme();
  const afterLogin = useAuth((s) => s.afterLogin);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogin() {
    setLoading(true);
    setErr(null);
    try {
      const device = Device.deviceName ?? "Android device";
      const tok = await authApi.login(id.trim(), pw, device);
      await tokenStore.set(tok.access_token, tok.refresh_token);
      const me = await authApi.me();
      afterLogin(me);
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 30, paddingTop: 6 }} keyboardShouldPersistTaps="handled">
          {/* Ink logo tile */}
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundColor: palette.primary,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 22,
              shadowColor: palette.shadow,
              shadowOpacity: 0.45,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
              elevation: scheme === "dark" ? 0 : 6,
            }}
          >
            <Icon name="logo" size={30} color={palette.primaryText} width={1.7} />
          </View>

          <Txt variant="display" style={{ marginTop: 24 }}>
            Welcome back
          </Txt>
          <Txt variant="muted" style={{ marginTop: 6, fontSize: 15 }}>
            Sign in with your institution account.
          </Txt>

          {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

          <View style={{ marginTop: 28 }}>
            <Field
              label="Email or matric / staff ID"
              icon="mail"
              placeholder="ada.lovelace@uni.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              value={id}
              onChangeText={setId}
            />
          </View>

          {/* Password with Forgot link */}
          <View style={{ marginTop: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Txt variant="label">Password</Txt>
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate("ForgotPassword")}>
                <Txt style={{ fontSize: 13, color: palette.accents.sky.fg, ...font(700) }}>Forgot?</Txt>
              </Pressable>
            </View>
            <Field
              label=""
              icon="lock"
              rightIcon="eye"
              onRightIconPress={() => setShowPw((v) => !v)}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              value={pw}
              onChangeText={setPw}
              style={{ marginTop: -8 }}
            />
          </View>

          <Button title="Sign in" onPress={onLogin} loading={loading} disabled={!id || !pw} style={{ marginTop: 24 }} />

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: palette.fieldBorder }} />
            <Txt variant="faint" style={{ letterSpacing: 0.5 }}>NEW HERE?</Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: palette.fieldBorder }} />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button title="Activate invite" variant="ghost" onPress={() => navigation.navigate("Activate")} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Join code" variant="ghost" onPress={() => navigation.navigate("JoinCode")} />
            </View>
          </View>

          <Txt onPress={() => navigation.navigate("RequestAccess")} variant="muted" style={{ textAlign: "center", marginTop: 22, ...font(700), fontSize: 13.5 }}>
            Bring Gather to your school →
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
