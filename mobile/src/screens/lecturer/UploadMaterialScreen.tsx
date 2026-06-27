import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { useTheme, font } from "@/theme";
import * as DocumentPicker from "expo-document-picker";
import { materialsApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import { formatBytes, fileKind } from "@/util/format";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Upload material (design 57): file check + placement before publish. */
export default function UploadMaterialScreen({ route, navigation }: RootScreen<"UploadMaterial">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId;
  const code = route.params?.code ?? "Course";

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [week, setWeek] = useState("1");
  const [busy, setBusy] = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets.length > 0) {
      setFile(result.assets[0]);
    }
  }

  async function handleUpload(publish: boolean) {
    if (!file) return Alert.alert("No file", "Pick a file first.");
    if (!offeringId) return Alert.alert("Error", "No offering selected.");
    const weekNum = parseInt(week, 10);
    if (!weekNum || weekNum < 1 || weekNum > 15) return Alert.alert("Invalid week", "Enter a week between 1 and 15.");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("offering_id", offeringId);
      form.append("week", String(weekNum));
      form.append("title", file.name.replace(/\.[^.]+$/, ""));
      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/octet-stream",
      } as any);

      const material = await materialsApi.upload(form);

      if (publish) {
        await materialsApi.publish(material.id, null);
      }

      qc.invalidateQueries({ queryKey: ["materials", offeringId] });
      Alert.alert(publish ? "Published" : "Draft saved", `${file.name} ${publish ? "is live" : "saved as draft"}.`);
      navigation.goBack();
    } catch (e: any) {
      if (e?.status === 413) {
        // Course storage / file-size cap hit — show the dedicated blocked screen.
        navigation.navigate("StorageFull", { offeringId, code, fileName: file.name });
      } else {
        Alert.alert("Upload failed", e?.message ?? "Check permissions and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Upload material</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {file ? (
          <>
            <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <TinyIcon icon="file" accent="peach" size={44} iconSize={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{file.name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>
                  {file.size ? formatBytes(file.size) : "—"} · {fileKind(file.name)}
                </Txt>
              </View>
              <Icon name="check" size={20} color={palette.accents.mint.fg} width={2.4} />
            </View>

            <View style={{ backgroundColor: palette.accents.mint.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="check" size={16} color={palette.accents.mint.fg} width={2.4} />
              <Txt style={{ fontSize: 12.5, ...font(600), color: palette.text }}>File ready to upload</Txt>
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 24, alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <Icon name="upload" size={36} color={palette.textFaint} />
            <Txt variant="muted" style={{ textAlign: "center" }}>No file selected</Txt>
            <Button title="Choose file" onPress={pickFile} />
          </View>
        )}

        {file && (
          <View style={{ marginTop: 16 }}>
            <Button title="Change file" variant="ghost" onPress={pickFile} />
          </View>
        )}

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>PLACEMENT</Txt>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Week (1–15)"
              icon="hash"
              placeholder="e.g. 1"
              keyboardType="number-pad"
              value={week}
              onChangeText={setWeek}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: palette.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" }}>
            <Txt style={{ fontSize: 11, ...font(700), color: palette.accents.peach.fg }}>Course</Txt>
            <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 1 }}>{code}</Txt>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
          <View style={{ flex: 1.5 }}>
            <Button title="Publish now" loading={busy} onPress={() => handleUpload(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Save draft" variant="ghost" loading={busy} onPress={() => handleUpload(false)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
