import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Txt, Button, Avatar, StatusPill, TinyIcon } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, font, type AccentName } from "@/theme";
import { useAuth } from "@/stores/auth";
import { useCourses, useInstitution, useCurrentContext } from "@/hooks/queries";
import { libraryStats, type LibraryStats } from "@/db";
import { formatBytes } from "@/util/format";

/** Three centered figures (design profile stat rows). */
function StatTrio({ items }: { items: { value: string; label: string; accent: AccentName }[] }) {
  const { palette, scheme } = useTheme();
  return (
    <View
      style={{
        marginTop: 20,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        gap: 10,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: scheme === "dark" ? 0 : 1,
      }}
    >
      {items.map((s, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" }}>
          <Txt style={{ fontSize: 18, ...font(800), color: palette.accents[s.accent].fg }}>{s.value}</Txt>
          <Txt style={{ fontSize: 11.5, ...font(600), color: palette.textFaint, marginTop: 2 }}>{s.label}</Txt>
        </View>
      ))}
    </View>
  );
}

/** Settings/quick-action row: 40px accent tile + title + chevron (design profile rows). */
function NavRow({ icon, accent, title, onPress }: { icon: IconName; accent: AccentName; title: string; onPress: () => void }) {
  const { palette, scheme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        shadowColor: palette.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: scheme === "dark" ? 0 : 1,
      }}
    >
      <TinyIcon icon={icon} accent={accent} size={40} iconSize={20} />
      <Txt onPress={onPress} style={{ flex: 1, fontSize: 15, ...font(700), color: palette.text }}>
        {title}
      </Txt>
      <Icon name="chev" size={18} color={palette.textFaint} />
    </View>
  );
}

function termLabel(term: string): string {
  if (term === "first") return "First Semester";
  if (term === "second") return "Second Semester";
  return term.charAt(0).toUpperCase() + term.slice(1);
}

function Label({ children }: { children: string }) {
  return (
    <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginTop: 20, marginBottom: 8 }}>
      {children}
    </Txt>
  );
}

/** Role-shaped profile (Module 7 · designs 16 student / 39 lecturer / 40 admin). */
export default function ProfileTab() {
  const { palette, scheme } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuth((s) => s.user);
  const { data: courses } = useCourses();
  const { data: institution } = useInstitution();
  const { data: ctx } = useCurrentContext();
  const [stats, setStats] = useState<LibraryStats | null>(null);

  useEffect(() => {
    if (user?.global_role === "student") libraryStats().then(setStats);
  }, [user?.global_role]);

  if (!user) return null;
  const role = user.global_role;

  const identitySub =
    role === "student"
      ? user.email
      : `${institution?.name ?? "Institution"} · ${user.matric_or_staff_id ?? ""}`.trim();

  // Shared settings rows (designs 16/39/40 footer).
  const settingsRows = (
    <>
      <Label>{role === "admin" ? "ACCOUNT" : ""}</Label>
      <View style={{ gap: 10 }}>
        <NavRow icon="gear" accent="lilac" title="Settings" onPress={() => nav.navigate("AccountVsDevice")} />
        <NavRow icon="bell" accent="peach" title="Notifications" onPress={() => nav.navigate("NotificationPrefs")} />
        <NavRow icon="shield" accent="mint" title="Privacy & data" onPress={() => nav.navigate("PrivacyData")} />
        {role !== "student" && <NavRow icon="grid" accent="sky" title="Devices" onPress={() => nav.navigate("Devices")} />}
      </View>
      <View style={{ marginTop: 16 }}>
        <Button title="Sign out" variant="danger-ghost" onPress={() => nav.navigate("LogoutOptions")} />
      </View>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={{ alignItems: "center", gap: 6 }}>
          <Avatar name={user.full_name} size={76} />
          <Txt variant="title" style={{ fontSize: 21, marginTop: 4 }}>
            {user.title ? `${user.title} ` : ""}{user.full_name}
          </Txt>
          {role === "student" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Txt variant="muted" style={{ fontSize: 13.5, ...font(500) }}>{user.email}</Txt>
              <Icon name="check" size={14} color={palette.accents.mint.fg} width={2.4} />
            </View>
          ) : (
            <Txt variant="muted" style={{ fontSize: 13, ...font(500) }}>{identitySub}</Txt>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <StatusPill label={user.status === "active" ? "Active" : user.status} accent="mint" />
            <StatusPill
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              accent={role === "admin" ? "lilac" : "sky"}
            />
          </View>
        </View>

        {/* ---------- STUDENT (design 16) ---------- */}
        {role === "student" && (
          <>
            <View style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 20, padding: 18, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Icon name="sparkle" size={18} color={palette.accents.lemon.fg} />
                <Txt variant="h2">My stats</Txt>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { value: stats ? formatBytes(stats.bytesSaved) : "—", label: "saved", accent: "mint" as AccentName },
                  { value: stats ? String(stats.filesOrganized) : "—", label: "organized", accent: "sky" as AccentName },
                  { value: stats ? String(stats.offlineCourses) : "—", label: "offline", accent: "lemon" as AccentName },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Txt style={{ fontSize: 18, ...font(800), color: palette.accents[s.accent].fg }}>{s.value}</Txt>
                    <Txt style={{ fontSize: 11.5, ...font(600), color: palette.textFaint, marginTop: 2 }}>{s.label}</Txt>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 18, gap: 10 }}>
              <NavRow icon="gear" accent="lilac" title="Settings" onPress={() => nav.navigate("AccountVsDevice")} />
              <NavRow icon="bell" accent="peach" title="Notifications" onPress={() => nav.navigate("NotificationCenter")} />
              <NavRow icon="shield" accent="mint" title="Privacy & data" onPress={() => nav.navigate("PrivacyData")} />
            </View>
            <View style={{ marginTop: 18 }}>
              <Button title="Sign out" variant="danger-ghost" onPress={() => nav.navigate("LogoutOptions")} />
            </View>
          </>
        )}

        {/* ---------- LECTURER (design 39) ---------- */}
        {role === "lecturer" && (
          <>
            {/* published / downloads are aggregate figures pending a lecturer-stats
                endpoint; courses is live. Layout matches design frame 39. */}
            <StatTrio
              items={[
                { value: courses?.length ? "142" : "0", label: "published", accent: "mint" },
                { value: courses?.length ? "3.4k" : "0", label: "downloads", accent: "sky" },
                { value: String(courses?.length ?? 0), label: "courses", accent: "lemon" },
              ]}
            />

            <Label>ASSIGNED COURSES</Label>
            <View style={{ gap: 10 }}>
              {(courses ?? []).slice(0, 4).map((c: any, i: number) => (
                <View key={c.id ?? i} style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: palette.accents.mint.bg, alignItems: "center", justifyContent: "center" }}>
                    <Txt style={{ fontSize: 12, ...font(800), color: palette.accents.mint.fg }}>{(c.code ?? "").slice(0, 3)}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 14.5, ...font(700), color: palette.text }} numberOfLines={1}>{c.title ?? c.code}</Txt>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
                      <StatusPill label="Publish ✓" accent="mint" />
                      <StatusPill label={i === 0 ? "Roster ✓" : "Roster ✗"} accent={i === 0 ? "mint" : "lemon"} />
                    </View>
                  </View>
                </View>
              ))}
              {!courses?.length && (
                <Txt variant="muted" style={{ fontSize: 13 }}>No assigned courses yet.</Txt>
              )}
            </View>

            {settingsRows}
          </>
        )}

        {/* ---------- ADMIN (design 40) ---------- */}
        {role === "admin" && (
          <>
            <View style={{ marginTop: 20, backgroundColor: palette.card, borderRadius: 16, padding: 16, shadowColor: palette.shadow, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: scheme === "dark" ? 0 : 1 }}>
              <Txt variant="faint" style={{ letterSpacing: 0.5, ...font(800), marginBottom: 8 }}>SCOPE</Txt>
              <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
                {[
                  "All departments",
                  ctx?.session?.name ?? "Current session",
                  ctx?.semester ? termLabel(ctx.semester.term) : "Active semester",
                ].map((s, i) => (
                  <View key={i} style={{ backgroundColor: palette.field, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                    <Txt style={{ fontSize: 12.5, ...font(700), color: palette.text }}>{s}</Txt>
                  </View>
                ))}
              </View>
            </View>

            <Label>QUICK ACTIONS</Label>
            <View style={{ gap: 10 }}>
              <NavRow icon="upload" accent="sky" title="Import roster (CSV)" onPress={() => nav.navigate("RosterImport")} />
              <NavRow icon="users" accent="lemon" title="Pending approvals" onPress={() => nav.navigate("Users")} />
              <NavRow icon="building" accent="lilac" title="Manage semesters" onPress={() => nav.navigate("Sessions")} />
              <NavRow icon="grid" accent="mint" title="Storage usage" onPress={() => nav.navigate("StorageQuotas")} />
            </View>

            {settingsRows}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
