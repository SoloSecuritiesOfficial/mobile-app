/**
 * pushNotifications.ts
 * ─────────────────────
 * Push notification setup for the SoloSecurities mobile app.
 *
 * IMPORTANT — SDK 53 behaviour:
 *   Expo Go no longer supports remote push notifications (FCM).
 *   Token registration is silently skipped when running in Expo Go.
 *   Everything works normally in:
 *     • A development build  (npx expo run:android / npx expo run:ios)
 *     • A production build   (EAS Build)
 *
 *   Foreground notification display and notification listeners still
 *   work in Expo Go (for local notifications). Remote push from the
 *   backend only works in a real build.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────────
// Detect whether we are running inside Expo Go.
// expo-notifications throws at runtime in Expo Go SDK 53+ when
// you try to get a push token.
// ─────────────────────────────────────────────────────────────────
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

// ─────────────────────────────────────────────────────────────────
// Configure foreground notification display.
//
// This controls what happens when a notification arrives while
// the SoloSecurities app is currently open.
//
// Compatible with the newer expo-notifications NotificationBehavior
// which requires shouldShowBanner and shouldShowList.
// ─────────────────────────────────────────────────────────────────
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        // Show notification as a banner/popup at the top of the screen
        shouldShowBanner: true,

        // Keep notification visible in the notification list
        shouldShowList: true,

        // Play the default notification sound
        shouldPlaySound: true,

        // Update the app notification badge
        shouldSetBadge: true,
      };
    },
  });
}
// ─────────────────────────────────────────────────────────────────
// Create the Android notification channel (required on Android 8+).
// ─────────────────────────────────────────────────────────────────
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "SoloSecurities",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#C62828",
    sound: "default",
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}

// ─────────────────────────────────────────────────────────────────
// Register device for remote push notifications.
//
// Returns the Expo push token string on success, null otherwise.
//
// Silently returns null when:
//   • Running in Expo Go (SDK 53+ restriction)
//   • Running on a simulator / emulator
//   • Permission denied by user
// ─────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {

  // Skip in Expo Go — FCM tokens are not supported there in SDK 53+
  if (isExpoGo()) {
    console.log(
      "[Push] Skipping token registration: Expo Go does not support " +
      "remote push notifications in SDK 53+. " +
      "Use a development build (npx expo run:android) for full push support."
    );
    return null;
  }

  // Push tokens also don't work on simulators/emulators
  if (!Device.isDevice) {
    console.log("[Push] Skipping: not a physical device.");
    return null;
  }

  try {
    await ensureAndroidChannel();

    // 1. Check / request OS permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission denied by user.");
      return null;
    }

    // 2. Get Expo Push Token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;
    console.log("[Push] Expo push token:", token);

    // 3. Register token with our backend
    await api.post("/push/register", {
      token,
      platform: Platform.OS as "android" | "ios" | "web",
      deviceInfo: {
        model:      Device.modelName    ?? "unknown",
        osVersion:  Device.osVersion    ?? "unknown",
        appVersion: Constants.expoConfig?.version ?? "1.0.0",
      },
    });

    console.log("[Push] Token registered with backend.");
    return token;

  } catch (err: any) {
    console.warn("[Push] Registration failed:", err?.message ?? err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Unregister token on logout
// ─────────────────────────────────────────────────────────────────
export async function unregisterPushToken(): Promise<void> {
  if (isExpoGo() || !Device.isDevice) return;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await api.post("/push/unregister", { token: tokenData.data });
    console.log("[Push] Token unregistered.");
  } catch (err: any) {
    console.warn("[Push] Unregister failed:", err?.message ?? err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Notification listeners — safe in both Expo Go and real builds.
// Returns a cleanup function for useEffect.
// ─────────────────────────────────────────────────────────────────
export function addNotificationListeners(opts: {
  onForeground?: (notification: Notifications.Notification) => void;
  onTap?: (response: Notifications.NotificationResponse) => void;
}): () => void {
  const sub1 = opts.onForeground
    ? Notifications.addNotificationReceivedListener(opts.onForeground)
    : null;

  const sub2 = opts.onTap
    ? Notifications.addNotificationResponseReceivedListener(opts.onTap)
    : null;

  return () => {
    sub1?.remove();
    sub2?.remove();
  };
}

// ─────────────────────────────────────────────────────────────────
// Badge helpers
// ─────────────────────────────────────────────────────────────────
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
