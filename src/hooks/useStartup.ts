/**
 * useStartup.ts — Startup coordinator
 *
 * Drives the splash-screen progress bar with REAL task completion.
 * Progress only advances when a task actually finishes — never from a timer.
 *
 * Phases:
 *   A  Local init   — token read, theme, ads SDK          (0  → 35%)
 *   B  Session      — validate token / fetch profile      (35 → 60%)
 *   C  Preload data — dashboard + certs + notifs          (60 → 90%)
 *   D  Finish       — hide native splash, navigate        (90 →100%)
 *
 * Phase C has a 5-second timeout per call so a slow/cold free-tier MongoDB
 * server never stalls the bar. If a call times out the task is marked
 * "skipped" and Dashboard loads that data in the background after navigation.
 */

import { useCallback, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import { getToken, getUser }          from "../utils/storage";
import { fetchCurrentUser }           from "../services/authService";
import { getSecurityDashboard }       from "../services/securityService";
import { getUnreadNotificationCount } from "../services/notificationService";
import { getCertificates }            from "../services/certificateService";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Race a promise against a timeout.
 * Returns null when the timeout fires first — never rejects.
 * This keeps the progress bar moving even when the free MongoDB
 * cold-start takes 5-8 seconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race<T | null>([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

// Max ms to wait for any single Phase C backend call.
const PHASE_C_MS = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface StartupTask {
  id:       string;
  label:    string;
  weight:   number;
  required: boolean;
  status:   TaskStatus;
  error?:   string;
}

// Weights must sum to 100.
const INITIAL_TASKS: StartupTask[] = [
  { id: "token",     label: "Restoring session…",      weight: 15, required: true,  status: "pending" },
  { id: "theme",     label: "Loading preferences…",    weight: 10, required: false, status: "pending" },
  { id: "ads",       label: "Initializing services…",  weight: 10, required: false, status: "pending" },
  { id: "refresh",   label: "Validating session…",     weight: 25, required: false, status: "pending" },
  { id: "profile",   label: "Loading your profile…",   weight: 15, required: false, status: "pending" },
  { id: "dashboard", label: "Loading your dashboard…", weight: 15, required: false, status: "pending" },
  { id: "finish",    label: "Almost ready!",           weight: 10, required: false, status: "pending" },
];

export interface StartupData {
  user:              any | null;
  dashboard:         any | null;
  certificateCount:  number;
  notificationCount: number;
  isAuthenticated:   boolean;
}

export interface StartupState {
  progress:      number;
  currentLabel:  string;
  tasks:         StartupTask[];
  isDone:        boolean;
  hasFatalError: boolean;
  fatalMessage:  string;
  data:          StartupData;
  retry:         () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useStartup(
  onComplete: (data: StartupData) => void
): StartupState {
  const [tasks,    setTasks]    = useState<StartupTask[]>(INITIAL_TASKS);
  const [isDone,   setIsDone]   = useState(false);
  const [fatalMsg, setFatalMsg] = useState("");
  const hasRun    = useRef(false);
  const startedRef = useRef(false);

  const dataRef = useRef<StartupData>({
    user: null, dashboard: null,
    certificateCount: 0, notificationCount: 0,
    isAuthenticated: false,
  });

  const updateTask = useCallback((id: string, patch: Partial<StartupTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const progress = tasks.reduce(
    (sum, t) => sum + (t.status === "done" || t.status === "skipped" ? t.weight : 0),
    0
  );

  const currentLabel = (() => {
    const running = tasks.find(t => t.status === "running");
    if (running) return running.label;
    const next = tasks.find(t => t.status === "pending");
    if (next) return next.label;
    return "Ready!";
  })();

  const hasFatalError = tasks.some(t => t.required && t.status === "failed");

  // ── run ──────────────────────────────────────────────────────────────────

  const run = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;

    setTasks(INITIAL_TASKS);
    setIsDone(false);
    setFatalMsg("");
    dataRef.current = {
      user: null, dashboard: null,
      certificateCount: 0, notificationCount: 0,
      isAuthenticated: false,
    };

    // ── Phase A ──────────────────────────────────────────────────────────────

    // Token
    updateTask("token", { status: "running" });
    let hasToken = false;
    try {
      const token = await getToken();
      hasToken = !!token;
      const cachedUser = await getUser();
      if (cachedUser) dataRef.current.user = cachedUser;
      dataRef.current.isAuthenticated = hasToken;
      updateTask("token", { status: "done" });
    } catch (err: any) {
      updateTask("token", { status: "failed", error: err?.message });
      setFatalMsg("Could not restore your session. Please restart the app.");
      return;
    }

    // Theme (AsyncStorage warm-up)
    updateTask("theme", { status: "running" });
    try {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      await AsyncStorage.getItem("@app_theme_dark");
      updateTask("theme", { status: "done" });
    } catch {
      updateTask("theme", { status: "skipped" });
    }

    // Ads SDK (skip in Expo Go, 3 s cap)
    updateTask("ads", { status: "running" });
    if (!IS_EXPO_GO) {
      try {
        const { MobileAds } = await import("react-native-google-mobile-ads");
        await Promise.race([
          MobileAds().initialize(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
        ]);
        updateTask("ads", { status: "done" });
      } catch {
        updateTask("ads", { status: "skipped" });
      }
    } else {
      updateTask("ads", { status: "skipped" });
    }

    // ── Phase B — Session validation ─────────────────────────────────────────

    updateTask("refresh", { status: "running" });
    if (hasToken) {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          dataRef.current.user = user;
          dataRef.current.isAuthenticated = true;
        }
        updateTask("refresh", { status: "done" });
      } catch {
        dataRef.current.isAuthenticated = false;
        updateTask("refresh", { status: "skipped" });
      }
    } else {
      updateTask("refresh", { status: "skipped" });
    }

    // ── Phase C — Preload data ────────────────────────────────────────────────
    // All calls are raced against PHASE_C_MS (5 s). A free-tier MongoDB cold
    // start can take 5-8 s; we treat a timeout as a skipped task so the bar
    // never stalls. Dashboard will load the data in the background instead.

    if (dataRef.current.isAuthenticated) {
      updateTask("profile",   { status: "running" });
      updateTask("dashboard", { status: "running" });

      const [profileResult, dashResult, certResult, notifResult] =
        await Promise.allSettled([
          withTimeout(fetchCurrentUser(),           PHASE_C_MS),
          withTimeout(getSecurityDashboard(),       PHASE_C_MS),
          withTimeout(getCertificates(),            PHASE_C_MS),
          withTimeout(getUnreadNotificationCount(), PHASE_C_MS),
        ]);

      if (profileResult.status === "fulfilled" && profileResult.value) {
        dataRef.current.user = profileResult.value;
        updateTask("profile", { status: "done" });
      } else {
        updateTask("profile", { status: "skipped" });
      }

      if (dashResult.status === "fulfilled" && dashResult.value !== null) {
        const d = dashResult.value as any;
        dataRef.current.dashboard = d?.data ?? d ?? null;
        updateTask("dashboard", { status: "done" });
      } else {
        updateTask("dashboard", { status: "skipped" });
      }

      if (certResult.status === "fulfilled" && certResult.value !== null) {
        const c = certResult.value as any;
        dataRef.current.certificateCount = c?.data?.length ?? c?.length ?? 0;
      }

      if (notifResult.status === "fulfilled" && notifResult.value !== null) {
        const n = notifResult.value as any;
        dataRef.current.notificationCount = n?.data?.count ?? n?.count ?? 0;
      }
    } else {
      updateTask("profile",   { status: "skipped" });
      updateTask("dashboard", { status: "skipped" });
    }

    // ── Phase D — Finish ─────────────────────────────────────────────────────

    updateTask("finish", { status: "running" });

    // Hide native splash — our custom splash is visible at ~90% progress.
    try { await SplashScreen.hideAsync(); } catch { /* already hidden */ }

    // Brief pause so the bar visually reaches 90% before snapping to 100%.
    await new Promise(r => setTimeout(r, 250));

    updateTask("finish", { status: "done" });
    setIsDone(true);
    onComplete({ ...dataRef.current });
  }, [updateTask, onComplete]);

  const retry = useCallback(() => {
    hasRun.current = false;
    run();
  }, [run]);

  // Trigger on first render via a microtask (never during render phase).
  if (!startedRef.current) {
    startedRef.current = true;
    Promise.resolve().then(() => {
      if (!hasRun.current) run();
    });
  }

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
