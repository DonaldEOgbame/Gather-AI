import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { useTheme, font } from "@/theme";
import { coursesApi } from "@/api/endpoints";
import type { AuthScreen } from "@/navigation/types";

/** Public · Request access (design 82): institution lead form into the verification queue. */
export default function RequestAccessScreen({ navigation }: AuthScreen<"RequestAccess">) {
  const { palette } = useTheme();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return Alert.alert("Required", "Enter your institution name.");
    if (!email.trim()) return Alert.alert("Required", "Enter your work email.");
    setBusy(true);
    try {
      await coursesApi.requestAccess({
        contact_name: name.trim(),
        contact_email: email.trim(),
        institution_name: name.trim(),
        message: domain ? `Domain: ${domain.trim()}` : undefined,
      });
      Alert.alert("Request sent", "Thanks — we'll be in touch shortly.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not submit request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.card }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 26, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center", marginTop: 20, shadowColor: palette.shadow, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } }}>
          <Icon name="building" size={28} color={palette.primaryText} />
        </View>
        <Txt style={{ fontSize: 25, ...font(800), color: palette.text, letterSpacing: -0.4, marginTop: 20, lineHeight: 30 }}>Bring Gather to your school</Txt>
        <Txt variant="muted" style={{ fontSize: 14, ...font(500), marginTop: 8, lineHeight: 21 }}>We provision each institution manually after a short conversation.</Txt>

        <View style={{ marginTop: 20 }}>
          <Field label="INSTITUTION NAME" icon="building" placeholder="Lagos State University" value={name} onChangeText={setName} />
          <Field label="OFFICIAL DOMAIN" icon="hash" placeholder="lasu.edu.ng" autoCapitalize="none" value={domain} onChangeText={setDomain} />
          <Field label="WORK EMAIL" icon="mail" placeholder="you@lasu.edu.ng" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </View>

        <View style={{ flex: 1 }} />
        <InfoCard accent="lemon" icon="clock" text="You'll land in our verification queue. We'll reach out before anything goes live." />
        <View style={{ marginTop: 14 }}>
          <Button title="Request access" loading={busy} onPress={submit} />
        </View>
      </ScrollView>
    </View>
  );
}
