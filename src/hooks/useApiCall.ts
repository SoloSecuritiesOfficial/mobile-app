import { useState, useCallback } from "react";
import { Alert } from "react-native";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export function useApiCall<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || "An unexpected error occurred",
        code: err.code,
        status: err.status || err.response?.status,
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, data, execute, clearError, setData };
}

export function handleApiError(error: unknown, fallbackMessage = "Something went wrong"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return fallbackMessage;
}

export function showErrorAlert(title: string, message: string) {
  Alert.alert(title, message, [{ text: "OK" }]);
}

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const err = error as any;
  return (
    err.message?.includes("Network") ||
    err.message?.includes("timeout") ||
    err.message?.includes("ECONNREFUSED") ||
    err.status === 0 ||
    err.code === "ERR_NETWORK" ||
    err.code === "ECONNABORTED"
  );
}

export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  const err = error as any;
  return err.status === 401 || err.response?.status === 401;
}