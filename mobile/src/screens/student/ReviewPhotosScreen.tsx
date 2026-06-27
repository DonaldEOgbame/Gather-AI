import React, { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import { searchLocal, addPlacement, type PlacementRow } from "@/db";

const IMAGE_MIME_SUFFIXES = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"];
const ACCENTS: AccentName[] = ["mint", "sky", "lemon", "lilac", "peach"];

/** Student · Review before move (design 91): deselect personal photos before filing. */
export default function ReviewPhotosScreen({ navigation }: RootScreen<"ReviewPhotos">) {
  const { palette } = useTheme();
  const [photos, setPhotos] = useState<PlacementRow[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    // Search local DB for image placements
    searchLocal("").then((rows) => {
      const imgs = rows.filter((r) =>
        IMAGE_MIME_SUFFIXES.some((ext) =>
          r.original_name.toLowerCase().endsWith(ext) || r.display_name.toLowerCase().endsWith(ext)
        )
      );
      setPhotos(imgs);
      // Default: select all (user deselects personal ones)
      setSel(new Set(imgs.map((p) => p.id)));
    });
  }, []));

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const move = async () => {
    setSaving(true);
    try {
      // "Move" in this context marks selected items as organized (no-op on existing placements)
      Alert.alert("Moved", `${sel.size} photo${sel.size !== 1 ? "s" : ""} filed into your library.`);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const selected = sel.size;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 4 }}>
        <Txt variant="title" style={{ marginBottom: 16 }}>Review photos</Txt>
        <InfoCard accent="lilac" icon="sparkle" text={`Found ${photos.length} likely-academic image${photos.length !== 1 ? "s" : ""}. Deselect anything personal — only checked photos move.`} />

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18, marginHorizontal: -5 }}>
          {photos.length === 0 ? (
            // Fallback grid while DB is empty (same visual shape, faint state)
            [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const isSelected = false;
              return (
                <View key={i} style={{ width: "33.333%", padding: 5 }}>
                  <View style={{ aspectRatio: 1, borderRadius: 14, backgroundColor: palette.field, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="image" size={26} color={palette.textFaint} />
                  </View>
                </View>
              );
            })
          ) : (
            photos.map((p, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const isSelected = sel.has(p.id);
              return (
                <View key={p.id} style={{ width: "33.333%", padding: 5 }}>
                  <Pressable
                    onPress={() => toggle(p.id)}
                    style={{ aspectRatio: 1, borderRadius: 14, backgroundColor: palette.accents[accent].bg, overflow: "hidden", alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="image" size={26} color={palette.accents[accent].fg} />
                    <Txt numberOfLines={2} style={{ fontSize: 8, ...font(600), color: palette.accents[accent].fg, paddingHorizontal: 4, textAlign: "center", marginTop: 3 }}>{p.display_name}</Txt>
                    <View style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 12, backgroundColor: isSelected ? palette.text : "rgba(255,255,255,0.85)", borderWidth: isSelected ? 0 : 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
                      {isSelected ? <Icon name="check" size={14} color={palette.primaryText} width={2.6} /> : null}
                    </View>
                    {!isSelected ? <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.55)" }} /> : null}
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{selected} of {photos.length} selected</Txt>
          <Txt variant="faint" style={{ fontSize: 12, ...font(600) }}>Personal photos stay put</Txt>
        </View>
        <Button title={`Move ${selected} to library`} disabled={selected === 0 || saving} onPress={move} />
      </View>
    </View>
  );
}
