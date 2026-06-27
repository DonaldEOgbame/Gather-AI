import React, { useCallback, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Txt, ListCard, SectionHeader, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor } from "@/theme";
import { listBookmarks, type PlacementRow } from "@/db";

/** Student · Bookmarks (design 37): bookmarked files, newest first. */
export default function BookmarksScreen() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [items, setItems] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listBookmarks());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Bookmarks</Txt>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No bookmarks yet"
          body="Bookmark a file from any course to find it here fast."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title={`${items.length} bookmarked`} />
          <View style={{ gap: 10 }}>
            {items.map((p) => (
              <ListCard
                key={p.id}
                icon="file"
                accent={accentFor(p.course_id ?? p.display_name)}
                title={p.display_name}
                subtitle={[p.course_id, p.week ? `Week ${p.week}` : null].filter(Boolean).join(" · ") || "Bookmarked"}
                right={<Icon name="bookmark" size={18} color={palette.accents[accentFor(p.course_id ?? p.display_name)].fg} />}
                onPress={() =>
                  nav.navigate("Viewer", {
                    placementId: p.id,
                    materialId: p.material_id ?? undefined,
                    title: p.display_name,
                    sha256: p.sha256,
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
