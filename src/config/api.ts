import { Platform } from "react-native";

// Live Render production backend
export const RENDER_BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://backend-api-1-tf7p.onrender.com";

// Your computer's Wi-Fi IP for local physical-device testing
export const LOCAL_IP = "192.168.1.7";

// Default host resolution for local development
const LOCAL_HOST =
  Platform.OS === "android"
    ? "10.0.2.2" // Android Emulator
    : Platform.OS === "web"
    ? "localhost" // Web / iOS Simulator
    : LOCAL_IP; // Physical Android/iOS device

// Smart base URL resolution: use EXPO_PUBLIC_API_URL if set, or local host in dev mode, fallback to production
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? `http://${LOCAL_HOST}:5000` : RENDER_BACKEND_URL);

// API base URL
export const API_URL = `${BASE_URL}/api`;