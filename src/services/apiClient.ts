import { getToken } from "../utils/storage";
import { API_URL as API_BASE_URL } from "../config/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
};

const request = async (
  endpoint: string,
  options: RequestOptions = {}
) => {
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
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      config
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong"
      );
    }

    return data;
  } catch (error: any) {
    throw error;
  }
};

// GET REQUEST
export const apiGet = async (endpoint: string) => {
  return request(endpoint, {
    method: "GET",
  });
};

// POST REQUEST
export const apiPost = async (endpoint: string, body: any) => {
  return request(endpoint, {
    method: "POST",
    body,
  });
};

// PUT REQUEST
export const apiPut = async (endpoint: string, body: any) => {
  return request(endpoint, {
    method: "PUT",
    body,
  });
};

// DELETE REQUEST
export const apiDelete = async (endpoint: string) => {
  return request(endpoint, {
    method: "DELETE",
  });
};

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};