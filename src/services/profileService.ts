import api from "./api";

import {
  saveUser,
} from "../utils/storage";


export const getProfile = async () => {
  try {
    const response = await api.get("/user/profile");

    if (response.data.user) {
      await saveUser(response.data.user);
    }

    return response.data;
  } catch (error: any) {
    console.log("Get Profile Error:", error.response?.data || error.message);
    throw error;
  }
};


export const updateProfile = async (data: {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  country?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  profileImage?: string;
}) => {
  try {
    const response = await api.put("/user/profile", data);

    if (response.data.user) {
      await saveUser(response.data.user);
    }

    return response.data;
  } catch (error: any) {
    console.log("Update Profile Error:", error.response?.data || error.message);
    throw error;
  }
};


export const changePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  try {
    // Route: PUT /user/change-password (registered in user.routes.ts)
    const response = await api.put("/user/change-password", data);
    return response.data;
  } catch (error: any) {
    console.log("Change Password Error:", error.response?.data || error.message);
    throw error;
  }
};


export const getUserStats = async () => {
  try {
    // Stats come from the profile endpoint — no separate /user/stats route exists
    const response = await api.get("/user/profile");
    return response.data;
  } catch (error: any) {
    console.log("User Stats Error:", error.response?.data || error.message);
    throw error;
  }
};


export const uploadProfileImage = async (image: any) => {
  try {
    const formData = new FormData();
    formData.append("image", image);

    // Correct route: POST /user/upload-profile
    const response = await api.post(
      "/user/upload-profile",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.log("Profile Image Upload Error:", error.response?.data || error.message);
    throw error;
  }
};


export const deleteAccount = async () => {
  try {
    // Route: DELETE /user/account (registered in user.routes.ts)
    const response = await api.delete("/user/account");
    return response.data;
  } catch (error: any) {
    console.log("Delete Account Error:", error.response?.data || error.message);
    throw error;
  }
};
