import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import { useTheme } from "@/theme";
import { getDb, expiredTrash, removeTrash } from "@/db";
import { initNativeFiles } from "@/scan/nativeBridge";
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
  const { scheme } = useTheme();
  return (
    <NavigationContainer theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
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
