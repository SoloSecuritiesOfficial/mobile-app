/**
 * pushNotifications.ts
 *
 * SoloSecurities push notification setup.
 *
 * IMPORTANT:
 * - Expo Go:
 *   Remote push registration is skipped on Android.
 *   Local notifications still work.
 *
 * - Development build / production build:
 *   Native FCM/APNs push token is registered with our backend.
 *
 * Backend:
 *   Firebase Admin SDK sends notifications directly through FCM.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import api from "../services/api";

// ─────────────────────────────────────────────────────────────
// Detect Expo Go
// ─────────────────────────────────────────────────────────────

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

// ─────────────────────────────────────────────────────────────
// Configure foreground notifications
// ─────────────────────────────────────────────────────────────

export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// Android notification channel
// ─────────────────────────────────────────────────────────────

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

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

// ─────────────────────────────────────────────────────────────
// Register device for remote push notifications
// ─────────────────────────────────────────────────────────────
//
// IMPORTANT:
// We use getDevicePushTokenAsync() because your backend sends
// directly through Firebase Admin / FCM.
//
// This returns a native FCM token on Android.
//
// DO NOT use getExpoPushTokenAsync() with your current backend.
// ─────────────────────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<
  string | null
> {
  // ───────────────────────────────────────────────────────────
  // Expo Go protection
  // ───────────────────────────────────────────────────────────

  if (isExpoGo()) {
    console.log(
      "[Push] Expo Go detected. Remote push registration skipped."
    );

    console.log(
      "[Push] Install a development build to test FCM push notifications."
    );

    return null;
  }

  // ───────────────────────────────────────────────────────────
  // Physical device check
  // ───────────────────────────────────────────────────────────

  if (!Device.isDevice) {
    console.log(
      "[Push] Remote push requires a physical device."
    );

    return null;
  }

  try {
    // ─────────────────────────────────────────────────────────
    // Android notification channel
    // ─────────────────────────────────────────────────────────

    await ensureAndroidChannel();

    // ─────────────────────────────────────────────────────────
    // Check notification permission
    // ─────────────────────────────────────────────────────────

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "[Push] Notification permission was denied."
      );

      return null;
    }

    console.log(
      "[Push] Notification permission granted."
    );

    // ─────────────────────────────────────────────────────────
    // Get native FCM/APNs token
    // ─────────────────────────────────────────────────────────
    //
    // IMPORTANT:
    // Your backend uses Firebase Admin:
    //
    // admin.messaging().send({
    //   token: token
    // })
    //
    // Therefore we need the native device token.
    // ─────────────────────────────────────────────────────────

    const tokenData =
      await Notifications.getDevicePushTokenAsync();

    const token = String(tokenData.data);

    if (!token) {
      console.warn(
        "[Push] Device push token was empty."
      );

      return null;
    }

    console.log(
      "[Push] Native device push token received."
    );

    console.log(
      "[Push] Token type:",
      tokenData.type
    );

    // ─────────────────────────────────────────────────────────
    // Register token with backend
    // ─────────────────────────────────────────────────────────

    await api.post("/push/register", {
      token,

      platform:
        Platform.OS === "ios"
          ? "ios"
          : "android",

      deviceInfo: {
        model:
          Device.modelName ?? "unknown",

        osVersion:
          Device.osVersion ?? "unknown",

        appVersion:
          Constants.expoConfig?.version ??
          "1.0.0",
      },
    });

    console.log(
      "[Push] Native push token registered with backend."
    );

    return token;
  } catch (error: any) {
    console.warn(
      "[Push] Registration failed:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Unregister push token
// ─────────────────────────────────────────────────────────────

export async function unregisterPushToken(): Promise<void> {
  // Nothing to unregister from Expo Go
  if (isExpoGo()) {
    return;
  }

  if (!Device.isDevice) {
    return;
  }

  try {
    const tokenData =
      await Notifications.getDevicePushTokenAsync();

    const token = String(tokenData.data);

    if (!token) {
      return;
    }

    await api.post("/push/unregister", {
      token,
    });

    console.log(
      "[Push] Push token unregistered."
    );
  } catch (error: any) {
    console.warn(
      "[Push] Unregister failed:",
      error?.response?.data ||
        error?.message ||
        error
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Notification listeners
// ─────────────────────────────────────────────────────────────

export function addNotificationListeners(options: {
  onForeground?: (
    notification: Notifications.Notification
  ) => void;

  onTap?: (
    response: Notifications.NotificationResponse
  ) => void;
}): () => void {
  const foregroundSubscription =
    options.onForeground
      ? Notifications.addNotificationReceivedListener(
          options.onForeground
        )
      : null;

  const responseSubscription =
    options.onTap
      ? Notifications.addNotificationResponseReceivedListener(
          options.onTap
        )
      : null;

  return () => {
    foregroundSubscription?.remove();

    responseSubscription?.remove();
  };
}

// ─────────────────────────────────────────────────────────────
// Badge helpers
// ─────────────────────────────────────────────────────────────

export async function setBadgeCount(
  count: number
): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(
      count
    );
  } catch (error) {
    console.warn(
      "[Push] Failed to set badge:",
      error
    );
  }
}

export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.warn(
      "[Push] Failed to clear badge:",
      error
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Local notification helper
// ─────────────────────────────────────────────────────────────
//
// This DOES work in Expo Go.
// Useful for testing notification UI before making
// a development build.
// ─────────────────────────────────────────────────────────────

export async function showLocalTestNotification(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await ensureAndroidChannel();
    }

    const { status } =
      await Notifications.getPermissionsAsync();

    let finalStatus = status;

    if (status !== "granted") {
      const permission =
        await Notifications.requestPermissionsAsync();

      finalStatus = permission.status;
    }

    if (finalStatus !== "granted") {
      console.warn(
        "[Push] Notification permission denied."
      );

      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 SoloSecurities",
        body: "Local notification test successful!",
        sound: "default",
        data: {
          type: "local_test",
        },
      },

      trigger: null,
    });

    console.log(
      "[Push] Local test notification scheduled."
    );
  } catch (error: any) {
    console.warn(
      "[Push] Local notification failed:",
      error?.message || error
    );
  }
}