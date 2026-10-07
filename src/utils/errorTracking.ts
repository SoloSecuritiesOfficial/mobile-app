// import * as Sentry from "@sentry/react-native";

export function initErrorTracking() {
  // Initialize Sentry or other error tracking
  if (__DEV__) {
    console.log("Error tracking initialized (dev mode)");
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error("Error captured:", error, context);
  
  // In production, send to Sentry or other service
  if (!__DEV__) {
    // Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>) {
  console.log(`[${level.toUpperCase()}]`, message, context);
  
  if (!__DEV__) {
    // Sentry.captureMessage(message, level, { extra: context });
  }
}

export function setUserContext(user: { id: string; email?: string; username?: string } | null) {
  if (!__DEV__) {
    // Sentry.setUser(user);
  }
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  data?: Record<string, any>;
  level?: "debug" | "info" | "warning" | "error";
}) {
  if (!__DEV__) {
    // Sentry.addBreadcrumb(breadcrumb);
  }
}