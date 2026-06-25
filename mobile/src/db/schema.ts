/**
 * Local SQLite mirror (Modules 3 & 4 + Reality Check).
 *
 * The "soft reference / SHA alias" from the spec is implemented LOGICALLY here,
 * not at the OS filesystem level (mobile sandboxes don't expose user-meaningful
 * aliases). The mapping is:
 *
 *     content (one row per unique sha256, one physical_path)
 *        └── placement (many rows: a logical folder entry pointing at a content)
 *
 * So the same physical PDF assigned to CS101 and CS102 is ONE `content` row with
 * TWO `placement` rows. Dedup is "does this sha256 already exist in `content`?".
 *
 * Hashing uses SHA-256 (Reality Check: costs little more than SHA-1, avoids the
 * "shipped a broken hash" optics).
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
  sha256        TEXT PRIMARY KEY,
  physical_path TEXT NOT NULL,          -- app-private sandbox path (Module 13)
  size_bytes    INTEGER NOT NULL,
  mime          TEXT,
  imported_at   INTEGER NOT NULL,
  restriction   TEXT DEFAULT 'open'
);

-- A logical folder entry. One content can appear in many folders (the alias system).
CREATE TABLE IF NOT EXISTS placement (
  id            TEXT PRIMARY KEY,
  sha256        TEXT NOT NULL REFERENCES content(sha256) ON DELETE CASCADE,
  folder_id     TEXT NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,          -- Smart Renamer output: {COURSE}_{WEEK}_{TOPIC}
  original_name TEXT NOT NULL,          -- the chaotic original filename
  course_id     TEXT,                   -- linked official course, when known
  week          INTEGER,
  topic         TEXT,
  -- server material id when this mirrors a published material; null for scanned files
  material_id   TEXT,
  is_read       INTEGER NOT NULL DEFAULT 0,
  is_bookmarked INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  restriction   TEXT DEFAULT 'open',
  offering_id   TEXT,
  session_name  TEXT,
  semester_term TEXT
);
CREATE INDEX IF NOT EXISTS idx_placement_folder ON placement(folder_id);
CREATE INDEX IF NOT EXISTS idx_placement_sha    ON placement(sha256);
CREATE UNIQUE INDEX IF NOT EXISTS uq_placement_folder_sha ON placement(folder_id, sha256);

-- Folders: official (course/week) AND smart ("Uncategorized - Finance"), plus virtuals.
CREATE TABLE IF NOT EXISTS folder (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL,            -- 'course' | 'smart' | 'unsorted' | 'bookmarks' | 'past'
  course_id   TEXT,                     -- set when kind='course'
  -- TF-IDF keywords that defined a smart cluster (Module 9-E "Why is this here?")
  cluster_keywords TEXT,
  created_at  INTEGER NOT NULL,
  offering_id   TEXT,
  session_name  TEXT,
  semester_term TEXT
);

-- Named bookmark collections (Module 9-B). Membership via collection_item.
CREATE TABLE IF NOT EXISTS collection (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS collection_item (
  collection_id TEXT NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
  placement_id  TEXT NOT NULL REFERENCES placement(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, placement_id)
);

-- 30-day trash for Copy/Move safety net (Module 10C / Reality Check).
CREATE TABLE IF NOT EXISTS trash (
  id            TEXT PRIMARY KEY,
  origin_uri    TEXT NOT NULL,          -- where the original lived (SAF/MediaStore uri)
  physical_path TEXT NOT NULL,          -- our retained copy
  sha256        TEXT,
  deleted_at    INTEGER NOT NULL,
  purge_after   INTEGER NOT NULL        -- epoch ms; reaper deletes past this
);

-- Files that couldn't be processed during a scan (Module 12 "Couldn't process").
CREATE TABLE IF NOT EXISTS scan_skip (
  id        TEXT PRIMARY KEY,
  uri       TEXT NOT NULL,
  reason    TEXT NOT NULL,
  scanned_at INTEGER NOT NULL
);

-- Learned course mappings: a folder/path keyword -> course (Module 9-E, auto-apply).
CREATE TABLE IF NOT EXISTS learned_mapping (
  keyword   TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  hits      INTEGER NOT NULL DEFAULT 1
);

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

CREATE TABLE IF NOT EXISTS timetable_session (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL,
  day_of_week   INTEGER NOT NULL,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  room          TEXT NOT NULL,
  offering_id   TEXT
);

CREATE TABLE IF NOT EXISTS announcement (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  pinned        INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  offering_id   TEXT
);
`;

export const BOOKMARKS_FOLDER_ID = "virtual:bookmarks";
export const UNSORTED_FOLDER_ID = "virtual:unsorted";
