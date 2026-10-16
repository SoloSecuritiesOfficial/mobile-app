/**
 * useStartup.ts — Startup coordinator
 *
 * Progress bar advances ONLY when tasks genuinely complete or fail.
 * No fake timers. 100% = all work done (success, timeout, or error).
 *
 * Phases:
 *   A  Local init   (0 → 20%)  token + theme + ads SDK
 *   B  Session      (20 → 40%) validate JWT / profile fetch (one call)
 *   C  Backend data (40 → 90%) dashboard + certs + notifs IN PARALLEL
 *   D  Finish       (90 →100%) hide native splash, brief visual pause
 *
 * Phase C runs all three backend calls concurrently (Promise.allSettled)
 * so total wait ≈ max(individual latency) instead of their sum.
 *
 * Timeout: 15 s per call — enough for a free-tier MongoDB cold start.
 * Timed-out tasks are marked "skipped"; the bar still advances and
 * Dashboard refreshes the missing data in the background.
 *
 * Phase B fetches the user profile once. Phase C reuses that result —
 * no duplicate /user/profile calls.
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

const API_TIMEOUT_MS = 15_000;

/** Race a promise against a timeout. Returns null on timeout — never rejects. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race<T | null>([
    p,
    new Promise<null>(res => setTimeout(() => res(null), ms)),
  ]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { id: "token",     label: "Restoring session…",         weight: 10, required: true,  status: "pending" },
  { id: "theme",     label: "Loading preferences…",       weight:  5, required: false, status: "pending" },
  { id: "ads",       label: "Initializing services…",     weight:  5, required: false, status: "pending" },
  { id: "session",   label: "Connecting to server…",      weight: 20, required: false, status: "pending" },
  { id: "dashboard", label: "Loading your dashboard…",    weight: 25, required: false, status: "pending" },
  { id: "certs",     label: "Loading certificates…",      weight: 15, required: false, status: "pending" },
  { id: "notifs",    label: "Checking notifications…",    weight: 15, required: false, status: "pending" },
  { id: "finish",    label: "Almost ready!",              weight:  5, required: false, status: "pending" },
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStartup(
  onComplete: (data: StartupData) => void
): StartupState {
  const [tasks,    setTasks]   = useState<StartupTask[]>(INITIAL_TASKS);
  const [isDone,   setIsDone]  = useState(false);
  const [fatalMsg, setFatalMsg]= useState("");
  const hasRun     = useRef(false);
  const startedRef = useRef(false);

  const dataRef = useRef<StartupData>({
    user: null, dashboard: null,
    certificateCount: 0, notificationCount: 0,
    isAuthenticated: false,
  });

  const update = useCallback((id: string, patch: Partial<StartupTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const progress = tasks.reduce(
    (sum, t) => sum + (t.status === "done" || t.status === "skipped" ? t.weight : 0),
    0
  );

  const currentLabel = (() => {
    const running = tasks.find(t => t.status === "running");
    if (running) return running.label;
    const pending = tasks.find(t => t.status === "pending");
    if (pending) return pending.label;
    return "Ready!";
  })();

  const hasFatalError = tasks.some(t => t.required && t.status === "failed");

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

    // ── Phase A: Local init ───────────────────────────────────────────────────

    // Token + cached user (single SecureStore read for auth state)
    update("token", { status: "running" });
    let hasToken = false;
    try {
      const [token, cached] = await Promise.all([getToken(), getUser()]);
      hasToken = !!token;
      if (cached) dataRef.current.user = cached;
      dataRef.current.isAuthenticated = hasToken;
      update("token", { status: "done" });
    } catch (err: any) {
      update("token", { status: "failed", error: err?.message });
      setFatalMsg("Could not restore your session. Please restart the app.");
      return;
    }

    // Theme warm-up (non-critical)
    update("theme", { status: "running" });
    try {
      const AS = (await import("@react-native-async-storage/async-storage")).default;
      await AS.getItem("@app_theme_dark");
      update("theme", { status: "done" });
    } catch {
      update("theme", { status: "skipped" });
    }

    // Ads SDK (skip in Expo Go, 4 s cap)
    update("ads", { status: "running" });
    if (!IS_EXPO_GO) {
      try {
        const { MobileAds } = await import("react-native-google-mobile-ads");
        await Promise.race([
          MobileAds().initialize(),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("ads-timeout")), 4000)),
        ]);
        update("ads", { status: "done" });
      } catch {
        update("ads", { status: "skipped" }); // ads never block startup
      }
    } else {
      update("ads", { status: "skipped" });
    }

    // ── Phase B: Session validation ───────────────────────────────────────────
    // Fetch the user profile once. This both validates the JWT (the Axios
    // interceptor transparently refreshes an expired token) and provides
    // the user object for Phase C — no duplicate /user/profile call later.

    update("session", { status: "running" });
    if (hasToken) {
      try {
        const user = await withTimeout(fetchCurrentUser(), API_TIMEOUT_MS);
        if (user) {
          dataRef.current.user = user;
          dataRef.current.isAuthenticated = true;
          update("session", { status: "done" });
        } else {
          // Timed out — keep auth state from the local token check.
          // Dashboard will re-fetch the profile in the background.
          update("session", { status: "skipped" });
        }
      } catch {
        // Network error or 401 with no refresh token — treat as logged-out.
        dataRef.current.isAuthenticated = false;
        update("session", { status: "skipped" });
      }
    } else {
      update("session", { status: "skipped" });
    }

    // ── Phase C: Backend data (authenticated only) ────────────────────────────
    // Run dashboard, certs, and notifications IN PARALLEL so total wait ≈
    // max(individual latency) rather than their sum.
    // Non-authenticated: skip all three immediately so bar reaches 90%.

    if (dataRef.current.isAuthenticated) {
      // Mark all three running at the same time so labels show correctly
      update("dashboard", { status: "running" });
      update("certs",     { status: "running" });
      update("notifs",    { status: "running" });

      const [dashResult, certResult, notifResult] = await Promise.allSettled([
        withTimeout(getSecurityDashboard(),       API_TIMEOUT_MS),
        withTimeout(getCertificates(),            API_TIMEOUT_MS),
        withTimeout(getUnreadNotificationCount(), API_TIMEOUT_MS),
      ]);

      // Dashboard
      if (dashResult.status === "fulfilled" && dashResult.value !== null) {
        const d = dashResult.value as any;
        dataRef.current.dashboard = d?.data ?? d ?? null;
        update("dashboard", { status: "done" });
      } else {
        update("dashboard", { status: "skipped" });
      }

      // Certificates
      if (certResult.status === "fulfilled" && certResult.value !== null) {
        const c = certResult.value as any;
        dataRef.current.certificateCount = c?.data?.length ?? c?.length ?? 0;
        update("certs", { status: "done" });
      } else {
        update("certs", { status: "skipped" });
      }

      // Notifications
      if (notifResult.status === "fulfilled" && notifResult.value !== null) {
        const n = notifResult.value as any;
        dataRef.current.notificationCount = n?.data?.count ?? n?.count ?? 0;
        update("notifs", { status: "done" });
      } else {
        update("notifs", { status: "skipped" });
      }
    } else {
      update("dashboard", { status: "skipped" });
      update("certs",     { status: "skipped" });
      update("notifs",    { status: "skipped" });
    }

    // ── Phase D: Finish ───────────────────────────────────────────────────────

    update("finish", { status: "running" });
    try { await SplashScreen.hideAsync(); } catch { /* already hidden */ }
    // Brief pause so the bar visually reaches 90% before snapping to 100%.
    await new Promise(r => setTimeout(r, 300));
    update("finish", { status: "done" });

    setIsDone(true);
    onComplete({ ...dataRef.current });
  }, [update, onComplete]);

  const retry = useCallback(() => {
    hasRun.current = false;
    run();
  }, [run]);

  // Trigger once after first render via microtask (never during render phase).
  if (!startedRef.current) {
    startedRef.current = true;
    Promise.resolve().then(() => { if (!hasRun.current) run(); });
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
