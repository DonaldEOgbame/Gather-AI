/** Organization + storage/sync preferences (Module 10C/D). In-memory store;
 * a production build persists these to SecureStore/AsyncStorage. */
import { create } from "zustand";

interface Prefs {
  scanAction: "copy" | "move";
  smartRenamer: boolean;
  smartClustering: boolean;
  autoApplyMappings: boolean;
  duplicateHandling: "alias" | "keep-both";
  wifiOnlyDownload: boolean;
  preCache: boolean;
  biometricLock: boolean;
  set: (p: Partial<Omit<Prefs, "set">>) => void;
}

export const usePrefs = create<Prefs>((set) => ({
  scanAction: "copy",
  smartRenamer: true,
  smartClustering: true,
  autoApplyMappings: true,
  duplicateHandling: "alias",
  wifiOnlyDownload: true,
  preCache: true,
  biometricLock: false,
  set: (p) => set(p),
}));
