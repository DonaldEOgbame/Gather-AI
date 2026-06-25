import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Txt, Button, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import {
  getOrCreateCourseFolder,
  listFolders,
  listPlacements,
  recordMapping,
  relinkToCourse,
  setBookmarked,
  setRead,
  listCollections,
  addPlacementToCollection,
  removePlacementFromCollection,
  listCollectionPlacements,
  deleteCollection,
  type PlacementRow,
} from "@/db";
import { coursesApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

/** Folder contents (Module 9-E · design 11). Smart-folder affordances + file actions. */
export default function FolderDetailScreen({ route }: RootScreen<"FolderDetail">) {
  const { folderId, name, isCollection } = route.params;
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [items, setItems] = useState<PlacementRow[]>([]);
  const [keywords, setKeywords] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (isCollection) {
      setItems(await listCollectionPlacements(folderId));
      setKeywords(null);
    } else {
      setItems(await listPlacements(folderId));
      const folders = await listFolders();
      setKeywords(folders.find((f) => f.id === folderId)?.cluster_keywords ?? null);
    }
  }, [folderId, isCollection]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function linkToCourse() {
    const courses = await coursesApi.list().catch(() => []);
    if (!courses.length) return Alert.alert("No courses to link to");
    Alert.alert(
      "Link to course",
      "Pick a course; this folder's files move into it and the matcher learns.",
      courses.slice(0, 3).map((c) => ({
        text: `${c.code}`,
        onPress: async () => {
          const dest = await getOrCreateCourseFolder(c.id, `${c.code} ${c.title}`);
          for (const it of items) await relinkToCourse(it.id, dest, c.id);
          await recordMapping(name, c.id);
          reload();
        },
      }))
    );
  }

  function longPress(item: PlacementRow) {
    const actions: any[] = [
      { text: item.is_bookmarked ? "Remove bookmark" : "Bookmark", onPress: async () => { await setBookmarked(item.id, !item.is_bookmarked); reload(); } },
      { text: item.is_read ? "Mark unread" : "Mark read", onPress: async () => { await setRead(item.id, !item.is_read); reload(); } },
    ];
    if (isCollection) {
      actions.push({ text: "Remove from collection", style: "destructive", onPress: async () => { await removePlacementFromCollection(folderId, item.id); reload(); } });
    } else {
      actions.push({
        text: "Add to collection…",
        onPress: async () => {
          const colls = await listCollections();
          if (!colls.length) return Alert.alert("No collections", "Create a collection in My Library first!");
          Alert.alert("Add to collection", "Select a collection", colls.map((c) => ({ text: c.name, onPress: async () => { await addPlacementToCollection(c.id, item.id); Alert.alert("Success", `Added to ${c.name}`); } })));
        },
      });
    }
    actions.push({ text: "Cancel", style: "cancel" });
    Alert.alert(item.display_name, "Actions", actions);
  }

  const accent = accentFor(folderId);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Folder header */}
        <TinyIcon icon={isCollection ? "bookmark" : "folder"} accent={accent} size={52} iconSize={26} />
        <Txt variant="title" style={{ fontSize: 22, marginTop: 12 }}>{name}</Txt>
        <Txt variant="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
          {items.length} file{items.length === 1 ? "" : "s"}{isCollection ? " · collection" : " · all offline"}
        </Txt>

        {keywords && (
          <View style={{ marginTop: 14 }}>
            <ChipRow>
              {keywords.split(/[,\s]+/).filter(Boolean).slice(0, 4).map((kw) => (
                <Chip key={kw} label={kw} onPress={() => Alert.alert("Why is this here?", `These files were grouped because they share the key term(s): ${keywords}.`)} />
              ))}
            </ChipRow>
          </View>
        )}

        {keywords !== null && (
          <View style={{ marginTop: 14 }}>
            <Button title="Link to course" variant="ghost" icon="folder" onPress={linkToCourse} />
          </View>
        )}
        {isCollection && (
          <View style={{ marginTop: 14 }}>
            <Button
              title="Delete collection"
              variant="ghost"
              icon="trash"
              onPress={() =>
                Alert.alert("Delete collection", `Delete ${name}? This won't delete the files, only the collection group.`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => { await deleteCollection(folderId); nav.goBack(); } },
                ])
              }
            />
          </View>
        )}

        {/* Files */}
        <View style={{ marginTop: 18, gap: 10 }}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => nav.navigate("Viewer", { placementId: item.id, title: item.display_name, sha256: item.sha256 })}
              onLongPress={() => longPress(item)}
              style={({ pressed }) => ({ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, opacity: pressed ? 0.85 : 1, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 })}
            >
              <TinyIcon icon="file" accent={accentFor(item.id)} size={44} iconSize={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{item.display_name}</Txt>
                <Txt numberOfLines={1} variant="faint" style={{ fontSize: 12, marginTop: 3 }}>was: {item.original_name}</Txt>
              </View>
              {item.is_bookmarked ? <Icon name="bookmark" size={18} color={palette.accents.peach.fg} /> : null}
              {!item.is_read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accents.sky.fg }} /> : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
