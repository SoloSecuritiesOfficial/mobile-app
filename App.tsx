import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
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
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const IS_EXPO_GO = Constants.appOwnership === "expo";

    if (!IS_EXPO_GO) {
      ensureAndroidChannelEarly();
    }

    SplashScreen.hideAsync().catch(() => {});

    if (!IS_EXPO_GO) {
      configureForegroundNotifications();
    }

    const init = async () => {
      // ── Step 1: Initialize Google Mobile Ads SDK ──────────────────────────
      if (!IS_EXPO_GO) {
        try {
          const { MobileAds } = await import("react-native-google-mobile-ads");
          await MobileAds().initialize();
        } catch (err) {
          console.warn("[Ads] SDK initialization failed:", err);
        }
      }

      // ── Step 2: Preload overlay ads AFTER SDK init ────────────────────────
      try { preloadInterstitialAd(); } catch { /* non-fatal */ }
      try { initAppOpenAd(false); }    catch { /* non-fatal */ }

      // ── Step 3: Push notifications ────────────────────────────────────────
      const loggedIn = await isLoggedIn();
      if (!IS_EXPO_GO && loggedIn) {
        registerForPushNotifications().catch((err) =>
          console.warn("[Push] Re-registration failed:", err?.message),
        );
      }

      // ── Step 4: Cold-start notification tap ───────────────────────────────
      if (!IS_EXPO_GO) {
        try {
          const N = require("expo-notifications");
          const initialResponse = await N.getLastNotificationResponseAsync();
          if (initialResponse) {
            const data = initialResponse.notification?.request?.content
              ?.data as Record<string, string> | undefined;
            setTimeout(() => routeNotification(data), 500);
          }
        } catch {
          /* expo-notifications not available in this build */
        }
      }
    };

    init();

    const cleanup = addNotificationListeners({
      onForeground: (notification: any) => {
        console.log("[Push] Foreground:", notification?.request?.content?.title);
      },
      onTap: (response: any) => {
        clearBadge();
        const data = response?.notification?.request?.content?.data as
          | Record<string, string>
          | undefined;
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
      },
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
