/**
 * useStartup.ts — Startup coordinator
 *
 * Progress bar advances ONLY when a task genuinely completes or fails.
 * No fake timers. 100% = all API calls done (success or error).
 *
 * Phases:
 *   A  Local init   (0→30%)  — token, theme, ads SDK
 *   B  Session      (30→50%) — validate token / JWT refresh
 *   C  Backend data (50→90%) — profile, dashboard, certs, notifications
 *   D  Finish       (90→100%)— hide native splash, navigate
 *
 * Timeouts: 15s per Phase C call — enough for free-tier MongoDB cold start.
 * If a backend call times out it is marked "skipped" (bar still advances)
 * and Dashboard loads that data in the background.
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

// 15 s gives free-tier MongoDB enough time to cold-start.
// Bar still advances even if it times out — task becomes "skipped".
const API_TIMEOUT_MS = 15_000;

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

// Weights must sum to 100
const INITIAL_TASKS: StartupTask[] = [
  { id: "token",     label: "Restoring session…",         weight: 10, required: true,  status: "pending" },
  { id: "theme",     label: "Loading preferences…",       weight:  5, required: false, status: "pending" },
  { id: "ads",       label: "Initializing services…",     weight:  5, required: false, status: "pending" },
  { id: "session",   label: "Validating your account…",   weight: 20, required: false, status: "pending" },
  { id: "profile",   label: "Loading your profile…",      weight: 15, required: false, status: "pending" },
  { id: "dashboard", label: "Loading your dashboard…",    weight: 20, required: false, status: "pending" },
  { id: "certs",     label: "Loading certificates…",      weight: 10, required: false, status: "pending" },
  { id: "notifs",    label: "Checking notifications…",    weight: 10, required: false, status: "pending" },
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
  const [tasks,     setTasks]    = useState<StartupTask[]>(INITIAL_TASKS);
  const [isDone,    setIsDone]   = useState(false);
  const [fatalMsg,  setFatalMsg] = useState("");
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
    (s, t) => s + (t.status === "done" || t.status === "skipped" ? t.weight : 0),
    0
  );

  const currentLabel = (() => {
    const r = tasks.find(t => t.status === "running");
    if (r) return r.label;
    const p = tasks.find(t => t.status === "pending");
    if (p) return p.label;
    return "Ready!";
  })();

  const hasFatalError = tasks.some(t => t.required && t.status === "failed");

  // ── Main run ──────────────────────────────────────────────────────────────

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

    // ── Phase A: Local ────────────────────────────────────────────────────────

    update("token", { status: "running" });
    let hasToken = false;
    try {
      const token = await getToken();
      hasToken = !!token;
      const cached = await getUser();
      if (cached) dataRef.current.user = cached;
      dataRef.current.isAuthenticated = hasToken;
      update("token", { status: "done" });
    } catch (err: any) {
      update("token", { status: "failed", error: err?.message });
      setFatalMsg("Could not restore your session. Please restart the app.");
      return;
    }

    update("theme", { status: "running" });
    try {
      const AS = (await import("@react-native-async-storage/async-storage")).default;
      await AS.getItem("@app_theme_dark");
      update("theme", { status: "done" });
    } catch {
      update("theme", { status: "skipped" });
    }

    update("ads", { status: "running" });
    if (!IS_EXPO_GO) {
      try {
        const { MobileAds } = await import("react-native-google-mobile-ads");
        await Promise.race([
          MobileAds().initialize(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
        ]);
        update("ads", { status: "done" });
      } catch {
        update("ads", { status: "skipped" });
      }
    } else {
      update("ads", { status: "skipped" });
    }

    // ── Phase B: Session validation ───────────────────────────────────────────

    update("session", { status: "running" });
    if (hasToken) {
      try {
        const user = await withTimeout(fetchCurrentUser(), API_TIMEOUT_MS);
        if (user) {
          dataRef.current.user = user;
          dataRef.current.isAuthenticated = true;
          update("session", { status: "done" });
        } else {
          // timed out — token might still be valid, keep auth state from token check
          update("session", { status: "skipped" });
        }
      } catch {
        dataRef.current.isAuthenticated = false;
        update("session", { status: "skipped" });
      }
    } else {
      update("session", { status: "skipped" });
    }

    // ── Phase C: Backend data ─────────────────────────────────────────────────
    // Always runs — even for unauthenticated users the tasks mark themselves
    // skipped so the bar advances to 90%.

    if (dataRef.current.isAuthenticated) {
      // Profile
      update("profile", { status: "running" });
      try {
        const user = await withTimeout(fetchCurrentUser(), API_TIMEOUT_MS);
        if (user) { dataRef.current.user = user; update("profile", { status: "done" }); }
        else         update("profile", { status: "skipped" });
      } catch {
        update("profile", { status: "skipped" });
      }

      // Dashboard
      update("dashboard", { status: "running" });
      try {
        const dash = await withTimeout(getSecurityDashboard(), API_TIMEOUT_MS);
        if (dash !== null) {
          dataRef.current.dashboard = (dash as any)?.data ?? dash ?? null;
          update("dashboard", { status: "done" });
        } else {
          update("dashboard", { status: "skipped" });
        }
      } catch {
        update("dashboard", { status: "skipped" });
      }

      // Certificates
      update("certs", { status: "running" });
      try {
        const certs = await withTimeout(getCertificates(), API_TIMEOUT_MS);
        if (certs !== null) {
          dataRef.current.certificateCount = (certs as any)?.data?.length ?? (certs as any)?.length ?? 0;
          update("certs", { status: "done" });
        } else {
          update("certs", { status: "skipped" });
        }
      } catch {
        update("certs", { status: "skipped" });
      }

      // Notifications
      update("notifs", { status: "running" });
      try {
        const notifs = await withTimeout(getUnreadNotificationCount(), API_TIMEOUT_MS);
        if (notifs !== null) {
          dataRef.current.notificationCount = (notifs as any)?.data?.count ?? (notifs as any)?.count ?? 0;
          update("notifs", { status: "done" });
        } else {
          update("notifs", { status: "skipped" });
        }
      } catch {
        update("notifs", { status: "skipped" });
      }
    } else {
      // Not authenticated — skip data tasks, bar still advances to 90%
      update("profile",   { status: "skipped" });
      update("dashboard", { status: "skipped" });
      update("certs",     { status: "skipped" });
      update("notifs",    { status: "skipped" });
    }

    // ── Phase D: Finish ───────────────────────────────────────────────────────

    update("finish", { status: "running" });
    try { await SplashScreen.hideAsync(); } catch { /* already hidden */ }
    // Let the bar visually reach 90% before snapping to 100%
    await new Promise(r => setTimeout(r, 300));
    update("finish", { status: "done" });

    setIsDone(true);
    onComplete({ ...dataRef.current });
  }, [update, onComplete]);

  const retry = useCallback(() => {
    hasRun.current = false;
    run();
  }, [run]);

  // Trigger once via microtask after first render
  if (!startedRef.current) {
    startedRef.current = true;
    Promise.resolve().then(() => { if (!hasRun.current) run(); });
  }

  return { progress, currentLabel, tasks, isDone, hasFatalError, fatalMessage: fatalMsg, data: dataRef.current, retry };
}
