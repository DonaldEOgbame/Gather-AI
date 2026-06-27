import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Txt, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { timetableApi } from "@/api/endpoints";

/** Admin · Timetable editor (design 52): institution meeting times + conflicts. */
export default function TimetableEditorScreen({ route }: RootScreen<"TimetableEditor">) {
  const { palette, scheme } = useTheme();
  const qc = useQueryClient();
  const offeringId = route.params?.offeringId ?? "";
  const code = route.params?.code ?? "CSC101";

  const { data: slots = [], isLoading } = useQuery<any[]>({
    queryKey: ["timetable", offeringId],
    queryFn: () => timetableApi.getOfferingTimetable(offeringId),
    enabled: !!offeringId,
  });

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleImportCsv = () => {
    Alert.alert("Import CSV", "Pick a timetable CSV file.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Import",
        onPress: async () => {
          try {
            await timetableApi.importCsv(offeringId, "", "timetable.csv");
            await qc.invalidateQueries({ queryKey: ["timetable", offeringId] });
            Alert.alert("Imported", "Timetable updated.");
          } catch {
            Alert.alert("Error", "Failed to import timetable.");
          }
        },
      },
    ]);
  };

  const handleAddSlot = () => {
    Alert.alert("Add session", "Creating a new meeting slot.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 }}>
        <View>
          <Txt variant="title" style={{ fontSize: 19 }}>Timetable</Txt>
          <Txt variant="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{code}</Txt>
        </View>
        <Pressable onPress={handleImportCsv} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Icon name="upload" size={16} color={palette.textFaint} />
          <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>CSV</Txt>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {slots.length === 0 && !offeringId && (
            <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="bell" size={18} color={palette.accents.lemon.fg} />
              <Txt style={{ flex: 1, fontSize: 12.5, lineHeight: 17, ...font(600), color: palette.text }}>
                Select an offering to manage its timetable.
              </Txt>
            </View>
          )}

          {slots.length > 0 && (
            <>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 4, marginBottom: 8 }}>SESSIONS</Txt>
              <View style={{ gap: 10 }}>
                {slots.map((slot: any, i: number) => (
                  <View key={i} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                    <Txt style={{ width: 42, textAlign: "center", fontSize: 14, ...font(800), color: palette.text }}>
                      {DAYS[slot.day_of_week ?? slot.weekday ?? 0]}
                    </Txt>
                    <View style={{ width: 1, height: 36, backgroundColor: palette.fieldBorder }} />
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>{slot.start_time} – {slot.end_time}</Txt>
                      <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{slot.room}</Txt>
                    </View>
                    <Icon name="edit" size={18} color={palette.textFaint} />
                  </View>
                ))}
              </View>
            </>
          )}

          <Txt variant="faint" style={{ fontSize: 11.5, ...font(500), textAlign: "center", marginTop: 16, marginBottom: 12, lineHeight: 16 }}>
            Admin / registry sets class meeting times. Lecturers schedule material release, not meetings.
          </Txt>
          <Button title="Add session" onPress={handleAddSlot} />
        </ScrollView>
      )}
    </View>
  );
}
