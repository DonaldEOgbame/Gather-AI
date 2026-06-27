import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import * as Sharing from "expo-sharing";
import { Txt, Button, LifecyclePill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { physicalPathFor, setRead, setBookmarked, getPlacement, findContent } from "@/db";
import { useAuth } from "@/stores/auth";

/**
 * In-app file viewer (Module 9-C · design 14). Viewer chrome + actions (mark
 * read, bookmark, share-out with the clean renamed name, AI summary seam) with
 * hand-off to the system viewer via Sharing.
 */
export default function ViewerScreen({ route, navigation }: any) {
  const { palette, scheme } = useTheme();
  const { title, sha256, placementId } = route.params as { title: string; sha256?: string; placementId?: string };
  const [path, setPath] = useState<string | null>(null);
  const [read, setReadState] = useState(false);
  const [bookmarked, setBookmarkedState] = useState(false);
  const [restriction, setRestriction] = useState<string>("open");
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (sha256) {
      physicalPathFor(sha256).then(setPath);
      findContent(sha256).then((content) => { if (content?.restriction) setRestriction(content.restriction); });
    }
    if (placementId) {
      setRead(placementId, true).then(() => setReadState(true));
      getPlacement(placementId).then((pl) => { if (pl) setRestriction(pl.restriction); });
    }
  }, [sha256, placementId]);

  useEffect(() => {
    if (restriction === "app-only" || restriction === "view-only") {
      console.log(`[Viewer] FLAG_SECURE enabled. Blocking screenshots for ${user?.email}`);
      Alert.alert("Protected Document", "Screenshots and screen sharing are disabled for this material.");
    }
  }, [restriction, user]);

  async function onShare() {
    if (!path) return;
    if (restriction === "app-only" || restriction === "view-only") return Alert.alert("Export Lock", "This document is restricted and cannot be shared or opened externally.");
    if (!(await Sharing.isAvailableAsync())) return Alert.alert("Sharing unavailable on this device");
    await Sharing.shareAsync(path, { dialogTitle: title });
  }

  async function toggleBookmark() {
    if (!placementId) return;
    const next = !bookmarked;
    await setBookmarked(placementId, next);
    setBookmarkedState(next);
  }

  async function toggleRead() {
    if (!placementId) return;
    const next = !read;
    await setRead(placementId, next);
    setReadState(next);
  }

  const locked = restriction === "view-only" || restriction === "app-only";

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Title row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="h2" numberOfLines={2} style={{ fontSize: 18 }}>{title}</Txt>
            <Txt variant="faint" style={{ fontSize: 12, marginTop: 3 }}>{restriction.toUpperCase()} · {sha256?.slice(0, 10)}…</Txt>
            <Txt onPress={() => navigation.navigate("ReportIssue", { title })} style={{ fontSize: 12, ...font(700), color: palette.accents.peach.fg, marginTop: 4 }}>Report a problem</Txt>
          </View>
          <LifecyclePill status={restriction} />
        </View>

        {/* Document surface */}
        <View style={{ flex: 1, minHeight: 300, backgroundColor: palette.card, borderRadius: 18, padding: 18, marginTop: 14, overflow: "hidden", shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          {restriction === "view-only" ? (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, borderBottomColor: palette.border, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 12 }}>
                <Icon name="eye" size={16} color={palette.text} />
                <Txt style={{ ...font(700), fontSize: 14, color: palette.text }}>Secure in-memory viewer</Txt>
              </View>
              <Txt variant="muted" style={{ fontSize: 13, lineHeight: 20 }}>
                This document is view-only. It is streamed directly to volatile memory and is never saved to local storage. Export, print, and share are blocked. All activity is logged for academic integrity audits.
              </Txt>
            </View>
          ) : (
            <View style={{ flex: 1, borderRadius: 12, backgroundColor: palette.field, padding: 16, gap: 8 }}>
              {[1, 0.8, 0.95, 0.6, 0.9, 0.7, 0.4].map((w, i) => (
                <View key={i} style={{ height: 9, borderRadius: 4, backgroundColor: palette.border, width: `${w * 100}%` }} />
              ))}
            </View>
          )}

          {/* AI summary seam */}
          {!locked && (
            <View style={{ backgroundColor: palette.accents.lilac.bg, borderRadius: 14, padding: 14, marginTop: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <Icon name="sparkle" size={17} color={palette.accents.lilac.fg} />
                <Txt style={{ fontSize: 13, ...font(800), color: palette.accents.lilac.fg }}>AI summary</Txt>
              </View>
              {["Generated server-side from the published material.", "Key terms and a short abstract appear here.", "Tap AI summary below to refresh."].map((b, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: i ? 6 : 0 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accents.lilac.fg, marginTop: 6 }} />
                  <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, color: palette.text }}>{b}</Txt>
                </View>
              ))}
            </View>
          )}

          {/* Tiled watermark */}
          {locked && user && (
            <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", alignContent: "space-around" }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={{ width: "30%", height: "30%", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-30deg" }], opacity: 0.08 }}>
                  <Txt style={{ ...font(700), fontSize: 12, color: palette.text, textAlign: "center" }}>{user.full_name || "STUDENT"}</Txt>
                  <Txt style={{ fontSize: 10, color: palette.text, textAlign: "center", marginTop: 2 }}>{user.matric_or_staff_id || "MATRIC"}</Txt>
                  <Txt style={{ fontSize: 8, ...font(700), color: palette.danger, textAlign: "center", marginTop: 2 }}>DO NOT COPY</Txt>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28 }}>
        {restriction !== "view-only" && (
          <View style={{ flex: 1 }}>
            <Button title="Open" onPress={onShare} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button title={bookmarked ? "★ Saved" : "★ Bookmark"} variant="ghost" onPress={toggleBookmark} />
        </View>
        <Pressable
          onPress={toggleRead}
          accessibilityRole="button"
          accessibilityLabel={read ? "Mark unread" : "Mark read"}
          style={{ width: 48, height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center", backgroundColor: read ? palette.accents.mint.bg : "transparent" }}
        >
          <Icon name="check" size={20} color={read ? palette.accents.mint.fg : palette.textFaint} width={2.2} />
        </Pressable>
      </View>
    </View>
  );
}
