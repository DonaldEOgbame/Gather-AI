import React from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Txt, TinyIcon, Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useOfferingAnalytics } from "@/hooks/queries";
import { formatBytes } from "@/util/format";

/** Lecturer · Storage full (design 74): upload blocked when a course offering is
 * at its storage cap. Usage and cap come from the offering analytics endpoint. */
export default function StorageFullScreen() {
  const { palette, scheme } = useTheme();
  const route = useRoute<any>();
  const offeringId: string = route.params?.offeringId;
  const code: string = route.params?.code ?? "Course";
  const fileName: string = route.params?.fileName ?? "Lab recording.mp4";
  const { data, isLoading } = useOfferingAnalytics(offeringId);

  const used = data?.total_bytes ?? 0;
  const cap = data?.quota_bytes ?? 2 * 1024 * 1024 * 1024;
  const pct = Math.min(100, cap > 0 ? (used / cap) * 100 : 0);
  const full = used >= cap;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Upload material</Txt>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
            <TinyIcon icon="file" accent="peach" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{fileName}</Txt>
              <Txt variant="muted" style={{ fontSize: 12, marginTop: 2 }}>Ready to publish</Txt>
            </View>
          </View>

          {full && (
            <View style={{ marginTop: 12, backgroundColor: palette.dangerSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="shield" size={19} color={palette.danger} />
              <Txt style={{ flex: 1, fontSize: 12.5, ...font(700), color: palette.danger, lineHeight: 18 }}>
                Course storage full — {formatBytes(used)} / {formatBytes(cap)}. Remove files or contact admin.
              </Txt>
            </View>
          )}

          <Txt variant="faint" style={{ ...font(800), letterSpacing: 0.5, marginTop: 20, marginBottom: 8 }}>COURSE STORAGE</Txt>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{code}</Txt>
              <Txt style={{ fontSize: 12.5, ...font(800), color: full ? palette.danger : palette.textFaint }}>
                {formatBytes(used)} / {formatBytes(cap)}
              </Txt>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.border, overflow: "hidden" }}>
              <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: full ? palette.danger : palette.primary }} />
            </View>
          </Card>

          <View style={{ flex: 1 }} />

          <View style={{ marginTop: 24 }}>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: full ? palette.border : palette.primary,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Txt style={{ fontSize: 16, ...font(700), color: full ? palette.textFaint : palette.primaryText }}>
                {full ? "Publish · unavailable" : "Publish now"}
              </Txt>
            </View>
            {full && (
              <Txt variant="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 12 }}>
                Free up space to upload again.
              </Txt>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
