/**
 * Auth/session store (Module 6C/D). Holds the current user, drives role-based
 * navigation, and supports the offline grace state: when the session can't be
 * refreshed the app stays usable on cached content but blocks sync/publish.
 */
import { create } from "zustand";
import { authApi } from "@/api/endpoints";
import { setOnAuthLost } from "@/api/client";
import { tokenStore } from "@/api/storage";
import type { UserOut } from "@/api/types";

type Phase = "loading" | "authed" | "anon" | "locked";

interface AuthState {
  phase: Phase;
  user: UserOut | null;
  /** True once the app-lock (biometric) has been satisfied this launch. */
  unlocked: boolean;
  bootstrap: () => Promise<void>;
  afterLogin: (user: UserOut) => void;
  setUnlocked: (v: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  phase: "loading",
  user: null,
  unlocked: false,

  bootstrap: async () => {
    setOnAuthLost(() => set({ phase: "anon", user: null }));
    const token = await tokenStore.getAccess();
    if (!token) {
      set({ phase: "anon" });
      return;
    }
    try {
      const user = await authApi.me();
      // Module 6D: suspended users land on a lock screen, not the home.
      set({
        user,
        phase: user.status === "suspended" ? "locked" : "authed",
        unlocked: false,
      });
    } catch {
      // Offline grace: keep last-known user from cache if present, else anon.
      set({ phase: "anon" });
    }
  },

  afterLogin: (user) =>
    set({ user, phase: user.status === "suspended" ? "locked" : "authed" }),

  setUnlocked: (unlocked) => set({ unlocked }),

  refreshUser: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      /* offline: keep cached user */
    }
  },

  logout: async () => {
    await tokenStore.clear();
    set({ phase: "anon", user: null, unlocked: false });
  },
}));

export const roleOf = () => useAuth.getState().user?.global_role;
