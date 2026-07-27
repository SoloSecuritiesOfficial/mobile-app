import api from "./api";

import {
  saveToken,
  saveUser,
  getUser,
  getToken,
  removeToken,
} from "../utils/storage";

export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/register", data);

  if (response.data.token) {
    await saveToken(response.data.token);
    await saveUser(response.data.user);
  }

  return response.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", data);

  if (response.data.token) {
    await saveToken(response.data.token);
    await saveUser(response.data.user);
  }

  return response.data;
};

export const loginWithGoogle = async (googleAuthPayload: {
  idToken?: string;
  googleUser?: {
    email: string;
    name?: string;
    photoUrl?: string;
  };
}) => {
  const response = await api.post("/auth/google", googleAuthPayload);

  if (response.data.token) {
    await saveToken(response.data.token);
    await saveUser(response.data.user);
  }

  return response.data;
};


export const getProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Download latest profile from backend
|--------------------------------------------------------------------------
*/

export const fetchCurrentUser = async () => {
  try {
    const response = await api.get("/user/profile");

    if (response.data.success) {
      await saveUser(response.data.user);

      return response.data.user;
    }

    return null;
  } catch (error) {
    console.log("Fetch Profile Error:", error);

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Read locally stored user
|--------------------------------------------------------------------------
*/

export const getCurrentUser = async () => {
  return await getUser();
};

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

export const logout = async () => {
  await removeToken();
};

export const isLoggedIn = async () => {
  const token = await getToken();
  return !!token;
};