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

// ── Ad Unit IDs ───────────────────────────────────────────────────────────────
// Format: ca-app-pub-PUBLISHER_ID/AD_UNIT_ID
// Your publisher ID: 4705207925908028
// Your banner ad unit ID: 4786224093
const PROD_UNIT_ID = "ca-app-pub-4705207925908028/4786224093";

// true when running inside Expo Go — native ads module is not linked there
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface Props {
  isPremium?:      boolean;
  marginVertical?: number;
}

export default function AdBanner({ isPremium, marginVertical = 8 }: Props) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [failed,   setFailed]   = useState(false);

  // Never show in Expo Go — native module not linked
  if (IS_EXPO_GO) return null;

  // Never show to premium users
  if (isPremium) return null;

  // Don't hold space once the ad permanently fails
  if (failed) return null;

  // Lazy-require so the module isn't evaluated in Expo Go at all
  let BannerAd: any, BannerAdSize: any, TestIds: any;
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd     = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds      = ads.TestIds;
  } catch {
    return null;
  }

  // In dev builds use the official Google test banner ID so the real
  // ad unit is never called without a real impression.
  // In production use the live unit ID.
  const unitId: string = __DEV__
    ? (TestIds?.BANNER ?? "ca-app-pub-3940256099942544/6300978111")
    : PROD_UNIT_ID;

  return (
    <View style={[styles.container, { marginVertical }]}>
      {/* Label only shown once the ad has actually rendered */}
      {adLoaded && <Text style={styles.label}>Advertisement</Text>}
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          // Disable test devices override in prod so real ads show
        }}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(err: any) => {
          console.warn("[AdBanner] failed to load:", err?.message ?? err?.code);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  label: {
    fontSize: 9,
    color: "#BBBBBB",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "500",
  },
});
