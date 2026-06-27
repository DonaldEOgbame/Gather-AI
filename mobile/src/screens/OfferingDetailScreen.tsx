import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Screen, Txt, Button, EmptyState, StatusPill, LifecyclePill, ListCard, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, accentFor, font } from "@/theme";
import { useMaterials } from "@/hooks/queries";
import { ensureDownloaded } from "@/services/materials";
import { formatBytes, fileKind } from "@/util/format";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";
import type { MaterialOut, OfferingOut } from "@/api/types";
import { announcementsApi, offeringsApi } from "@/api/endpoints";
import { findContent } from "@/db";

/** Module 1/9/2 · design 13 — canonical Offering → Week → File drill-down. */
export default function OfferingDetailScreen({ route, navigation }: RootScreen<"OfferingDetail">) {
  const { offeringId, code, title, sessionName, semesterTerm } = route.params;
  const { palette } = useTheme();
  const role = useAuth((s) => s.user?.global_role);
  const isStaff = role === "lecturer" || role === "admin";
  const { data: materials, isLoading, refetch } = useMaterials(offeringId);

  const [offering, setOffering] = useState<OfferingOut | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pinned, setPinned] = useState<{ id: string; title: string } | null>(null);

  const byWeek = useMemo(() => {
    const m = new Map<number, MaterialOut[]>();
    (materials ?? []).forEach((mat) => {
      const arr = m.get(mat.week) ?? [];
      arr.push(mat);
      m.set(mat.week, arr);
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [materials]);

  useEffect(() => {
    offeringsApi.get(offeringId).then(setOffering).catch(() => {}).finally(() => setLoadingOffering(false));
    announcementsApi
      .list(offeringId)
      .then((list: any[]) => {
        const p = list.find((a) => a.pinned);
        if (p) setPinned({ id: p.id, title: p.title });
      })
      .catch(() => {});
  }, [offeringId]);

  // Header action: staff manage the course; students bookmark it (design 13).
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isStaff ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage course"
            onPress={() => navigation.navigate("ManageCourse", { offeringId, code, title })}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}
          >
            <Icon name="gear" size={20} color={palette.text} />
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>Manage</Txt>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Bookmark course" style={{ paddingHorizontal: 8 }}>
            <Icon name="bookmark" size={21} color={palette.text} />
          </Pressable>
        ),
    });
  }, [navigation, isStaff, offeringId, code, title, palette.text]);

  async function onOpen(mat: MaterialOut) {
    if (!offering) return;
    try {
      const existing = await findContent(mat.content_sha256);
      if (existing) {
        navigation.navigate("Viewer", { materialId: mat.id, title: mat.title, sha256: mat.content_sha256 });
      } else {
        navigation.navigate("PreDownload", { material: mat, offering });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not check file status.");
    }
  }

  if (isLoading || loadingOffering) {
    return (
      <Screen contentStyle={{ justifyContent: "center" }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  const a = palette.accents[accentFor(offeringId)];
  const displaySession = offering?.session_name || sessionName;
  const displayTerm = offering?.semester_term || semesterTerm;
  const isArchived = offering?.status === "archived";

  return (
    <Screen scroll>
      {/* Accent hero (design 13) */}
      <View style={{ backgroundColor: a.bg, borderRadius: 24, padding: 22, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <Txt style={{ flex: 1, fontSize: 13, ...font(800), color: a.fg, letterSpacing: 0.4 }}>
            {code}{displaySession ? ` · ${displaySession}` : ""}
          </Txt>
          {offering?.status ? <StatusPill label={isArchived ? "Archived" : offering.status} accent={accentFor(offeringId)} /> : null}
        </View>
        <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 8, lineHeight: 25 }}>{title}</Txt>
        {displayTerm ? <Txt style={{ fontSize: 13, ...font(600), color: a.fg, marginTop: 12 }}>{displayTerm} semester</Txt> : null}
      </View>

      {/* Pinned announcement → feed (design 54 "pin to course header") */}
      {pinned && (
        <Pressable onPress={() => navigation.navigate("AnnouncementsFeed", { offeringId, code })} style={{ marginBottom: 16 }}>
          <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 }}>
            <Icon name="bookmark" size={18} color={palette.accents.lemon.fg} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 11, ...font(800), color: palette.accents.lemon.fg, letterSpacing: 0.5 }}>PINNED</Txt>
              <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(700), color: palette.text, marginTop: 2 }}>{pinned.title}</Txt>
            </View>
            <Icon name="chev" size={18} color={palette.accents.lemon.fg} />
          </View>
        </Pressable>
      )}

      {byWeek.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Nothing posted yet"
          body="When your lecturer publishes materials, they'll appear here organized by week."
        />
      ) : (
        byWeek.map(([week, mats]) => (
          <View key={week} style={{ marginBottom: 12 }}>
            <SectionHeader title={`Week ${week}`} action={{ label: `${mats.length} file${mats.length === 1 ? "" : "s"}`, onPress: () => {} }} />
            <View style={{ gap: 10 }}>
              {mats.map((mat) => (
                <ListCard
                  key={mat.id}
                  icon="file"
                  accent={accentFor(mat.id)}
                  title={mat.title}
                  subtitle={`${formatBytes(mat.size_bytes)} · ${fileKind(mat.original_filename).toUpperCase()}`}
                  onPress={() => onOpen(mat)}
                  right={
                    downloading === mat.id ? (
                      <ActivityIndicator />
                    ) : isStaff ? (
                      <LifecyclePill status={mat.status} />
                    ) : mat.restriction !== "open" ? (
                      <StatusPill label={mat.restriction === "view-only" ? "View-only" : "App-only"} accent={mat.restriction === "view-only" ? "blush" : "peach"} />
                    ) : (
                      <Icon name="chev" size={18} color={palette.textFaint} />
                    )
                  }
                />
              ))}
            </View>
          </View>
        ))
      )}

      {isStaff && !isArchived && (
        <View style={{ marginTop: 8 }}>
          <Button title="Upload material" icon="upload" variant="secondary" onPress={() => navigation.navigate("UploadMaterial", { offeringId, code })} />
        </View>
      )}
    </Screen>
  );
}
