import React, { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { QRCode } from "@/components/QRCode";
import { useTheme, font } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enrollmentApi } from "@/api/endpoints";
import type { OfferingOut } from "@/api/types";
import { CameraView, Camera } from "expo-camera";

/** Student · Join a course (design 60): code entry / QR scan + preview. */
export default function JoinCourseScreen() {
  const { palette, scheme } = useTheme();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { data: preview } = useQuery<OfferingOut>({
    queryKey: ["join-code-preview", previewId],
    queryFn: () => enrollmentApi.resolveCourseJoinCode(previewId!),
    enabled: !!previewId,
    retry: false,
  });

  const lookup = async () => {
    if (code.trim().length < 4) return;
    setPreviewId(code.trim().toUpperCase());
  };

  const join = async () => {
    if (!code.trim()) return;
    if (!preview?.id) {
      Alert.alert("Look up first", "Enter the code and tap search to preview the course before joining.");
      return;
    }
    setJoining(true);
    try {
      await enrollmentApi.enroll(preview.id, code.trim());
      await qc.invalidateQueries({ queryKey: ["offerings"] });
      Alert.alert("Joined", "You're enrolled — the course is now in your list.");
    } catch (e: any) {
      if (e?.status === 202 || e?.message?.includes("pending")) {
        Alert.alert("Requested", "Awaiting lecturer approval.");
      } else {
        Alert.alert("Could not join", e?.message ?? "Check the code and try again.");
      }
    } finally {
      setJoining(false);
    }
  };

  const onScanTap = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    if (status === "granted") {
      setShowScanner(true);
    } else {
      Alert.alert("Permission needed", "Camera permission is required to scan QR codes.");
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Check if the QR code is a URL (e.g. gather://join/CODE) or a raw code
    const parsedCode = data.includes("/join/") ? data.split("/join/")[1] : data;
    const cleanCode = parsedCode.trim().toUpperCase();
    setCode(cleanCode);
    setShowScanner(false);
    setPreviewId(cleanCode);
  };

  if (showScanner) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={{ flex: 1, justifyContent: "space-between", padding: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40 }}>
              <Pressable
                onPress={() => setShowScanner(false)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
            <View style={{ alignSelf: "center", width: 220, height: 220, borderWidth: 2, borderColor: palette.primary, borderRadius: 24, borderStyle: "dashed", backgroundColor: "rgba(0,0,0,0.1)" }} />
            <Txt style={{ textAlign: "center", color: "#FFF", fontSize: 14, ...font(700), marginBottom: 40, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              Align the course QR code inside the box
            </Txt>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Join a course</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <Icon name="hash" size={20} color={palette.textFaint} />
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setPreviewId(null); }}
            onSubmitEditing={lookup}
            placeholder="CSC-7F2K"
            placeholderTextColor={palette.textFaint}
            autoCapitalize="characters"
            accessibilityLabel="Course code"
            returnKeyType="search"
            style={{ flex: 1, paddingVertical: 15, fontSize: 16, ...font(800), color: palette.text, letterSpacing: 3 }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Txt variant="faint" style={{ fontSize: 12.5, ...font(700) }}>or</Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        <Pressable
          onPress={onScanTap}
          style={({ pressed }) => ({ alignItems: "center", gap: 10, marginTop: 14, opacity: pressed ? 0.8 : 1 })}
        >
          <QRCode size={140} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Icon name="camera" size={16} color={palette.textFaint} />
            <Txt style={{ fontSize: 13, ...font(700), color: palette.textMuted }}>Scan a course QR</Txt>
          </View>
        </Pressable>

        {preview && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PREVIEW</Txt>
            <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" }}>
                <Txt style={{ fontSize: 13, ...font(800), color: palette.accents.mint.fg }}>{preview.code?.slice(0, 3) ?? "CSC"}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>{preview.code} · {preview.title}</Txt>
                <Txt style={{ fontSize: 12.5, ...font(600), color: palette.accents.mint.fg, marginTop: 2 }}>{preview.enrollment_mode ?? "Open"} enrollment</Txt>
              </View>
            </View>
          </>
        )}

        <View style={{ marginTop: 22 }}>
          <Button
            title={joining ? "Joining…" : preview ? "Join course" : "Look up code"}
            disabled={!code.trim() || joining}
            onPress={preview ? join : lookup}
          />
          <Txt variant="faint" style={{ fontSize: 12, ...font(500), textAlign: "center", marginTop: 12, lineHeight: 17 }}>
            Enter a course join code to preview the course, then confirm to enroll.
          </Txt>
          <Txt
            onPress={() => nav.navigate("JoinOutcomes")}
            style={{ fontSize: 13, ...font(700), textAlign: "center", marginTop: 14, color: palette.textFaint }}
          >
            What happens when I join?
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}
