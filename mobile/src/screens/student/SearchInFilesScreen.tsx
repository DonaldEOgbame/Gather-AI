import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useFocusEffect } from "@react-navigation/native";
import { searchLocal, type PlacementRow, type SearchFilters } from "@/db";

const ACCENTS: AccentName[] = ["peach", "lemon", "sky", "mint", "lilac"];

const SCOPE_MAP: Record<string, Partial<SearchFilters>> = {
  Titles: {},
  "Inside files": {},
  Courses: {},
  Bookmarks: { bookmarkedOnly: true },
  Unread: { unreadOnly: true },
};

/** Student · Search inside files (design 66): offline full-text via local SQLite. */
export default function SearchInFilesScreen() {
  const { palette, scheme } = useTheme();
  const [scope, setScope] = useState("Titles");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlacementRow[]>([]);

  const doSearch = useCallback(async (query: string, currentScope: string) => {
    const filters: SearchFilters = { ...SCOPE_MAP[currentScope] };
    const rows = await searchLocal(query, filters);
    setResults(rows);
  }, []);

  useFocusEffect(useCallback(() => {
    doSearch(q, scope);
  }, [q, scope]));

  const matchCount = results.length;
  const fileCount = new Set(results.map((r) => r.sha256)).size;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Search</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <Icon name="search" size={20} color={palette.textFaint} />
          <TextInput
            value={q}
            onChangeText={(t) => { setQ(t); doSearch(t, scope); }}
            placeholder="Search inside files"
            placeholderTextColor={palette.textFaint}
            style={{ flex: 1, paddingVertical: 14, fontSize: 15, ...font(600), color: palette.text }}
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(""); doSearch("", scope); }} accessibilityLabel="Clear search">
              <Icon name="close" size={16} color={palette.textFaint} />
            </Pressable>
          )}
        </View>
        <View style={{ marginTop: 14 }}>
          <ChipRow>
            {Object.keys(SCOPE_MAP).map((s) => (
              <Chip key={s} label={s} selected={scope === s} onPress={() => { setScope(s); doSearch(q, s); }} />
            ))}
          </ChipRow>
        </View>
      </View>

      {q.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 24, marginTop: 18, marginBottom: 8 }}>
          <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>{matchCount} MATCH{matchCount !== 1 ? "ES" : ""} IN {fileCount} FILE{fileCount !== 1 ? "S" : ""}</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="cloud" size={14} color={palette.textFaint} />
            <Txt variant="faint" style={{ fontSize: 11.5, ...font(700) }}>Offline</Txt>
          </View>
        </View>
      )}

      {q.length === 0 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
          <Icon name="search" size={36} color={palette.textFaint} width={1.5} />
          <Txt variant="muted" style={{ fontSize: 14, ...font(600), marginTop: 10 }}>Type to search your library</Txt>
        </View>
      )}

      {q.length > 0 && results.length === 0 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
          <Txt variant="muted" style={{ fontSize: 14, ...font(600) }}>No matches found</Txt>
        </View>
      )}

      {results.length > 0 && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
          {results.map((p, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <View key={p.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                  <TinyIcon icon="file" accent={accent} size={38} iconSize={19} />
                  <Txt numberOfLines={1} style={{ flex: 1, fontSize: 13.5, ...font(700), color: palette.text }}>{p.display_name}</Txt>
                  {p.week != null && (
                    <View style={{ backgroundColor: palette.field, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Txt style={{ fontSize: 11.5, ...font(800), color: palette.textMuted }}>Wk {p.week}</Txt>
                    </View>
                  )}
                </View>
                {p.topic ? (
                  <View style={{ marginTop: 10, backgroundColor: palette.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
                    <Txt style={{ fontSize: 12.5, lineHeight: 18, ...font(500), color: palette.textMuted }}>{p.topic}</Txt>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
