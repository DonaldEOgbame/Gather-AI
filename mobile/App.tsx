import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Expo Go (SDK 53+) dropped remote-push support in expo-notifications and logs
// an error at import; it's a dev-client-only limitation, harmless to the UI.
// Silence the known notices so they don't redbox during in-app verification.
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "New Architecture is always enabled in Expo Go",
]);
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { useAuth } from "@/stores/auth";
import { useTheme, useThemePrefs } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDb, expiredTrash, removeTrash } from "@/db";
import { initNativeFiles } from "@/scan/nativeBridge";
import { initShareIntake } from "@/scan/shareIntake";
import { navigationRef } from "@/navigation/ref";
import RootNavigator from "@/navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/** 30-day trash reaper (Module 10C). Purges expired retained originals on launch. */
async function reapTrash() {
  try {
    for (const t of await expiredTrash()) {
      await FileSystem.deleteAsync(t.physical_path, { idempotent: true }).catch(() => {});
      await removeTrash(t.id);
    }
  } catch {
    /* non-fatal */
  }
}

function Inner() {
  const { scheme, palette } = useTheme();
  // Align the NavigationContainer theme with our design palette so the
  // container/card backgrounds behind screens match (no default-grey flash in
  // dark mode). `scheme` follows the OS via useColorScheme(), so this swaps live.
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: palette.bg,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
    },
  };
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onReady={initShareIntake}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    initNativeFiles();
    getDb().then(reapTrash);
    bootstrap();
    
    // Load persisted theme preference
    AsyncStorage.getItem("theme_mode").then((savedMode) => {
      if (savedMode) {
        useThemePrefs.getState().setMode(savedMode as any);
      }
    }).catch(() => {});
  }, [bootstrap]);

  // Hold the UI until Jakarta is ready so the first paint isn't in the
  // platform default and then reflowing (design typeface is load-blocking).
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Inner />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
