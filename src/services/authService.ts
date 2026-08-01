import api from "./api";

import {
  saveToken,
  saveUser,
  getUser,
  getToken,
  removeToken,
} from "../utils/storage";

/**
 * Register User
 */
export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/register", data);

  if (response.data.token) {
    await saveToken(response.data.token);
  }

  if (response.data.user) {
    await saveUser(response.data.user);
  }

  return response.data;
};

/**
 * Login User
 */
export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", data);

  if (response.data.token) {
    await saveToken(response.data.token);
  }

  if (response.data.user) {
    await saveUser(response.data.user);
  }

  return response.data;
};

/**
 * Get Current User Profile
 */
export const getProfile = async () => {
  const response = await api.get("/user/profile");

  return response.data;
};

/**
 * Refresh Current User
 */
export const fetchCurrentUser = async () => {
  try {
    const response = await api.get("/user/profile");

    if (response.data.success && response.data.user) {
      await saveUser(response.data.user);

      return response.data.user;
    }

    return null;
  } catch (error) {
    console.log("Fetch Profile Error:", error);

    return null;
  }
};

/**
 * Get Cached User
 */
export const getCurrentUser = async () => {
  return await getUser();
};

/**
 * Logout
 */
export const logout = async () => {
  await removeToken();
};

/**
 * Check Login Status
 */
export const isLoggedIn = async () => {
  const token = await getToken();

  return !!token;
};