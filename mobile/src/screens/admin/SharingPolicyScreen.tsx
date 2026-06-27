import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Txt, Segmented, SettingsGroup, SettingItem, Toggle, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useInstitution } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { institutionApi } from "@/api/endpoints";

/** Admin · Sharing policy (design 49): the institution sharing ceiling. */
export default function SharingPolicyScreen() {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const { data: inst, isLoading } = useInstitution();

  const [ceiling, setCeiling] = useState<"open" | "app-only" | "view-only">("open");
  const [watermark, setWatermark] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (inst) {
      setCeiling((inst.sharing_ceiling as "open" | "app-only" | "view-only") ?? "open");
      setWatermark(inst.watermark_mandatory ?? false);
    }
  }, [inst]);

  const save = async () => {
    setSaving(true);
    try {
      await institutionApi.patch({ sharing_ceiling: ceiling, watermark_mandatory: watermark });
      await qc.invalidateQueries({ queryKey: ["institution"] });
      Alert.alert("Saved", "Sharing policy updated.");
    } catch {
      Alert.alert("Error", "Failed to save policy.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Sharing policy</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="shield" size={20} color={palette.accents.lemon.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(500), color: palette.text }}>
            This sets the institution ceiling. Lecturers can make files more restricted, never less.
          </Txt>
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>EXTERNAL SHARING CEILING</Txt>
        <Segmented
          value={ceiling}
          onChange={setCeiling}
          options={[{ key: "open", label: "Open" }, { key: "app-only", label: "App-only" }, { key: "view-only", label: "View-only" }]}
        />

        <View style={{ marginTop: 18 }}>
          <SettingsGroup>
            <SettingItem
              first
              icon="shield"
              accent="lilac"
              title="Force watermark"
              sub="Name + matric on restricted viewers"
              right={<Toggle value={watermark} onValueChange={setWatermark} label="Force watermark" />}
            />
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 18, backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={18} color={palette.textFaint} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(500), color: palette.textMuted }}>
            Honest limit: this deters casual resharing, not a determined user. Watermarking is the real lever.
          </Txt>
        </View>

        <View style={{ marginTop: 22 }}>
          <Button title={saving ? "Saving…" : "Save policy"} disabled={saving} onPress={save} />
        </View>
      </ScrollView>
    </View>
  );
}
