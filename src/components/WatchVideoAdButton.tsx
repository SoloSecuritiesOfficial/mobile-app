/**
 * WatchVideoAdButton.tsx — SoloSecurities
 *
 * A button the user can tap to voluntarily watch a rewarded video ad.
 *
 * Revenue from watching the ad comes from the SDK's onPaid event —
 * NOT from a fixed amount per view. The actual revenue depends on
 * the AdMob auction for that impression and is reported via the
 * SDK paid event, which is submitted to the backend by the ad components.
 *
 * What this component does:
 *  • Loads a RewardedInterstitialAd on mount
 *  • Shows it when the user taps
 *  • Calls onRewarded() when the user earns the engagement reward
 *    (the EARNED_REWARD event — separate from the PAID revenue event)
 *  • Auto-reloads after close
 *
 * What this component does NOT do:
 *  • Claim any fixed rupee amount per view
 *  • Credit any local balance
 *  • Perform any revenue accounting
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { submitAdRevenueEvent, SdkPaidEvent } from "../services/adRewardService";
import { AD_UNITS } from "../config/adUnits";
import Colors from "../theme/colors";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface Props {
  /** Called when EARNED_REWARD fires (engagement reward, not revenue) */
  onRewarded?: () => void;
  style?   : ViewStyle;
  compact? : boolean;
}

type AdState = "idle" | "loading" | "ready" | "showing" | "error";

export default function WatchVideoAdButton({ onRewarded, style, compact = false }: Props) {
  const [adState, setAdState] = useState<AdState>("idle");
  const adRef      = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadAd = useCallback(() => {
    if (IS_EXPO_GO || !mountedRef.current) return;

    let RewardedInterstitialAd: any;
    let RewardedAdEventType: any;
    let AdEventType: any;
    try {
      const ads              = require("react-native-google-mobile-ads");
      RewardedInterstitialAd = ads.RewardedInterstitialAd;
      RewardedAdEventType    = ads.RewardedAdEventType;
      AdEventType            = ads.AdEventType;
    } catch {
      if (mountedRef.current) setAdState("error");
      return;
    }

    if (!RewardedInterstitialAd) {
      if (mountedRef.current) setAdState("error");
      return;
    }

    if (mountedRef.current) setAdState("loading");

    const ad = RewardedInterstitialAd.createForAdRequest(AD_UNITS.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adRef.current = ad;
      if (mountedRef.current) setAdState("ready");
    });

    // EARNED_REWARD — the user completed watching the ad (engagement reward).
    // This is separate from the AdMob PAID revenue event.
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (mountedRef.current) onRewarded?.();
    });

    // PAID — actual AdMob revenue event. Submit to backend.
    // Cast required: AdEventType.PAID is typed as `undefined` payload by the
    // SDK's generic but the runtime value IS a PaidEvent object.
    ad.addAdEventListener(AdEventType.PAID, (payload: unknown) => {
      const paidEvent = payload as SdkPaidEvent;
      submitAdRevenueEvent(
        paidEvent,
        AD_UNITS.REWARDED,
        "rewarded",
        "watch_video_button",
      ).catch(() => { /* queued for retry */ });
    });

    ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
      adRef.current = null;
      if (mountedRef.current) setAdState("error");
      setTimeout(() => { if (mountedRef.current) loadAd(); }, 60_000);
    });

    ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      adRef.current = null;
      if (mountedRef.current) {
        setAdState("idle");
        setTimeout(() => { if (mountedRef.current) loadAd(); }, 1_000);
      }
    });

    ad.load();
  }, [onRewarded]);

  useEffect(() => { loadAd(); }, [loadAd]);

  const handlePress = () => {
    if (IS_EXPO_GO) {
      Alert.alert("Dev Mode", "Rewarded ads are not available in Expo Go.");
      return;
    }
    if (adState === "loading") {
      Alert.alert("Loading", "Video ad is still loading. Please try again shortly.");
      return;
    }
    if (adState === "error" || !adRef.current) {
      Alert.alert("Not Available", "No video ad is available right now.", [
        { text: "Retry", onPress: loadAd },
        { text: "OK" },
      ]);
      return;
    }
    if (adState === "ready" && adRef.current) {
      setAdState("showing");
      try {
        adRef.current.show();
      } catch {
        setAdState("error");
      }
    }
  };

  const isDisabled = adState === "showing";

  if (compact) {
    return (
      <TouchableOpacity
        style={[s.compactBtn, isDisabled && s.disabled, style]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isDisabled}
      >
        {adState === "loading" ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Text style={s.compactIcon}>📺</Text>
            <Text style={s.compactLabel}>Watch Video Ad</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[s.btn, isDisabled && s.disabled, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={isDisabled}
    >
      <View style={s.iconWrap}>
        <Text style={s.icon}>📺</Text>
      </View>
      <View style={s.textCol}>
        <Text style={s.title}>Watch Video Ad</Text>
        <Text style={s.sub}>Earn revenue share from this impression</Text>
      </View>
      <View style={s.earnBadge}>
        {adState === "loading" ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={s.earnText}>Watch</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B5E20",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 3,
    shadowColor: "#1B5E20",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  disabled: { backgroundColor: "#9E9E9E", elevation: 0, shadowOpacity: 0 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  icon:    { fontSize: 22 },
  textCol: { flex: 1 },
  title:   { color: "#FFF", fontWeight: "800", fontSize: 15 },
  sub:     { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  earnBadge: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
  },
  earnText: { color: "#FFF", fontWeight: "900", fontSize: 13 },

  compactBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#2E7D32", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, gap: 6,
  },
  compactIcon:  { fontSize: 14 },
  compactLabel: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
