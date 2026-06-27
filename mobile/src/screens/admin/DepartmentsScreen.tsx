import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Txt, Chip, ChipRow, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font, accentFor } from "@/theme";
import { useDepartments, useCourses } from "@/hooks/queries";
import { coursesApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/stores/auth";

/** Admin · Structure / departments (design 44): live departments + courses. */
export default function DepartmentsScreen() {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const { data: departments, isLoading: loadingDepts } = useDepartments();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const [tab, setTab] = useState("Departments");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [saving, setSaving] = useState(false);

  const coursesByDept = (deptId: string) =>
    (courses ?? []).filter((c) => c.department_id === deptId);

  async function createDept() {
    if (!newDeptName.trim()) return Alert.alert("Required", "Enter a department name.");
    if (!user?.institution_id) return Alert.alert("Error", "No institution linked.");
    setSaving(true);
    try {
      await coursesApi.createDepartment({ university_id: user.institution_id, name: newDeptName.trim() });
      qc.invalidateQueries({ queryKey: ["departments"] });
      setNewDeptName("");
      setAdding(false);
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not create department.");
    } finally {
      setSaving(false);
    }
  }

  const isLoading = loadingDepts || loadingCourses;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title">Structure</Txt>
          <Txt variant="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {departments?.length ?? 0} departments · {courses?.length ?? 0} courses
          </Txt>
        </View>
        <Pressable
          onPress={() => setAdding((v) => !v)}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="plus" size={22} color={palette.primaryText} />
        </Pressable>
      </View>

      {adding && (
        <View style={{ paddingHorizontal: 24, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TextInput
            value={newDeptName}
            onChangeText={setNewDeptName}
            placeholder="Department name"
            placeholderTextColor={palette.textFaint}
            style={{ flex: 1, backgroundColor: palette.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, ...font(600), color: palette.text, borderWidth: 1, borderColor: palette.border }}
            autoFocus
          />
          <Pressable
            onPress={createDept}
            disabled={saving}
            style={{ backgroundColor: palette.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 }}
          >
            <Txt style={{ fontSize: 13, ...font(700), color: palette.primaryText }}>{saving ? "…" : "Add"}</Txt>
          </Pressable>
        </View>
      )}

      <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
        <ChipRow>
          {["Departments", "Courses"].map((t) => (
            <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </ChipRow>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {tab === "Departments" ? (
            (departments ?? []).length === 0 ? (
              <Txt variant="muted" style={{ textAlign: "center", marginTop: 24 }}>No departments yet. Tap + to add one.</Txt>
            ) : (
              (departments ?? []).map((dept) => {
                const deptCourses = coursesByDept(dept.id);
                const isOpen = expanded === dept.id;
                const accent = accentFor(dept.id);
                return (
                  <View key={dept.id} style={{ backgroundColor: palette.card, borderRadius: 18, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <Pressable onPress={() => setExpanded(isOpen ? null : dept.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}>
                      <TinyIcon icon="building" accent={accent} size={44} iconSize={22} />
                      <View style={{ flex: 1 }}>
                        <Txt style={{ fontSize: 15, ...font(800), color: palette.text }}>{dept.name}</Txt>
                        <Txt variant="faint" style={{ fontSize: 12, marginTop: 2 }}>
                          {deptCourses.length} course{deptCourses.length !== 1 ? "s" : ""}
                        </Txt>
                      </View>
                      <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                        <Icon name="chev" size={18} color={palette.textFaint} />
                      </View>
                    </Pressable>
                    {isOpen && deptCourses.length > 0 && (
                      <View style={{ borderTopColor: palette.fieldBorder, borderTopWidth: 1, paddingHorizontal: 15, paddingBottom: 12 }}>
                        {deptCourses.map((c) => (
                          <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: palette.accents[accent].fg }} />
                            <Txt style={{ fontSize: 13, ...font(800), color: palette.text, width: 72 }}>{c.code}</Txt>
                            <Txt style={{ fontSize: 12.5, ...font(500), color: palette.textMuted, flex: 1 }}>{c.title}</Txt>
                          </View>
                        ))}
                      </View>
                    )}
                    {isOpen && deptCourses.length === 0 && (
                      <View style={{ borderTopColor: palette.fieldBorder, borderTopWidth: 1, paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10 }}>
                        <Txt variant="faint" style={{ fontSize: 12 }}>No courses in this department yet.</Txt>
                      </View>
                    )}
                  </View>
                );
              })
            )
          ) : (
            (courses ?? []).length === 0 ? (
              <Txt variant="muted" style={{ textAlign: "center", marginTop: 24 }}>No courses in catalog.</Txt>
            ) : (
              (courses ?? []).map((c) => (
                <View key={c.id} style={{ backgroundColor: palette.card, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: palette.accents[accentFor(c.id)].bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 11, ...font(800), color: palette.accents[accentFor(c.id)].fg }}>{c.code.slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{c.code} · {c.title}</Txt>
                    {c.credit_units ? <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{c.credit_units} units</Txt> : null}
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}
