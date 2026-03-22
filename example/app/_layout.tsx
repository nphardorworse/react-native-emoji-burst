import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useBurstConfig } from "../hooks/useBurstConfig";
import { BurstConfigContext } from "../hooks/useBurstConfigStore";

export default function RootLayout() {
  const store = useBurstConfig();

  return (
    <SafeAreaProvider>
      <BurstConfigContext.Provider value={store}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="settings"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </BurstConfigContext.Provider>
    </SafeAreaProvider>
  );
}
