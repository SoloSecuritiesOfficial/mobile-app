/**
 * useStartup.ts — Startup coordinator
 *
 * Drives the splash-screen progress bar with REAL task completion.
 * Each task has an id, label, weight (0–100, weights must sum to 100),
 * and a status. Progress = sum of weights of completed tasks.
 *
 * Phases:
 *   A  Local init   — token read, theme read, ads SDK, push channel   (0  → 35%)
 *   B  Session      — token refresh / validation                       (35 → 60%)
 *   C  Preload data — profile + dashboard in parallel (if authed)      (60 → 90%)
 *   D  Finish       — brief visual completion pause                    (90 →100%)
 *
 * No fake timers. Progress only advances when a task actually finishes.
 * Optional tasks (ads, push) never block progress — they complete or skip.
 */

import { useCallback, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import { getToken, getUser }         from "../utils/storage";
import { isLoggedIn }                from "../services/authService";
import { fetchCurrentUser }          from "../services/authService";
import { getSecurityDashboard }      from "../services/securityService";
import { getUnreadNotificationCount } from "../services/notificationService";
import { getCertificates }           from "../services/certificateService";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─────────────────────────────────────────────────────────────────────────────
// Task definitions
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface StartupTask {
  id:       string;
  label:    string;
  weight:   number;          // contributes this many % to overall progress when done
  required: boolean;         // if true, failure shows retry; if false, skipped silently
  status:   TaskStatus;
  error?:   string;
}

// Weights must sum to 100.
const INITIAL_TASKS: StartupTask[] = [
  { id: "token",     label: "Restoring session…",        weight: 15, required: true,  status: "pending" },
  { id: "theme",     label: "Loading preferences…",      weight: 10, required: false, status: "pending" },
  { id: "ads",       label: "Initializing services…",    weight: 10, required: false, status: "pending" },
  { id: "refresh",   label: "Validating session…",       weight: 25, required: false, status: "pending" },
  { id: "profile",   label: "Loading your profile…",     weight: 15, required: false, status: "pending" },
  { id: "dashboard", label: "Loading your dashboard…",   weight: 15, required: false, status: "pending" },
  { id: "finish",    label: "Almost ready!",             weight: 10, required: false, status: "pending" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Preloaded data shape — passed to Dashboard to avoid refetch
// ─────────────────────────────────────────────────────────────────────────────

export interface StartupData {
  user:              any | null;
  dashboard:         any | null;
  certificateCount:  number;
  notificationCount: number;
  isAuthenticated:   boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface StartupState {
  progress:     number;          // 0–100
  currentLabel: string;
  tasks:        StartupTask[];
  isDone:       boolean;
  hasFatalError:boolean;
  fatalMessage: string;
  data:         StartupData;
  retry:        () => void;
}

export function useStartup(
  onComplete: (data: StartupData) => void
): StartupState {
  const [tasks,    setTasks]   = useState<StartupTask[]>(INITIAL_TASKS);
  const [isDone,   setIsDone]  = useState(false);
  const [fatalMsg, setFatalMsg]= useState("");
  const hasRun = useRef(false);

  // Stable data ref — avoids stale closure issues with setState batching
  const dataRef = useRef<StartupData>({
    user: null, dashboard: null,
    certificateCount: 0, notificationCount: 0,
    isAuthenticated: false,
  });

  // ── helpers ──────────────────────────────────────────────────────────────

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
    const nextPending = tasks.find(t => t.status === "pending");
    if (nextPending) return nextPending.label;
    return "Ready!";
  })();

  const hasFatalError = tasks.some(t => t.required && t.status === "failed");

  // ── run ──────────────────────────────────────────────────────────────────

  const run = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Reset on retry
    setTasks(INITIAL_TASKS);
    setIsDone(false);
    setFatalMsg("");
    dataRef.current = {
      user: null, dashboard: null,
      certificateCount: 0, notificationCount: 0,
      isAuthenticated: false,
    };

    // ── Phase A: Local init ──────────────────────────────────────────────────

    // Task: token
    updateTask("token", { status: "running" });
    let hasToken = false;
    try {
      const token = await getToken();
      hasToken = !!token;
      // Also load cached user from SecureStore as immediate fallback
      const cachedUser = await getUser();
      if (cachedUser) dataRef.current.user = cachedUser;
      dataRef.current.isAuthenticated = hasToken;
      updateTask("token", { status: "done" });
    } catch (err: any) {
      updateTask("token", { status: "failed", error: err?.message });
      setFatalMsg("Could not restore your session. Please restart the app.");
      return;
    }

    // Task: theme — always succeeds (AsyncStorage read, non-critical)
    updateTask("theme", { status: "running" });
    try {
      const { AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.getItem("@app_theme_dark"); // warm the AsyncStorage cache
      updateTask("theme", { status: "done" });
    } catch {
      updateTask("theme", { status: "skipped" });
    }

    // Task: ads — non-blocking, skip in Expo Go
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
        updateTask("ads", { status: "skipped" }); // never block startup for ads
      }
    } else {
      updateTask("ads", { status: "skipped" });
    }

    // ── Phase B: Session validation ──────────────────────────────────────────

    updateTask("refresh", { status: "running" });
    if (hasToken) {
      try {
        // Make a lightweight profile call — if the token is expired, the Axios
        // interceptor will transparently refresh it. If refresh fails, the
        // interceptor calls triggerForcedSignOut() and we treat as logged-out.
        const user = await fetchCurrentUser();
        if (user) {
          dataRef.current.user          = user;
          dataRef.current.isAuthenticated = true;
        }
        updateTask("refresh", { status: "done" });
      } catch {
        // Session invalid / network failure — treat as logged-out, not fatal
        dataRef.current.isAuthenticated = false;
        updateTask("refresh", { status: "skipped" });
      }
    } else {
      updateTask("refresh", { status: "skipped" });
    }

    // ── Phase C: Preload data (only if authenticated) ────────────────────────

    if (dataRef.current.isAuthenticated) {
      // Profile + dashboard in parallel
      updateTask("profile", { status: "running" });
      updateTask("dashboard", { status: "running" });

      const [profileResult, dashResult, certResult, notifResult] =
        await Promise.allSettled([
          fetchCurrentUser(),
          getSecurityDashboard(),
          getCertificates(),
          getUnreadNotificationCount(),
        ]);

      if (profileResult.status === "fulfilled" && profileResult.value) {
        dataRef.current.user = profileResult.value;
        updateTask("profile", { status: "done" });
      } else {
        updateTask("profile", { status: "skipped" }); // cached user still available
      }

      if (dashResult.status === "fulfilled") {
        dataRef.current.dashboard =
          dashResult.value?.data ?? dashResult.value ?? null;
        updateTask("dashboard", { status: "done" });
      } else {
        updateTask("dashboard", { status: "skipped" });
      }

      if (certResult.status === "fulfilled") {
        dataRef.current.certificateCount =
          certResult.value?.data?.length ?? certResult.value?.length ?? 0;
      }

      if (notifResult.status === "fulfilled") {
        dataRef.current.notificationCount =
          notifResult.value?.data?.count ?? notifResult.value?.count ?? 0;
      }
    } else {
      updateTask("profile",   { status: "skipped" });
      updateTask("dashboard", { status: "skipped" });
    }

    // ── Phase D: Finish ──────────────────────────────────────────────────────

    updateTask("finish", { status: "running" });

    // Hide native splash now — custom splash is fully rendered and progress bar
    // is at 90%. This eliminates the white-screen gap.
    try { await SplashScreen.hideAsync(); } catch { /* already hidden */ }

    // Give the progress bar a brief moment to visually reach ~90% before
    // snapping to 100% — purely for UX smoothness, not a fake delay.
    await new Promise(r => setTimeout(r, 250));

    updateTask("finish", { status: "done" });

    setIsDone(true);
    onComplete({ ...dataRef.current });
  }, [updateTask, onComplete]);

  const retry = useCallback(() => {
    hasRun.current = false;
    run();
  }, [run]);

  // Start on first call (the SplashScreen calls this hook once)
  if (!hasRun.current && !isDone && !hasFatalError) {
    // Schedule the run so it fires after the first render
    setTimeout(run, 0);
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
