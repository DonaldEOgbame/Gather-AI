import React, { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/** 6-cell code entry — a hidden input drives six display boxes (design 05). */
function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { palette } = useTheme();
  const ref = useRef<TextInput>(null);
  const cells = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
  const focusIdx = Math.min(value.length, 5);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: "row", gap: 10, marginTop: 28 }}>
      {cells.map((d, i) => {
        const filled = !!d;
        const isFocus = i === focusIdx;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 16,
              backgroundColor: filled ? palette.card : palette.field,
              borderWidth: 2,
              borderColor: filled || isFocus ? palette.primary : palette.fieldBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Txt style={{ fontSize: 24, ...font(800), color: palette.text }}>{d}</Txt>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        accessibilityLabel="Verification code"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}

/** Module 6A.2 / 6C: OTP verification step; also sets the password on first verify. */
export default function OtpScreen({ route, navigation }: AuthScreen<"Otp">) {
  const { palette } = useTheme();
  const { email } = route.params;
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onVerify() {
    setLoading(true);
    setErr(null);
    try {
      await authApi.verifyOtp({ email, code: code.trim(), password: pw });
      navigation.navigate("Login");
    } catch (e: any) {
      setErr(e?.message ?? "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 6 }}>
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center", marginTop: 22 }}>
          <Icon name="shield" size={28} color={palette.accents.mint.fg} />
        </View>
        <Txt variant="display" style={{ marginTop: 24 }}>
          Verify it's you
        </Txt>
        <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
          We sent a 6-digit code to {email}. Enter it to continue.
        </Txt>

        {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

        <CodeInput value={code} onChange={setCode} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 22 }}>
          <Icon name="clock" size={18} color={palette.textFaint} />
          <Txt variant="muted" style={{ fontSize: 14 }}>Resend code in 0:24</Txt>
        </View>

        <View style={{ marginTop: 24 }}>
          <Field
            label="Set a password"
            icon="lock"
            rightIcon="eye"
            onRightIconPress={() => setShowPw((v) => !v)}
            secureTextEntry={!showPw}
            value={pw}
            onChangeText={setPw}
          />
        </View>

        <Button title="Verify" onPress={onVerify} loading={loading} disabled={code.length < 6 || !pw} style={{ marginTop: "auto", marginBottom: 30 }} />
      </View>
    </SafeAreaView>
  );
}
