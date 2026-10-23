import { Platform } from "react-native";

/**
 * SoloSecurities API Configuration
 *
 * Uses the deployed Render backend for Android, iOS, and web.
 * EXPO_PUBLIC_API_URL can override the default backend URL.
 */

const DEFAULT_BACKEND_URL =
  "https://backend-api-1-tf7p.onrender.com";

const normalizeBaseUrl = (url: string): string =>
  url.trim().replace(/\/+$/, "");

export const BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_BACKEND_URL
);

/**
 * Backend API prefix.
 * Example: https://backend-api-1-tf7p.onrender.com/api
 */
export const API_URL = `${BASE_URL}/api`;

/**
 * Platform information for any platform-specific API behavior.
 */
export const IS_ANDROID = Platform.OS === "android";
export const IS_IOS = Platform.OS === "ios";
export const IS_WEB = Platform.OS === "web";
