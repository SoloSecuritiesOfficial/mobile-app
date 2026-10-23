/**
 * useStartup.ts — Optimized startup data loader
 *
 * Restores the local session, validates it, and loads the configured startup
 * data requests in parallel. This hook only calls the services listed below;
 * it does not automatically call every GET endpoint in the backend.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import { getToken, getUser } from "../utils/storage";
import { fetchCurrentUser } from "../services/authService";
import {
  getSecurityDashboard,
  getCVEUpdates,
  getLearningModules,
  getLabs,
  getBugReports,
} from "../services/securityService";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "../services/notificationService";
import {
  getCertificates as getCertsAlt,
  getCertificateCount,
} from "../services/certificateService";
import { getJobs } from "../services/jobsService";
import { getQuizzes } from "../services/quizService";
import {
  getConversations,
  getUnreadCount as getChatUnreadCount,
} from "../services/chatService";
import { getTodaySecurityTip } from "../services/securityTipService";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const API_TIMEOUT_MS = 15_000;
const ADS_TIMEOUT_MS = 4_000;
const FINISH_DELAY_MS = 300;

export type TaskStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped";

export interface StartupTask {
  id: string;
  label: string;
  weight: number;
  required: boolean;
  status: TaskStatus;
  error?: string;
}

export interface StartupData {
  user: any | null;
  dashboard: any | null;
  certificates: any[] | null;
  certificateCount: number;
  notifications: any[] | null;
  notificationCount: number;
  cves: any[] | null;
  learningModules: any[] | null;
  labs: any[] | null;
  bugReports: any[] | null;
  jobs: any[] | null;
  quizzes: any[] | null;
  conversations: any[] | null;
  chatUnreadCount: number;
  securityTip: any | null;
  isAuthenticated: boolean;
}

export interface StartupState {
  progress: number;
  currentLabel: string;
  tasks: StartupTask[];
  isDone: boolean;
  hasFatalError: boolean;
  fatalMessage: string;
  data: StartupData;
  retry: () => void;
}

const INITIAL_TASKS: StartupTask[] = [
  // Local initialization
  { id: "token", label: "Restoring session…", weight: 5, required: true, status: "pending" },
  { id: "theme", label: "Loading preferences…", weight: 3, required: false, status: "pending" },
  { id: "ads", label: "Initializing services…", weight: 2, required: false, status: "pending" },

  // Session validation
  { id: "session", label: "Validating account…", weight: 5, required: false, status: "pending" },
  { id: "profile", label: "Loading profile…", weight: 3, required: false, status: "pending" },

  // Configured startup data requests
  { id: "dashboard", label: "Loading dashboard…", weight: 4, required: false, status: "pending" },
  { id: "certs", label: "Loading certificates…", weight: 4, required: false, status: "pending" },
  { id: "certCount", label: "Counting certificates…", weight: 3, required: false, status: "pending" },
  { id: "notifications", label: "Loading notifications…", weight: 4, required: false, status: "pending" },
  { id: "notifCount", label: "Counting notifications…", weight: 3, required: false, status: "pending" },
  { id: "cves", label: "Loading CVE updates…", weight: 4, required: false, status: "pending" },
  { id: "learning", label: "Loading learning modules…", weight: 4, required: false, status: "pending" },
  { id: "labs", label: "Loading security labs…", weight: 4, required: false, status: "pending" },
  { id: "bugs", label: "Loading bug reports…", weight: 4, required: false, status: "pending" },
  { id: "jobs", label: "Loading job listings…", weight: 4, required: false, status: "pending" },
  { id: "quizzes", label: "Loading quizzes…", weight: 4, required: false, status: "pending" },
  { id: "chats", label: "Loading conversations…", weight: 4, required: false, status: "pending" },
  { id: "chatUnread", label: "Checking unread messages…", weight: 3, required: false, status: "pending" },
  { id: "securityTip", label: "Loading security tip…", weight: 3, required: false, status: "pending" },

  // Finish
  { id: "finish", label: "Finalizing…", weight: 5, required: false, status: "pending" },
];

const DATA_TASK_IDS = [
  "dashboard",
  "certs",
  "certCount",
  "notifications",
  "notifCount",
  "cves",
  "learning",
  "labs",
  "bugs",
  "jobs",
  "quizzes",
  "chats",
  "chatUnread",
  "securityTip",
] as const;

function createEmptyStartupData(): StartupData {
  return {
    user: null,
    dashboard: null,
    certificates: null,
    certificateCount: 0,
    notifications: null,
    notificationCount: 0,
    cves: null,
    learningModules: null,
    labs: null,
    bugReports: null,
    jobs: null,
    quizzes: null,
    conversations: null,
    chatUnreadCount: 0,
    securityTip: null,
    isAuthenticated: false,
  };
}

/**
 * Resolves to null on timeout. The underlying request is not cancelled, so
 * service-level cancellation should be added separately if the API client
 * supports AbortSignal or Axios cancellation.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise<T | null>((resolve, reject) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Request failed";
}

function unwrapData(value: any): any {
  return value?.data ?? value;
}

function extractArray(value: any, keys: string[] = []): any[] {
  const candidates = [
    value,
    value?.data,
    value?.items,
    value?.data?.items,
    ...keys.map(key => value?.[key]),
    ...keys.map(key => value?.data?.[key]),
  ];

  return candidates.find(Array.isArray) ?? [];
}

function extractCount(value: any): number | null {
  const candidates = [
    value?.data?.count,
    value?.count,
    value?.data?.total,
    value?.total,
  ];

  const count = candidates.find(
    candidate => typeof candidate === "number" && Number.isFinite(candidate),
  );

  return typeof count === "number" ? Math.max(0, count) : null;
}

function isSettledSuccessfully<T>(
  result: PromiseSettledResult<T | null>,
): result is PromiseFulfilledResult<T | null> {
  return result.status === "fulfilled";
}

export function useStartup(
  onComplete: (data: StartupData) => void,
): StartupState {
  const [tasks, setTasks] = useState<StartupTask[]>(() =>
    INITIAL_TASKS.map(task => ({ ...task })),
  );
  const [isDone, setIsDone] = useState(false);
  const [fatalMsg, setFatalMsg] = useState("");

  const hasRun = useRef(false);
  const dataRef = useRef<StartupData>(createEmptyStartupData());
  const onCompleteRef = useRef(onComplete);

  // Keep the latest callback without restarting the startup process.
  onCompleteRef.current = onComplete;

  const update = useCallback(
    (id: string, patch: Partial<StartupTask>) => {
      setTasks(previous =>
        previous.map(task =>
          task.id === id ? { ...task, ...patch } : task,
        ),
      );
    },
    [],
  );

  const totalWeight = INITIAL_TASKS.reduce(
    (sum, task) => sum + task.weight,
    0,
  );

  // Count failed tasks as completed work so the progress indicator does not
  // remain stuck when an optional API fails.
  const completedWeight = tasks.reduce(
    (sum, task) =>
      sum +
      (task.status === "done" ||
      task.status === "skipped" ||
      task.status === "failed"
        ? task.weight
        : 0),
    0,
  );

  const progress =
    totalWeight > 0
      ? Math.min(100, Math.round((completedWeight / totalWeight) * 100))
      : 0;

  const currentLabel = (() => {
    const runningTask = tasks.find(task => task.status === "running");
    if (runningTask) return runningTask.label;

    const pendingTask = tasks.find(task => task.status === "pending");
    if (pendingTask) return pendingTask.label;

    return isDone ? "Ready!" : "Startup needs attention";
  })();

  const hasFatalError = tasks.some(
    task => task.required && task.status === "failed",
  );

  const run = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;

    setTasks(INITIAL_TASKS.map(task => ({ ...task })));
    setIsDone(false);
    setFatalMsg("");
    dataRef.current = createEmptyStartupData();

    // Phase A: restore the local session.
    update("token", { status: "running" });

    let hasToken = false;

    try {
      const [token, cachedUser] = await Promise.all([getToken(), getUser()]);
      hasToken = Boolean(token);

      if (cachedUser) dataRef.current.user = cachedUser;

      dataRef.current.isAuthenticated = hasToken;
      update("token", { status: "done" });
    } catch (error) {
      update("token", {
        status: "failed",
        error: errorMessage(error),
      });
      setFatalMsg("Could not restore your session. Please retry.");
      hasRun.current = false;
      return;
    }

    // Theme preference is local data, not a backend API call.
    update("theme", { status: "running" });

    try {
      const asyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await asyncStorage.getItem("@app_theme_dark");
      update("theme", { status: "done" });
    } catch (error) {
      update("theme", {
        status: "skipped",
        error: errorMessage(error),
      });
    }

    // Ads initialization is skipped in Expo Go.
    update("ads", { status: "running" });

    if (IS_EXPO_GO) {
      update("ads", { status: "skipped" });
    } else {
      try {
        const { MobileAds } = await import("react-native-google-mobile-ads");
        const result = await withTimeout(
          MobileAds().initialize(),
          ADS_TIMEOUT_MS,
        );

        update(
          "ads",
          result === null
            ? { status: "skipped", error: "Ads initialization timed out" }
            : { status: "done" },
        );
      } catch (error) {
        update("ads", {
          status: "skipped",
          error: errorMessage(error),
        });
      }
    }

    // Phase B: validate the session and fetch the profile only once.
    update("session", { status: "running" });

    if (hasToken) {
      try {
        const user = await withTimeout(
          fetchCurrentUser(),
          API_TIMEOUT_MS,
        );

        if (user !== null) {
          dataRef.current.user = user;
          dataRef.current.isAuthenticated = true;
          update("session", { status: "done" });
          update("profile", { status: "done" });
        } else {
          // A timeout means the session could not be validated. Avoid sending
          // all authenticated startup requests with an unverified session.
          dataRef.current.isAuthenticated = false;
          update("session", {
            status: "failed",
            error: `Session validation timed out after ${API_TIMEOUT_MS} ms`,
          });
          update("profile", { status: "skipped" });
        }
      } catch (error) {
        dataRef.current.isAuthenticated = false;
        update("session", {
          status: "failed",
          error: errorMessage(error),
        });
        update("profile", { status: "skipped" });
      }
    } else {
      update("session", { status: "skipped" });
      update("profile", { status: "skipped" });
    }

    // Phase C: call only the configured startup services, in parallel.
    // This is not an automatic call to every backend GET endpoint.
    if (dataRef.current.isAuthenticated) {
      DATA_TASK_IDS.forEach(id => update(id, { status: "running" }));

      const results = await Promise.allSettled([
        withTimeout(getSecurityDashboard(), API_TIMEOUT_MS),
        withTimeout(getCertsAlt(), API_TIMEOUT_MS),
        withTimeout(getCertificateCount(), API_TIMEOUT_MS),
        withTimeout(getNotifications(), API_TIMEOUT_MS),
        withTimeout(getUnreadNotificationCount(), API_TIMEOUT_MS),
        withTimeout(getCVEUpdates(), API_TIMEOUT_MS),
        withTimeout(getLearningModules(), API_TIMEOUT_MS),
        withTimeout(getLabs(), API_TIMEOUT_MS),
        withTimeout(getBugReports(), API_TIMEOUT_MS),
        withTimeout(getJobs(), API_TIMEOUT_MS),
        withTimeout(getQuizzes(), API_TIMEOUT_MS),
        withTimeout(getConversations(), API_TIMEOUT_MS),
        withTimeout(getChatUnreadCount(), API_TIMEOUT_MS),
        withTimeout(getTodaySecurityTip(), API_TIMEOUT_MS),
      ]);

      const [
        dashboardResult,
        certificatesResult,
        certificateCountResult,
        notificationsResult,
        notificationCountResult,
        cvesResult,
        learningResult,
        labsResult,
        bugsResult,
        jobsResult,
        quizzesResult,
        conversationsResult,
        chatUnreadResult,
        securityTipResult,
      ] = results;

      const applyResult = <T,>(
        id: string,
        result: PromiseSettledResult<T | null>,
        assign: (value: T) => void,
      ) => {
        if (result.status === "rejected") {
          update(id, {
            status: "failed",
            error: errorMessage(result.reason),
          });
          return;
        }

        if (result.value === null) {
          update(id, {
            status: "skipped",
            error: `Request timed out after ${API_TIMEOUT_MS} ms`,
          });
          return;
        }

        try {
          assign(result.value);
          update(id, { status: "done" });
        } catch (error) {
          update(id, {
            status: "failed",
            error: errorMessage(error),
          });
        }
      };

      applyResult("dashboard", dashboardResult, value => {
        dataRef.current.dashboard = unwrapData(value);
      });

      applyResult("certs", certificatesResult, value => {
        dataRef.current.certificates = extractArray(value, [
          "certificates",
          "items",
        ]);
      });

      // If the count endpoint fails (for example, the backend returns
      // "Invalid certificate id"), fall back to the loaded list count when
      // that list is available. This protects the UI, but the backend route
      // still needs to be fixed separately.
      if (
        isSettledSuccessfully(certificateCountResult) &&
        certificateCountResult.value !== null
      ) {
        const count = extractCount(certificateCountResult.value);

        if (count !== null) {
          dataRef.current.certificateCount = count;
          update("certCount", { status: "done" });
        } else if (dataRef.current.certificates !== null) {
          dataRef.current.certificateCount =
            dataRef.current.certificates.length;
          update("certCount", {
            status: "done",
            error: "Count was derived from the loaded certificate list.",
          });
        } else {
          update("certCount", {
            status: "failed",
            error: "Certificate count response did not contain a valid count.",
          });
        }
      } else if (dataRef.current.certificates !== null) {
        dataRef.current.certificateCount =
          dataRef.current.certificates.length;
        update("certCount", {
          status: "done",
          error: "Count endpoint unavailable; used the loaded certificate list.",
        });
      } else if (certificateCountResult.status === "rejected") {
        update("certCount", {
          status: "failed",
          error: errorMessage(certificateCountResult.reason),
        });
      } else {
        update("certCount", {
          status: "skipped",
          error: `Request timed out after ${API_TIMEOUT_MS} ms`,
        });
      }

      applyResult("notifications", notificationsResult, value => {
        dataRef.current.notifications = extractArray(value, [
          "notifications",
          "items",
        ]);
      });

      applyResult("notifCount", notificationCountResult, value => {
        dataRef.current.notificationCount = extractCount(value) ?? 0;
      });

      applyResult("cves", cvesResult, value => {
        dataRef.current.cves = extractArray(value, ["cves", "items"]);
      });

      applyResult("learning", learningResult, value => {
        dataRef.current.learningModules = extractArray(value, [
          "modules",
          "learningModules",
          "items",
        ]);
      });

      applyResult("labs", labsResult, value => {
        dataRef.current.labs = extractArray(value, ["labs", "items"]);
      });

      applyResult("bugs", bugsResult, value => {
        dataRef.current.bugReports = extractArray(value, [
          "bugReports",
          "reports",
          "items",
        ]);
      });

      applyResult("jobs", jobsResult, value => {
        dataRef.current.jobs = extractArray(value, ["jobs", "items"]);
      });

      applyResult("quizzes", quizzesResult, value => {
        dataRef.current.quizzes = extractArray(value, ["quizzes", "items"]);
      });

      applyResult("chats", conversationsResult, value => {
        dataRef.current.conversations = extractArray(value, [
          "conversations",
          "items",
        ]);
      });

      applyResult("chatUnread", chatUnreadResult, value => {
        dataRef.current.chatUnreadCount = extractCount(value) ?? 0;
      });

      applyResult("securityTip", securityTipResult, value => {
        dataRef.current.securityTip = unwrapData(value);
      });
    } else {
      // No validated session: do not call protected endpoints.
      DATA_TASK_IDS.forEach(id =>
        update(id, {
          status: "skipped",
          error: "Skipped because the session is not authenticated.",
        }),
      );
    }

    // Phase D: finish and notify the app.
    update("finish", { status: "running" });

    try {
      await SplashScreen.hideAsync();
    } catch {
      // The native splash may already be hidden.
    }

    await new Promise<void>(resolve =>
      setTimeout(resolve, FINISH_DELAY_MS),
    );

    update("finish", { status: "done" });
    setIsDone(true);
    onCompleteRef.current({ ...dataRef.current });
  }, [update]);

  useEffect(() => {
    void run();
  }, [run]);

  const retry = useCallback(() => {
    if (hasRun.current) {
      hasRun.current = false;
    }
    void run();
  }, [run]);

  return {
    progress,
    currentLabel,
    tasks,
    isDone,
    hasFatalError,
    fatalMessage: fatalMsg,
    data: dataRef.current,
    retry,
  };
}
