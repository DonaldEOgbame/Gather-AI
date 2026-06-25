/** SQLite handle + migrations + the data-access layer for the local mirror. */
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
  SCHEMA_SQL,
  BOOKMARKS_FOLDER_ID,
  UNSORTED_FOLDER_ID,
} from "./schema";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("uniportal.db");
  await _db.execAsync("PRAGMA foreign_keys = ON;");
  await _db.execAsync(SCHEMA_SQL);
  await runMigrations(_db);
  await seedVirtualFolders(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  // Ensure schema_version table exists (created by SCHEMA_SQL, but let's be safe)
  await db.execAsync("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);");
  
  const versionRow = await db.getFirstAsync<{ version: number }>("SELECT version FROM schema_version LIMIT 1");
  if (!versionRow) {
    // Fresh DB, insert version 2 directly
    await db.runAsync("INSERT INTO schema_version (version) VALUES (2);");
    return;
  }
  
  const currentVersion = versionRow.version;
  if (currentVersion < 2) {
    // Upgrade to version 2
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS offering (
          id            TEXT PRIMARY KEY,
          course_id     TEXT NOT NULL,
          semester_id   TEXT NOT NULL,
          session_name  TEXT NOT NULL,
          semester_term TEXT NOT NULL,
          course_code   TEXT NOT NULL,
          course_title  TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'active'
        );
      `);
    } catch (e) { /* ignore */ }

    const columnsToMigrate = [
      { table: "placement", column: "offering_id" },
      { table: "placement", column: "session_name" },
      { table: "placement", column: "semester_term" },
      { table: "folder", column: "offering_id" },
      { table: "folder", column: "session_name" },
      { table: "folder", column: "semester_term" },
      { table: "announcement", column: "offering_id" },
      { table: "timetable_session", column: "offering_id" }
    ];

    for (const col of columnsToMigrate) {
      try {
        await db.execAsync(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} TEXT;`);
      } catch (e) { /* ignore */ }
    }

    await db.runAsync("UPDATE schema_version SET version = 2;");
  }
}

async function seedVirtualFolders(db: SQLite.SQLiteDatabase) {
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO folder (id, name, kind, created_at) VALUES (?,?,?,?)`,
    [BOOKMARKS_FOLDER_ID, "Bookmarks", "bookmarks", now]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO folder (id, name, kind, created_at) VALUES (?,?,?,?)`,
    [UNSORTED_FOLDER_ID, "Unsorted", "unsorted", now]
  );
}

export const uid = () => Crypto.randomUUID();

// ---------------------------------------------------------------------------
// Content / dedup
// ---------------------------------------------------------------------------

export interface ContentRow {
  sha256: string;
  physical_path: string;
  size_bytes: number;
  restriction?: string;
}

/** Module 4: dedup. Returns the existing physical path if this hash is known. */
export async function findContent(sha256: string): Promise<ContentRow | null> {
  const db = await getDb();
  return db.getFirstAsync<ContentRow>(
    `SELECT sha256, physical_path, size_bytes, restriction FROM content WHERE sha256 = ?`,
    [sha256]
  );
}

export async function upsertContent(c: ContentRow & { mime?: string }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO content (sha256, physical_path, size_bytes, mime, imported_at, restriction)
     VALUES (?,?,?,?,?,?)`,
    [c.sha256, c.physical_path, c.size_bytes, c.mime ?? null, Date.now(), c.restriction ?? "open"]
  );
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export interface FolderRow {
  id: string;
  name: string;
  kind: string;
  course_id: string | null;
  cluster_keywords: string | null;
}

export async function listFolders(): Promise<(FolderRow & { count: number })[]> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT f.*,
       CASE f.id
         WHEN ? THEN (SELECT COUNT(*) FROM placement WHERE is_bookmarked = 1)
         ELSE (SELECT COUNT(*) FROM placement p WHERE p.folder_id = f.id)
       END AS count
     FROM folder f ORDER BY
       CASE f.kind WHEN 'course' THEN 0 WHEN 'smart' THEN 1 ELSE 2 END, f.name`,
    [BOOKMARKS_FOLDER_ID]
  );
}

export async function getOrCreateCourseFolder(
  courseId: string,
  name: string
): Promise<string> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM folder WHERE kind='course' AND course_id = ?`,
    [courseId]
  );
  if (existing) return existing.id;
  const id = uid();
  await db.runAsync(
    `INSERT INTO folder (id, name, kind, course_id, created_at) VALUES (?,?,?,?,?)`,
    [id, name, "course", courseId, Date.now()]
  );
  return id;
}

export async function getOrCreateOfferingFolder(
  offeringId: string,
  courseId: string,
  name: string,
  sessionName: string,
  semesterTerm: string
): Promise<string> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM folder WHERE kind='course' AND offering_id = ?`,
    [offeringId]
  );
  if (existing) return existing.id;
  const id = uid();
  await db.runAsync(
    `INSERT INTO folder (id, name, kind, course_id, offering_id, session_name, semester_term, created_at) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, "course", courseId, offeringId, sessionName, semesterTerm, Date.now()]
  );
  return id;
}

export async function createSmartFolder(
  name: string,
  keywords: string[]
): Promise<string> {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    `INSERT INTO folder (id, name, kind, cluster_keywords, created_at) VALUES (?,?,?,?,?)`,
    [id, name, "smart", keywords.join(","), Date.now()]
  );
  return id;
}

// ---------------------------------------------------------------------------
// Placements (logical folder entries / the alias system)
// ---------------------------------------------------------------------------

export interface PlacementRow {
  id: string;
  sha256: string;
  folder_id: string;
  display_name: string;
  original_name: string;
  course_id: string | null;
  week: number | null;
  topic: string | null;
  material_id: string | null;
  is_read: number;
  is_bookmarked: number;
  restriction: string;
  offering_id: string | null;
  session_name: string | null;
  semester_term: string | null;
}

export interface PlacementInput {
  sha256: string;
  folderId: string;
  displayName: string;
  originalName: string;
  courseId?: string | null;
  week?: number | null;
  topic?: string | null;
  materialId?: string | null;
  restriction?: string;
  offeringId?: string | null;
  sessionName?: string | null;
  semesterTerm?: string | null;
}

/** Add a logical placement. Silently ignores an existing (folder, sha) pair. */
export async function addPlacement(p: PlacementInput): Promise<string> {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    `INSERT OR IGNORE INTO placement
       (id, sha256, folder_id, display_name, original_name, course_id, week, topic, material_id, created_at, restriction, offering_id, session_name, semester_term)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      p.sha256,
      p.folderId,
      p.displayName,
      p.originalName,
      p.courseId ?? null,
      p.week ?? null,
      p.topic ?? null,
      p.materialId ?? null,
      Date.now(),
      p.restriction ?? "open",
      p.offeringId ?? null,
      p.sessionName ?? null,
      p.semesterTerm ?? null,
    ]
  );
  return id;
}

export async function getPlacement(id: string): Promise<PlacementRow | null> {
  const db = await getDb();
  return db.getFirstAsync<PlacementRow>(
    `SELECT * FROM placement WHERE id = ?`,
    [id]
  );
}

export async function listPlacements(folderId: string): Promise<PlacementRow[]> {
  const db = await getDb();
  if (folderId === BOOKMARKS_FOLDER_ID) {
    return db.getAllAsync<PlacementRow>(
      `SELECT * FROM placement WHERE is_bookmarked = 1 ORDER BY week, display_name`
    );
  }
  return db.getAllAsync<PlacementRow>(
    `SELECT * FROM placement WHERE folder_id = ? ORDER BY week, display_name`,
    [folderId]
  );
}

export async function setRead(placementId: string, read: boolean) {
  const db = await getDb();
  await db.runAsync(`UPDATE placement SET is_read = ? WHERE id = ?`, [
    read ? 1 : 0,
    placementId,
  ]);
}

export async function setBookmarked(placementId: string, value: boolean) {
  const db = await getDb();
  await db.runAsync(`UPDATE placement SET is_bookmarked = ? WHERE id = ?`, [
    value ? 1 : 0,
    placementId,
  ]);
}

export async function listBookmarks(): Promise<PlacementRow[]> {
  const db = await getDb();
  return db.getAllAsync<PlacementRow>(
    `SELECT * FROM placement WHERE is_bookmarked = 1 ORDER BY display_name`
  );
}

/** Move a scanned placement into an official course folder (Module 9-E "Link to course"). */
export async function relinkToCourse(
  placementId: string,
  courseFolderId: string,
  courseId: string
) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE placement SET folder_id = ?, course_id = ? WHERE id = ?`,
    [courseFolderId, courseId, placementId]
  );
}

export async function physicalPathFor(sha256: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ physical_path: string }>(
    `SELECT physical_path FROM content WHERE sha256 = ?`,
    [sha256]
  );
  return row?.physical_path ?? null;
}

// ---------------------------------------------------------------------------
// Search (Module 9-A): matches display_name, topic, original_name.
// ---------------------------------------------------------------------------

export interface SearchFilters {
  courseId?: string;
  week?: number;
  bookmarkedOnly?: boolean;
  unreadOnly?: boolean;
}

export async function searchLocal(
  q: string,
  f: SearchFilters = {}
): Promise<PlacementRow[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q.trim()) {
    where.push(`(display_name LIKE ? OR topic LIKE ? OR original_name LIKE ?)`);
    const like = `%${q.trim()}%`;
    args.push(like, like, like);
  }
  if (f.courseId) {
    where.push(`course_id = ?`);
    args.push(f.courseId);
  }
  if (f.week != null) {
    where.push(`week = ?`);
    args.push(f.week);
  }
  if (f.bookmarkedOnly) where.push(`is_bookmarked = 1`);
  if (f.unreadOnly) where.push(`is_read = 0`);
  const sql = `SELECT * FROM placement ${
    where.length ? "WHERE " + where.join(" AND ") : ""
  } ORDER BY display_name LIMIT 200`;
  return db.getAllAsync<PlacementRow>(sql, args);
}

// ---------------------------------------------------------------------------
// Stats (Module 7-B "My Stats")
// ---------------------------------------------------------------------------

export interface LibraryStats {
  filesOrganized: number;
  uniqueContent: number;
  bytesStored: number;
  bytesSaved: number; // sum of dup sizes avoided (placements beyond first per sha)
  bookmarks: number;
  offlineCourses: number;
}

export async function libraryStats(): Promise<LibraryStats> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    placements: number;
    uniques: number;
    bytes: number;
    bookmarks: number;
    courses: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM placement) AS placements,
      (SELECT COUNT(*) FROM content) AS uniques,
      (SELECT COALESCE(SUM(size_bytes),0) FROM content) AS bytes,
      (SELECT COUNT(*) FROM placement WHERE is_bookmarked=1) AS bookmarks,
      (SELECT COUNT(DISTINCT course_id) FROM placement WHERE course_id IS NOT NULL) AS courses
  `);
  // bytesSaved: for each content referenced by N placements, (N-1)*size avoided.
  const saved = await db.getFirstAsync<{ saved: number }>(`
    SELECT COALESCE(SUM((cnt-1)*size_bytes),0) AS saved FROM (
      SELECT c.size_bytes AS size_bytes, COUNT(p.id) AS cnt
      FROM content c JOIN placement p ON p.sha256 = c.sha256
      GROUP BY c.sha256
    )
  `);
  return {
    filesOrganized: row?.placements ?? 0,
    uniqueContent: row?.uniques ?? 0,
    bytesStored: row?.bytes ?? 0,
    bytesSaved: saved?.saved ?? 0,
    bookmarks: row?.bookmarks ?? 0,
    offlineCourses: row?.courses ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Trash (Module 10C safety net) + reaper
// ---------------------------------------------------------------------------

export async function addTrash(t: {
  originUri: string;
  physicalPath: string;
  sha256?: string;
  retentionDays: number;
}) {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO trash (id, origin_uri, physical_path, sha256, deleted_at, purge_after)
     VALUES (?,?,?,?,?,?)`,
    [
      uid(),
      t.originUri,
      t.physicalPath,
      t.sha256 ?? null,
      now,
      now + t.retentionDays * 86400_000,
    ]
  );
}

export async function expiredTrash(): Promise<
  { id: string; physical_path: string }[]
> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT id, physical_path FROM trash WHERE purge_after < ?`,
    [Date.now()]
  );
}

export async function removeTrash(id: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM trash WHERE id = ?`, [id]);
}

export async function addScanSkip(uri: string, reason: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO scan_skip (id, uri, reason, scanned_at) VALUES (?,?,?,?)`,
    [uid(), uri, reason, Date.now()]
  );
}

export async function listScanSkips(): Promise<
  { id: string; uri: string; reason: string }[]
> {
  const db = await getDb();
  return db.getAllAsync(`SELECT id, uri, reason FROM scan_skip ORDER BY scanned_at DESC`);
}

// Learned mappings (auto-apply learned course mappings)
export async function recordMapping(keyword: string, courseId: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO learned_mapping (keyword, course_id, hits) VALUES (?,?,1)
     ON CONFLICT(keyword) DO UPDATE SET hits = hits + 1, course_id = excluded.course_id`,
    [keyword.toLowerCase(), courseId]
  );
}

export async function lookupMapping(keyword: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ course_id: string }>(
    `SELECT course_id FROM learned_mapping WHERE keyword = ?`,
    [keyword.toLowerCase()]
  );
  return row?.course_id ?? null;
}

/** Module 10C destructive: wipe the entire local mirror (keeps trash table policy). */
export async function clearMirror() {
  const db = await getDb();
  await db.execAsync(
    `DELETE FROM placement; DELETE FROM content; DELETE FROM collection_item; DELETE FROM collection;
     DELETE FROM folder WHERE kind IN ('course','smart');`
  );
  await seedVirtualFolders(db);
}

// ---------------------------------------------------------------------------
// Collections (Module 9-B)
// ---------------------------------------------------------------------------

export interface CollectionRow {
  id: string;
  name: string;
  created_at: number;
}

export async function listCollections(): Promise<(CollectionRow & { count: number })[]> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.*, (SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = c.id) AS count
     FROM collection c ORDER BY c.name`
  );
}

export async function createCollection(name: string): Promise<string> {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    `INSERT INTO collection (id, name, created_at) VALUES (?,?,?)`,
    [id, name, Date.now()]
  );
  return id;
}

export async function addPlacementToCollection(collectionId: string, placementId: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO collection_item (collection_id, placement_id) VALUES (?,?)`,
    [collectionId, placementId]
  );
}

export async function removePlacementFromCollection(collectionId: string, placementId: string) {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM collection_item WHERE collection_id = ? AND placement_id = ?`,
    [collectionId, placementId]
  );
}

export async function listCollectionPlacements(collectionId: string): Promise<PlacementRow[]> {
  const db = await getDb();
  return db.getAllAsync<PlacementRow>(
    `SELECT p.* FROM placement p
     JOIN collection_item ci ON ci.placement_id = p.id
     WHERE ci.collection_id = ?
     ORDER BY p.display_name`,
    [collectionId]
  );
}

export async function deleteCollection(collectionId: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM collection WHERE id = ?`, [collectionId]);
}

// ---------------------------------------------------------------------------
// Timetable Sessions & Announcements (Gap Solutions)
// ---------------------------------------------------------------------------

export interface TimetableSessionRow {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}

export async function insertTimetableSession(session: {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO timetable_session (id, course_id, day_of_week, start_time, end_time, room) VALUES (?,?,?,?,?,?)`,
    [session.id, session.course_id, session.day_of_week, session.start_time, session.end_time, session.room]
  );
}

export async function getTodayTimetableSessions(dayOfWeek: number): Promise<(TimetableSessionRow & { course_name: string })[]> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ts.*, COALESCE(f.name, ts.course_id) as course_name FROM timetable_session ts
     LEFT JOIN folder f ON f.course_id = ts.course_id AND f.kind = 'course'
     WHERE ts.day_of_week = ?
     ORDER BY ts.start_time`,
    [dayOfWeek]
  ) as any;
}

export async function clearTimetableSessions() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM timetable_session`);
}

export interface AnnouncementRow {
  id: string;
  course_id: string;
  title: string;
  body: string;
  pinned: number;
  created_at: number;
}

export async function insertAnnouncement(ann: AnnouncementRow) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO announcement (id, course_id, title, body, pinned, created_at) VALUES (?,?,?,?,?,?)`,
    [ann.id, ann.course_id, ann.title, ann.body, ann.pinned, ann.created_at]
  );
}

export async function listLocalAnnouncements(courseId: string): Promise<AnnouncementRow[]> {
  const db = await getDb();
  return db.getAllAsync<AnnouncementRow>(
    `SELECT * FROM announcement WHERE course_id = ? ORDER BY pinned DESC, created_at DESC`,
    [courseId]
  );
}

