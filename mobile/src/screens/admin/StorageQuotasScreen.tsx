import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { useTheme, font } from "@/theme";
import { useStorageStats, useInstitution } from "@/hooks/queries";
import { formatBytes } from "@/util/format";

const STORAGE_CAP_BYTES = 500 * 1024 * 1024 * 1024; // 500 GB institution cap

/** Admin · Storage quotas (design 50): real institution usage + per-department bars. */
export default function StorageQuotasScreen() {
  const { palette } = useTheme();
  const { data: stats, isLoading } = useStorageStats();
  const { data: inst } = useInstitution();

  const totalBytes = stats?.total_bytes ?? 0;
  const pct = Math.min((totalBytes / STORAGE_CAP_BYTES) * 100, 100);

  const barColor = (p: number) =>
    p >= 95 ? palette.danger : p >= 80 ? palette.accents.peach.fg : palette.textFaint;

  const depts = stats?.by_department ?? [];
  const maxDeptBytes = Math.max(...depts.map((d) => d.bytes_used), 1);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Storage quotas</Txt>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Institution meter */}
          <View style={{ backgroundColor: palette.primary, borderRadius: 20, padding: 18 }}>
            <Txt style={{ fontSize: 13, ...font(600), color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
              {inst?.name ?? "Institution"}
            </Txt>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Txt style={{ fontSize: 26, ...font(800), color: palette.primaryText }}>{formatBytes(totalBytes)}</Txt>
              <Txt style={{ fontSize: 13, ...font(600), color: "rgba(255,255,255,0.6)" }}>
                of {formatBytes(STORAGE_CAP_BYTES)}
              </Txt>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 12, overflow: "hidden" }}>
              <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: palette.primaryText }} />
            </View>
            <Txt style={{ fontSize: 12, ...font(600), color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              {pct.toFixed(1)}% used
            </Txt>
          </View>

          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 18, marginBottom: 12 }}>BY DEPARTMENT</Txt>

          {depts.length === 0 ? (
            <Txt variant="muted" style={{ textAlign: "center" }}>No departments or files yet.</Txt>
          ) : (
            <View style={{ gap: 14 }}>
              {depts
                .slice()
                .sort((a, b) => b.bytes_used - a.bytes_used)
                .map((dept) => {
                  const p = maxDeptBytes > 0 ? (dept.bytes_used / maxDeptBytes) * 100 : 0;
                  const pctInst = STORAGE_CAP_BYTES > 0 ? (dept.bytes_used / STORAGE_CAP_BYTES) * 100 : 0;
                  return (
                    <View key={dept.department_id}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{dept.department_name}</Txt>
                        <Txt style={{ fontSize: 12.5, ...font(700), color: barColor(pctInst) }}>
                          {formatBytes(dept.bytes_used)}
                        </Txt>
                      </View>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.border, overflow: "hidden" }}>
                        <View style={{ height: 8, borderRadius: 4, width: `${p}%`, backgroundColor: palette.primary }} />
                      </View>
                      {pctInst >= 80 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: barColor(pctInst) }} />
                          <Txt style={{ fontSize: 11, ...font(700), color: barColor(pctInst) }}>
                            {pctInst >= 95 ? "Over 95% — uploads blocked" : "Over 80% — alert sent"}
                          </Txt>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
