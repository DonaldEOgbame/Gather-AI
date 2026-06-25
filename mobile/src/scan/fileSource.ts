/**
 * File-source abstraction (Module 3 + Reality Check).
 *
 * Two strategies:
 *  - FullScanSource: enterprise build with MANAGE_EXTERNAL_STORAGE — recursively
 *    enumerates user-granted roots (Downloads, DCIM, WhatsApp media, ...). Real
 *    on the sideloaded/MDM target chosen for this project.
 *  - ImportSource: graceful degrade (permission revoked / non-enterprise) — the
 *    user multi-selects via the document picker.
 *
 * The native recursive-scan + Copy-to-trash lives behind `NativeFiles`, a small
 * native module contract. The TS here is the orchestration; it's the seam an
 * Android native module (or expo-file-system SAF wrapper) plugs into.
 */
import * as DocumentPicker from "expo-document-picker";
import { ENTERPRISE_FULL_SCAN } from "@/config";

export interface DiscoveredFile {
  uri: string;
  name: string;
  size: number;
  mime: string | null;
}

export interface FileSource {
  readonly kind: "full-scan" | "import";
  discover(roots?: string[]): Promise<DiscoveredFile[]>;
}

/**
 * Native module contract. The Android side (Kotlin) implements recursive
 * enumeration over MANAGE_EXTERNAL_STORAGE roots and returns file descriptors.
 * Kept as an injectable so the JS is testable and degrades cleanly when the
 * native module isn't present (e.g. running in Expo Go).
 */
export interface NativeFilesModule {
  hasAllFilesAccess(): Promise<boolean>;
  requestAllFilesAccess(): Promise<boolean>;
  /** Recursively list files under each root path. */
  listRecursive(roots: string[]): Promise<DiscoveredFile[]>;
}

let nativeFiles: NativeFilesModule | null = null;
export function registerNativeFiles(m: NativeFilesModule) {
  nativeFiles = m;
}

export const DEFAULT_SCAN_ROOTS = [
  "Download",
  "DCIM",
  "Documents",
  "WhatsApp/Media/WhatsApp Documents",
];

class FullScanSource implements FileSource {
  readonly kind = "full-scan" as const;
  async discover(roots: string[] = DEFAULT_SCAN_ROOTS): Promise<DiscoveredFile[]> {
    if (!nativeFiles) throw new Error("native-files-unavailable");
    if (!(await nativeFiles.hasAllFilesAccess())) {
      const granted = await nativeFiles.requestAllFilesAccess();
      if (!granted) throw new Error("all-files-access-denied");
    }
    return nativeFiles.listRecursive(roots);
  }
}

class ImportSource implements FileSource {
  readonly kind = "import" as const;
  async discover(): Promise<DiscoveredFile[]> {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return [];
    return res.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      size: a.size ?? 0,
      mime: a.mimeType ?? null,
    }));
  }
}

/**
 * Pick the best available source. Falls back to import when the enterprise
 * native module isn't usable (Module 12: "Scan gracefully degrades to import-only").
 */
export async function resolveFileSource(): Promise<FileSource> {
  if (ENTERPRISE_FULL_SCAN && nativeFiles) {
    try {
      if (await nativeFiles.hasAllFilesAccess()) return new FullScanSource();
      // We can still offer it; discover() will prompt for the grant.
      return new FullScanSource();
    } catch {
      /* fall through */
    }
  }
  return new ImportSource();
}
