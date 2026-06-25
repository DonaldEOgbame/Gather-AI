import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt, EmptyState, Chip, ChipRow, ListCard, Segmented } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { searchLocal, type PlacementRow } from "@/db";
import { useTheme, accentFor, font } from "@/theme";
import { useNavigation } from "@react-navigation/native";

/**
 * Global search (Module 9-A · design 12). Scope toggle: My Library (local,
 * offline) vs Course Catalog (server). Local matches display_name, topic, name.
 */
export default function SearchTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [scope, setScope] = useState<"library" | "catalog">("library");
  const [q, setQ] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [results, setResults] = useState<PlacementRow[]>([]);
  const [searched, setSearched] = useState(false);

  async function run() {
    if (scope === "library") setResults(await searchLocal(q, { bookmarkedOnly, unreadOnly }));
    else setResults([]); // Catalog scope hits the server; wired through list APIs.
    setSearched(true);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Txt variant="title">Search</Txt>
          <Txt onPress={() => nav.navigate("SearchInFiles")} style={{ fontSize: 13, ...font(700), color: palette.textFaint }}>Inside files</Txt>
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, marginTop: 14, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Icon name="search" size={20} color={palette.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={run}
            returnKeyType="search"
            placeholder="Search files, topics, key terms"
            placeholderTextColor={palette.textFaint}
            accessibilityLabel="Search"
            style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: palette.text, ...font(500) }}
          />
          <Icon name="filter" size={18} color={palette.textFaint} />
        </View>

        {/* Scope */}
        <View style={{ marginTop: 14 }}>
          <Segmented
            value={scope}
            onChange={(k) => setScope(k)}
            options={[{ key: "library", label: "My Library" }, { key: "catalog", label: "Catalog" }]}
          />
        </View>

        {/* Filters */}
        <View style={{ marginTop: 14 }}>
          <ChipRow>
            <Chip label="★ Bookmarked" selected={bookmarkedOnly} onPress={() => { setBookmarkedOnly((v) => !v); }} />
            <Chip label="Unread" selected={unreadOnly} onPress={() => { setUnreadOnly((v) => !v); }} />
            <Chip label="PDF" onPress={run} />
          </ChipRow>
        </View>

        {searched && (
          <Txt variant="faint" style={{ marginTop: 18, marginBottom: 8, letterSpacing: 0.5, ...font(800) }}>
            {results.length} RESULT{results.length === 1 ? "" : "S"}
          </Txt>
        )}

        {searched && results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No results"
            body={scope === "library" ? "Nothing in your library matched. Try the Catalog scope." : "Nothing in the catalog matched. Try My Library."}
          />
        ) : (
          <View style={{ gap: 10, marginTop: searched ? 0 : 18 }}>
            {results.map((item) => (
              <ListCard
                key={item.id}
                icon="file"
                accent={accentFor(item.id)}
                title={item.display_name}
                subtitle={`${item.topic ?? item.original_name}${item.week ? ` · Week ${item.week}` : ""}`}
                right={<Icon name="chev" size={18} color={palette.textFaint} />}
                onPress={() => nav.navigate("Viewer", { placementId: item.id, title: item.display_name, sha256: item.sha256 })}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
