import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Txt, Button, EmptyState, LifecyclePill, TinyIcon } from "@/components/ui";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { offeringsApi, materialsApi } from "@/api/endpoints";
import { extractMeta } from "@/scan/matcher";
import { formatBytes } from "@/util/format";
import { useTheme, accentFor, font } from "@/theme";
import type { OfferingOut, MaterialOut } from "@/api/types";

/**
 * Lecturer Drafts queue (Module 2 / 15 · design 20). Upload (Share-to-App seam),
 * review AI-suggested metadata (editable), and batch publish/schedule.
 */
export default function DraftsTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const [courses, setCourses] = useState<OfferingOut[]>([]);
  const [drafts, setDrafts] = useState<MaterialOut[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [courseSizes, setCourseSizes] = useState<Record<string, number>>({});

  const [editingDraft, setEditingDraft] = useState<MaterialOut | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editWeek, setEditWeek] = useState("");
  const [editRestriction, setEditRestriction] = useState("open");
  const [editingBusy, setEditingBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const cs = await offeringsApi.list();
      setCourses(cs);
      const all = await Promise.all(cs.map((c) => materialsApi.list(c.id)));
      const sizes: Record<string, number> = {};
      cs.forEach((c, idx) => {
        sizes[c.id] = all[idx].reduce((sum, m) => sum + m.size_bytes, 0);
      });
      setCourseSizes(sizes);
      setDrafts(all.flat().filter((m) => m.status === "draft"));
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function uploadDraft() {
    if (!courses.length) return Alert.alert("No assigned courses to upload into");
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    const meta = extractMeta(asset.name);
    const offering = courses.find((c) => (c.code ?? "").toUpperCase() === meta.courseCode) ?? courses[0];
    setBusy(true);
    try {
      const form = new FormData();
      form.append("offering_id", offering.id);
      form.append("week", String(meta.week ?? 1));
      form.append("title", meta.topic ?? asset.name);
      form.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream" } as any);
      await materialsApi.upload(form);
      Alert.alert("Added to drafts", `Suggested ${offering.code ?? ""}, Week ${meta.week ?? 1} (${Math.round(meta.confidence * 100)}% confidence). Tap the draft to adjust before publishing.`);
      reload();
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Retry from Drafts.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function publishSelected(schedule: boolean) {
    if (!selected.size) return;
    setBusy(true);
    try {
      const releaseAt = schedule ? new Date(Date.now() + 3600_000).toISOString() : null;
      await materialsApi.publishBatch([...selected], releaseAt);
      setSelected(new Set());
      reload();
      Alert.alert(schedule ? "Scheduled" : "Published", "Students get a single digest notification per course.");
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Check permissions");
    } finally {
      setBusy(false);
    }
  }

  const openEdit = (draft: MaterialOut) => {
    setEditingDraft(draft);
    setEditTitle(draft.title);
    setEditWeek(String(draft.week));
    setEditRestriction(draft.restriction);
  };

  const saveEdit = async () => {
    if (!editingDraft) return;
    const weekNum = parseInt(editWeek, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 15) return Alert.alert("Error", "Week must be between 1 and 15");
    setEditingBusy(true);
    try {
      await materialsApi.update(editingDraft.id, { title: editTitle, week: weekNum, restriction: editRestriction });
      setEditingDraft(null);
      reload();
      Alert.alert("Success", "Draft updated successfully.");
    } catch (e: any) {
      Alert.alert("Update failed", e.message || "Could not update draft.");
    } finally {
      setEditingBusy(false);
    }
  };

  const editingCourse = courses.find((c) => c.id === editingDraft?.offering_id);
  const ceiling = editingCourse?.sharing_ceiling || "open";
  const scale = ["view-only", "app-only", "open"];
  const ceilingIdx = scale.indexOf(ceiling) !== -1 ? scale.indexOf(ceiling) : 2;
  const allowedLevels = scale.slice(0, ceilingIdx + 1);
  const allCoursesFull = courses.length > 0 && courses.every((c) => (courseSizes[c.id] || 0) >= 2 * 1024 * 1024 * 1024);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Txt variant="title">Drafts</Txt>
          <Txt variant="muted" onPress={() => nav.navigate("DraftsHygiene")} style={{ fontSize: 13.5, marginTop: 2 }}>
            {drafts.length} pending file{drafts.length === 1 ? "" : "s"} · review stale
          </Txt>
        </View>
        <Pressable
          onPress={uploadDraft}
          disabled={allCoursesFull || busy}
          accessibilityRole="button"
          accessibilityLabel="Add a file"
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: allCoursesFull ? palette.textFaint : palette.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: drafts.length ? 96 : 24 }} showsVerticalScrollIndicator={false}>
        {/* Share-to-app hint */}
        <View style={{ backgroundColor: palette.accents.sky.bg, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Icon name="cloud" size={20} color={palette.accents.sky.fg} />
          <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 18, ...font(600), color: palette.accents.sky.fg }}>
            Share files from Gmail or Drive — they land here.
          </Txt>
        </View>

        {/* Storage meters */}
        {courses.map((c) => {
          const size = courseSizes[c.id] || 0;
          const limit = 2 * 1024 * 1024 * 1024;
          const percent = Math.min((size / limit) * 100, 100);
          const isFull = size >= limit;
          return (
            <View key={c.id} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Txt style={{ fontSize: 13, ...font(700), color: palette.text }}>{c.code} storage</Txt>
                <Txt variant="muted" style={{ fontSize: 12 }}>{formatBytes(size)} / 2 GB</Txt>
              </View>
              <View style={{ height: 8, backgroundColor: palette.field, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ width: `${percent}%`, height: "100%", backgroundColor: isFull ? palette.danger : palette.primary }} />
              </View>
              {isFull && <Txt style={{ color: palette.danger, fontSize: 11, ...font(700), marginTop: 6 }}>Course storage full — remove files or contact admin.</Txt>}
            </View>
          );
        })}

        {/* Drafts list */}
        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: 24 }} />
        ) : drafts.length === 0 ? (
          <EmptyState icon="edit" title="No drafts" body="Share a file from Gmail/Drive into Gather, or tap + above. It lands here for review before publishing." />
        ) : (
          <View style={{ gap: 10 }}>
            {drafts.map((item) => {
              const code = courses.find((c) => c.id === item.offering_id)?.code ?? "";
              const isSel = selected.has(item.id);
              return (
                <View
                  key={item.id}
                  style={{ backgroundColor: palette.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderColor: isSel ? palette.primary : "transparent", shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
                >
                  <Pressable
                    accessibilityLabel={isSel ? "Deselect" : "Select"}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSel }}
                    onPress={() => toggle(item.id)}
                    style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: isSel ? palette.primary : palette.card, borderWidth: isSel ? 0 : 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}
                  >
                    {isSel ? <Icon name="check" size={15} color="#fff" width={2.6} /> : null}
                  </Pressable>
                  <TinyIcon icon="file" accent={accentFor(item.id)} size={42} iconSize={20} />
                  <Pressable onPress={() => openEdit(item)} style={{ flex: 1, minWidth: 0 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 14, ...font(700), color: palette.text }}>{item.title}</Txt>
                    <Txt variant="muted" style={{ fontSize: 12, marginTop: 3 }}>{code} · Week {item.week} · {formatBytes(item.size_bytes)}</Txt>
                  </Pressable>
                  <LifecyclePill status={item.restriction} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky publish bar */}
      {selected.size > 0 && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: palette.bg, borderTopColor: palette.border, borderTopWidth: 1 }}>
          <View style={{ flex: 1 }}>
            <Button
              title={`Publish ${selected.size}`}
              onPress={() => {
                const ids = [...selected];
                const code = courses.find((c) => c.id === drafts.find((d) => d.id === ids[0])?.offering_id)?.code ?? undefined;
                nav.navigate("PublishSheet", { ids, code });
              }}
              loading={busy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Schedule" variant="ghost" onPress={() => publishSelected(true)} loading={busy} />
          </View>
        </View>
      )}

      {/* Edit Metadata sheet */}
      <Modal visible={editingDraft !== null} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
            <Txt variant="h2" style={{ fontSize: 22, marginBottom: 16 }}>Edit draft</Txt>
            <Field label="Title" value={editTitle} onChangeText={setEditTitle} />
            <Field label="Week (1–15)" icon="calendar" keyboardType="number-pad" value={editWeek} onChangeText={setEditWeek} />
            <Txt variant="label" style={{ marginBottom: 6 }}>Restriction level</Txt>
            <Txt variant="muted" style={{ marginBottom: 8, fontSize: 11.5, lineHeight: 16 }}>
              Institution ceiling: {ceiling.toUpperCase()} — you can only make files equal or more restricted.
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {scale.map((lvl) => {
                const isAllowed = allowedLevels.includes(lvl);
                const isSelected = editRestriction === lvl;
                return (
                  <Pressable
                    key={lvl}
                    disabled={!isAllowed}
                    onPress={() => setEditRestriction(lvl)}
                    style={{ flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 12, borderWidth: 1.5, borderColor: isSelected ? palette.primary : palette.border, backgroundColor: isSelected ? palette.field : "transparent", opacity: isAllowed ? 1 : 0.3 }}
                  >
                    <Txt style={{ fontSize: 12, ...font(isSelected ? 700 : 600), color: palette.text }}>{lvl}</Txt>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="ghost" onPress={() => setEditingDraft(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Save" onPress={saveEdit} loading={editingBusy} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
