/**
 * Offline action queue for lecturer mutations.
 *
 * When a mutation fails because the device is offline (TypeError: Network request failed),
 * call `enqueueAction` to persist the intent to AsyncStorage so PendingActionsScreen
 * can display it and retry on reconnect.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AccentName } from "@/theme";

const QUEUE_KEY = "pending_action_queue";

export interface PendingAction {
  id: string;
  title: string;
  code: string;
  state: "queued" | "synced" | "conflict";
  accent: AccentName;
}

export async function enqueueAction(title: string, code: string): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const existing: PendingAction[] = raw ? JSON.parse(raw) : [];
  const action: PendingAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    code,
    state: "queued",
    accent: "lemon",
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, action]));
}

/** Returns true if the error looks like a network connectivity failure. */
export function isOfflineError(e: unknown): boolean {
  if (e instanceof TypeError && e.message === "Network request failed") return true;
  if (e instanceof Error && e.message.toLowerCase().includes("network")) return true;
  return false;
}
