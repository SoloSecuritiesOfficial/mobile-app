export interface AppError {
  message: string;
  code?: string;
  status?: number;
  originalError?: Error;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  status?: number;
}

export class AppErrorClass extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly isNetworkError: boolean;
  public readonly isAuthError: boolean;
  public readonly isServerError: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      originalError?: Error;
      isNetworkError?: boolean;
      isAuthError?: boolean;
      isServerError?: boolean;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isAuthError = options.isAuthError ?? false;
    this.isServerError = options.isServerError ?? false;
    this.timestamp = new Date();
    this.context = options.context;

    if (options.originalError) {
      this.stack = options.originalError.stack;
    }
  }
}

export function createAppError(
  error: unknown,
  context?: Record<string, any>
): AppErrorClass {
  if (error instanceof AppErrorClass) {
    return error;
  }

  if (error instanceof Error) {
    const isNetworkError = isNetworkErrorCheck(error);
    const isAuthError = isAuthErrorCheck(error);
    const isServerError = isServerErrorCheck(error);

    return new AppErrorClass(error.message, {
      originalError: error,
      isNetworkError,
      isAuthError,
      isServerError,
      context,
    });
  }

  if (typeof error === "string") {
    return new AppErrorClass(error, { context });
  }

  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message: string; code?: string; status?: number };
    const isNetworkError = isNetworkErrorCheck(err);
    const isAuthError = isAuthErrorCheck(err);
    const isServerError = isServerErrorCheck(err);

    return new AppErrorClass(err.message, {
      code: err.code,
      status: err.status,
      isNetworkError,
      isAuthError,
      isServerError,
      context,
    });
  }

  return new AppErrorClass("An unknown error occurred", { context });
}

export function isNetworkErrorCheck(error: any): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket") ||
    message.includes("fetch") ||
    error.status === 0 ||
    error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.code === "ENOTFOUND" ||
    error.code === "ECONNREFUSED"
  );
}

function isAuthErrorCheck(error: any): boolean {
  if (!error) return false;
  return error.status === 401 || error.response?.status === 401;
}

function isServerErrorCheck(error: any): boolean {
  if (!error) return false;
  const status = error.status ?? error.response?.status;
  return status >= 500 && status < 600;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AppErrorClass) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return fallback;
}

export function logError(
  error: unknown,
  context?: Record<string, any>,
  level: "error" | "warn" | "info" = "error"
): void {
  const appError = createAppError(error, context);
  const logData = {
    message: appError.message,
    code: appError.code,
    status: appError.status,
    isNetworkError: appError.isNetworkError,
    isAuthError: appError.isAuthError,
    isServerError: appError.isServerError,
    timestamp: appError.timestamp.toISOString(),
    context: appError.context,
    stack: appError.stack,
  };

  switch (level) {
    case "error":
      console.error("[ERROR]", JSON.stringify(logData, null, 2));
      break;
    case "warn":
      console.warn("[WARN]", JSON.stringify(logData, null, 2));
      break;
    case "info":
      console.info("[INFO]", JSON.stringify(logData, null, 2));
      break;
  }
}

export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections (works in React Native)
  const globalScope: any = typeof globalThis !== "undefined" ? globalThis : 
                      typeof window !== "undefined" ? window : 
                      {};

  if (typeof globalScope.addEventListener === "function") {
    globalScope.addEventListener("unhandledrejection", (event: any) => {
      console.error("[UNHANDLED REJECTION]", event.reason);
      logError(event.reason, { type: "unhandled_rejection" });
    });

    globalScope.addEventListener("error", (event: any) => {
      console.error("[GLOBAL ERROR]", event.error);
      logError(event.error, { type: "global_error", filename: event.filename, lineno: event.lineno });
    });
  }

  // Handle uncaught exceptions in Node.js-like environments
  if (typeof globalThis !== "undefined" && globalThis.process && typeof globalThis.process.emit === "function") {
    const process = globalThis.process;
    const originalEmit = process.emit;
    process.emit = function (type: string, ...args: any[]) {
      if (type === "uncaughtException") {
        console.error("[UNCAUGHT EXCEPTION]", args[0]);
        logError(args[0], { type: "uncaught_exception" });
      }
      return originalEmit.apply(this, [type, ...args]);
    };
  }
}

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { ...context, functionName: fn.name });
      throw error;
    }
  }) as T;
}

export function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: Record<string, any>
): Promise<T> {
  return fn().catch((error) => {
    logError(error, { ...context, fallback: true }, "warn");
    return fallback;
  });
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = (error) => createAppError(error).isNetworkError,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = Math.random() * 1000;

      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}