/**
 * Thin API client with silent access-token refresh (Module 6C).
 *
 * - Attaches the bearer access token.
 * - On 401, attempts a one-shot refresh via /auth/refresh, then retries.
 * - On hard expiry (refresh fails), invokes the onAuthLost callback so the app
 *   can drop to the login screen. Offline reads still work from the local mirror.
 */
import { API_BASE_URL } from "@/config";
import { tokenStore } from "./storage";
import type { AccessOut } from "./types";

let onAuthLost: (() => void) | null = null;
export function setOnAuthLost(cb: () => void) {
  onAuthLost = cb;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

async function refreshAccess(): Promise<string | null> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as AccessOut;
  await tokenStore.set(data.access_token);
  return data.access_token;
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  /** Multipart form data (file upload); bypasses JSON encoding. */
  form?: FormData;
  /** When false, sends no Authorization header (login, activate, etc.). */
  auth?: boolean;
  /** Return the raw Response (e.g. for blob downloads). */
  raw?: boolean;
}

async function doFetch(path: string, opts: RequestOpts, token: string | null) {
  const headers: Record<string, string> = {};
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form as unknown as BodyInit;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  return fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
  });
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOpts = {}
): Promise<T> {
  let token = await tokenStore.getAccess();
  let res = await doFetch(path, opts, token);

  if (res.status === 401 && opts.auth !== false) {
    const fresh = await refreshAccess();
    if (fresh) {
      res = await doFetch(path, opts, fresh);
    } else {
      await tokenStore.clear();
      onAuthLost?.();
    }
  }

  if (opts.raw) {
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
    return res as unknown as T;
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new ApiError(res.status, String(detail), data);
  }
  return data as T;
}
