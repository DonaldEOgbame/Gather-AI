import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner, Segmented } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/**
 * Module 6A.2: self-register with institution code. If the matric/staff ID matches
 * the pre-loaded roster -> OTP verification. If not -> lands in the Admin Pending
 * Approvals queue (server returns 202 with a "pending" flag).
 */
export default function JoinCodeScreen({ navigation }: AuthScreen<"JoinCode">) {
  const { palette } = useTheme();
  const [joinCode, setJoinCode] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setErr(null);
    try {
      const res: any = await authApi.selfRegister({
        join_code: joinCode.trim().toUpperCase(),
        email: email.trim(),
        full_name: name.trim(),
        matric_or_staff_id: matric.trim(),
        requested_role: role,
      });
      if (res?.status === "pending") setPending(true);
      else navigation.navigate("Otp", { email: email.trim() });
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't submit");
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.card }}>
        <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 6, justifyContent: "center" }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.lemon.bg, alignItems: "center", justifyContent: "center" }}>
            <Icon name="clock" size={28} color={palette.accents.lemon.fg} />
          </View>
          <Txt variant="display" style={{ marginTop: 24 }}>Request received</Txt>
          <Txt variant="muted" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            Your ID wasn't found on the roster, so an administrator needs to approve your request. You'll get an email once it's reviewed.
          </Txt>
          <Button title="Back to sign in" onPress={() => navigation.navigate("Login")} style={{ marginTop: 28 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 6, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.lilac.bg, alignItems: "center", justifyContent: "center", marginTop: 22 }}>
            <Icon name="hash" size={28} color={palette.accents.lilac.fg} />
          </View>
          <Txt style={{ fontSize: 27, marginTop: 24, ...font(800), letterSpacing: -0.5, color: palette.text }}>Join your institution</Txt>
          <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
            Enter the join code from your university, or activate an emailed invite.
          </Txt>

          {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

          <View style={{ marginTop: 26 }}>
            <Field label="Institution code" icon="hash" hint="e.g. ADUN-2026" autoCapitalize="characters" value={joinCode} onChangeText={setJoinCode} />
            <Field label="Full name" icon="user" value={name} onChangeText={setName} />
            <Field label="Email" icon="mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Field label="Matric / staff ID" icon="hash" autoCapitalize="characters" value={matric} onChangeText={setMatric} />
            <Txt variant="label" style={{ marginBottom: 8 }}>I am a</Txt>
            <Segmented
              value={role}
              onChange={(k) => setRole(k as "student" | "lecturer")}
              options={[{ key: "student", label: "Student" }, { key: "lecturer", label: "Lecturer" }]}
            />
          </View>

          <Button title="Continue" onPress={onSubmit} loading={loading} disabled={!joinCode || !email || !matric} style={{ marginTop: 24 }} />
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Activate")} style={{ marginTop: 16 }}>
            <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>I have an invite link instead</Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
