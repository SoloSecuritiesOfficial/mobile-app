import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { API_URL } from "../config/api";
import {
  getToken,
  saveToken,
  getRefreshToken,
  saveRefreshToken,
  clearStorage,
} from "../utils/storage";
import { navigateTo } from "../navigation/navigationRef";

// ─────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────────────────────────
// Token refresh state
// Only one refresh request runs at a time — concurrent 401s queue
// up and all resolve once the single refresh completes.
// ─────────────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// ─────────────────────────────────────────────────────────────────
// REQUEST interceptor — attach access token
// ─────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // never block the request on storage errors
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────
// RESPONSE interceptor — auto-refresh on 401
//
// Flow:
//   1. Request fails with 401 (TokenExpiredError)
//   2. Interceptor calls POST /auth/refresh with the stored
//      refresh token
//   3. Backend returns a new { token, refreshToken }
//   4. New tokens saved to SecureStore
//   5. Original failed request retried with new access token
//   6. If refresh itself fails (refresh token also expired) →
//      clear all storage and navigate user to Login
// ─────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // ── Only handle 401 (Unauthorized / token expired) ────────────
    // Skip refresh if:
    //   • It's already a retry (avoids infinite loop)
    //   • It's the login endpoint itself (wrong password etc.)
    //   • It's the refresh endpoint (refresh token also expired)
    const url = originalRequest?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register");

    if (status !== 401 || originalRequest._retry || isAuthEndpoint) {
      // Log non-401 errors for debugging
      if (error.response) {
        console.log("====================");
        console.log("API FAILED:");
        console.log("URL:", error.config?.url);
        console.log("METHOD:", error.config?.method?.toUpperCase());
        console.log("STATUS:", error.response.status);
        console.log("DATA:", JSON.stringify(error.response.data));
        console.log("====================");
      } else if (error.request) {
        console.log("NETWORK ERROR:", error.message);
      }
      return Promise.reject(error);
    }

    // ── 401 on a protected endpoint — try to refresh ──────────────
    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token stored — session ended.");
      }

      // Call the refresh endpoint (no auth header needed)
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken  = data.token;
      const newRefreshToken = data.refreshToken;

      // Persist the new tokens
      await saveToken(newAccessToken);
      if (newRefreshToken) await saveRefreshToken(newRefreshToken);

      // Update the default header for future requests
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      // Unblock all queued requests
      processQueue(null, newAccessToken);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Refresh failed — session is truly over
      processQueue(refreshError, null);

      // Clear everything and send user to Login
      await clearStorage();
      navigateTo("Login");

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─────────────────────────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────────────────────────
export const apiGet = async (endpoint: string) => {
  const response = await api.get(endpoint);
  return response.data;
};

export const apiPost = async (endpoint: string, data?: any) => {
  const response = await api.post(endpoint, data);
  return response.data;
};

export const apiPut = async (endpoint: string, data?: any) => {
  const response = await api.put(endpoint, data);
  return response.data;
};

export const apiDelete = async (endpoint: string) => {
  const response = await api.delete(endpoint);
  return response.data;
};

export default api;
