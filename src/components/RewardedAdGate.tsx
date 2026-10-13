/**
 * RewardedAdGate.tsx — SoloSecurities
 *
 * Button that shows a REWARDED INTERSTITIAL video ad for free users
 * before executing an action (e.g. retake quiz, retry lab).
 *
 * Premium users get the action directly — no ad shown.
 *
 * NOTE: react-native-google-mobile-ads is loaded lazily via require() inside
 * loadAd() — never at module level — so the app does not crash with
 * "TurboModule RNGoogleMobileAdsModule could not be found" when the native
 * binary does not include the SDK (e.g. Expo Go or a misconfigured build).
 *
 * Event type rules for RewardedInterstitialAd:
 *   LOADED        → RewardedAdEventType.LOADED        ('rewarded_loaded')
 *   EARNED_REWARD → RewardedAdEventType.EARNED_REWARD ('rewarded_earned_reward')
 *   ERROR         → AdEventType.ERROR                 ('error')
 *   CLOSED        → AdEventType.CLOSED                ('closed')
 *   PAID          → AdEventType.PAID                  ('paid')
 *
 * Using AdEventType.LOADED on a RewardedInterstitialAd throws at runtime —
 * the SDK explicitly rejects it.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, StyleSheet,
  Text, TouchableOpacity, View, ViewStyle, TextStyle,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import Colors from "../theme/colors";
import { AD_UNITS, isAdUnitReady } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface Props {
  isPremium?: boolean;
  label: string;
  icon?: string;
  onReward: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function RewardedAdGate({
  isPremium, label, icon, onReward, style, textStyle, disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const adRef = useRef<any>(null);

  const loadAd = useCallback(() => {
    if (IS_EXPO_GO || isPremium) return;
    if (!isAdUnitReady(AD_UNITS.REWARDED)) return;

    // Lazy require — never imported at module level so the TurboModule
    // registration error cannot fire during bundle initialisation.
    let RewardedInterstitialAd: any;
    let RewardedAdEventType: any;
    let AdEventType: any;
    try {
      const sdk          = require("react-native-google-mobile-ads");
      RewardedInterstitialAd = sdk.RewardedInterstitialAd;
      RewardedAdEventType    = sdk.RewardedAdEventType;
      AdEventType            = sdk.AdEventType;
    } catch {
      // Native module not available — allow action without ad
      return;
    }

    if (!RewardedInterstitialAd || !RewardedAdEventType || !AdEventType) {
      console.warn("[RewardedAdGate] AdMob SDK not available");
      return;
    }

    setLoading(true);

    const ad = RewardedInterstitialAd.createForAdRequest(AD_UNITS.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });

    // LOADED — must use RewardedAdEventType (SDK throws if you use AdEventType.LOADED)
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adRef.current = ad;
      setLoading(false);
    });

    // EARNED_REWARD — user completed the ad (engagement reward)
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onReward();
    });

    // ERROR — AdEventType (RewardedAdEventType has no ERROR value)
    ad.addAdEventListener(AdEventType.ERROR, () => {
      adRef.current = null;
      setLoading(false);
    });

    // CLOSED — AdEventType (RewardedAdEventType has no CLOSED value)
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      adRef.current = null;
      loadAd();
    });

    ad.load();
  }, [isPremium, onReward]);

  useEffect(() => { loadAd(); }, [loadAd]);

  const handlePress = () => {
    if (disabled || loading) return;

    // Premium or Expo Go: immediate action, no ad
    if (isPremium || IS_EXPO_GO) { onReward(); return; }

    // Unit not configured yet: allow action
    if (!isAdUnitReady(AD_UNITS.REWARDED)) { onReward(); return; }

    if (!adRef.current) {
      Alert.alert(
        "Video Ad Not Ready",
        "The video ad is still loading. You can proceed for free this time.",
        [{ text: "Continue", onPress: onReward }],
      );
      return;
    }

    try {
      adRef.current.show();
      // onReward() fires via EARNED_REWARD listener above
    } catch {
      onReward();
    }
  };

  const unitReady = isAdUnitReady(AD_UNITS.REWARDED);

  return (
    <TouchableOpacity
      style={[s.btn, style, (disabled || loading) && s.disabled]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      {loading && !isPremium ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <>
          {icon ? <Text style={[s.icon, textStyle]}>{icon}</Text> : null}
          <Text style={[s.label, textStyle]}>{label}</Text>
          {!isPremium && !IS_EXPO_GO && unitReady && (
            <View style={s.hint}>
              <Text style={s.hintText}>📺 Watch Video</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, gap: 8,
  },
  disabled: { opacity: 0.5 },
  icon:     { fontSize: 20, color: "#FFF" },
  label:    { color: "#FFF", fontWeight: "800", fontSize: 16 },
  hint: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4,
  },
  hintText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
});
