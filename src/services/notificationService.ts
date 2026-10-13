import api from "./api";
import { logError, createAppError } from "../utils/errorHandling";
import { Platform } from "react-native";
import {
  registerForPushNotifications,
  clearBadge,
} from "../utils/pushNotifications";


export const getNotifications = async() => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch(error: any) {
    logError(error, { function: "getNotifications", endpoint: "/notifications" });
    throw createAppError(error, { function: "getNotifications", endpoint: "/notifications" });
  }
};


export const getUnreadNotifications = async() => {
  try {
    const response = await api.get("/notifications/unread");
    return response.data;
  } catch(error: any) {
    logError(error, { function: "getUnreadNotifications", endpoint: "/notifications/unread" });
    throw createAppError(error, { function: "getUnreadNotifications", endpoint: "/notifications/unread" });
  }
};


export const getNotificationById = async(id: string) => {
  try {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  } catch(error: any) {
    logError(error, { function: "getNotificationById", endpoint: `/notifications/${id}`, id });
    throw createAppError(error, { function: "getNotificationById", endpoint: `/notifications/${id}`, id });
  }
};


export const markNotificationAsRead = async(id: string) => {
  try {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  } catch(error: any) {
    logError(error, { function: "markNotificationAsRead", endpoint: `/notifications/${id}/read`, id });
    throw createAppError(error, { function: "markNotificationAsRead", endpoint: `/notifications/${id}/read`, id });
  }
};


export const markAllNotificationsAsRead = async() => {
  try {
    const response = await api.put("/notifications/read-all");
    return response.data;
  } catch(error: any) {
    logError(error, { function: "markAllNotificationsAsRead", endpoint: "/notifications/read-all" });
    throw createAppError(error, { function: "markAllNotificationsAsRead", endpoint: "/notifications/read-all" });
  }
};


export const deleteNotification = async(id: string) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch(error: any) {
    logError(error, { function: "deleteNotification", endpoint: `/notifications/${id}`, id });
    throw createAppError(error, { function: "deleteNotification", endpoint: `/notifications/${id}`, id });
  }
};


export const deleteAllNotifications = async() => {
  try {
    const response = await api.delete("/notifications/all");
    return response.data;
  } catch(error: any) {
    logError(error, { function: "deleteAllNotifications", endpoint: "/notifications/all" });
    throw createAppError(error, { function: "deleteAllNotifications", endpoint: "/notifications/all" });
  }
};


export const getUnreadNotificationCount = async() => {
  try {
    const response = await api.get("/notifications/count");
    return response.data;
  } catch(error: any) {
    logError(error, { function: "getUnreadNotificationCount", endpoint: "/notifications/count" });
    throw createAppError(error, { function: "getUnreadNotificationCount", endpoint: "/notifications/count" });
  }
};


// ─────────────────────────────────────────────────────────────────
// Request notification permissions and register the device token
// with the backend. Call this once after a successful login.
// ─────────────────────────────────────────────────────────────────
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const token = await registerForPushNotifications();
  return !!token;
};

// ─────────────────────────────────────────────────────────────────
// Trigger a local in-app notification (still useful for quick alerts
// when the app is open, e.g. a streak reminder).
// For background/killed notifications the backend sends FCM directly.
// ─────────────────────────────────────────────────────────────────
export const triggerAppNotification = (
  _title: string,
  _body: string
): void => {
  // No-op: foreground notifications are now shown via expo-notifications
  // setNotificationHandler in pushNotifications.ts (shouldShowAlert: true).
};

// ─────────────────────────────────────────────────────────────────
// Called on DashboardScreen focus to clear the badge when the user
// opens the app from a notification tap.
// ─────────────────────────────────────────────────────────────────
export const checkAndTriggerDeviceNotifications = async (): Promise<void> => {
  try {
    await clearBadge();
    // ✅ Re-register push token every time dashboard loads (ensures token is fresh)
    await registerForPushNotifications();
    console.log("[checkAndTriggerDeviceNotifications] Push token re-registered ✅");
  } catch (error) {
    logError(error, { function: "checkAndTriggerDeviceNotifications" }, "warn");
    // Non-critical
  }
};