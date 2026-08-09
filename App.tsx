import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";

import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import {
  configureForegroundNotifications,
  addNotificationListeners,
  registerForPushNotifications,
  clearBadge,
} from "./src/utils/pushNotifications";
import { isLoggedIn } from "./src/services/authService";

// ── Configure how notifications appear when the app is in the foreground.
// This MUST be called before any navigator mounts.
configureForegroundNotifications();

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. Register push token if already logged in (returning user)
    const initPush = async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        registerForPushNotifications();   // fire-and-forget, non-blocking
      }
    };
    initPush();

    // 2. Notification listeners
    const cleanup = addNotificationListeners({
      // Notification arrives while app is OPEN — banner is already shown
      // by the foreground handler above. Log for debugging.
      onForeground: (notification) => {
        console.log(
          "[Push] Foreground:",
          notification.request.content.title
        );
      },
      // User TAPPED a notification (app was in background or killed).
      // React Navigation is already mounted — navigate to the right screen.
      onTap: (response) => {
        clearBadge();
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        const url  = data?.actionUrl ?? "";
        console.log("[Push] Tapped, url:", url);
        // Navigation is handled inside AppNavigator on next render via
        // Notifications.getLastNotificationResponseAsync() at app boot.
        // Deep-link URLs are stored here for components that need them.
      },
    });

    // 3. Clear badge when the app comes back to foreground
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
