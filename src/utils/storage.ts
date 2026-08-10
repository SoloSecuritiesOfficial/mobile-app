import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────────────────────────
// Namespaced keys — avoids collisions with other libraries that
// also store "token" or "user" in SecureStore.
// ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = "solosec_auth_token";
const USER_KEY  = "solosec_auth_user";

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

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

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await removeUser();
};
