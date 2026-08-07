import { Platform } from "react-native";

// Live Render production backend
export const RENDER_BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://backend-api-1-tf7p.onrender.com";

// Your computer's Wi-Fi IP for local physical-device testing
// Run `ipconfig` on Windows or `ifconfig` on Mac to find your IP
export const LOCAL_IP = "192.168.1.3";

// Default host resolution for local development
const LOCAL_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"   // Android Emulator → maps to host machine localhost
    : Platform.OS === "web"
    ? "localhost"  // Web browser
    : LOCAL_IP;    // Physical Android/iOS device on same Wi-Fi

// Smart base URL resolution:
// 1. Use EXPO_PUBLIC_API_URL env var if set (production/CI)
// 2. In dev mode use local host
// 3. Fallback to Render production backend
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? `http://${LOCAL_HOST}:5000` : RENDER_BACKEND_URL);

// API base URL
export const API_URL = `${BASE_URL}/api`;