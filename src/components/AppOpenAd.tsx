/**
 * AppOpenAd.tsx — SoloSecurities
 *
 * Shows an App Open ad on TWO occasions:
 *   1. Cold start — when the user first opens the app (after a 2s delay
 *      so the splash / navigator is fully mounted before the ad appears)
 *   2. Foreground resume — when the user brings the app back from the
 *      background (max once every 4 hours so it isn't spammy)
 *
 * Ad unit: "app" — ca-app-pub-4705207925908028/4468848681
 *
 * Call initAppOpenAd(isPremium) once from App.tsx after startup.
 */

import { AppState, AppStateStatus } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Minimum gap between two App Open ads (4 hours in ms)
const MIN_GAP_MS = 4 * 60 * 60 * 1000;

let _ad: any                   = null;
let _loaded                     = false;
let _loading                    = false;
let _lastShownAt                = 0;
let _appStateSubscription: any  = null;
let _isPremium                  = false;
let _initialised                = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getAdClasses() {
  if (IS_EXPO_GO) return null;
  try {
    const ads = require("react-native-google-mobile-ads");
    return { AppOpenAd: ads.AppOpenAd, AdEventType: ads.AdEventType };
  } catch {
    return null;
  }
}

function loadAd() {
  if (IS_EXPO_GO || _isPremium) return;

  const classes = getAdClasses();
  if (!classes?.AppOpenAd) return;
  if (_loading) return;

  _loading = true;
  _loaded  = false;

  const { AppOpenAd, AdEventType } = classes;

  const ad = AppOpenAd.createForAdRequest(AD_UNITS.APP_OPEN, {
    requestNonPersonalizedAdsOnly: false,
  });

  ad.addAdEventListener(AdEventType.LOADED, () => {
    _ad = ad; _loaded = true; _loading = false;
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {
    _ad = null; _loaded = false; _loading = false;
    // Retry after 30 s — don't spam the ad server
    setTimeout(loadAd, 30_000);
  });

  ad.addAdEventListener(AdEventType.CLOSED, () => {
    _ad = null; _loaded = false;
    // Immediately start loading the next ad for future foreground events
    loadAd();
  });

  ad.load();
}

async function tryShowAd(): Promise<void> {
  if (IS_EXPO_GO || _isPremium) return;
  if (!_loaded || !_ad) return;
  if (Date.now() - _lastShownAt < MIN_GAP_MS) return;

  try {
    _lastShownAt = Date.now();
    await _ad.show();
  } catch { /* silent — never crash for an ad */ }
}

function handleAppStateChange(nextState: AppStateStatus) {
  // Only fire when coming BACK to foreground
  if (nextState === "active") {
    tryShowAd();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the App Open ad system.
 *
 * Call once from App.tsx after determining the user's premium status.
 * Safe to call multiple times — de-duplicates the AppState listener.
 *
 * @param isPremium  Suppress all App Open ads for paying users.
 */
export function initAppOpenAd(isPremium: boolean): void {
  _isPremium = isPremium;

  if (IS_EXPO_GO || isPremium) return;

  // Remove previous AppState listener if re-initialising (e.g. after login)
  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }

  // Start loading the ad immediately
  loadAd();

  // Wire up the foreground-resume listener
  _appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

  // ── Show on cold start ──────────────────────────────────────────────────
  // On first ever call we attempt to show the ad after a short delay so:
  //   • The splash screen has hidden
  //   • The navigator is mounted
  //   • The ad has had a moment to load
  // We wait up to 5 s for the ad to finish loading, then show it.
  if (!_initialised) {
    _initialised = true;
    showOnColdStart();
  }
}

async function showOnColdStart(): Promise<void> {
  // Poll up to 5 s (50 × 100 ms) for the ad to load
  let attempts = 0;
  while (!_loaded && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }

  // Add a small extra buffer so the navigator finishes mounting
  await new Promise(r => setTimeout(r, 500));

  await tryShowAd();
}

/**
 * Call on logout to tear down the AppState listener and reset state.
 */
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
