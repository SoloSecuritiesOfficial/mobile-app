import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/api";
import {
  getToken,
  saveToken,
  getRefreshToken,
  saveRefreshToken,
  clearStorage,
} from "../utils/storage";
import { logError, createAppError, isNetworkErrorCheck, retryWithBackoff } from "../utils/errorHandling";

// ─────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────────────────────────
// Retry configuration
// ─────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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
// RESPONSE interceptor — auto-refresh on 401 and retry on network errors
// ─────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    const status = error.response?.status;
    const isNetworkError = isNetworkErrorCheck(error);

    // ── Handle Network Errors with Retry Logic ──────────────────────
    if (isNetworkError && originalRequest && !originalRequest._retry) {
      const retryCount = originalRequest._retryCount ?? 0;
      
      if (retryCount < MAX_RETRIES) {
        originalRequest._retry = true;
        originalRequest._retryCount = retryCount + 1;
        
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        logError(error, { 
          function: "apiRetry", 
          attempt: retryCount + 1, 
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          url: originalRequest.url 
        }, "warn");
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

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
      return Promise.reject(createAppError(error));
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
      try {
        const { navigateTo } = require("../navigation/navigationRef");
        navigateTo("Login");
      } catch {
        // navigation not ready
      }

      return Promise.reject(createAppError(refreshError));

    } finally {
      isRefreshing = false;
    }
  },
);

// ─────────────────────────────────────────────────────────────────
// Convenience helpers with retry logic
// ─────────────────────────────────────────────────────────────────
const withRetry = async <T>(fn: () => Promise<T>, context: string): Promise<T> => {
  return retryWithBackoff(fn, {
    maxRetries: 2,
    baseDelayMs: 500,
    shouldRetry: (error) => isNetworkErrorCheck(createAppError(error)),
    onRetry: (err, attempt) => {
      logError(err, { function: context, retryAttempt: attempt }, "warn");
    },
  });
};

export const apiGet = async (endpoint: string) => {
  return withRetry(() => api.get(endpoint).then(r => r.data), `apiGet:${endpoint}`);
};

export const apiPost = async (endpoint: string, data?: any) => {
  return withRetry(() => api.post(endpoint, data).then(r => r.data), `apiPost:${endpoint}`);
};

export const apiPut = async (endpoint: string, data?: any) => {
  return withRetry(() => api.put(endpoint, data).then(r => r.data), `apiPut:${endpoint}`);
};

export const apiDelete = async (endpoint: string) => {
  return withRetry(() => api.delete(endpoint).then(r => r.data), `apiDelete:${endpoint}`);
};

export default api;
