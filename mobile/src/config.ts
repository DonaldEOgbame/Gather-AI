/**
 * Runtime config. API base points at the FastAPI backend. For Android emulator
 * the host machine is reachable at 10.0.2.2; override via EXPO_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000";

// Module 8 reality check: this build targets Android enterprise distribution
// with MANAGE_EXTERNAL_STORAGE, enabling the full recursive Scan & Sort.
export const ENTERPRISE_FULL_SCAN = true;

// Module 10C: Copy is the default scan action; originals retained 30 days in trash.
export const DEFAULT_SCAN_ACTION: "copy" | "move" = "copy";
export const TRASH_RETENTION_DAYS = 30;
