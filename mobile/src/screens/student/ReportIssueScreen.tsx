import React, { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { useTheme, font } from "@/theme";
import { reportsApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

const REASONS = ["Won't open", "Wrong course", "Outdated", "Other"];

/** Student · Report issue (design 62): bottom-sheet file problem report. */
export default function ReportIssueScreen({ route, navigation }: RootScreen<"ReportIssue">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "Lecture 8 — Trees.pdf";
  const code = route.params?.code ?? "CSC101 · Week 8";
  const materialId = route.params?.materialId;
  const [reason, setReason] = useState("Won't open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!materialId) {
      Alert.alert("Report sent", "Thanks — your lecturer will take a look.");
      navigation.goBack();
      return;
    }
    setBusy(true);
    try {
      await reportsApi.reportFile(materialId, reason, note.trim() || undefined);
      Alert.alert("Report sent", "Thanks — your lecturer will take a look.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not send report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 18 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 }}>
          <TinyIcon icon="file" accent="peach" size={42} iconSize={21} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{code}</Txt>
          </View>
        </View>

        <Txt style={{ fontSize: 16, ...font(800), color: palette.text, marginBottom: 12 }}>What's wrong?</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
          {REASONS.map((r) => {
            const sel = reason === r;
            return (
              <Pressable key={r} onPress={() => setReason(r)} style={{ backgroundColor: sel ? palette.primary : palette.card, borderWidth: sel ? 0 : 1.5, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: sel ? palette.primaryText : palette.textMuted }}>{r}</Txt>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16, backgroundColor: palette.field, borderRadius: 14, padding: 14, minHeight: 80 }}>
          <TextInput value={note} onChangeText={setNote} placeholder="Add a note (optional)…" placeholderTextColor={palette.textFaint} multiline textAlignVertical="top" style={{ fontSize: 13.5, ...font(500), color: palette.text, padding: 0, minHeight: 52 }} />
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Send report" loading={busy} onPress={submit} />
        </View>
        <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), textAlign: "center", marginTop: 14, lineHeight: 16 }}>
          Your lecturer sees the reason — never who reported it on its own.
        </Txt>
      </View>
    </View>
  );
}
