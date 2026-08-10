/**
 * pushNotifications.ts — SoloSecurities Mobile App
 *
 * CRITICAL: Do NOT use a top-level `import * as Notifications from
 * "expo-notifications"`. In Expo Go SDK 53, the module itself
 * registers an internal push-token listener the moment it is
 * imported, which crashes immediately with:
 *
 *   "Android Push notifications (remote notifications) functionality
 *    provided by expo-notifications was removed from Expo Go…"
 *
 * Solution: lazy-load via require() only when running in a real
 * build (detected with Constants.appOwnership !== "expo").
 * Everything is a no-op in Expo Go — the app works normally,
 * just without push notifications.
 *
 * For full push support use a development build:
 *   npx expo run:android
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────────
// Runtime guard — true when running inside Expo Go
// ─────────────────────────────────────────────────────────────────
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

// ─────────────────────────────────────────────────────────────────
// Lazy loader — returns the expo-notifications module only in
// real builds. Returns null in Expo Go (avoids the import crash).
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNotifications(): any | null {
  if (isExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-notifications");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Configure foreground notification display
// Safe to call anywhere — silently skipped in Expo Go
// ─────────────────────────────────────────────────────────────────
export function configureForegroundNotifications(): void {
  const N = getNotifications();
  if (!N) return;

  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// Create Android notification channel (Android 8+ requirement)
// ─────────────────────────────────────────────────────────────────
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const N = getNotifications();
  if (!N) return;

  await N.setNotificationChannelAsync("default", {
    name:             "SoloSecurities",
    importance:       N.AndroidImportance.MAX,
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
// Returns FCM device token string, or null if unavailable
// ─────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  const N = getNotifications();
  if (!N) {
    console.log("[Push] Expo Go — push registration skipped.");
    return null;
  }

  if (!Device.isDevice) {
    console.log("[Push] Skipping: not a physical device.");
    return null;
  }

  try {
    await ensureAndroidChannel();

    // Request OS permission
    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await N.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission denied.");
      return null;
    }

    // Get native FCM device token
    const tokenData = await N.getDevicePushTokenAsync();
    const fcmToken  = tokenData.data as string;

    console.log("[Push] FCM token:", fcmToken.substring(0, 20) + "...");

    // Register with backend
    await api.post("/push/register", {
      token:    fcmToken,
      platform: Platform.OS,
      deviceInfo: {
        model:      Device.modelName    ?? "unknown",
        osVersion:  Device.osVersion    ?? "unknown",
        appVersion: Constants.expoConfig?.version ?? "1.0.0",
      },
    });

    console.log("[Push] Token registered ✅");
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
  const N = getNotifications();
  if (!N || !Device.isDevice) return;
  try {
    const tokenData = await N.getDevicePushTokenAsync();
    await api.post("/push/unregister", { token: tokenData.data });
    console.log("[Push] Token unregistered.");
  } catch (err: any) {
    console.warn("[Push] Unregister failed:", err?.message ?? err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Notification listeners
// Returns a no-op cleanup function in Expo Go
// ─────────────────────────────────────────────────────────────────
export function addNotificationListeners(opts: {
  onForeground?: (notification: unknown) => void;
  onTap?: (response: unknown) => void;
}): () => void {
  const N = getNotifications();
  if (!N) return () => {};

  const s1 = opts.onForeground
    ? N.addNotificationReceivedListener(opts.onForeground)
    : null;
  const s2 = opts.onTap
    ? N.addNotificationResponseReceivedListener(opts.onTap)
    : null;

  return () => {
    s1?.remove();
    s2?.remove();
  };
}

// ─────────────────────────────────────────────────────────────────
// Badge helpers — silent no-ops in Expo Go
// ─────────────────────────────────────────────────────────────────
export async function setBadgeCount(count: number): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try { await N.setBadgeCountAsync(count); } catch { /* ignore */ }
}

export async function clearBadge(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try { await N.setBadgeCountAsync(0); } catch { /* ignore */ }
}
