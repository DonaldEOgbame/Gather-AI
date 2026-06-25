import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { useTheme, font } from "@/theme";
import { sessionsApi } from "@/api/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import type { RootScreen } from "@/navigation/types";

/** Admin · Create session (design 78): two semesters spawned together. */
export default function CreateSessionScreen({ navigation }: RootScreen<"CreateSession">) {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return Alert.alert("Required", "Session name is required.");
    setBusy(true);
    try {
      await sessionsApi.create({
        name: name.trim(),
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["current-context"] });
      Alert.alert("Session created", `${name} is live with both semesters.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not create session.");
    } finally {
      setBusy(false);
    }
  }

  const WILL_CREATE = [
    ["First Semester", "Starts with session start date"],
    ["Second Semester", "Follows First Semester"],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>New academic session</Txt>
        <Txt variant="muted" style={{ fontSize: 13, ...font(500), marginTop: 4 }}>Two semesters are created together.</Txt>

        <View style={{ marginTop: 18 }}>
          <Field label="SESSION NAME" icon="calendar" placeholder="e.g. 2026 / 2027" value={name} onChangeText={setName} />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="STARTS" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="ENDS" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          </View>
        </View>

        <View style={{ backgroundColor: palette.field, borderRadius: 16, padding: 14, marginTop: 2 }}>
          <Txt variant="faint" style={{ fontSize: 11, ...font(800), letterSpacing: 0.5, marginBottom: 10 }}>WILL CREATE</Txt>
          {WILL_CREATE.map(([title, range]) => (
            <View key={title} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
              <Icon name="check" size={17} color={palette.accents.mint.fg} width={2.4} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 13.5, ...font(700), color: palette.text }}>{title}</Txt>
                <Txt variant="faint" style={{ fontSize: 11.5, ...font(600), marginTop: 1 }}>{range}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Button title="Create session + 2 semesters" loading={busy} onPress={handleCreate} />
        </View>
      </View>
    </View>
  );
}
