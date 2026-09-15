/**
 * AdBanner.tsx — SoloSecurities
 *
 * Shows a real AdMob ANCHORED_ADAPTIVE_BANNER inline.
 * Silent no-op in Expo Go (native module not linked).
 * Hidden for premium users.
 *
 * IMPORTANT: Do NOT tap your own ads while testing.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AD_UNITS } from "../config/adUnits";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface Props {
  isPremium?: boolean;
  marginVertical?: number;
}

export default function AdBanner({ isPremium = false, marginVertical = 8 }: Props) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (IS_EXPO_GO) return null;
  if (isPremium)  return null;
  if (failed)     return null;

  let BannerAd: any, BannerAdSize: any;
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd     = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
  } catch {
    return null;
  }

  return (
    <View style={[s.wrap, { marginVertical }]}>
      {adLoaded && <Text style={s.label}>Advertisement</Text>}
      <BannerAd
        unitId={AD_UNITS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(err: any) => {
          console.warn("[AdBanner] failed:", err?.message ?? err?.code);
          setFailed(true);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: "center", width: "100%" },
  label: { fontSize: 9, color: "#BBBBBB", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2, fontWeight: "500" },
});
