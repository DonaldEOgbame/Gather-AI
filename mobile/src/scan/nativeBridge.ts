/**
 * Binds the JS FileSource seam to the Android native module that performs the
 * recursive MANAGE_EXTERNAL_STORAGE scan (Reality Check: enterprise build).
 *
 * The Kotlin module `UniportalFiles` is expected to expose:
 *   - hasAllFilesAccess(): boolean
 *   - requestAllFilesAccess(): Promise<boolean>  (opens the system grant screen)
 *   - listRecursive(roots: string[]): Promise<DiscoveredFile[]>
 *
 * When the module isn't present (Expo Go / iOS), we register nothing and the app
 * cleanly falls back to document-picker import (Module 12).
 */
import { NativeModules } from "react-native";
import { registerNativeFiles, type NativeFilesModule } from "./fileSource";

export function initNativeFiles() {
  const mod = (NativeModules as Record<string, unknown>).UniportalFiles as
    | NativeFilesModule
    | undefined;
  if (mod && typeof mod.listRecursive === "function") {
    registerNativeFiles(mod);
    return true;
  }
  return false;
}
