import { Alert, Platform } from "react-native";

export const triggerAppNotification = (title: string, body: string) => {
  if (Platform.OS === "web") {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    } else {
      Alert.alert(`🔔 ${title}`, body);
    }
  } else {
    Alert.alert(`📢 ${title}`, body, [{ text: "View Details", style: "default" }]);
  }
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === "web" && "Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
  }
};
