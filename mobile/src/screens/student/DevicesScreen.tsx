import React, { useCallback, useState } from "react";
import { Alert, ScrollView, View, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Txt, Button, TinyIcon, StatusPill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { authApi } from "@/api/endpoints";
import type { SessionOut } from "@/api/types";

/** Devices (design 18): manage where you're signed in; remote-logout any device. */
export default function DevicesScreen() {
  const { palette, scheme } = useTheme();
  const [sessions, setSessions] = useState<SessionOut[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await authApi.sessions());
    } catch {
      /* offline — keep last list */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const revoke = (s: SessionOut) =>
    Alert.alert("Log out device?", `Sign out of ${s.device_name}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => authApi.revokeSession(s.id).then(load),
      },
    ]);

  const revokeAll = () =>
    Alert.alert(
      "Log out all other devices?",
      "Every device except this one will be signed out immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out all",
          style: "destructive",
          onPress: () => authApi.revokeAllOtherSessions().then(load),
        },
      ]
    );

  const others = sessions.filter((s) => !s.current);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>Devices</Txt>
      <Txt variant="muted" style={{ paddingHorizontal: 24, paddingTop: 12, lineHeight: 20 }}>
        Manage where you're signed in. Remote-logout any device.
      </Txt>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 11 }}>
            {sessions.map((s) => (
              <View
                key={s.id}
                style={{
                  backgroundColor: palette.card,
                  borderRadius: 18,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 13,
                  borderWidth: s.current ? 1.5 : 0,
                  borderColor: s.current ? palette.accents.mint.fg : "transparent",
                  shadowColor: palette.shadow,
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: scheme === "dark" ? 0 : 1,
                }}
              >
                <TinyIcon icon={s.current ? "shield" : "grid"} accent={s.current ? "mint" : "sky"} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 15, ...font(700), color: palette.text }}>{s.device_name}</Txt>
                  <Txt variant="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {s.current ? "This device" : `Last seen ${new Date(s.last_seen_at).toLocaleDateString()}`}
                  </Txt>
                </View>
                {s.current ? (
                  <StatusPill label="Current" accent="mint" />
                ) : (
                  <Txt
                    onPress={() => revoke(s)}
                    style={{ fontSize: 13, ...font(700), color: palette.danger }}
                  >
                    Log out
                  </Txt>
                )}
              </View>
            ))}
          </View>

          {others.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Button title="Log out all other devices" variant="ghost" icon="logout" onPress={revokeAll} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
