/**
 * AuthContext — global authentication state
 *
 * Provides:
 *   isAuthenticated   boolean — true when a valid access token is stored
 *   isAuthLoading     boolean — true during the initial token check on startup
 *   signIn()          call after a successful login/register to update state
 *   signOut()         call on logout to clear state and tokens
 *   refreshAuthState() re-check storage (used after token refresh)
 *
 * C3: AppNavigator consumes this context to conditionally render either the
 * AuthStack (Login/Register/ForgotPassword) or the AppStack (all other
 * screens). This prevents any authenticated-only screen from being reachable
 * without a valid token — even via deep link or direct navigation.navigate().
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

// Module-level handler so api.ts can force a sign-out when token refresh fails
// without needing to import a React context (which can't be used outside components).
let _forcedSignOutHandler: (() => void) | null = null;

export function triggerForcedSignOut(): void {
  if (_forcedSignOutHandler) {
    _forcedSignOutHandler();
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading:   boolean;
  signIn:          () => void;
  signOut:         () => Promise<void>;
  refreshAuthState:() => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated:  false,
  isAuthLoading:    true,
  signIn:           () => {},
  signOut:          async () => {},
  refreshAuthState: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);

  // Read storage on mount to restore session after an app restart.
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

  // Call signIn() immediately after saving tokens on login/register.
  const signIn = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  // Call signOut() on logout. Revokes server session and clears storage.
  const signOut = useCallback(async () => {
    try {
      await authServiceLogout();
    } catch {
      await clearStorage().catch(() => {});
    }
    setIsAuthenticated(false);
  }, []);

  // Register this instance so api.ts can force a sign-out when refresh fails.
  useEffect(() => {
    _forcedSignOutHandler = () => setIsAuthenticated(false);
    return () => { _forcedSignOutHandler = null; };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthLoading, signIn, signOut, refreshAuthState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
