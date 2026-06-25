import React, { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, View, TextInput } from "react-native";
import { Screen, Txt, Card, LifecyclePill, Button, EmptyState, Toggle, StatusPill, ListCard } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { useTheme, accentFor, font, type AccentName } from "@/theme";
import { useMaterials } from "@/hooks/queries";
import { ensureDownloaded } from "@/services/materials";
import { formatBytes, fileKind } from "@/util/format";
import { useAuth } from "@/stores/auth";
import type { RootScreen } from "@/navigation/types";
import type { MaterialOut, OfferingOut } from "@/api/types";
import { announcementsApi, reportsApi, enrollmentApi, offeringsApi } from "@/api/endpoints";

/** Module 1/9/2: canonical Offering -> Week -> File drill-down. */
export default function OfferingDetailScreen({ route, navigation }: RootScreen<"OfferingDetail">) {
  const { offeringId, code, title, sessionName, semesterTerm } = route.params;
  const { palette } = useTheme();
  const role = useAuth((s) => s.user?.global_role);
  const { data: materials, isLoading, refetch } = useMaterials(offeringId);

  const [offering, setOffering] = useState<OfferingOut | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);

  const [downloading, setDownloading] = useState<string | null>(null);

  // New States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [currentEnrollmentMode, setCurrentEnrollmentMode] = useState<string>("advisor_approval");
  const [joinCode, setJoinCode] = useState<string | null>(null);

  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announcePinned, setAnnouncePinned] = useState(false);

  const [reportingMatId, setReportingMatId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");

  const byWeek = useMemo(() => {
    const m = new Map<number, MaterialOut[]>();
    (materials ?? []).forEach((mat) => {
      const arr = m.get(mat.week) ?? [];
      arr.push(mat);
      m.set(mat.week, arr);
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [materials]);

  const fetchOffering = async () => {
    try {
      const data = await offeringsApi.get(offeringId);
      setOffering(data);
      if (data.enrollment_mode) {
        setCurrentEnrollmentMode(data.enrollment_mode);
      }
    } catch (e) {
      console.warn("Failed to fetch offering details:", e);
    } finally {
      setLoadingOffering(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementsApi.list(offeringId);
      setAnnouncements(data);
    } catch (e) {
      console.warn("Failed to fetch announcements:", e);
    }
  };

  const fetchReports = async () => {
    if (role === "lecturer" || role === "admin") {
      try {
        const data = await reportsApi.listReports(offeringId);
        setReports(data);
      } catch (e) {
        console.warn("Failed to fetch reports:", e);
      }
    }
  };

  useEffect(() => {
    fetchOffering();
    fetchAnnouncements();
    fetchReports();
  }, [offeringId, role]);

  const handleUpdateEnrollmentMode = async (mode: string) => {
    try {
      await enrollmentApi.updateMode(offeringId, mode);
      setCurrentEnrollmentMode(mode);
      Alert.alert("Success", `Enrollment mode updated to ${mode}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update enrollment mode");
    }
  };

  const handleGenerateJoinCode = async () => {
    try {
      const res = await enrollmentApi.generateJoinCode(offeringId);
      setJoinCode(res.code);
      Alert.alert("Generated Code", `Join code: ${res.code}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate join code");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) {
      Alert.alert("Validation", "Please enter both a title and body");
      return;
    }
    try {
      await announcementsApi.create(offeringId, announceTitle, announceBody, announcePinned);
      setAnnounceTitle("");
      setAnnounceBody("");
      setAnnouncePinned(false);
      setShowAnnounceForm(false);
      Alert.alert("Success", "Announcement posted!");
      fetchAnnouncements();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to post announcement");
    }
  };

  const handleMarkAnnouncementRead = async (id: string) => {
    try {
      await announcementsApi.markRead(id);
      fetchAnnouncements();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to mark announcement as read");
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingMatId) return;
    if (!reportReason.trim()) {
      Alert.alert("Validation", "Please provide a reason");
      return;
    }
    try {
      await reportsApi.reportFile(reportingMatId, reportReason, reportNote);
      setReportingMatId(null);
      setReportReason("");
      setReportNote("");
      Alert.alert("Success", "Report submitted. Thank you!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit report");
    }
  };

  const handleResolveReport = async (id: string) => {
    try {
      await reportsApi.resolveReport(id, "resolved");
      fetchReports();
      Alert.alert("Success", "Report resolved");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to resolve report");
    }
  };

  async function onOpen(mat: MaterialOut) {
    if (!offering) return;
    setDownloading(mat.id);
    try {
      await ensureDownloaded(mat, offering);
      navigation.navigate("Viewer", {
        materialId: mat.id,
        title: mat.title,
        sha256: mat.content_sha256,
      });
    } catch (e: any) {
      Alert.alert("Couldn't open", e?.message ?? "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  const isArchived = offering?.status === "archived";

  const ListHeader = () => {
    return (
      <View style={{ marginBottom: 16 }}>
        {/* Archived read-only banner */}
        {isArchived && (
          <Card style={{ backgroundColor: "#FFF2E6", borderColor: "#FF9500", borderWidth: 1, padding: 12, marginBottom: 16 }}>
            <Txt style={{ color: "#CC6600", fontWeight: "bold" }}>Archived Semester Offering</Txt>
            <Txt style={{ color: "#CC6600", fontSize: 12, marginTop: 4 }}>
              This course offering is archived. Materials are read-only.
            </Txt>
          </Card>
        )}

        {/* Enrollment Mode section for Lecturers */}
        {(role === "lecturer" || role === "admin") && !isArchived && (
          <Card style={{ marginBottom: 16, padding: 12 }}>
            <Txt variant="label" style={{ fontWeight: "bold", marginBottom: 8 }}>Course Enrollment Mode</Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["roster", "code", "advisor_approval"].map((mode) => (
                <View key={mode} style={{ flex: 1 }}>
                  <Button
                    title={mode === "advisor_approval" ? "Approval" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    variant={currentEnrollmentMode === mode ? "primary" : "secondary"}
                    onPress={() => handleUpdateEnrollmentMode(mode)}
                  />
                </View>
              ))}
            </View>
            {currentEnrollmentMode === "code" && (
              <View style={{ marginTop: 12, alignItems: "center" }}>
                {joinCode ? (
                  <Txt style={{ fontWeight: "bold" }}>Active Code: {joinCode}</Txt>
                ) : (
                  <Button
                    title="Generate Join Code"
                    variant="secondary"
                    onPress={handleGenerateJoinCode}
                  />
                )}
              </View>
            )}
          </Card>
        )}

        {/* Course controls (design 53–56, plus timetable) */}
        {(role === "lecturer" || role === "admin") && !isArchived && (
          <View style={{ marginBottom: 16, gap: 10 }}>
            <Txt variant="label" style={{ ...font(800), letterSpacing: 0.5 }}>COURSE CONTROLS</Txt>
            {([
              ["grid", "sky", "Course analytics", "CourseAnalytics"],
              ["upload", "mint", "Upload material", "UploadMaterial"],
              ["users", "sky", "Enrollment requests", "EnrollmentRequests"],
              ["megaphone", "lemon", "Post announcement", "AnnouncementCompose"],
              ["file", "peach", "File reports", "FileReports"],
              ["clock", "lilac", "Version history", "VersionRollback"],
              ["shield", "lilac", "Sharing restriction", "SharingRestriction"],
              ["calendar", "mint", "Timetable", "TimetableEditor"],
            ] as [IconName, AccentName, string, string][]).map(([icon, accent, title, route]) => (
              <ListCard
                key={route}
                icon={icon}
                accent={accent}
                title={title}
                onPress={() => navigation.navigate(route as any, { offeringId, code, title } as any)}
                right={<Icon name="chev" size={18} color={palette.textFaint} />}
              />
            ))}
          </View>
        )}

        {/* Announcements section */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Txt variant="h2">Announcements</Txt>
            {(role === "lecturer" || role === "admin") && !isArchived && (
              <Button
                title={showAnnounceForm ? "Cancel" : "Post"}
                variant="secondary"
                onPress={() => setShowAnnounceForm(!showAnnounceForm)}
              />
            )}
          </View>

          {showAnnounceForm && (
            <Card style={{ padding: 12, marginBottom: 12 }}>
              <TextInput
                placeholder="Announcement Title"
                value={announceTitle}
                onChangeText={setAnnounceTitle}
                placeholderTextColor="#999"
                style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 8, padding: 4, color: palette.text }}
              />
              <TextInput
                placeholder="Announcement Content"
                value={announceBody}
                onChangeText={setAnnounceBody}
                placeholderTextColor="#999"
                multiline
                style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 8, padding: 4, minHeight: 60, color: palette.text }}
              />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Txt>Pin to top?</Txt>
                <Toggle value={announcePinned} onValueChange={setAnnouncePinned} label="Pin to top" />
              </View>
              <Button title="Submit Announcement" onPress={handlePostAnnouncement} />
            </Card>
          )}

          {announcements.length === 0 ? (
            <Txt variant="muted">No announcements posted.</Txt>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} style={{ marginBottom: 8, padding: 12, borderLeftWidth: ann.pinned ? 4 : 0, borderLeftColor: palette.primary }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Txt variant="label" style={{ fontWeight: "bold" }}>{ann.title}</Txt>
                  <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                    {ann.pinned ? <LifecyclePill status="live" /> : null}
                    {ann.is_read && <Txt variant="muted" style={{ fontSize: 10 }}>Read</Txt>}
                  </View>
                </View>
                <Txt style={{ marginTop: 4 }}>{ann.body}</Txt>
                {role === "student" && !ann.is_read && !isArchived && (
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <Button
                      title="Mark as Read"
                      variant="secondary"
                      onPress={() => handleMarkAnnouncementRead(ann.id)}
                    />
                  </View>
                )}
                {(role === "lecturer" || role === "admin") && (
                  <Txt variant="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    Read by {ann.read_count} student(s)
                  </Txt>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Lecturer View for File Reports */}
        {(role === "lecturer" || role === "admin") && reports.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Txt variant="h2" style={{ marginBottom: 8 }}>File Reports ({reports.length})</Txt>
            {reports.map((rep) => (
              <Card key={rep.id} style={{ marginBottom: 8, padding: 12 }}>
                <Txt style={{ fontWeight: "bold" }}>File: {rep.material_title}</Txt>
                <Txt>Reason: {rep.reason}</Txt>
                {rep.note && <Txt>Note: {rep.note}</Txt>}
                <Txt variant="muted" style={{ fontSize: 11 }}>By: {rep.reporter_name}</Txt>
                {rep.status === "open" && !isArchived ? (
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <Button
                      title="Resolve Report"
                      variant="secondary"
                      onPress={() => handleResolveReport(rep.id)}
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    <LifecyclePill status={rep.status} />
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {byWeek.length > 0 && (
          <Txt variant="h2" style={{ marginBottom: 8 }}>
            Course Materials
          </Txt>
        )}
      </View>
    );
  };

  if (isLoading || loadingOffering) {
    return (
      <Screen style={{ justifyContent: "center" }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  const displaySession = offering?.session_name || sessionName;
  const displayTerm = offering?.semester_term || semesterTerm;

  return (
    <Screen>
      {/* Accent hero header (design 13) */}
      {(() => {
        const a = palette.accents[accentFor(offeringId)];
        return (
          <View style={{ backgroundColor: a.bg, borderRadius: 24, padding: 22, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Txt style={{ fontSize: 13, ...font(800), color: a.fg, letterSpacing: 0.4 }}>
                {code}{displaySession ? ` · ${displaySession}` : ""}
              </Txt>
              {offering?.status ? <StatusPill label={offering.status} accent={accentFor(offeringId)} /> : null}
            </View>
            <Txt style={{ fontSize: 21, ...font(800), color: palette.text, marginTop: 8, lineHeight: 25 }}>{title}</Txt>
            {displayTerm ? <Txt style={{ fontSize: 13, ...font(600), color: a.fg, marginTop: 12 }}>{displayTerm} semester</Txt> : null}
          </View>
        );
      })()}

      {reportingMatId && (
        <Card style={{ padding: 16, marginBottom: 16, backgroundColor: palette.card }}>
          <Txt variant="h2">Report File</Txt>
          <Txt variant="muted" style={{ marginBottom: 8 }}>Let us know what's wrong with this file.</Txt>
          <TextInput
            placeholder="Reason (e.g. broken, wrong course)"
            value={reportReason}
            onChangeText={setReportReason}
            placeholderTextColor="#999"
            style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 8, padding: 4, color: palette.text }}
          />
          <TextInput
            placeholder="Additional note (optional)"
            value={reportNote}
            onChangeText={setReportNote}
            placeholderTextColor="#999"
            multiline
            style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 12, padding: 4, minHeight: 40, color: palette.text }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setReportingMatId(null);
                  setReportReason("");
                  setReportNote("");
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Submit Report"
                onPress={handleSubmitReport}
              />
            </View>
          </View>
        </Card>
      )}

      {byWeek.length === 0 ? (
        <View style={{ flex: 1 }}>
          <ListHeader />
          <EmptyState
            title="Nothing posted yet"
            body="When your lecturer publishes materials, they'll appear here organized by week."
          />
        </View>
      ) : (
        <FlatList
          data={byWeek}
          keyExtractor={([w]) => String(w)}
          onRefresh={() => {
            refetch();
            fetchAnnouncements();
            fetchReports();
          }}
          refreshing={false}
          ListHeaderComponent={ListHeader}
          renderItem={({ item: [week, mats] }) => (
            <View style={{ marginBottom: 16 }}>
              <Txt variant="h2" style={{ marginBottom: 8 }}>
                Week {week}
              </Txt>
              {mats.map((mat) => (
                <Pressable key={mat.id} onPress={() => onOpen(mat)}>
                  <Card style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: palette.accents[accentFor(mat.id)].bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Txt variant="label" style={{ color: palette.accents[accentFor(mat.id)].fg }}>
                        {fileKind(mat.original_filename)}
                      </Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt numberOfLines={1} style={{ fontWeight: "600" }}>{mat.title}</Txt>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
                        <View style={{ backgroundColor: palette.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Txt style={{ fontSize: 10, fontWeight: "600", color: palette.text }}>
                            {formatBytes(mat.size_bytes)}
                          </Txt>
                        </View>
                        {mat.restriction !== "open" && (
                          <View style={{ backgroundColor: "#FFE5E5", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Txt style={{ fontSize: 10, fontWeight: "600", color: "#C8372D" }}>
                              {mat.restriction.toUpperCase()}
                            </Txt>
                          </View>
                        )}
                      </View>
                    </View>
                    {role === "student" && !isArchived && (
                      <View style={{ alignSelf: "center" }}>
                        <Button
                          title="Report"
                          variant="secondary"
                          onPress={() => setReportingMatId(mat.id)}
                        />
                      </View>
                    )}
                    {(role === "lecturer" || role === "admin") && (
                      <LifecyclePill status={mat.status} />
                    )}
                    {downloading === mat.id && <ActivityIndicator />}
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}
      {(role === "lecturer" || role === "admin") && byWeek.length === 0 && !isArchived && (
        <Button
          title="Manage roster"
          variant="secondary"
          onPress={() =>
            Alert.alert("Roster", "Roster management is on the Courses tab actions.")
          }
        />
      )}
    </Screen>
  );
}
