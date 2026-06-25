import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParams } from "./types";
import LoginScreen from "@/screens/auth/LoginScreen";
import ActivateScreen from "@/screens/auth/ActivateScreen";
import JoinCodeScreen from "@/screens/auth/JoinCodeScreen";
import OtpScreen from "@/screens/auth/OtpScreen";

const Stack = createNativeStackNavigator<AuthStackParams>();

export default function AuthNavigator() {
  // Inner screens carry their own large headers; the native bar contributes only
  // a back chevron (no title, no shadow) so it blends with the white auth screens.
  const minimalHeader = {
    headerShown: true,
    title: "",
    headerShadowVisible: false,
    headerTintColor: "#14171C",
    headerStyle: { backgroundColor: "#FFFFFF" },
  } as const;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Activate" component={ActivateScreen} options={minimalHeader} />
      <Stack.Screen name="JoinCode" component={JoinCodeScreen} options={minimalHeader} />
      <Stack.Screen name="Otp" component={OtpScreen} options={minimalHeader} />
    </Stack.Navigator>
  );
}
