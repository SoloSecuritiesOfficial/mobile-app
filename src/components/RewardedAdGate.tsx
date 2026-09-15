/**
 * RewardedAdGate.tsx — SoloSecurities
 *
 * Button that shows a REWARDED INTERSTITIAL video ad for free users
 * before executing an action (e.g. retake quiz, retry lab).
 *
 * Ad unit: "Quiz Retake Reward" — ca-app-pub-4705207925908028/4722420545
 *
 * RewardedInterstitialAd plays automatically (no explicit "Watch" click
 * required from user). Reward is earned after the ad completes.
 *
 * Premium users get the action directly — no ad shown.
 *
 * Usage:
 *   <RewardedAdGate
 *     isPremium={user?.isPremium}
 *     label="Retake Quiz"
 *     icon="↻"
 *     onReward={handleRetake}
 *   />
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

    let RewardedInterstitialAd: any, RewardedAdEventType: any;
    try {
      const ads = require("react-native-google-mobile-ads");
      // Use RewardedInterstitialAd — matches the ad unit type created in AdMob
      RewardedInterstitialAd = ads.RewardedInterstitialAd;
      RewardedAdEventType    = ads.RewardedAdEventType;
    } catch {
      return;
    }

    if (!RewardedInterstitialAd) {
      console.warn("[RewardedAdGate] RewardedInterstitialAd not found in SDK");
      return;
    }

    setLoading(true);

    const ad = RewardedInterstitialAd.createForAdRequest(AD_UNITS.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Ad loaded and ready to show
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adRef.current = ad;
      setLoading(false);
    });

    // User earned the reward — fire the action
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onReward();
    });

    // Ad failed to load — allow action without ad
    ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
      adRef.current = null;
      setLoading(false);
    });

    // Ad closed — reload for next use
    ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
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
        [{ text: "Continue", onPress: onReward }]
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
          {/* Show video-ad hint badge only for free users in real builds */}
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
