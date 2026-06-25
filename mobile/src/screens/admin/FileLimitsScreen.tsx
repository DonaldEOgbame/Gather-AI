import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";

const TYPES = ["PDF", "DOCX", "PPTX", "JPG", "PNG", "MP4", "ZIP"];
const DEFAULT_ON = new Set(["PDF", "DOCX", "PPTX", "JPG", "PNG"]);
const LIMITS: [string, string][] = [
  ["Max file size", "50 MB"],
  ["Files per week", "20"],
  ["Total per course", "2 GB"],
];

/** Admin · File & upload limits (design 51): allowed types + numeric limits. */
export default function FileLimitsScreen() {
  const { palette } = useTheme();
  const [on, setOn] = useState<Set<string>>(new Set(DEFAULT_ON));
  const toggle = (t: string) =>
    setOn((s) => {
      const n = new Set(s);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>File & upload limits</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>ALLOWED FILE TYPES</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TYPES.map((t) => {
            const active = on.has(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggle(t)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? palette.primary : palette.card, borderWidth: active ? 0 : 1.5, borderColor: palette.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}
              >
                {active ? <Icon name="check" size={14} color="#fff" width={2.6} /> : null}
                <Txt style={{ fontSize: 13, ...font(700), color: active ? "#fff" : palette.textFaint }}>{t}</Txt>
              </Pressable>
            );
          })}
        </View>

        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>LIMITS</Txt>
        <View style={{ backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 16, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          {LIMITS.map(([label, val], i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: "#F1F2F4" }}>
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
      </ScrollView>
    </View>
  );
}
