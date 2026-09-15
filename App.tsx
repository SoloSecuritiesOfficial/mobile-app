import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import Constants from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import {
  configureForegroundNotifications,
  addNotificationListeners,
  registerForPushNotifications,
  clearBadge,
  ensureAndroidChannelEarly,
} from "./src/utils/pushNotifications";
import { isLoggedIn } from "./src/services/authService";
import { routeNotification } from "./src/navigation/notificationRouter";
import { preloadInterstitialAd } from "./src/components/InterstitialAd";
import { initAppOpenAd } from "./src/components/AppOpenAd";

// Keep the native splash screen visible until we explicitly hide it.
SplashScreen.preventAutoHideAsync();

// ─── Create the Android notification channel at module level ──────────────────
// This runs BEFORE React mounts, before any login check, before any user
// interaction. If the channel doesn't exist when a FCM message arrives while
// the app is killed, Android silently drops the notification. Creating it here
// guarantees it is registered as early as possible on every cold start.
ensureAndroidChannelEarly();

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    SplashScreen.hide();

    const inExpoGo = Constants.appOwnership === "expo";

    // Configure foreground notification display
    if (!inExpoGo) {
      configureForegroundNotifications();
    }

    // Preload interstitial so it's ready for the first key navigation
    preloadInterstitialAd();

    const initPush = async () => {
      // Init App Open ad — fires immediately on cold start for free users,
      // and on every foreground resume (max once per 4 hours).
      // We pass false here; DashboardScreen calls initAppOpenAd(true) for
      // premium users once it knows their subscription tier.
      initAppOpenAd(false);

      const loggedIn = await isLoggedIn();

      if (!inExpoGo && loggedIn) {
        // Re-register FCM token on every app open (idempotent upsert)
        registerForPushNotifications().catch((err) =>
          console.warn("[Push] Re-registration failed:", err?.message)
        );
      }

      // Cold-start notification tap handler
      if (!inExpoGo) {
        try {
          const N = require("expo-notifications");
          const initialResponse = await N.getLastNotificationResponseAsync();
          if (initialResponse) {
            const data = initialResponse.notification?.request?.content
              ?.data as Record<string, string> | undefined;
            setTimeout(() => routeNotification(data), 500);
          }
        } catch {
          /* expo-notifications not available */
        }
      }
    };

    initPush();

    // ── Foreground / tap listeners ─────────────────────────────────────────
    const cleanup = addNotificationListeners({
      onForeground: (notification: any) => {
        console.log(
          "[Push] Foreground:",
          notification?.request?.content?.title
        );
      },
      onTap: (response: any) => {
        clearBadge();
        const data = response?.notification?.request?.content?.data as
          | Record<string, string>
          | undefined;
        console.log(
          "[Push] Tapped:",
          data?.actionUrl ?? data?.type ?? "(no url)"
        );
        routeNotification(data);
      },
    });

    // ── Badge clear when app comes back to foreground ─────────────────────
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
