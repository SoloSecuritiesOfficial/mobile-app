/**
 * AdBanner.tsx
 *
 * react-native-google-mobile-ads requires native code — it CANNOT run
 * in Expo Go (executionEnvironment === "storeClient").
 *
 * Guard: only import the library when running in a real binary
 * (bare / standalone). In Expo Go the component renders nothing.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

// ── IDs ──────────────────────────────────────────────────────────
const PROD_UNIT_ID  = "ca-app-pub-4705207925908028/4786224093";

// true when running in Expo Go or a dev-client (no native ads module)
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface Props {
  isPremium?:      boolean;
  marginVertical?: number;
}

export default function AdBanner({ isPremium, marginVertical = 8 }: Props) {
  const [failed, setFailed] = useState(false);

  // Never show in Expo Go — native module not linked
  if (IS_EXPO_GO) return null;

  // Never show to premium users
  if (isPremium) return null;

  // Don't render empty space when ad fails to load
  if (failed) return null;

  // Lazy-require so the module isn't evaluated at all in Expo Go
  let BannerAd: any, BannerAdSize: any, TestIds: any;
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd     = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds      = ads.TestIds;
  } catch {
    return null;
  }

  const unitId = __DEV__ ? TestIds.BANNER : PROD_UNIT_ID;

  return (
    <View style={[styles.container, { marginVertical }]}>
      <Text style={styles.label}>Advertisement</Text>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(err: any) => {
          console.warn("[AdBanner] load failed:", err?.message);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { alignItems: "center" },
  label: {
    fontSize: 9,
    color: "#BBBBBB",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "500",
  },
});
