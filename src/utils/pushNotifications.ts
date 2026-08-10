/**
 * pushNotifications.ts — SoloSecurities Mobile App
 * ──────────────────────────────────────────────────
 * Uses NATIVE FCM device tokens (getDevicePushTokenAsync) so the
 * backend can send via Firebase Admin SDK admin.messaging().send().
 *
 * Why NOT getExpoPushTokenAsync?
 *   Expo push tokens (ExponentPushToken[...]) only work with Expo's
 *   own push gateway, which is a relay in front of FCM.
 *   Our backend talks to FCM directly, so we need the raw device token.
 *
 * SDK 53 note:
 *   getDevicePushTokenAsync still works in Expo Go on Android.
 *   iOS physical device requires a development build.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────────
// Configure how notifications look when the app is in the foreground
// ─────────────────────────────────────────────────────────────────
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    } as Notifications.NotificationBehavior),
  });
}

// ─────────────────────────────────────────────────────────────────
// Create Android notification channel (required on Android 8+)
// ─────────────────────────────────────────────────────────────────
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name:             "SoloSecurities",
    importance:       Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       "#C62828",
    sound:            "default",
    enableLights:     true,
    enableVibrate:    true,
    showBadge:        true,
  });
}

// ─────────────────────────────────────────────────────────────────
// Register for push notifications
// Returns the FCM device token, or null on failure.
// ─────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a real device — simulators/emulators have no push token
  if (!Device.isDevice) {
    console.log("[Push] Skipping: not a physical device.");
    return null;
  }

  try {
    await ensureAndroidChannel();

    // 1. Request OS permission
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
      console.log("[Push] Permission denied.");
      return null;
    }

    // 2. Get NATIVE FCM device token (not Expo push token)
    //    This is what admin.messaging().send({ token }) expects.
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken  = tokenData.data as string;

    console.log("[Push] FCM device token obtained:", fcmToken.substring(0, 20) + "...");

    // 3. Register token with our backend
    await api.post("/push/register", {
      token:    fcmToken,
      platform: Platform.OS as "android" | "ios" | "web",
      deviceInfo: {
        model:      Device.modelName    ?? "unknown",
        osVersion:  Device.osVersion    ?? "unknown",
        appVersion: Constants.expoConfig?.version ?? "1.0.0",
      },
    });

    console.log("[Push] Token registered with backend ✅");
    return fcmToken;

  } catch (err: any) {
    console.warn("[Push] Registration failed:", err?.message ?? err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Unregister on logout
// ─────────────────────────────────────────────────────────────────
export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    await api.post("/push/unregister", { token: tokenData.data });
    console.log("[Push] Token unregistered.");
  } catch (err: any) {
    console.warn("[Push] Unregister failed:", err?.message ?? err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Notification listeners — attach at app root
// Returns a cleanup function for useEffect
// ─────────────────────────────────────────────────────────────────
export function addNotificationListeners(opts: {
  onForeground?: (notification: Notifications.Notification) => void;
  onTap?: (response: Notifications.NotificationResponse) => void;
}): () => void {
  const s1 = opts.onForeground
    ? Notifications.addNotificationReceivedListener(opts.onForeground)
    : null;
  const s2 = opts.onTap
    ? Notifications.addNotificationResponseReceivedListener(opts.onTap)
    : null;
  return () => { s1?.remove(); s2?.remove(); };
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
