import React, { useState } from "react";
import { Alert, ScrollView, TextInput, View } from "react-native";
import { Txt, Button, SettingsGroup, SettingItem, Toggle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { announcementsApi } from "@/api/endpoints";
import type { RootScreen } from "@/navigation/types";

/** Lecturer · Announcement compose (design 54): one-way course announcement. */
export default function AnnouncementComposeScreen({ route, navigation }: RootScreen<"AnnouncementCompose">) {
  const { palette, scheme } = useTheme();
  const offeringId = route.params?.offeringId;
  const code = route.params?.code ?? "Course";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pin, setPin] = useState(true);
  const [push, setPush] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handlePost() {
    if (!title.trim() || !body.trim()) return;
    if (!offeringId) {
      Alert.alert("Error", "No offering selected.");
      return;
    }
    setBusy(true);
    try {
      await announcementsApi.create(offeringId, title.trim(), body.trim(), pin, push);
      Alert.alert("Posted", "Your announcement is live.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Could not post announcement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Txt variant="title" style={{ paddingHorizontal: 24, paddingTop: 4 }}>New announcement</Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Txt style={{ fontSize: 13.5, ...font(700), color: palette.textMuted }}>{code}</Txt>

        <View style={{ backgroundColor: palette.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Announcement title"
            placeholderTextColor={palette.textFaint}
            style={{ fontSize: 17, ...font(800), color: palette.text, padding: 0 }}
          />
        </View>

        <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 16, marginTop: 12, minHeight: 140, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your message…"
            placeholderTextColor={palette.textFaint}
            multiline
            textAlignVertical="top"
            style={{ flex: 1, fontSize: 14, lineHeight: 21, ...font(500), color: palette.text, padding: 0 }}
          />
        </View>

        <View style={{ marginTop: 14 }}>
          <SettingsGroup>
            <SettingItem first icon="bookmark" accent="lemon" title="Pin to course header" right={<Toggle value={pin} onValueChange={setPin} label="Pin" />} />
            <SettingItem icon="bell" accent="sky" title="Send push notification" sub="Batched · respects quiet hours" right={<Toggle value={push} onValueChange={setPush} label="Push" />} />
          </SettingsGroup>
        </View>

        <View style={{ marginTop: 14, backgroundColor: palette.accents.lilac.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Icon name="shield" size={17} color={palette.accents.lilac.fg} />
          <Txt style={{ flex: 1, fontSize: 12, ...font(600), color: palette.text }}>One-way. Students can't reply — you'll see a read count only.</Txt>
        </View>

        <View style={{ marginTop: 18 }}>
          <Button
            title="Post announcement"
            loading={busy}
            disabled={!title.trim() || !body.trim()}
            onPress={handlePost}
          />
        </View>
      </ScrollView>
    </View>
  );
}
