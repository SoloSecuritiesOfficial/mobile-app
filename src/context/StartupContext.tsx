/**
 * StartupContext.tsx
 *
 * Shares the data preloaded during the splash startup phase with any
 * screen that needs it — primarily DashboardScreen.
 *
 * Why this exists:
 *   During startup, useStartup() already fetches the user profile,
 *   security dashboard, certificate count, and notification count.
 *   Without this context, DashboardScreen would re-fetch all of that
 *   on mount, causing the user to see a spinner again after the
 *   splash finishes.
 *
 * Usage:
 *   1. SplashScreen calls setStartupData(data) when startup completes.
 *   2. DashboardScreen reads useStartupData() — if data is present,
 *      it skips the initial fetch and renders immediately.
 *   3. After the first render, Dashboard continues to use its normal
 *      refresh/poll logic to keep data fresh.
 *
 * Security rules:
 *   - Data is cleared on signOut() (see AuthContext) via clearStartupData().
 *   - Never treat preloaded data as authoritative for security decisions.
 *   - Only user A's data is ever set for user A's session.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { StartupData } from "../hooks/useStartup";

// Module-level clear handler — lets AuthContext.signOut() wipe startup data
// without importing StartupContext (which would be a circular dependency).
let _clearStartupDataHandler: (() => void) | null = null;

export function triggerClearStartupData(): void {
  _clearStartupDataHandler?.();
}

interface StartupContextType {
  startupData:      StartupData | null;
  setStartupData:   (data: StartupData) => void;
  clearStartupData: () => void;
}

const StartupContext = createContext<StartupContextType>({
  startupData:      null,
  setStartupData:   () => {},
  clearStartupData: () => {},
});

export function StartupProvider({ children }: { children: React.ReactNode }) {
  const [startupData, setStartupDataState] = useState<StartupData | null>(null);

  const setStartupData = useCallback((data: StartupData) => {
    setStartupDataState(data);
  }, []);

  const clearStartupData = useCallback(() => {
    setStartupDataState(null);
  }, []);

  // Register handler so AuthContext can clear startup data on signOut
  // without a circular import.
  useEffect(() => {
    _clearStartupDataHandler = clearStartupData;
    return () => { _clearStartupDataHandler = null; };
  }, [clearStartupData]);

  return (
    <StartupContext.Provider value={{ startupData, setStartupData, clearStartupData }}>
      {children}
    </StartupContext.Provider>
  );
}

export function useStartupData(): StartupContextType {
  return useContext(StartupContext);
}
