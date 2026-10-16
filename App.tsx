import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import Constants from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider }   from "./src/context/ThemeContext";
import { AuthProvider }    from "./src/context/AuthContext";
import { StartupProvider } from "./src/context/StartupContext";
import {
  configureForegroundNotifications,
  addNotificationListeners,
  clearBadge,
  ensureAndroidChannelEarly,
} from "./src/utils/pushNotifications";
import { routeNotification }   from "./src/navigation/notificationRouter";
import { preloadInterstitialAd } from "./src/components/InterstitialAd";
import { initAppOpenAd }         from "./src/components/AppOpenAd";

// Keep the native splash screen visible until useStartup() hides it.
// Previously App.tsx called hideAsync() immediately in useEffect, which
// caused a white-screen gap. The startup coordinator now owns this call
// and hides the native splash only once the custom SplashScreen is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const IS_EXPO_GO = Constants.appOwnership === "expo";

    // Set up the Android notification channel as early as possible.
    if (!IS_EXPO_GO) {
      ensureAndroidChannelEarly();
    }

    // NOTE: SplashScreen.hideAsync() is intentionally NOT called here as the
    // primary path — useStartup() owns it at phase D so the native splash
    // transitions directly to the custom splash with no gap.
    // This fallback fires after 8 seconds ONLY if useStartup never reaches
    // phase D (e.g. the NavigationContainer failed to mount or the hook threw).
    const hideTimeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);

    if (!IS_EXPO_GO) {
      configureForegroundNotifications();
    }

    const init = async () => {
      // Ads SDK init is handled inside useStartup() (phase A, task "ads").
      // Preload overlay ad slots here so they are ready when the user navigates.
      try { preloadInterstitialAd(); } catch { /* non-fatal */ }
      try { initAppOpenAd(false); }    catch { /* non-fatal */ }

      // Push notification re-registration is handled inside DashboardScreen
      // on first mount, where auth state is already known from useStartup.
      // Doing it here would require a redundant SecureStore read.

      // Handle cold-start notification tap.
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
      clearTimeout(hideTimeout);
      cleanup();
      appStateSub.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <StartupProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </StartupProvider>
    </AuthProvider>
  );
}
