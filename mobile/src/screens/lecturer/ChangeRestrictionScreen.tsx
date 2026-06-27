import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { materialsApi } from "@/api/endpoints";
import { enqueueAction, isOfflineError } from "@/api/offlineQueue";
import { useQueryClient } from "@tanstack/react-query";

const LEVELS: [string, string, AccentName, string][] = [
  ["Open", "Download & keep anywhere", "mint", "open"],
  ["App-only", "Opens only inside Gather", "sky", "app-only"],
  ["View-only", "No download, watermarked", "lilac", "view-only"],
];

/** Lecturer · Retroactive restriction change (design 104): tighten future downloads. */
export default function ChangeRestrictionScreen({ route, navigation }: RootScreen<"ChangeRestriction">) {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const fileName = route.params?.fileName ?? "File";
  const materialId = (route.params as any)?.materialId as string | undefined;
  const [sel, setSel] = useState(0);
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    if (!materialId) {
      Alert.alert("Restriction updated", `${fileName} is now ${LEVELS[sel][0]}.`);
      navigation.goBack();
      return;
    }
    setSaving(true);
    try {
      await materialsApi.update(materialId, { restriction: LEVELS[sel][3] });
      await qc.invalidateQueries({ queryKey: ["materials"] });
      Alert.alert("Restriction updated", `${fileName} is now ${LEVELS[sel][0]}.`);
      navigation.goBack();
    } catch (e: unknown) {
      if (isOfflineError(e)) {
        await enqueueAction(`Restriction → ${LEVELS[sel][0]}: ${fileName}`, materialId ?? "");
        Alert.alert("Queued", "You're offline. The restriction change will apply when you reconnect.");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update restriction.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 18 }} />
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>Change restriction level</Txt>
        <Txt style={{ fontSize: 13, ...font(600), color: palette.textMuted, marginTop: 4 }}>{fileName}</Txt>

        <View style={{ marginTop: 16, gap: 10 }}>
          {LEVELS.map(([title, sub, accent], i) => {
            const on = sel === i;
            return (
              <Pressable key={title} onPress={() => setSel(i)} style={{ backgroundColor: on ? palette.field : palette.card, borderWidth: 1.5, borderColor: on ? palette.text : palette.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TinyIcon icon="lock" accent={accent} size={40} iconSize={20} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 1 }}>{sub}</Txt>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? palette.text : "transparent", borderWidth: on ? 0 : 2, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                  {on ? <Icon name="check" size={13} color={palette.primaryText} width={2.6} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="lemon" icon="shield" text="Tightening applies to future downloads only. Copies students already exported as Open can't be recalled." />
        </View>
        <View style={{ marginTop: 16 }}>
          <Button title={saving ? "Saving…" : "Apply to future downloads"} disabled={saving} onPress={apply} />
        </View>
      </View>
    </View>
  );
}
