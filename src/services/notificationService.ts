import api from "./api";



export const getNotifications = async()=>{

try{


const response =
await api.get(
"/notifications"
);


return response.data;


}
catch(error:any){


console.log(
"Get Notifications Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getUnreadNotifications = async()=>{

try{


const response =
await api.get(
"/notifications/unread"
);


return response.data;


}
catch(error:any){


console.log(
"Get Unread Notifications Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getNotificationById = async(
id:string
)=>{

try{


const response =
await api.get(
`/notifications/${id}`
);


return response.data;


}
catch(error:any){


console.log(
"Notification Details Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const markNotificationAsRead = async(
id:string
)=>{

try{


const response =
await api.put(
`/notifications/${id}/read`
);


return response.data;


}
catch(error:any){


console.log(
"Mark Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const markAllNotificationsAsRead = async()=>{

try{


const response =
await api.put(
"/notifications/read-all"
);


return response.data;


}
catch(error:any){


console.log(
"Mark All Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const deleteNotification = async(
id:string
)=>{

try{


const response =
await api.delete(
`/notifications/${id}`
);


return response.data;


}
catch(error:any){


console.log(
"Delete Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const deleteAllNotifications = async()=>{

try{


const response =
await api.delete(
"/notifications/all"
);


return response.data;


}
catch(error:any){


console.log(
"Delete All Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getUnreadNotificationCount = async()=>{

try{


const response =
await api.get(
"/notifications/count"
);


return response.data;


}
catch(error:any){


console.log(
"Notification Count Error:",
error.response?.data ||
error.message
);


throw error;


}


};







import { Platform } from "react-native";
import {
  registerForPushNotifications,
  clearBadge,
} from "../utils/pushNotifications";

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
  } catch {
    // Non-critical
  }
};