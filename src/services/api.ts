import axios from "axios";
import { API_URL } from "../config/api";
import { getToken } from "../utils/storage";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.log("Request Interceptor Error:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      console.log(
        "API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.log("Network Error:", error.message);
    } else {
      console.log("Axios Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;