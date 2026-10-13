/**
 * AppOpenAd.tsx — SoloSecurities
 *
 * Shows an App Open ad on cold start and foreground resume
 * (max once every 4 hours so it isn't spammy).
 *
 * Crash-safety rules:
 *  • initAppOpenAd() must be called from inside App.tsx useEffect only —
 *    never at module level. The native bridge must be ready first.
 *  • showOnColdStart() waits for the navigator to mount (2 s hard delay)
 *    before attempting to show an ad, preventing a native crash caused by
 *    showing an ad before the React root is attached to a window.
 *  • All ad operations are wrapped in try/catch.
 *  • _initialised guard prevents double-registration of the AppState listener.
 */

import { AppState, AppStateStatus } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const MIN_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours between shows

let _ad: any                  = null;
let _loaded                   = false;
let _loading                  = false;
let _lastShownAt               = 0;
let _appStateSubscription: any = null;
let _isPremium                 = false;
let _initialised               = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getSdkClasses() {
  if (IS_EXPO_GO) return null;
  try {
    const ads = require("react-native-google-mobile-ads");
    return { AppOpenAd: ads.AppOpenAd ?? null, AdEventType: ads.AdEventType ?? null };
  } catch {
    return null;
  }
}

function loadAd() {
  if (IS_EXPO_GO || _isPremium) return;

  const sdk = getSdkClasses();
  if (!sdk?.AppOpenAd || !sdk?.AdEventType) return;
  if (_loading) return;

  _loading = true;
  _loaded  = false;

  try {
    const ad = sdk.AppOpenAd.createForAdRequest(AD_UNITS.APP_OPEN, {
      requestNonPersonalizedAdsOnly: false,
    });

    ad.addAdEventListener(sdk.AdEventType.LOADED, () => {
      _ad = ad; _loaded = true; _loading = false;
    });

    ad.addAdEventListener(sdk.AdEventType.ERROR, () => {
      _ad = null; _loaded = false; _loading = false;
      setTimeout(loadAd, 30_000);
    });

    ad.addAdEventListener(sdk.AdEventType.CLOSED, () => {
      _ad = null; _loaded = false;
      loadAd(); // preload for next foreground event
    });

    ad.load();
  } catch {
    _loading = false;
  }
}

async function tryShowAd(): Promise<void> {
  if (IS_EXPO_GO || _isPremium)          return;
  if (!_loaded || !_ad)                  return;
  if (Date.now() - _lastShownAt < MIN_GAP_MS) return;

  try {
    _lastShownAt = Date.now();
    await _ad.show();
  } catch { /* never crash for an ad */ }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === "active") {
    tryShowAd();
  }
}

// ─── Cold-start show ─────────────────────────────────────────────────────────
// Waits up to 5 s for the ad to load, then adds a hard 2 s delay so the
// React Navigator and its native window are fully attached before the ad
// tries to present itself over them.

async function showOnColdStart(): Promise<void> {
  // Poll up to 5 s (50 × 100 ms)
  let attempts = 0;
  while (!_loaded && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }

  // Hard delay — navigator must be mounted before we show anything
  await new Promise(r => setTimeout(r, 2_000));

  await tryShowAd();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call once from App.tsx inside useEffect (never at module level).
 * Safe to call multiple times — de-duplicates the AppState listener.
 */
export function initAppOpenAd(isPremium: boolean): void {
  _isPremium = isPremium;

  if (IS_EXPO_GO || isPremium) return;

  // Remove stale listener before re-registering
  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }

  loadAd();

  _appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

  if (!_initialised) {
    _initialised = true;
    showOnColdStart();
  }
}

/** Call on logout to tear down the listener and reset all state. */
export function destroyAppOpenAd(): void {
  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }
  _ad          = null;
  _loaded      = false;
  _loading     = false;
  _initialised = false;
}
