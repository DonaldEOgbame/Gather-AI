import React, { useState } from "react";
import { Alert, ScrollView, TextInput, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { QRCode } from "@/components/QRCode";
import { useTheme, font } from "@/theme";

/** Student · Join a course (design 60): code entry / QR scan + preview. */
export default function JoinCourseScreen() {
  const { palette } = useTheme();
  const [code, setCode] = useState("");
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Join a course</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Code field */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Icon name="hash" size={20} color={palette.textFaint} />
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="CSC-7F2K"
            placeholderTextColor={palette.textFaint}
            autoCapitalize="characters"
            accessibilityLabel="Course code"
            style={{ flex: 1, paddingVertical: 15, fontSize: 16, ...font(800), color: palette.text, letterSpacing: 3 }}
          />
        </View>

        {/* Divider */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Txt variant="faint" style={{ fontSize: 12.5, ...font(700) }}>or</Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        {/* QR scan */}
        <View style={{ alignItems: "center", gap: 10, marginTop: 14 }}>
          <QRCode size={140} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Icon name="search" size={16} color={palette.textFaint} />
            <Txt style={{ fontSize: 13, ...font(700), color: palette.textMuted }}>Scan a course QR</Txt>
          </View>
        </View>

        {/* Preview */}
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PREVIEW</Txt>
        <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Txt style={{ fontSize: 13, ...font(800), color: palette.accents.mint.fg }}>CSC</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>CSC101 · Intro to CS</Txt>
            <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>Dr. Grace Hopper · 142 students</Txt>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <Button title="Request to join" onPress={() => Alert.alert("Requested", "You'll get a Pending chip until the lecturer accepts.")} />
          <Txt variant="faint" style={{ fontSize: 12, ...font(500), textAlign: "center", marginTop: 12, lineHeight: 17 }}>
            Approval mode — you'll get a "Pending" chip until the lecturer accepts.
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
