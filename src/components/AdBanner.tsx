/**
 * AdBanner.tsx — SoloSecurities
 *
 * Renders an INLINE_ADAPTIVE_BANNER for in-scroll content.
 *
 * Crash-safety rules:
 *  • No hooks from the ads SDK — avoids variable hook-identity crashes.
 *    iOS foreground-reload done with plain useEffect + AppState listener.
 *  • SDK resolved once at module level, never inside render.
 *  • All early returns placed AFTER every hook call.
 *
 * Revenue:
 *  • The onPaid prop receives the real AdMob PaidEvent from the SDK.
 *  • Every paid event is submitted to the backend via submitAdRevenueEvent().
 *  • Revenue is never calculated locally.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import {
  submitAdRevenueEvent,
  SdkPaidEvent,
} from "../services/adRewardService";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─── Resolve SDK once at module load ─────────────────────────────────────────
let BannerAd: any     = null;
let BannerAdSize: any = null;

if (!IS_EXPO_GO) {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd     = ads.BannerAd     ?? null;
    BannerAdSize = ads.BannerAdSize ?? null;
  } catch {
    // Native module not linked — component renders nothing.
  }
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isPremium?    : boolean;
  marginVertical?: number;
  /** Optional placement label for revenue analytics (e.g. "quiz_screen") */
  placement?    : string;
}

export default function AdBanner({
  isPremium      = false,
  marginVertical = 8,
  placement,
}: Props) {
  const bannerRef = useRef<any>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [failed,   setFailed]   = useState(false);

  // iOS: reload ad when app returns to foreground (avoids blank WKWebView)
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active" && bannerRef.current) {
        try { bannerRef.current.load(); } catch { /* ignore */ }
      }
    });
    return () => sub.remove();
  }, []);

  // All hooks above — safe to early-return now.
  if (IS_EXPO_GO)                 return null;
  if (failed)                     return null;
  if (!BannerAd || !BannerAdSize) return null;

  /**
   * onPaid is called by the SDK when this impression generates revenue.
   *
   * SDK PaidEvent shape (react-native-google-mobile-ads v16.3.4):
   *   { currency: string, precision: RevenuePrecisions, value: number }
   *
   * value is in the currency unit (e.g. 0.000042 USD), NOT micro-units.
   * The native bridge already divided by 1_000_000.
   */
  const handlePaid = (sdkEvent: SdkPaidEvent) => {
    // Fire-and-forget — never block the UI on revenue submission.
    submitAdRevenueEvent(
      sdkEvent,
      AD_UNITS.BANNER,
      "banner",
      placement,
    ).catch(() => { /* queued for retry */ });
  };

  return (
    <View style={[s.wrap, { marginVertical }]}>
      {adLoaded && <Text style={s.label}>Advertisement</Text>}
      <BannerAd
        ref={bannerRef}
        unitId={AD_UNITS.BANNER}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => setAdLoaded(true)}
        onPaid={handlePaid}
        onAdFailedToLoad={(err: any) => {
          console.warn("[AdBanner] failed:", err?.message ?? err?.code);
          setFailed(true);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", width: "100%" },
  label: {
    fontSize: 9,
    color: "#BBBBBB",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "500",
  },
});
