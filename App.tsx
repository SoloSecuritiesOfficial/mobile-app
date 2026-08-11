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
import { routeNotification } from "./src/navigation/notificationRouter";

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const inExpoGo = Constants.appOwnership === "expo";

    if (!inExpoGo) {
      configureForegroundNotifications();
    }

    const initPush = async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        registerForPushNotifications();
      }

      // Cold-start: app was killed, user tapped a notification
      if (!inExpoGo) {
        try {
          const N = require("expo-notifications");
          const initialResponse = await N.getLastNotificationResponseAsync();
          if (initialResponse) {
            const data = initialResponse.notification?.request?.content?.data as
              | Record<string, string>
              | undefined;
            // Small delay so navigator is mounted
            setTimeout(() => routeNotification(data), 500);
          }
        } catch {
          // expo-notifications not available
        }
      }
    };
    initPush();

    // Foreground tap + app-open tap
    const cleanup = addNotificationListeners({
      onForeground: (notification: any) => {
        console.log("[Push] Foreground:", notification?.request?.content?.title);
      },
      onTap: (response: any) => {
        clearBadge();
        const data = response?.notification?.request?.content?.data as
          | Record<string, string>
          | undefined;
        console.log("[Push] Tapped:", data?.actionUrl ?? data?.type ?? "(no url)");
        routeNotification(data);
      },
    });

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
