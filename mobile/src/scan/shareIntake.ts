/**
 * OS share-sheet intake. The Android UniportalShare native module delivers files
 * shared into the app (cold start via getInitialShare, warm start via the
 * "UniportalShareReceived" event); we route them to ShareToGather.
 *
 * A share can arrive before the user is authenticated (ShareToGather lives in the
 * authed stack) or before that stack has mounted, so we hold the most recent
 * payload and deliver it only once the authed navigator is actually present —
 * gated on the root navigator's routeNames, so we never fire a navigation the
 * current navigator can't handle (which would drop the share and warn).
 *
 * No-ops cleanly when the native module is absent (Expo Go / iOS).
 */
import { DeviceEventEmitter, NativeModules } from "react-native";
import { navigationRef } from "@/navigation/ref";
import { useAuth } from "@/stores/auth";

export interface SharePayload {
  uri: string;
  name: string;
  size: number;
  mime: string | null;
}

let pending: SharePayload | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Single coalesced retry, so overlapping triggers can't stack duplicate pushes. */
function schedule(delay = 0) {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    tryDeliver();
  }, delay);
}

function tryDeliver() {
  if (!pending) return;
  // Already there (a prior attempt landed) — done.
  if (navigationRef.getCurrentRoute()?.name === "ShareToGather") {
    pending = null;
    return;
  }
  // Not authenticated yet: hold. The auth subscription re-triggers on login.
  if (!navigationRef.isReady() || useAuth.getState().phase !== "authed") return;
  // Authed but the main stack (which owns ShareToGather) may still be mounting
  // after the auth→main swap — poll until its route is registered.
  const state = navigationRef.getRootState() as { routeNames?: string[] } | undefined;
  if (!state?.routeNames?.includes("ShareToGather")) {
    schedule(200);
    return;
  }
  navigationRef.navigate("ShareToGather", {
    name: pending.name,
    size: pending.size,
    uri: pending.uri,
    from: "Shared file",
  });
  // Confirm it landed (clears pending) or retry.
  schedule(400);
}

function receive(payload: SharePayload | null | undefined) {
  if (!payload || !payload.uri) return;
  pending = payload;
  schedule(0);
}

let started = false;

/** Call once the navigation container is ready (NavigationContainer onReady). */
export function initShareIntake() {
  const mod = (NativeModules as Record<string, any>).UniportalShare;
  if (!mod) return;

  // Cold start: the share that launched the app.
  mod.getInitialShare?.().then(receive).catch(() => {});

  if (started) return;
  started = true;

  // Warm start: shares received while the app is already running.
  DeviceEventEmitter.addListener("UniportalShareReceived", receive);

  // Replay a held share once the user becomes authenticated.
  useAuth.subscribe((state) => {
    if (state.phase === "authed") schedule(0);
  });
}
