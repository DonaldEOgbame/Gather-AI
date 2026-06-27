import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, Button, Banner, Segmented } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

type Institution = { id: string; name: string; timezone: string };

/**
 * Module 6A.2 · design 06 — Join your institution. Two steps: (1) enter the
 * join code and confirm the matched institution, (2) enter your details. If the
 * matric/staff ID matches the roster → OTP; otherwise → Admin pending approvals.
 */
export default function JoinCodeScreen({ navigation }: AuthScreen<"JoinCode">) {
  const { palette } = useTheme();
  const [step, setStep] = useState<"code" | "details">("code");

  const [joinCode, setJoinCode] = useState("");
  const [matched, setMatched] = useState<Institution | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveErr, setResolveErr] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const codeRef = useRef<TextInput>(null);

  // Debounced live resolution of the join code → institution (design 06 match card).
  useEffect(() => {
    const code = joinCode.trim();
    setMatched(null);
    setResolveErr(false);
    if (code.length < 3) return;
    let cancelled = false;
    setResolving(true);
    const t = setTimeout(async () => {
      try {
        const inst = await authApi.resolveJoinCode(code);
        if (!cancelled) setMatched(inst);
      } catch {
        if (!cancelled) setResolveErr(true);
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [joinCode]);

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
      if (res?.status === "pending_approval") setPending(true);
      else navigation.navigate("Otp", { email: email.trim() });
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't submit");
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 6, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accents.lilac.bg, alignItems: "center", justifyContent: "center", marginTop: 22 }}>
            <Icon name="hash" size={28} color={palette.accents.lilac.fg} />
          </View>

          {step === "code" ? (
            <>
              <Txt style={{ fontSize: 27, marginTop: 24, ...font(800), letterSpacing: -0.5, color: palette.text }}>Join your institution</Txt>
              <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
                Enter the join code from your university, or activate an emailed invite.
              </Txt>

              {/* Code entry with live institution match */}
              <Txt variant="label" style={{ marginTop: 26, marginBottom: 8 }}>Institution code</Txt>
              <Pressable
                onPress={() => codeRef.current?.focus()}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.field, borderWidth: 1.5, borderColor: matched ? palette.accents.mint.fg : palette.fieldBorder, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <TextInput
                  ref={codeRef}
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  placeholder="LAG-47"
                  placeholderTextColor={palette.textFaint}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  style={{ flex: 1, fontSize: 22, ...font(800), letterSpacing: 4, color: palette.text, padding: 0 }}
                />
                {resolving ? <ActivityIndicator color={palette.textFaint} /> : matched ? <Icon name="check" size={20} color={palette.accents.mint.fg} width={2.4} /> : null}
              </Pressable>

              {matched && (
                <View style={{ marginTop: 18, backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: palette.glass, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="building" size={22} color={palette.accents.mint.fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>{matched.name}</Txt>
                    <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Code matched · {matched.timezone}</Txt>
                  </View>
                </View>
              )}
              {resolveErr && joinCode.trim().length >= 3 && !resolving && (
                <Txt style={{ marginTop: 12, fontSize: 13, ...font(600), color: palette.danger }}>No institution matches that code.</Txt>
              )}

              <Button title="Continue" onPress={() => setStep("details")} disabled={!matched} style={{ marginTop: 24 }} />
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Activate")} style={{ marginTop: 16 }}>
                <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>I have an invite link instead</Txt>
              </Pressable>
            </>
          ) : (
            <>
              <Txt style={{ fontSize: 27, marginTop: 24, ...font(800), letterSpacing: -0.5, color: palette.text }}>Your details</Txt>
              <Txt variant="muted" style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>
                Joining <Txt style={{ ...font(700), color: palette.text }}>{matched?.name}</Txt>. We'll match your ID to the roster.
              </Txt>

              {err ? <View style={{ marginTop: 16 }}><Banner text={err} tone="danger" /></View> : null}

              <View style={{ marginTop: 22 }}>
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

              <Button title="Continue" onPress={onSubmit} loading={loading} disabled={!email || !matric || !name} style={{ marginTop: 24 }} />
              <Pressable accessibilityRole="button" onPress={() => setStep("code")} style={{ marginTop: 16 }}>
                <Txt variant="faint" style={{ textAlign: "center", fontSize: 14, ...font(700) }}>Back to code</Txt>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
