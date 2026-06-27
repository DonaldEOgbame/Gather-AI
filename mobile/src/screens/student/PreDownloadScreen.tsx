import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery } from "@tanstack/react-query";
import { materialsApi } from "@/api/endpoints";
import { ensureDownloaded } from "@/services/materials";
import type { MaterialOut, OfferingOut } from "@/api/types";

function fmtBytes(b: number): string {
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

/** Student · Pre-download AI summary (design 32): TL;DR + key terms before download. */
export default function PreDownloadScreen({ route, navigation }: RootScreen<"PreDownload">) {
  const { palette } = useTheme();

  const material = (route.params as any)?.material as MaterialOut | undefined;
  const offering = (route.params as any)?.offering as OfferingOut | undefined;

  const materialId = material?.id ?? (route.params as any)?.materialId;
  const title = material?.title ?? route.params?.title ?? "File";
  const sizeBytes = material?.size_bytes ?? (route.params as any)?.sizeBytes;

  // Fetch the real AI summary from the backend (live gpt-oss). No fabricated
  // fallback — if it can't be generated we say so rather than show fake bullets.
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["material-summary", materialId],
    queryFn: () => materialsApi.summary(materialId!),
    enabled: !!materialId,
  });

  const [downloading, setDownloading] = useState(false);

  const TLDR = summary?.tldr ?? [];
  const TERMS = summary?.key_terms ?? [];

  async function handleDownload() {
    if (!material || !offering) {
      Alert.alert("Error", "No material or course context available.");
      return;
    }
    setDownloading(true);
    try {
      await ensureDownloaded(material, offering);
      // Close this modal first, then open the viewer.
      navigation.goBack();
      navigation.navigate("Viewer", { materialId: material.id, title: material.title, sha256: material.content_sha256 });
    } catch (e: any) {
      Alert.alert("Download failed", e?.message ?? "Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 16 }} />
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <TinyIcon icon="file" accent="peach" size={44} iconSize={22} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt numberOfLines={1} style={{ fontSize: 15, ...font(800), color: palette.text }}>{title}</Txt>
              {sizeBytes != null && (
                <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 2 }}>{fmtBytes(sizeBytes)}</Txt>
              )}
            </View>
          </View>

          <View style={{ backgroundColor: palette.accents.lilac.bg, borderRadius: 14, padding: 14, marginTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <Icon name="sparkle" size={17} color={palette.accents.lilac.fg} />
              <Txt style={{ fontSize: 13, ...font(800), color: palette.accents.lilac.fg }}>TL;DR</Txt>
            </View>
            {isLoading ? (
              <ActivityIndicator color={palette.accents.lilac.fg} style={{ marginVertical: 8 }} />
            ) : isError || TLDR.length === 0 ? (
              <Txt style={{ fontSize: 12.5, lineHeight: 18, color: palette.accents.lilac.fg }}>
                No summary available for this file yet.
              </Txt>
            ) : (
              TLDR.map((b, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: i ? 6 : 0 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accents.lilac.fg, marginTop: 6 }} />
                  <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, color: palette.text }}>{b}</Txt>
                </View>
              ))
            )}
          </View>

          {TERMS.length > 0 && (
            <>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 16, marginBottom: 8 }}>KEY TERMS</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                {TERMS.map((k) => (
                  <View key={k} style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                    <Txt style={{ fontSize: 12, ...font(700), color: palette.text }}>{k}</Txt>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <View style={{ flex: 1.6 }}>
            <Button
              title={
                downloading
                  ? "Downloading…"
                  : sizeBytes != null
                  ? `Download · ${fmtBytes(sizeBytes)}`
                  : "Download"
              }
              icon="download"
              disabled={downloading}
              onPress={handleDownload}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Read online" variant="ghost" disabled={downloading} onPress={() => navigation.goBack()} />
          </View>
        </View>
      </View>
    </View>
  );
}
