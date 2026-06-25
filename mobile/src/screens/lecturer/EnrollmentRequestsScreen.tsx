import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Txt, Button, Avatar, StatusPill } from "@/components/ui";
import { useTheme, font, type AccentName } from "@/theme";
import type { RootScreen } from "@/navigation/types";

const REQUESTS: [string, string, AccentName][] = [
  ["Ngozi Eze", "CSC/22/118 · 200 level", "mint"],
  ["Sam Ade", "CSC/22/204 · 200 level", "peach"],
  ["Bola Yusuf", "CSC/22/051 · 200 level", "sky"],
  ["Ken Obi", "CSC/22/233 · 200 level", "lilac"],
];

/** Lecturer · Enrollment requests (design 53): approve/reject the join queue. */
export default function EnrollmentRequestsScreen({ route }: RootScreen<"EnrollmentRequests">) {
  const { palette } = useTheme();
  const code = route.params?.code ?? "CSC101";
  const [requests, setRequests] = useState(REQUESTS);
  const remove = (name: string) => setRequests((r) => r.filter((x) => x[0] !== name));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Requests</Txt>
      <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
        <Txt style={{ fontSize: 13, ...font(800), color: palette.textFaint }}>{code}</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
          <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>{requests.length} students waiting</Txt>
          <StatusPill label="Approval mode" accent="lemon" />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 11 }} showsVerticalScrollIndicator={false}>
        {requests.map(([name, sub, accent]) => (
          <View key={name} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 15, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={name} size={42} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }}>{name}</Txt>
                <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{sub}</Txt>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Button title="Approve" onPress={() => remove(name)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Reject" variant="ghost" onPress={() => remove(name)} />
              </View>
            </View>
          </View>
        ))}
        {requests.length === 0 && <Txt variant="muted" style={{ textAlign: "center", marginTop: 20 }}>All caught up — no pending requests.</Txt>}
      </ScrollView>
    </View>
  );
}
