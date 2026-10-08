import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────────────────────────
// Namespaced keys — avoids collisions with other libraries that
// also store "token" or "user" in SecureStore.
// ─────────────────────────────────────────────────────────────────
const TOKEN_KEY         = "solosec_auth_token";
const REFRESH_TOKEN_KEY = "solosec_refresh_token";
const USER_KEY          = "solosec_auth_user";
const PUSH_ASKED_KEY    = "solosec_push_asked";

// ─────────────────────────────────────────────────────────────────
// Access token (short-lived JWT)
// ─────────────────────────────────────────────────────────────────
export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// ─────────────────────────────────────────────────────────────────
// Refresh token (long-lived — used to obtain new access tokens)
// ─────────────────────────────────────────────────────────────────
export const saveRefreshToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

// ─────────────────────────────────────────────────────────────────
// User profile object
// ─────────────────────────────────────────────────────────────────
export const saveUser = async (user: any): Promise<void> => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const data = await SecureStore.getItemAsync(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    // Corrupted data — clear it
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

// ─────────────────────────────────────────────────────────────────
// Clear all auth data — call on logout or forced sign-out
// ─────────────────────────────────────────────────────────────────
export const clearStorage = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
};

// ─────────────────────────────────────────────────────────────────
// Push notification permission flag
// ─────────────────────────────────────────────────────────────────
export const hasPushBeenAsked = async (): Promise<boolean> => {
  const val = await SecureStore.getItemAsync(PUSH_ASKED_KEY);
  return val === "true";
};

export const markPushAsked = async (): Promise<void> => {
  await SecureStore.setItemAsync(PUSH_ASKED_KEY, "true");
};
