/**
 * AuthContext — global authentication state
 *
 * Key addition: `startupDone` flag.
 *
 * Problem: AuthContext resolves the token check (isAuthenticated=true)
 * before SplashScreen ever mounts, so AppNavigator immediately renders
 * AppNavigatorInner and the splash never shows.
 *
 * Solution: AppNavigator always shows AuthNavigator (which starts on
 * Splash) until `startupDone = true`. SplashScreen calls `markStartupDone()`
 * after its progress bar finishes. Only then does AppNavigator swap stacks.
 *
 * This guarantees the branded splash + progress bar runs on EVERY cold start.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getToken, clearStorage } from "../utils/storage";
import { logout as authServiceLogout } from "../services/authService";
import { triggerClearStartupData } from "./StartupContext";

let _forcedSignOutHandler: (() => void) | null = null;

export function triggerForcedSignOut(): void {
  if (_forcedSignOutHandler) {
    _forcedSignOutHandler();
  }
}

interface AuthContextType {
  isAuthenticated:  boolean;
  isAuthLoading:    boolean;
  startupDone:      boolean;          // ← NEW: true once SplashScreen finishes
  signIn:           () => void;
  signOut:          () => Promise<void>;
  markStartupDone:  () => void;       // ← NEW: called by SplashScreen on complete
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated:  false,
  isAuthLoading:    true,
  startupDone:      false,
  signIn:           () => {},
  signOut:          async () => {},
  markStartupDone:  () => {},
  refreshAuthState: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [startupDone,     setStartupDone]     = useState(false);

  const refreshAuthState = useCallback(async () => {
    try {
      const token = await getToken();
      setIsAuthenticated(!!token);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  const signIn = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    setStartupDone(false);
    triggerClearStartupData(); // wipe preloaded data so user A's data never leaks to user B
    try {
      await authServiceLogout();
    } catch {
      await clearStorage().catch(() => {});
    }
    setIsAuthenticated(false);
  }, []);

  // Called by SplashScreen once its progress bar reaches 100%.
  // This is the ONLY trigger that swaps AppNavigator to AppStack.
  const markStartupDone = useCallback(() => {
    setStartupDone(true);
  }, []);

  useEffect(() => {
    _forcedSignOutHandler = () => {
      setIsAuthenticated(false);
      setStartupDone(false);
    };
    return () => { _forcedSignOutHandler = null; };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        startupDone,
        signIn,
        signOut,
        markStartupDone,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
