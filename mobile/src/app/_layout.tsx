import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  Stack,
  router,
  useSegments,
  type Href,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getMe, getToken, removeToken } from "../services/api";

export default function RootLayout() {
  const [checkingSession, setCheckingSession] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getToken();

        if (!token) {
          setCheckingSession(false);
          return;
        }

        const response = await getMe();

        if (!response?.success) {
          await removeToken();
        }
      } catch (error) {
        console.log("Sesión no válida:", error);
        await removeToken();
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
  if (checkingSession) {
    return;
  }

  const currentRoute = String(segments[0] ?? "");

  const isLogin = currentRoute === "login";

  const redirect = async () => {
    const token = await getToken();

    if (!token && !isLogin) {
      router.replace("/login" as Href);
      return;
    }

    if (token && isLogin) {
      router.replace("/");
    }
  };

  redirect();
}, [checkingSession, segments]);

  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0F1C",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#10B981"
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: "#0A0F1C",
          },
        }}
      />
    </SafeAreaProvider>
  );
}