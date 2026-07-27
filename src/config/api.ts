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

// Use the live Render backend by default
export const BASE_URL =
  RENDER_BACKEND_URL || `http://${LOCAL_HOST}:5000`;

// API base URL
export const API_URL = `${BASE_URL}/api`;