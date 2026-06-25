import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { IconName } from "@/components/Icon";
import type { RootScreen } from "@/navigation/types";

const SOURCES: [IconName, string, string, AccentName][] = [
  ["download", "From files", "Pick from Downloads or Drive", "sky"],
  ["share", "Share into Gather", "From any app's share sheet", "mint"],
];
const FILES: [string, string, AccentName][] = [
  ["CSC101_notes.pdf", "2.4 MB", "peach"],
  ["lab_report.docx", "480 KB", "sky"],
  ["whiteboard.jpg", "1.1 MB", "mint"],
  ["scholarship.pdf", "90 KB", "lemon"],
];

/** Workflow · Import files (design 36): pick source + select files to add. */
export default function ImportFilesScreen({ navigation }: RootScreen<"ImportFiles">) {
  const { palette } = useTheme();
  const [source, setSource] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set(["CSC101_notes.pdf", "lab_report.docx", "whiteboard.jpg"]));
  const toggle = (f: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Add to library</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {SOURCES.map(([icon, title, sub, accent], i) => (
            <Pressable key={title} onPress={() => setSource(i)} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: source === i ? palette.primary : "transparent", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <TinyIcon icon={icon} accent={accent} size={44} iconSize={22} />
              <Txt style={{ fontSize: 15, ...font(800), color: palette.text, marginTop: 12 }}>{title}</Txt>
              <Txt variant="faint" style={{ fontSize: 12, ...font(500), marginTop: 4, lineHeight: 16 }}>{sub}</Txt>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 20, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>SELECT FILES</Txt>
          <Txt style={{ fontSize: 12, ...font(700), color: palette.text }}>{selected.size} selected</Txt>
        </View>
        <View style={{ gap: 10 }}>
          {FILES.map(([file, size, accent]) => {
            const sel = selected.has(file);
            return (
              <Pressable key={file} onPress={() => toggle(file)} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                <TinyIcon icon="file" accent={accent} size={40} iconSize={20} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{file}</Txt>
                  <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{size}</Txt>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: sel ? palette.primary : palette.card, borderWidth: sel ? 0 : 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                  {sel ? <Icon name="check" size={15} color="#fff" width={2.6} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, borderTopColor: palette.border, borderTopWidth: 1 }}>
        <Button title={`Import ${selected.size} file${selected.size === 1 ? "" : "s"}`} disabled={selected.size === 0} onPress={() => { Alert.alert("Imported", `${selected.size} files added to your library.`); navigation.goBack(); }} />
      </View>
    </View>
  );
}
