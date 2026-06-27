import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/theme";
import type { AuthStackParams } from "./types";
import LoginScreen from "@/screens/auth/LoginScreen";
import ActivateScreen from "@/screens/auth/ActivateScreen";
import ForgotPasswordScreen from "@/screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "@/screens/auth/ResetPasswordScreen";
import JoinCodeScreen from "@/screens/auth/JoinCodeScreen";
import OtpScreen from "@/screens/auth/OtpScreen";
import RequestAccessScreen from "@/screens/admin/RequestAccessScreen";

const Stack = createNativeStackNavigator<AuthStackParams>();

export default function AuthNavigator() {
  const { palette } = useTheme();
  // Inner screens carry their own large headers; the native bar contributes only
  // a back chevron (no title, no shadow) so it blends with the auth screen background.
  const minimalHeader = {
    headerShown: true,
    title: "",
    headerShadowVisible: false,
    headerTintColor: palette.text,
    headerStyle: { backgroundColor: palette.bg },
  } as const;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Activate" component={ActivateScreen} options={minimalHeader} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={minimalHeader} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={minimalHeader} />
      <Stack.Screen name="JoinCode" component={JoinCodeScreen} options={minimalHeader} />
      <Stack.Screen name="Otp" component={OtpScreen} options={minimalHeader} />
      <Stack.Screen name="RequestAccess" component={RequestAccessScreen} options={minimalHeader} />
    </Stack.Navigator>
  );
}
