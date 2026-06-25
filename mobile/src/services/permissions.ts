/**
 * Permission priming + grants (Module 6B / 10F / Reality Check).
 *
 * Priming: show the friendly rationale BEFORE the OS dialog (callers render the
 * priming screen, then call request*). Storage access on the enterprise build is
 * MANAGE_EXTERNAL_STORAGE via the native module; falls back to import-only.
 */
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";

export interface PermissionStatus {
  storage: "granted" | "denied" | "import-only" | "unknown";
  notifications: "granted" | "denied" | "unknown";
  biometricAvailable: boolean;
}

export async function requestNotifications(): Promise<"granted" | "denied"> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted" ? "granted" : "denied";
}

export async function biometricAvailable(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return has && enrolled;
}

/** App-lock check (Module 6C). Returns true if the user authenticated. */
export async function biometricUnlock(reason = "Unlock UniPortal"): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: "Use passcode",
  });
  return res.success;
}

export async function currentStatus(): Promise<PermissionStatus> {
  const notif = await Notifications.getPermissionsAsync();
  return {
    storage: "unknown", // resolved by the native module on the enterprise build
    notifications: notif.status === "granted" ? "granted" : "denied",
    biometricAvailable: await biometricAvailable(),
  };
}
