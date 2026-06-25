/**
 * Scan & Sort engine (Modules 3, 4, 12, 14).
 *
 * Pipeline per discovered file:
 *   1. hash (SHA-256, chunked so it never blocks the UI)
 *   2. dedup: if hash known -> add a logical placement only (no second copy)
 *   3. else COPY into app-private sandbox; retain original ref in 30-day trash
 *   4. extractMeta -> smartRename
 *   5. route: known course code -> course folder; else collect for clustering
 *
 * Progress is reported per file; the whole run is cancelable.
 */
// SDK 54: the classic FileSystem API moved to /legacy (the new File/Directory
// API is the default export). This module relies on the classic functions
// (documentDirectory, getInfoAsync, readAsStringAsync, copyAsync, EncodingType).
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { DEFAULT_SCAN_ACTION, TRASH_RETENTION_DAYS } from "@/config";
import {
  addPlacement,
  addScanSkip,
  addTrash,
  createSmartFolder,
  findContent,
  getOrCreateCourseFolder,
  lookupMapping,
  upsertContent,
} from "@/db";
import { UNSORTED_FOLDER_ID } from "@/db/schema";
import {
  clusterUncategorized,
  extractMeta,
  smartRename,
} from "./matcher";
import type { DiscoveredFile, FileSource } from "./fileSource";
import type { CourseOut } from "@/api/types";

const MIRROR_DIR = FileSystem.documentDirectory + "mirror/";

export interface ScanProgress {
  total: number;
  processed: number;
  current: string;
  organized: number;
  deduped: number;
  skipped: number;
}

export interface ScanResult {
  organized: number;
  deduped: number;
  skipped: number;
  bytesSaved: number;
  smartFolders: { name: string; count: number }[];
}

const SUPPORTED = /\.(pdf|pptx?|docx?|txt|png|jpe?g|gif|webp|heic)$/i;

async function ensureMirrorDir() {
  const info = await FileSystem.getInfoAsync(MIRROR_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(MIRROR_DIR, { intermediates: true });
}

/** Chunked SHA-256 so hashing large files doesn't block the JS thread in one go. */
async function hashFile(uri: string): Promise<string> {
  // expo-file-system reads base64; for very large files this should be streamed
  // in a native module. Here we hash the bytes via expo-crypto.
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, b64);
}

/** Map a parsed course code to a real enrolled course id, with learned-mapping fallback. */
async function resolveCourseId(
  code: string | null,
  folderHint: string,
  courses: CourseOut[]
): Promise<CourseOut | null> {
  if (code) {
    const hit = courses.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (hit) return hit;
  }
  // Auto-apply learned mappings (Module 9-E / 10D)
  const learned = await lookupMapping(folderHint);
  if (learned) return courses.find((c) => c.id === learned) ?? null;
  return null;
}

export async function runScan(
  source: FileSource,
  courses: CourseOut[],
  opts: {
    roots?: string[];
    onProgress?: (p: ScanProgress) => void;
    isCancelled?: () => boolean;
  } = {}
): Promise<ScanResult> {
  await ensureMirrorDir();
  const files = await source.discover(opts.roots);

  const progress: ScanProgress = {
    total: files.length,
    processed: 0,
    current: "",
    organized: 0,
    deduped: 0,
    skipped: 0,
  };
  let bytesSaved = 0;
  const uncategorized: { id: string; filename: string; sha256: string }[] = [];

  for (const f of files) {
    if (opts.isCancelled?.()) break;
    progress.current = f.name;

    if (!SUPPORTED.test(f.name)) {
      await addScanSkip(f.uri, "unsupported type");
      progress.skipped++;
      progress.processed++;
      opts.onProgress?.({ ...progress });
      continue;
    }

    try {
      const sha = await hashFile(f.uri);
      const meta = extractMeta(f.name);
      const display = smartRename(meta, f.name);
      const existing = await findContent(sha);

      if (existing) {
        // Dedup: only a new logical placement; no second physical copy.
        bytesSaved += existing.size_bytes;
        progress.deduped++;
        await placeFile(f, sha, display, meta, courses, uncategorized);
      } else {
        const dest = `${MIRROR_DIR}${sha}`;
        await FileSystem.copyAsync({ from: f.uri, to: dest });
        await upsertContent({
          sha256: sha,
          physical_path: dest,
          size_bytes: f.size,
          mime: f.mime ?? undefined,
        });
        // Copy-default safety net: retain original ref in 30-day trash.
        if (DEFAULT_SCAN_ACTION === "copy") {
          await addTrash({
            originUri: f.uri,
            physicalPath: dest,
            sha256: sha,
            retentionDays: TRASH_RETENTION_DAYS,
          });
        }
        await placeFile(f, sha, display, meta, courses, uncategorized);
        progress.organized++;
      }
    } catch (e) {
      await addScanSkip(f.uri, `error: ${String(e)}`);
      progress.skipped++;
    }

    progress.processed++;
    opts.onProgress?.({ ...progress });
  }

  // Cluster the leftover uncategorized files into smart folders (Module 3-D).
  const smartFolders = await buildClusters(uncategorized);

  return {
    organized: progress.organized,
    deduped: progress.deduped,
    skipped: progress.skipped,
    bytesSaved,
    smartFolders,
  };
}

async function placeFile(
  f: DiscoveredFile,
  sha: string,
  display: string,
  meta: ReturnType<typeof extractMeta>,
  courses: CourseOut[],
  uncategorized: { id: string; filename: string; sha256: string }[]
) {
  const course = await resolveCourseId(meta.courseCode, f.name, courses);
  if (course) {
    const folderId = await getOrCreateCourseFolder(
      course.id,
      `${course.code} ${course.title}`.trim()
    );
    await addPlacement({
      sha256: sha,
      folderId,
      displayName: display,
      originalName: f.name,
      courseId: course.id,
      week: meta.week,
      topic: meta.topic,
    });
  } else {
    // Stage for clustering; provisionally placed in Unsorted.
    const pid = await addPlacement({
      sha256: sha,
      folderId: UNSORTED_FOLDER_ID,
      displayName: display,
      originalName: f.name,
      week: meta.week,
      topic: meta.topic,
    });
    uncategorized.push({ id: pid, filename: f.name, sha256: sha });
  }
}

async function buildClusters(
  items: { id: string; filename: string; sha256: string }[]
): Promise<{ name: string; count: number }[]> {
  if (items.length < 2) return [];
  const { clusters } = clusterUncategorized(
    items.map((i) => ({ id: i.id, filename: i.filename }))
  );
  const out: { name: string; count: number }[] = [];
  for (const c of clusters) {
    const folderId = await createSmartFolder(c.label, c.keywords);
    for (const memberId of c.memberIds) {
      const item = items.find((i) => i.id === memberId);
      if (!item) continue;
      // Re-home the placement from Unsorted into the new smart folder.
      await addPlacement({
        sha256: item.sha256,
        folderId,
        displayName: item.filename,
        originalName: item.filename,
      });
    }
    out.push({ name: c.label, count: c.memberIds.length });
  }
  return out;
}
