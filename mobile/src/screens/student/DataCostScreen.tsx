import React, { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Txt, Button, TinyIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import type { RootScreen } from "@/navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

const SESSION_KEY = "session_data_used";
const MONTH_KEY = "month_data_used";

/** Student · Data-cost sheet (design 65): mobile-data warning before download. */
export default function DataCostScreen({ route, navigation }: RootScreen<"DataCost">) {
  const { palette } = useTheme();
  const title = route.params?.title ?? "File";
  const sizeBytes = (route.params as any)?.sizeBytes as number | undefined;
  const [sessionUsed, setSessionUsed] = useState(0);
  const [monthUsed, setMonthUsed] = useState(0);

  useFocusEffect(useCallback(() => {
    AsyncStorage.multiGet([SESSION_KEY, MONTH_KEY]).then(([[, s], [, m]]) => {
      setSessionUsed(Number(s ?? 0));
      setMonthUsed(Number(m ?? 0));
    });
  }, []));

  const download = async () => {
    const add = sizeBytes ?? 0;
    const newSession = sessionUsed + add;
    const newMonth = monthUsed + add;
    await AsyncStorage.multiSet([[SESSION_KEY, String(newSession)], [MONTH_KEY, String(newMonth)]]);
    Alert.alert("Downloading", "Saved offline.");
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: palette.toggleTrack, alignSelf: "center", marginBottom: 18 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <TinyIcon icon="download" accent="sky" size={44} iconSize={22} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ fontSize: 14.5, ...font(800), color: palette.text }}>{title}</Txt>
            {sizeBytes != null && (
              <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{fmtBytes(sizeBytes)}</Txt>
            )}
          </View>
        </View>

        {sizeBytes != null && (
          <View style={{ backgroundColor: palette.accents.lemon.bg, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 }}>
            <Icon name="cloud" size={22} color={palette.accents.lemon.fg} />
            <Txt style={{ fontSize: 14, ...font(700), color: palette.text }}>This uses {fmtBytes(sizeBytes)} on mobile data.</Txt>
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <Button
            title={sizeBytes != null ? `Download · ${fmtBytes(sizeBytes)}` : "Download"}
            icon="download"
            onPress={download}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="Wait for Wi-Fi" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Don't ask on Wi-Fi" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.fieldBorder }}>
          <View>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>THIS SESSION</Txt>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 4 }}>{fmtBytes(sessionUsed)}</Txt>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800) }}>THIS MONTH</Txt>
            <Txt style={{ fontSize: 19, ...font(800), color: palette.text, marginTop: 4 }}>{fmtBytes(monthUsed)}</Txt>
          </View>
        </View>
      </View>
    </View>
  );
}
