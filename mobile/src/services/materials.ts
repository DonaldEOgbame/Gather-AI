/**
 * Material download + local-mirror sync (Modules 1, 9, 12).
 * Downloads a published material into the sandbox and records it as a placement
 * so it appears in My Library and works offline. Dedup applies across courses.
 */
// SDK 54: classic API (documentDirectory, makeDirectoryAsync, downloadAsync)
// moved to /legacy.
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "@/config";
import { tokenStore } from "@/api/storage";
import {
  findContent,
  getOrCreateOfferingFolder,
  addPlacement,
  physicalPathFor,
  upsertContent,
} from "@/db";
import type { OfferingOut, MaterialOut } from "@/api/types";

const MIRROR_DIR = FileSystem.documentDirectory + "mirror/";

export async function ensureDownloaded(
  material: MaterialOut,
  offering: OfferingOut
): Promise<string> {
  // Dedup: if we already have this exact content, just add a logical placement.
  const existing = await findContent(material.content_sha256);
  const folderId = await getOrCreateOfferingFolder(
    offering.id,
    offering.course_id,
    `${offering.code ?? ""} ${offering.title ?? ""}`.trim(),
    offering.session_name || "Unknown Session",
    offering.semester_term || "first"
  );

  if (!existing) {
    await FileSystem.makeDirectoryAsync(MIRROR_DIR, { intermediates: true }).catch(
      () => {}
    );
    const dest = `${MIRROR_DIR}${material.content_sha256}`;
    const token = await tokenStore.getAccess();
    const res = await FileSystem.downloadAsync(
      `${API_BASE_URL}/materials/${material.id}/download`,
      dest,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (res.status >= 400) throw new Error(`Download failed (${res.status})`);
    await upsertContent({
      sha256: material.content_sha256,
      physical_path: dest,
      size_bytes: material.size_bytes,
      restriction: material.restriction,
    });
  }

  await addPlacement({
    sha256: material.content_sha256,
    folderId,
    displayName: material.title || material.original_filename,
    originalName: material.original_filename || material.title,
    courseId: offering.course_id,
    offeringId: offering.id,
    sessionName: offering.session_name,
    semesterTerm: offering.semester_term,
    week: material.week,
    topic: material.title,
    materialId: material.id,
    restriction: material.restriction,
  });

  return (await physicalPathFor(material.content_sha256))!;
}
