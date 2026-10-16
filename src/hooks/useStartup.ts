/**
 * useStartup.ts — Comprehensive Data Loader
 *
 * Loads ALL available GET endpoints in parallel during splash screen.
 * Progress bar tracks completion of every single API call.
 *
 * This runs:
 *   - On cold start (if user has valid token)
 *   - After successful login
 *
 * Flow:
 *   Phase A: Local init (token, theme, ads)
 *   Phase B: Session validation (fetch profile once)
 *   Phase C: Parallel data load (ALL read-only endpoints)
 *   Phase D: Finish (hide native splash)
 *
 * Each API call gets its own task with individual weight. Progress advances
 * only when calls genuinely complete (success, timeout, or error).
 */

import { useCallback, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SplashScreen from "expo-splash-screen";

import { getToken, getUser } from "../utils/storage";
import { fetchCurrentUser } from "../services/authService";
import { getSecurityDashboard, getCVEUpdates, getLearningModules, getLabs, getBugReports, getCertificates } from "../services/securityService";
import { getNotifications, getUnreadNotificationCount } from "../services/notificationService";
import { getCertificates as getCertsAlt, getCertificateCount } from "../services/certificateService";
import { getJobs } from "../services/jobsService";
import { getQuizzes } from "../services/quizService";
import { getConversations, getUnreadCount as getChatUnreadCount } from "../services/chatService";
import { getTodaySecurityTip } from "../services/securityTipService";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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
  id: string;
  label: string;
  weight: number;
  required: boolean;
  status: TaskStatus;
  error?: string;
}

// ALL startup tasks - weights sum to 100
const INITIAL_TASKS: StartupTask[] = [
  // Phase A: Local (15%)
  { id: "token", label: "Restoring session…", weight: 5, required: true, status: "pending" },
  { id: "theme", label: "Loading preferences…", weight: 3, required: false, status: "pending" },
  { id: "ads", label: "Initializing services…", weight: 2, required: false, status: "pending" },
  
  // Phase B: Session (5%)
  { id: "session", label: "Validating account…", weight: 5, required: false, status: "pending" },
  
  // Phase C: Data Load (75% — divided equally across all endpoints)
  { id: "dashboard", label: "Loading dashboard…", weight: 4, required: false, status: "pending" },
  { id: "profile", label: "Loading profile…", weight: 3, required: false, status: "pending" },
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
  
  // Phase D: Finish (5%)
  { id: "finish", label: "Finalizing…", weight: 5, required: false, status: "pending" },
];

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStartup(onComplete: (data: StartupData) => void): StartupState {
  const [tasks, setTasks] = useState<StartupTask[]>(INITIAL_TASKS);
  const [isDone, setIsDone] = useState(false);
  const [fatalMsg, setFatalMsg] = useState("");
  const hasRun = useRef(false);
  const startedRef = useRef(false);

  const dataRef = useRef<StartupData>({
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
  });

  const update = useCallback((id: string, patch: Partial<StartupTask>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
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

    // ── Phase A: Local ────────────────────────────────────────────────────────

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
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("ads-timeout")), 4000)),
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
          update("session", { status: "skipped" });
        }
      } catch {
        dataRef.current.isAuthenticated = false;
        update("session", { status: "skipped" });
      }
    } else {
      update("session", { status: "skipped" });
    }

    // ── Phase C: Comprehensive Data Load ──────────────────────────────────────
    // Load ALL available GET endpoints in parallel

    if (dataRef.current.isAuthenticated) {
      // Mark all tasks as running simultaneously
      const dataTaskIds = [
        "dashboard",
        "profile",
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
      ];
      dataTaskIds.forEach(id => update(id, { status: "running" }));

      // Execute ALL API calls in parallel
      const [
        dashResult,
        profileResult,
        certsResult,
        certCountResult,
        notifsResult,
        notifCountResult,
        cvesResult,
        learningResult,
        labsResult,
        bugsResult,
        jobsResult,
        quizzesResult,
        chatsResult,
        chatUnreadResult,
        tipResult,
      ] = await Promise.allSettled([
        withTimeout(getSecurityDashboard(), API_TIMEOUT_MS),
        withTimeout(fetchCurrentUser(), API_TIMEOUT_MS),
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

      // Dashboard
      if (dashResult.status === "fulfilled" && dashResult.value !== null) {
        dataRef.current.dashboard = (dashResult.value as any)?.data ?? dashResult.value;
        update("dashboard", { status: "done" });
      } else {
        update("dashboard", { status: "skipped" });
      }

      // Profile
      if (profileResult.status === "fulfilled" && profileResult.value !== null) {
        dataRef.current.user = profileResult.value;
        update("profile", { status: "done" });
      } else {
        update("profile", { status: "skipped" });
      }

      // Certificates
      if (certsResult.status === "fulfilled" && certsResult.value !== null) {
        dataRef.current.certificates = (certsResult.value as any)?.data ?? (certsResult.value as any)?.certificates ?? [];
        update("certs", { status: "done" });
      } else {
        update("certs", { status: "skipped" });
      }

      // Certificate Count
      if (certCountResult.status === "fulfilled" && certCountResult.value !== null) {
        dataRef.current.certificateCount = (certCountResult.value as any)?.data?.count ?? (certCountResult.value as any)?.count ?? 0;
        update("certCount", { status: "done" });
      } else {
        update("certCount", { status: "skipped" });
      }

      // Notifications
      if (notifsResult.status === "fulfilled" && notifsResult.value !== null) {
        dataRef.current.notifications = (notifsResult.value as any)?.data ?? (notifsResult.value as any)?.notifications ?? [];
        update("notifications", { status: "done" });
      } else {
        update("notifications", { status: "skipped" });
      }

      // Notification Count
      if (notifCountResult.status === "fulfilled" && notifCountResult.value !== null) {
        dataRef.current.notificationCount = (notifCountResult.value as any)?.data?.count ?? (notifCountResult.value as any)?.count ?? 0;
        update("notifCount", { status: "done" });
      } else {
        update("notifCount", { status: "skipped" });
      }

      // CVEs
      if (cvesResult.status === "fulfilled" && cvesResult.value !== null) {
        dataRef.current.cves = (cvesResult.value as any)?.data ?? [];
        update("cves", { status: "done" });
      } else {
        update("cves", { status: "skipped" });
      }

      // Learning Modules
      if (learningResult.status === "fulfilled" && learningResult.value !== null) {
        dataRef.current.learningModules = (learningResult.value as any)?.data ?? [];
        update("learning", { status: "done" });
      } else {
        update("learning", { status: "skipped" });
      }

      // Labs
      if (labsResult.status === "fulfilled" && labsResult.value !== null) {
        dataRef.current.labs = (labsResult.value as any)?.data ?? [];
        update("labs", { status: "done" });
      } else {
        update("labs", { status: "skipped" });
      }

      // Bug Reports
      if (bugsResult.status === "fulfilled" && bugsResult.value !== null) {
        dataRef.current.bugReports = (bugsResult.value as any)?.data ?? [];
        update("bugs", { status: "done" });
      } else {
        update("bugs", { status: "skipped" });
      }

      // Jobs
      if (jobsResult.status === "fulfilled" && jobsResult.value !== null) {
        dataRef.current.jobs = (jobsResult.value as any)?.data?.jobs ?? (jobsResult.value as any)?.jobs ?? [];
        update("jobs", { status: "done" });
      } else {
        update("jobs", { status: "skipped" });
      }

      // Quizzes
      if (quizzesResult.status === "fulfilled" && quizzesResult.value !== null) {
        dataRef.current.quizzes = Array.isArray(quizzesResult.value) ? quizzesResult.value : [];
        update("quizzes", { status: "done" });
      } else {
        update("quizzes", { status: "skipped" });
      }

      // Chats
      if (chatsResult.status === "fulfilled" && chatsResult.value !== null) {
        dataRef.current.conversations = (chatsResult.value as any)?.data ?? [];
        update("chats", { status: "done" });
      } else {
        update("chats", { status: "skipped" });
      }

      // Chat Unread Count
      if (chatUnreadResult.status === "fulfilled" && chatUnreadResult.value !== null) {
        dataRef.current.chatUnreadCount = (chatUnreadResult.value as any)?.data?.count ?? (chatUnreadResult.value as any)?.count ?? 0;
        update("chatUnread", { status: "done" });
      } else {
        update("chatUnread", { status: "skipped" });
      }

      // Security Tip
      if (tipResult.status === "fulfilled" && tipResult.value !== null) {
        dataRef.current.securityTip = (tipResult.value as any)?.data ?? tipResult.value;
        update("securityTip", { status: "done" });
      } else {
        update("securityTip", { status: "skipped" });
      }
    } else {
      // Not authenticated — skip all data tasks
      const dataTaskIds = [
        "dashboard",
        "profile",
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
      ];
      dataTaskIds.forEach(id => update(id, { status: "skipped" }));
    }

    // ── Phase D: Finish ───────────────────────────────────────────────────────

    update("finish", { status: "running" });
    try {
      await SplashScreen.hideAsync();
    } catch {
      /* already hidden */
    }
    await new Promise(r => setTimeout(r, 300));
    update("finish", { status: "done" });

    setIsDone(true);
    onComplete({ ...dataRef.current });
  }, [update, onComplete]);

  const retry = useCallback(() => {
    hasRun.current = false;
    run();
  }, [run]);

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
