import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveUser = async (user: any) => {
  console.log("Saving user:", user);

  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(user)
  );
};

export const getUser = async () => {
  const data = await SecureStore.getItemAsync(USER_KEY);

  console.log("Stored user:", data);

  if (!data) return null;

  return JSON.parse(data);
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await removeUser();
};