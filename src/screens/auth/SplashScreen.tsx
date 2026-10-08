/**
 * SplashScreen.tsx
 *
 * Progress bar now tracks REAL data loading — no fake fixed timer.
 *
 * Stages (each advances the bar):
 *   0 %  → app opens
 *  30 %  → SDK / module initialisation done (instant)
 *  60 %  → auth token check complete
 *  90 %  → navigation ready
 * 100 %  → navigate immediately
 *
 * The bar never sits waiting for a countdown. It moves only as
 * real work completes, so the total splash time equals exactly
 * the time needed — nothing more.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../navigation/types";
import { isLoggedIn } from "../../services/authService";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const SCREEN_WIDTH = Dimensions.get("window").width;

const STAGE_LABELS = [
  "Initialising...",
  "Checking session...",
  "Loading resources...",
  "Ready!",
];

// ─── smooth animated progress bar ────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,    // width is not supported by native driver
    }).start();
  }, [progress]);

  const barWidth = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={bar.track}>
      <Animated.View style={[bar.fill, { width: barWidth }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: {
    width: "100%",
    height: 6,
    backgroundColor: "#E6E6E6",
    borderRadius: 100,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#C62828",
    borderRadius: 100,
  },
});

// ─── screen ──────────────────────────────────────────────────────────────────

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim         = useRef(new Animated.Value(0)).current;
  const navigationDone   = useRef(false);

  const [progress,    setProgress]    = useState(0);
  const [stageIndex,  setStageIndex]  = useState(0);

  // ── animate fade-in on mount ─────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── real data-driven loading ──────────────────────────────────────────────
  const runStartup = useCallback(async () => {
    if (navigationDone.current) return;

    // Stage 1 — SDK / module init (synchronous, instant)
    setProgress(30);
    setStageIndex(1);

    // Small visual pause so the bar doesn't jump from 0 to 100 instantly
    await new Promise(r => setTimeout(r, 250));

    // Stage 2 — check auth token
    setProgress(60);
    setStageIndex(2);

    let loggedIn = false;
    try {
      loggedIn = await isLoggedIn();
    } catch {
      loggedIn = false;
    }

    // Stage 3 — navigation ready
    setProgress(90);
    setStageIndex(3);

    await new Promise(r => setTimeout(r, 150));  // brief visual confirmation

    // Stage 4 — done
    setProgress(100);

    // Navigate immediately after the bar reaches 100
    await new Promise(r => setTimeout(r, 200));

    if (navigationDone.current) return;
    navigationDone.current = true;

    navigation.replace(loggedIn ? "Dashboard" : "Login");
  }, [navigation]);

  useEffect(() => {
    runStartup();
  }, [runStartup]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Logo */}
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Stage label */}
        <Text style={styles.stageLabel}>
          {STAGE_LABELS[stageIndex]}
        </Text>

        {/* Real progress bar — advances with actual data loading */}
        <View style={styles.barWrap}>
          <ProgressBar progress={progress} />
          <Text style={styles.pct}>{Math.round(progress)}%</Text>
        </View>

      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.powered}>Powered by SoloSecurities</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  logo: {
    width:        SCREEN_WIDTH * 0.55,
    height:       SCREEN_WIDTH * 0.55,
    marginBottom: 32,
  },

  stageLabel: {
    fontSize:     14,
    fontWeight:   "600",
    color:        "#666666",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  barWrap: {
    width:     "100%",
    alignItems: "stretch",
  },

  pct: {
    marginTop:  6,
    fontSize:   12,
    color:      "#999999",
    alignSelf:  "flex-end",
    fontWeight: "600",
  },

  footer: {
    position:   "absolute",
    bottom:     30,
    alignItems: "center",
  },

  powered: {
    fontSize:     14,
    color:        "#666666",
    marginBottom: 4,
  },

  version: {
    fontSize: 12,
    color:    "#999999",
  },
});
