import { getToken, clearStorage } from "../utils/storage";
import { API_URL as API_BASE_URL } from "../config/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
};

/**
 * Tagged error class so callers can distinguish auth failures from other errors.
 * Screens should catch this and show a "please log in" message rather than crashing.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Session expired. Please log in again.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Navigate to Login without importing navigationRef at module level.
 * A direct import would create a circular dependency:
 *   apiClient → navigationRef → AppNavigator → (every screen) → apiClient
 * Lazy-requiring inside the function breaks the cycle.
 */
function redirectToLogin() {
  try {
    // require() at call time — not at module evaluation time — breaks the cycle
    const { navigateTo } = require("../navigation/navigationRef");
    navigateTo("Login");
  } catch {
    // Navigator not ready yet or require failed — ignore silently
  }
}

const request = async (endpoint: string, options: RequestOptions = {}) => {
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (response.status === 401) {
      // Token is missing or expired — clear local auth and redirect to Login.
      try { await clearStorage(); } catch { /* ignore */ }
      redirectToLogin();
      throw new UnauthorizedError(data?.message ?? "Session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    throw error;
  }
};

// GET REQUEST
export const apiGet = async (endpoint: string) => {
  return request(endpoint, { method: "GET" });
};

// POST REQUEST
export const apiPost = async (endpoint: string, body: any) => {
  return request(endpoint, { method: "POST", body });
};

// PUT REQUEST
export const apiPut = async (endpoint: string, body: any) => {
  return request(endpoint, { method: "PUT", body });
};

// DELETE REQUEST
export const apiDelete = async (endpoint: string) => {
  return request(endpoint, { method: "DELETE" });
};

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};
