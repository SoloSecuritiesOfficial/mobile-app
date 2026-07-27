import { Platform } from "react-native";

// Set your Render backend domain here once deployed (e.g. "https://solosecurities-api.onrender.com")
export const RENDER_BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "";

// Change this to your computer's Wi-Fi IP address if testing locally on a physical Android/iOS device
export const LOCAL_IP = "192.168.1.7";

// Default host resolution for local development
const LOCAL_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"
    : Platform.OS === "web"
    ? "localhost"
    : LOCAL_IP;

// Uses Render Production URL if provided; otherwise falls back to local dev server
export const BASE_URL = RENDER_BACKEND_URL ? RENDER_BACKEND_URL : `http://${LOCAL_HOST}:5000`;
export const API_URL = `${BASE_URL}/api`;