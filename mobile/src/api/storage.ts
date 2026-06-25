/** Secure token storage (Module 6C / 13). Uses Keystore-backed SecureStore. */
import * as SecureStore from "expo-secure-store";

const ACCESS = "uniportal.access";
const REFRESH = "uniportal.refresh";

export const tokenStore = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH);
  },
  async set(access: string, refresh?: string) {
    await SecureStore.setItemAsync(ACCESS, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
