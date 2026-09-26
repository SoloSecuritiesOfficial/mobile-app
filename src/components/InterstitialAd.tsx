/**
 * InterstitialAd.tsx — SoloSecurities
 *
 * Singleton that loads a full-screen interstitial and exposes
 * showInterstitialAd(isPremium) for key navigation moments.
 *
 * Crash-safety rules:
 *  • loadNext() is NOT called at module import time. The AdMob native SDK
 *    must be fully initialised before any ad request is made. Calling it at
 *    import time (before the JS bridge is ready) causes a native crash on
 *    cold start. preloadInterstitialAd() is called explicitly from App.tsx
 *    inside useEffect, which runs after the bridge is ready.
 *  • All SDK access is wrapped in try/catch.
 *  • Never blocks navigation — skips silently if ad isn't loaded.
 */

import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let _ad: any  = null;
let _loaded   = false;
let _loading  = false;

function loadNext() {
  if (IS_EXPO_GO) return;

  let InterstitialAd: any, AdEventType: any;
  try {
    const ads      = require("react-native-google-mobile-ads");
    InterstitialAd = ads.InterstitialAd;
    AdEventType    = ads.AdEventType;
  } catch { return; }

  if (_loading) return;
  _loading = true;
  _loaded  = false;

  try {
    const ad = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      _ad = ad; _loaded = true; _loading = false;
    });

    ad.addAdEventListener(AdEventType.ERROR, () => {
      _loading = false; _loaded = false; _ad = null;
      setTimeout(loadNext, 30_000);
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      _ad = null; _loaded = false;
      loadNext();
    });

    ad.load();
  } catch {
    _loading = false;
  }
}

// ─── NOT called at module level — must be called from App.tsx useEffect ──────
export function preloadInterstitialAd(): void {
  loadNext();
}

export async function showInterstitialAd(isPremium?: boolean): Promise<boolean> {
  if (IS_EXPO_GO || isPremium || !_loaded || !_ad) return false;
  try { await _ad.show(); return true; } catch { return false; }
}
