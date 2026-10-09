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

// ─── Create the Android notification channel at module level ─────────────────
// Must run before React mounts so FCM messages received while the app is
// killed are not silently dropped on Android.
ensureAndroidChannelEarly();

// ─── Whether we are running inside Expo Go ───────────────────────────────────
// Computed once at module level so it is available synchronously in the effect.
const IS_EXPO_GO = Constants.appOwnership === "expo";

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Hide splash screen
    SplashScreen.hideAsync().catch(() => {});

    // Configure foreground notification display (not needed in Expo Go)
    if (!IS_EXPO_GO) {
      configureForegroundNotifications();
    }

    const init = async () => {
      // ── Step 1: Initialize the Google Mobile Ads SDK ─────────────────────
      // app.json has googleMobileAdsAutoInit:false, so the SDK will NOT
      // self-initialize. We MUST call initialize() before making any ad
      // request (BannerAd load, RewardedInterstitialAd, AppOpenAd, etc.).
      // Skipping this causes native crashes when ad components mount.
      if (!IS_EXPO_GO) {
        try {
          const { MobileAds } = await import(
            "react-native-google-mobile-ads"
          );
          await MobileAds().initialize();
        } catch (err) {
          // Log but never crash — ads simply won't serve if init fails
          console.warn("[Ads] SDK initialization failed:", err);
        }
      }

      // ── Step 2: Preload overlay ads AFTER SDK is initialized ─────────────
      preloadInterstitialAd();
      initAppOpenAd(false);

      // ── Step 3: Push notification setup ──────────────────────────────────
      const loggedIn = await isLoggedIn();

      if (!IS_EXPO_GO && loggedIn) {
        // Re-register FCM token on every app open (idempotent upsert)
        registerForPushNotifications().catch((err) =>
          console.warn("[Push] Re-registration failed:", err?.message),
        );
      }

      // ── Step 4: Handle cold-start notification tap ────────────────────────
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

    // ── Foreground / tap notification listeners ───────────────────────────
    const cleanup = addNotificationListeners({
      onForeground: (notification: any) => {
        console.log(
          "[Push] Foreground:",
          notification?.request?.content?.title,
        );
      },
      onTap: (response: any) => {
        clearBadge();
        const data = response?.notification?.request?.content?.data as
          | Record<string, string>
          | undefined;
        routeNotification(data);
      },
    });

    // ── Clear badge when app returns to foreground ────────────────────────
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
