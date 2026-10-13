import * as SecureStore from "expo-secure-store";
import { logError } from "./errorHandling";

// ─────────────────────────────────────────────────────────────────
// Namespaced keys — avoids collisions with other libraries that
// also store "token" or "user" in SecureStore.
// ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = "solosec_auth_token";
const REFRESH_TOKEN_KEY = "solosec_refresh_token";
const USER_KEY = "solosec_auth_user";
const PUSH_ASKED_KEY = "solosec_push_asked";

async function safeSecureStoreOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, { operation: operationName, key: operationName }, "warn");
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────
// Access token (short-lived JWT)
// ─────────────────────────────────────────────────────────────────
export const saveToken = async (token: string): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.setItemAsync(TOKEN_KEY, token),
    "saveToken",
    undefined
  );
};

export const getToken = async (): Promise<string | null> => {
  return safeSecureStoreOperation(
    () => SecureStore.getItemAsync(TOKEN_KEY),
    "getToken",
    null
  );
};

export const removeToken = async (): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.deleteItemAsync(TOKEN_KEY),
    "removeToken",
    undefined
  );
};

// ─────────────────────────────────────────────────────────────────
// Refresh token (long-lived — used to obtain new access tokens)
// ─────────────────────────────────────────────────────────────────
export const saveRefreshToken = async (token: string): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
    "saveRefreshToken",
    undefined
  );
};

export const getRefreshToken = async (): Promise<string | null> => {
  return safeSecureStoreOperation(
    () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    "getRefreshToken",
    null
  );
};

export const removeRefreshToken = async (): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    "removeRefreshToken",
    undefined
  );
};

// ─────────────────────────────────────────────────────────────────
// User profile object
// ─────────────────────────────────────────────────────────────────
export const saveUser = async (user: any): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    "saveUser",
    undefined
  );
};

export const getUser = async (): Promise<any | null> => {
  const data = await safeSecureStoreOperation(
    () => SecureStore.getItemAsync(USER_KEY),
    "getUser",
    null
  );
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    logError(error, { operation: "parseUser", key: USER_KEY }, "warn");
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.deleteItemAsync(USER_KEY),
    "removeUser",
    undefined
  );
};

// ─────────────────────────────────────────────────────────────────
// Clear all auth data — call on logout or forced sign-out
// ─────────────────────────────────────────────────────────────────
export const clearStorage = async (): Promise<void> => {
  await Promise.all([
    safeSecureStoreOperation(
      () => SecureStore.deleteItemAsync(TOKEN_KEY),
      "clearToken",
      undefined
    ),
    safeSecureStoreOperation(
      () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      "clearRefreshToken",
      undefined
    ),
    safeSecureStoreOperation(
      () => SecureStore.deleteItemAsync(USER_KEY),
      "clearUser",
      undefined
    ),
  ]);
};

// ─────────────────────────────────────────────────────────────────
// Push notification permission flag
// ─────────────────────────────────────────────────────────────────
export const hasPushBeenAsked = async (): Promise<boolean> => {
  const val = await safeSecureStoreOperation(
    () => SecureStore.getItemAsync(PUSH_ASKED_KEY),
    "hasPushBeenAsked",
    null
  );
  return val === "true";
};

export const markPushAsked = async (): Promise<void> => {
  await safeSecureStoreOperation(
    () => SecureStore.setItemAsync(PUSH_ASKED_KEY, "true"),
    "markPushAsked",
    undefined
  );
};
