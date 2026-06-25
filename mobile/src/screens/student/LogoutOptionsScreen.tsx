import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Txt, Button, TinyIcon, InfoCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";

/** Shared-device logout options (design 93): keep files locked, or wipe the sandbox. */
export default function LogoutOptionsScreen({ navigation }: RootScreen<"LogoutOptions">) {
  const { palette } = useTheme();
  const logout = useAuth((s) => s.logout);
  const [wipe, setWipe] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(20,25,40,0.42)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={{ backgroundColor: palette.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3D7DE", alignSelf: "center", marginBottom: 18 }} />
        <Txt style={{ fontSize: 20, ...font(800), color: palette.text }}>Log out of Gather</Txt>
        <Txt variant="muted" style={{ fontSize: 13, ...font(500), marginTop: 4, lineHeight: 19 }}>This is a shared phone — choose what happens to your offline files.</Txt>

        <View style={{ marginTop: 18, gap: 12 }}>
          <Option icon="lock" accent="mint" title="Keep my files" sub="Encrypted & locked — re-auth to access" selected={!wipe} onPress={() => setWipe(false)} />
          <Option icon="trash" accent="peach" title="Remove from this device" sub="Wipes the sandbox + index completely" selected={wipe} onPress={() => setWipe(true)} />
        </View>

        <View style={{ marginTop: 16 }}>
          <InfoCard accent="lemon" icon="shield" text="We never wipe silently, and never leave your files open on a shared phone by default." />
        </View>
        <View style={{ marginTop: 16 }}>
          <Button title="Log out" onPress={logout} />
        </View>
      </View>
    </View>
  );
}

function Option({ icon, accent, title, sub, selected, onPress }: { icon: "lock" | "trash"; accent: "mint" | "peach"; title: string; sub: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: palette.card, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: selected ? palette.text : palette.border, flexDirection: "row", alignItems: "center", gap: 11, shadowColor: "#141928", shadowOpacity: selected ? 0 : 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: selected ? 0 : 1 }}>
      <TinyIcon icon={icon} accent={accent} size={44} iconSize={22} />
      <View style={{ flex: 1 }}>
        <Txt style={{ fontSize: 15.5, ...font(800), color: palette.text }}>{title}</Txt>
        <Txt variant="faint" style={{ fontSize: 12, ...font(600), marginTop: 2 }}>{sub}</Txt>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: selected ? palette.text : "transparent", borderWidth: selected ? 0 : 2, borderColor: palette.border, alignItems: "center", justifyContent: "center" }}>
        {selected ? <Icon name="check" size={13} color="#fff" width={2.6} /> : null}
      </View>
    </Pressable>
  );
}
