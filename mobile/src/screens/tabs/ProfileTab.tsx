import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, Button, Avatar, LifecyclePill, ListCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import { useCourses } from "@/hooks/queries";
import { libraryStats, type LibraryStats } from "@/db";
import { formatBytes } from "@/util/format";

function Stat({ value, label, fg }: { value: string; label: string; fg: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Txt style={{ fontSize: 18, ...font(800), color: fg }}>{value}</Txt>
      <Txt style={{ fontSize: 11.5, ...font(600), color: palette.textFaint, marginTop: 2 }}>{label}</Txt>
    </View>
  );
}

/** Role-shaped profile (Module 7 · design 16). */
export default function ProfileTab() {
  const { palette } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuth((s) => s.user);
  const { data: courses } = useCourses();
  const [stats, setStats] = useState<LibraryStats | null>(null);

  useEffect(() => {
    if (user?.global_role === "student") libraryStats().then(setStats);
  }, [user?.global_role]);

  if (!user) return null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={{ alignItems: "center", gap: 8 }}>
          <Avatar name={user.full_name} size={76} />
          <Txt variant="title" style={{ fontSize: 22, marginTop: 4 }}>
            {user.title} {user.full_name}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Txt variant="muted" style={{ fontSize: 13.5, ...font(500) }}>{user.email}</Txt>
            <Icon name="check" size={14} color={palette.accents.mint.fg} width={2.4} />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <LifecyclePill status={user.status} />
            <LifecyclePill status={user.global_role} />
          </View>
        </View>

        {/* Stats card */}
        {user.global_role === "student" && stats && (
          <View style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 20, padding: 18, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <Icon name="sparkle" size={18} color={palette.accents.lemon.fg} />
              <Txt variant="h2">My stats</Txt>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat value={formatBytes(stats.bytesSaved)} label="saved" fg={palette.accents.mint.fg} />
              <Stat value={String(stats.filesOrganized)} label="organized" fg={palette.accents.sky.fg} />
              <Stat value={String(stats.offlineCourses)} label="offline" fg={palette.accents.lemon.fg} />
            </View>
          </View>
        )}

        {user.global_role === "lecturer" && (
          <View style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 20, padding: 18, shadowColor: "#141928", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <Icon name="sparkle" size={18} color={palette.accents.lemon.fg} />
              <Txt variant="h2">Teaching</Txt>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat value={String(courses?.length ?? 0)} label="courses" fg={palette.accents.mint.fg} />
              {user.matric_or_staff_id ? <Stat value={user.matric_or_staff_id} label="staff ID" fg={palette.accents.sky.fg} /> : null}
            </View>
          </View>
        )}

        {/* Student quick access (design 30/31/32/33/60) */}
        {user.global_role === "student" && (
          <>
            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>QUICK ACCESS</Txt>
            <View style={{ gap: 10 }}>
              <ListCard icon="check" accent="mint" title="Ready for today" onPress={() => nav.navigate("ReadyToday")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="hash" accent="sky" title="Join a course" onPress={() => nav.navigate("JoinCourse")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="cloud" accent="lemon" title="Storage & sync" onPress={() => nav.navigate("StorageSync")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="clock" accent="lilac" title="File versions" onPress={() => nav.navigate("Versions")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="sparkle" accent="peach" title="Smart summaries" onPress={() => nav.navigate("PreDownload")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
            </View>

            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>LIBRARY & DATA</Txt>
            <View style={{ gap: 10 }}>
              <ListCard icon="bookmark" accent="peach" title="Collections" onPress={() => nav.navigate("Collections")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="cloud" accent="sky" title="Personal library backup" onPress={() => nav.navigate("LibraryBackup")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="download" accent="mint" title="Restore on new device" onPress={() => nav.navigate("Restore")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="refresh" accent="lilac" title="What syncs across devices" onPress={() => nav.navigate("SyncInfo")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="sun" accent="lemon" title="Performance & lite mode" onPress={() => nav.navigate("LiteMode")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="grid" accent="sky" title="Data usage" onPress={() => nav.navigate("DataCost")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="eye" accent="blush" title="Restricted file preview" onPress={() => nav.navigate("RestrictedViewer")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
            </View>

            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>SEMESTER & WORKFLOW</Txt>
            <View style={{ gap: 10 }}>
              <ListCard icon="check" accent="mint" title="Register courses" onPress={() => nav.navigate("RegisterCourses")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="sparkle" accent="lilac" title="New semester (preview)" onPress={() => nav.navigate("NewSemester")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="refresh" accent="sky" title="Reorganizing (preview)" onPress={() => nav.navigate("Reorganizing")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="logo" accent="peach" title="Save to Gather (preview)" onPress={() => nav.navigate("ShareToGather")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
            </View>

            <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>DEVICE & ACCOUNT</Txt>
            <View style={{ gap: 10 }}>
              <ListCard icon="user" accent="lilac" title="Name & identity" onPress={() => nav.navigate("NameIdentity")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="cloud" accent="sky" title="What syncs vs stays on device" onPress={() => nav.navigate("AccountVsDevice")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="folder" accent="mint" title="Local mirror" onPress={() => nav.navigate("LocalMirror")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="camera" accent="peach" title="Find academic photos" onPress={() => nav.navigate("PhotoConsent")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="trash" accent="lemon" title="Free up space" onPress={() => nav.navigate("FreeUpSpace")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
              <ListCard icon="users" accent="sky" title="Switch account" onPress={() => nav.navigate("SwitchAccount")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
            </View>
          </>
        )}

        {/* Quick links */}
        <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 22, marginBottom: 8 }}>ACCOUNT</Txt>
        <View style={{ gap: 10 }}>
          <ListCard icon="gear" accent="lilac" title="Settings" onPress={() => nav.navigate("Settings")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
          <ListCard icon="bell" accent="peach" title="Notifications" onPress={() => nav.navigate("NotificationCenter")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
          <ListCard icon="shield" accent="mint" title="Privacy & data" onPress={() => nav.navigate("Settings")} right={<Icon name="chev" size={18} color={palette.textFaint} />} />
        </View>

        <View style={{ marginTop: 16 }}>
          <Button title="Sign out" variant="ghost" icon="logout" onPress={() => nav.navigate("LogoutOptions")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
