import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import Constants from "expo-constants";

import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import {
  configureForegroundNotifications,
  addNotificationListeners,
  registerForPushNotifications,
  clearBadge,
} from "./src/utils/pushNotifications";
import { isLoggedIn } from "./src/services/authService";

// ─────────────────────────────────────────────────────────────────
// NOTE: Do NOT call configureForegroundNotifications() at module
// level — Expo Go SDK 53 crashes immediately when any
// expo-notifications handler is set outside a component.
// It is called inside useEffect below after the guard runs.
// ─────────────────────────────────────────────────────────────────

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Only set up push infrastructure in real builds (not Expo Go)
    const inExpoGo = Constants.appOwnership === "expo";

    if (!inExpoGo) {
      // Safe to call — this crashes in Expo Go SDK 53
      configureForegroundNotifications();
    }

    // Register token if already logged in
    const initPush = async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        registerForPushNotifications(); // no-op in Expo Go
      }
    };
    initPush();

    // Notification listeners — no-op in Expo Go (guard is inside addNotificationListeners)
    const cleanup = addNotificationListeners({
      onForeground: (notification: any) => {
        console.log("[Push] Foreground:", (notification as any)?.request?.content?.title);
      },
      onTap: (response: any) => {
        clearBadge();
        const data = (response as any)?.notification?.request?.content?.data as Record<string, string> | undefined;
        const url  = data?.actionUrl ?? "";
        console.log("[Push] Tapped:", url);
      },
    });

    // Clear badge when app comes to foreground
    const appStateSub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          clearBadge();
        }
        appState.current = nextState;
      }
    );

    return () => {
      cleanup();
      appStateSub.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
