import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, StatusPill, SettingsGroup, SettingItem, Toggle, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { offeringsApi, materialsApi } from "@/api/endpoints";

type Level = "open" | "app-only" | "view-only";
const OPTIONS: { key: Level; title: string; sub: string; pill: string; accent: AccentName }[] = [
  { key: "open", title: "Open", sub: "View, download, share to any app", pill: "Ceiling", accent: "mint" },
  { key: "app-only", title: "App-only", sub: "In-app only · no share or export", pill: "Stricter", accent: "lemon" },
  { key: "view-only", title: "View-only", sub: "Streamed · never stored on device", pill: "Stricter", accent: "peach" },
];

/** Lecturer · Sharing restriction (design 56): per-offering default + file overrides. */
export default function SharingRestrictionScreen({ route }: RootScreen<"SharingRestriction">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";

  const { data: offering } = useQuery<any>({
    queryKey: ["offering", offeringId],
    queryFn: () => offeringsApi.get(offeringId),
    enabled: !!offeringId,
  });

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["materials", offeringId],
    queryFn: () => materialsApi.list(offeringId),
    enabled: !!offeringId,
  });

  const [level, setLevel] = useState<Level>("open");
  const [watermark, setWatermark] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (offering) {
      setLevel((offering.sharing_ceiling as Level) ?? "open");
      setWatermark(offering.watermark_mandatory ?? false);
    }
  }, [offering]);

  const save = async () => {
    if (!offeringId) return;
    setSaving(true);
    try {
      await offeringsApi.patch(offeringId, { sharing_ceiling: level, watermark_mandatory: watermark });
      await qc.invalidateQueries({ queryKey: ["offering", offeringId] });
      Alert.alert("Saved", "Sharing restriction updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to update restriction.");
    } finally {
      setSaving(false);
    }
  };

  const perFileOverrides = materials.filter((m: any) => m.restriction && m.restriction !== level);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Sharing</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <Txt style={{ fontSize: 18, ...font(800), color: palette.text, marginTop: 2 }}>Default for this course</Txt>

        <View style={{ backgroundColor: palette.accents.sky.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="shield" size={16} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, ...font(600), color: palette.text }}>Institution ceiling: Open — you can only match it or go stricter.</Txt>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {OPTIONS.map((o) => {
            const sel = level === o.key;
            return (
              <Pressable key={o.key} onPress={() => setLevel(o.key)} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1.5, borderColor: sel ? palette.primary : "transparent", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: sel ? 0 : 2, borderColor: palette.border, backgroundColor: sel ? palette.primary : palette.card, alignItems: "center", justifyContent: "center" }}>
                  {sel ? <Icon name="check" size={14} color={palette.primaryText} width={2.6} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{o.title}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{o.sub}</Txt>
                </View>
                <StatusPill label={o.pill} accent={o.accent} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <SettingsGroup>
            <SettingItem first icon="shield" accent="lilac" title="Watermark restricted files" sub="Student name + matric overlay" right={<Toggle value={watermark} onValueChange={setWatermark} label="Watermark" />} />
          </SettingsGroup>
        </View>

        {perFileOverrides.length > 0 && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 8 }}>PER-FILE OVERRIDES</Txt>
            <View style={{ gap: 9 }}>
              {perFileOverrides.map((m: any) => {
                const accent: AccentName = m.restriction === "view-only" ? "peach" : m.restriction === "app-only" ? "lemon" : "mint";
                return (
                  <View key={m.id} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <TinyIcon icon="file" accent={accent} size={38} iconSize={19} />
                    <Txt style={{ flex: 1, fontSize: 13.5, ...font(700), color: palette.text }}>{m.title}</Txt>
                    <StatusPill label={m.restriction} accent={accent} />
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ marginTop: 22 }}>
          <Button title={saving ? "Saving…" : "Save restriction"} disabled={saving || !offeringId} onPress={save} />
        </View>
      </ScrollView>
    </View>
  );
}
