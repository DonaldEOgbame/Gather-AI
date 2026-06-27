import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View, Modal, ActivityIndicator } from "react-native";
import { Txt } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { listCollections, createCollection, type CollectionRow } from "@/db";

const ACCENTS: AccentName[] = ["peach", "sky", "lemon", "lilac", "mint"];

/** Student · Collections (design 71): synced bookmark collections grid. */
export default function CollectionsScreen() {
  const { palette, scheme } = useTheme();
  const [collections, setCollections] = useState<(CollectionRow & { count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setCollections(await listCollections()); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addCollection = async () => {
    if (!newName.trim()) return;
    await createCollection(newName.trim());
    setNewName("");
    setShowNew(false);
    load();
  };

  const rows: typeof collections[] = [];
  for (let i = 0; i < collections.length; i += 2) rows.push(collections.slice(i, i + 2));

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Collections</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>Saved on this device</Txt>
        </View>
        <Pressable onPress={() => setShowNew(true)} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={22} color={palette.primaryText} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>
          {collections.length === 0 && (
            <Txt variant="muted" style={{ textAlign: "center", marginTop: 40 }}>No collections yet. Tap + to create one.</Txt>
          )}
          {rows.map((pair, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
              {pair.map((c, ci) => {
                const accent = ACCENTS[(ri * 2 + ci) % ACCENTS.length];
                return (
                  <Pressable key={c.id} onPress={() => Alert.alert(c.name, `${c.count} file${c.count !== 1 ? "s" : ""}`)} style={{ flex: 1, backgroundColor: palette.card, borderRadius: 18, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.accents[accent].bg, alignItems: "center", justifyContent: "center" }}>
                        <Icon name="bookmark" size={22} color={palette.accents[accent].fg} />
                      </View>
                    </View>
                    <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text, marginTop: 14 }}>{c.name}</Txt>
                    <Txt variant="faint" style={{ fontSize: 12.5, ...font(600), marginTop: 3 }}>{c.count} file{c.count !== 1 ? "s" : ""}</Txt>
                  </Pressable>
                );
              })}
              {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showNew} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <Txt style={{ fontSize: 18, ...font(800), color: palette.text, marginBottom: 14 }}>New collection</Txt>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={palette.textFaint}
              autoFocus
              style={{ backgroundColor: palette.field, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, ...font(600), color: palette.text, marginBottom: 14 }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setShowNew(false)} style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", paddingVertical: 14 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.textMuted }}>Cancel</Txt>
              </Pressable>
              <Pressable onPress={addCollection} style={{ flex: 1, borderRadius: 999, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center", paddingVertical: 14 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.primaryText }}>Create</Txt>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
