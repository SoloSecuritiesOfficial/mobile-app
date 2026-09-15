/**
 * InterstitialAd.tsx — SoloSecurities
 *
 * Singleton that loads a full-screen interstitial and exposes
 * showInterstitialAd(isPremium) for key navigation moments.
 *
 * Ad unit: "Interstitial" — ca-app-pub-4705207925908028/8366152086
 *
 * Rules:
 *  • Silent no-op in Expo Go
 *  • Silent no-op for premium users
 *  • Never blocks navigation — if ad isn't loaded yet, skips silently
 *  • Auto-reloads after every close
 */

import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let _ad: any     = null;
let _loaded       = false;
let _loading      = false;

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
}

loadNext(); // kick off first load at import time

export async function showInterstitialAd(isPremium?: boolean): Promise<boolean> {
  if (IS_EXPO_GO || isPremium || !_loaded || !_ad) return false;
  try { await _ad.show(); return true; } catch { return false; }
}

export function preloadInterstitialAd(): void { loadNext(); }
