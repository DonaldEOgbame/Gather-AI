import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { institutionApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";

const ALL_TYPES = ["PDF", "DOCX", "PPTX", "JPG", "PNG", "MP4", "ZIP"];

/** Admin · File & upload limits (design 51): allowed types + numeric limits, persisted to institution settings. */
export default function FileLimitsScreen() {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [on, setOn] = useState<Set<string>>(new Set(["PDF", "DOCX", "PPTX", "JPG", "PNG"]));
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50);
  const [maxFilesPerWeek, setMaxFilesPerWeek] = useState(20);

  useEffect(() => {
    institutionApi.get().then((inst) => {
      const types = inst.allowed_file_types.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
      setOn(new Set(types));
      setMaxFileSizeMb(inst.max_file_size_mb);
      setMaxFilesPerWeek(inst.max_files_per_week);
    }).catch(() => {
      // fall through with defaults if network is unavailable
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (t: string) =>
    setOn((s) => {
      const n = new Set(s);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });

  const save = async () => {
    setSaving(true);
    try {
      await institutionApi.patch({
        allowed_file_types: Array.from(on).join(","),
        max_file_size_mb: maxFileSizeMb,
        max_files_per_week: maxFilesPerWeek,
      });
      qc.invalidateQueries({ queryKey: ["institution"] });
      Alert.alert("Saved", "File limits updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save limits.");
    } finally {
      setSaving(false);
    }
  };

  const LIMITS: [string, string, number, (v: number) => void][] = [
    ["Max file size", `${maxFileSizeMb} MB`, maxFileSizeMb, setMaxFileSizeMb],
    ["Files per week", `${maxFilesPerWeek}`, maxFilesPerWeek, setMaxFilesPerWeek],
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>File & upload limits</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>ALLOWED FILE TYPES</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ALL_TYPES.map((t) => {
            const active = on.has(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggle(t)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? palette.primary : palette.card, borderWidth: active ? 0 : 1.5, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}
              >
                {active ? <Icon name="check" size={14} color={palette.primaryText} width={2.6} /> : null}
                <Txt style={{ fontSize: 13, ...font(700), color: active ? palette.primaryText : palette.textFaint }}>{t}</Txt>
              </Pressable>
            );
          })}
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>LIMITS</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          {LIMITS.map(([label, val], i) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: palette.fieldBorder }}>
              <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{label}</Txt>
              <View style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Txt style={{ fontSize: 13.5, ...font(800), color: palette.text }}>{val}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18, backgroundColor: palette.accents.sky.bg, borderRadius: 16, padding: 14, flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
          <Icon name="sparkle" size={18} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, ...font(500), color: palette.text }}>
            Validated on upload — type, size and weekly count. Rejections show the reason to the lecturer.
          </Txt>
        </View>

        <View style={{ marginTop: 22 }}>
          <Button title={saving ? "Saving…" : "Save limits"} onPress={save} />
        </View>
      </ScrollView>
    </View>
  );
}
