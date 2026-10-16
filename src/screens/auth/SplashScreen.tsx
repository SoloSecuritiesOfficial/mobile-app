/**
 * SplashScreen.tsx — SoloSecurities
 *
 * Cybersecurity-themed startup screen:
 * - Clean white background
 * - Large centered logo (no decorative ring)
 * - Animated scanning radar + lock icon (security motif)
 * - Real progress bar driven by actual API calls from useStartup
 * - Red (#C62828) and black accents from brand palette
 *
 * No market/financial visuals — only cybersecurity animations.
 * All animations use Animated API — zero external dependencies.
 *
 * Progress is driven by useStartup() — bar only advances when real
 * backend tasks complete. StartupContext caches data to avoid duplicate
 * API calls on the dashboard.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar }              from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth }          from "../../context/AuthContext";
import { useStartupData }   from "../../context/StartupContext";
import { useStartup }       from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import { RootStackParamList } from "../../navigation/types";

const { width: W, height: H } = Dimensions.get("window");

// ─── Brand colors ─────────────────────────────────────────────────────────────
const WHITE = "#FFFFFF";
const RED   = "#C62828";     // brand primary
const BLACK = "#111111";     // text
const GRAY  = "#999999";     // muted

// ─── Animated security scanner ────────────────────────────────────────────────
// Circular radar sweep + pulsing lock icon in center
function SecurityScanner() {
  // Radar arm rotation
  const radarRotation = useRef(new Animated.Value(0)).current;
  // Lock pulse
  const lockScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous radar sweep
    const radarLoop = Animated.loop(
      Animated.timing(radarRotation, {
        toValue:         1,
        duration:        3000,
        easing:          Easing.linear,
        useNativeDriver: true,
      })
    );
    radarLoop.start();

    // Lock pulse
    const lockLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lockScale, {
          toValue:         1.15,
          duration:        800,
          easing:          Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lockScale, {
          toValue:         1,
          duration:        800,
          easing:          Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    lockLoop.start();

    return () => {
      radarLoop.stop();
      lockLoop.stop();
    };
  }, []);

  const radarRotate = radarRotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={sc.container}>
      {/* Outer ring */}
      <View style={sc.outerRing} />
      {/* Middle ring */}
      <View style={sc.middleRing} />
      {/* Inner ring */}
      <View style={sc.innerRing} />

      {/* Radar sweep arm */}
      <Animated.View
        style={[
          sc.radarArm,
          { transform: [{ rotate: radarRotate }] },
        ]}
      />

      {/* Center lock icon (text-based) */}
      <Animated.View
        style={[
          sc.lockContainer,
          { transform: [{ scale: lockScale }] },
        ]}
      >
        <View style={sc.lockBody}>
          <View style={sc.lockShackle} />
        </View>
      </Animated.View>
    </View>
  );
}

const sc = StyleSheet.create({
  container: {
    width:          180,
    height:         180,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   32,
  },

  // Concentric rings
  outerRing: {
    position:     "absolute",
    width:        180,
    height:       180,
    borderRadius: 90,
    borderWidth:  1.5,
    borderColor:  `${RED}22`,
  },
  middleRing: {
    position:     "absolute",
    width:        140,
    height:       140,
    borderRadius: 70,
    borderWidth:  1.5,
    borderColor:  `${RED}33`,
  },
  innerRing: {
    position:     "absolute",
    width:        100,
    height:       100,
    borderRadius: 50,
    borderWidth:  1.5,
    borderColor:  `${RED}44`,
  },

  // Radar sweep arm
  radarArm: {
    position:        "absolute",
    width:           90,
    height:          1.5,
    backgroundColor: RED,
    left:            90,
    top:             89.25,
    transformOrigin: "left center",
    opacity:         0.6,
  },

  // Lock icon (pure View-based)
  lockContainer: {
    alignItems:     "center",
    justifyContent: "center",
  },
  lockBody: {
    width:           32,
    height:          24,
    backgroundColor: RED,
    borderRadius:    4,
    alignItems:      "center",
    justifyContent:  "flex-start",
    paddingTop:      6,
  },
  lockShackle: {
    width:        16,
    height:       12,
    borderWidth:  3,
    borderColor:  RED,
    borderRadius: 8,
    borderBottomWidth: 0,
    backgroundColor:   WHITE,
    marginTop:         -14,
  },
});

// ─── Progress bar ─────────────────────────────────────────────────────────────
// Smooth red fill driven by actual API call completion from useStartup
function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         progress,
      duration:        400,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const width = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { width }]}>
        {/* Animated shimmer */}
        <View style={pb.shimmer} />
      </Animated.View>
    </View>
  );
}

const pb = StyleSheet.create({
  track: {
    width:           "100%",
    height:          6,
    backgroundColor: "#F0F0F0",
    borderRadius:    100,
    overflow:        "hidden",
  },
  fill: {
    height:          "100%",
    backgroundColor: RED,
    borderRadius:    100,
    overflow:        "hidden",
    position:        "relative",
  },
  shimmer: {
    position:        "absolute",
    right:           0,
    top:             0,
    bottom:          0,
    width:           40,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius:    100,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData }          = useStartupData();
  const completedRef                = useRef(false);

  // ── Entrance animations ───────────────────────────────────────────────────
  const scannerOp  = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.85)).current;
  const logoOp     = useRef(new Animated.Value(0)).current;
  const titleOp    = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(16)).current;
  const barOp      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Scanner fades in
      Animated.timing(scannerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 2. Logo springs in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue:         1,
          damping:         12,
          stiffness:       100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // 3. Title slides up
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(titleY,  {
          toValue:         0,
          duration:        300,
          easing:          Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 4. Progress bar
      Animated.timing(barOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Startup coordinator ───────────────────────────────────────────────────
  // useStartup runs all API calls and returns real progress (0→100%).
  // Data is cached in StartupContext so DashboardScreen doesn't re-fetch.
  const handleComplete = useCallback((data: StartupData) => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Store preloaded data — Dashboard will consume it and skip the initial fetch
    setStartupData(data);

    // Mark startup done — AppNavigator swaps to AppStack
    markStartupDone();

    if (data.isAuthenticated) {
      signIn();
    } else {
      navigation.replace("Login");
    }
  }, [signIn, markStartupDone, setStartupData, navigation]);

  const { progress, currentLabel, hasFatalError, fatalMessage, retry } =
    useStartup(handleComplete);

  // ── Error state ───────────────────────────────────────────────────────────
  if (hasFatalError) {
    return (
      <View style={[s.root, { justifyContent: "center" }]}>
        <StatusBar style="dark" />
        <Image
          source={require("../../../assets/images/logo.png")}
          style={{ width: 100, height: 100, marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text style={[s.appName, { marginBottom: 8 }]}>Startup Failed</Text>
        <Text style={[s.errorMsg, { marginBottom: 28 }]}>{fatalMessage}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.85}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      <View style={s.content}>
        {/* Animated security scanner (radar + lock) */}
        <Animated.View style={{ opacity: scannerOp }}>
          <SecurityScanner />
        </Animated.View>

        {/* Large logo (no ring, no padding) */}
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity:   logoOp,
            marginBottom: 28,
          }}
        >
          <Image
            source={require("../../../assets/images/logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name + tagline */}
        <Animated.View
          style={{
            opacity:   titleOp,
            transform: [{ translateY: titleY }],
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <Text style={s.appName}>SoloSecurities</Text>
          <Text style={s.tagline}>Cybersecurity • Bug Bounty • Learn</Text>
        </Animated.View>

        {/* Progress bar + status */}
        <Animated.View style={[s.progressContainer, { opacity: barOp }]}>
          <ProgressBar progress={progress} />
          <View style={s.statusRow}>
            {/* Scanning indicator */}
            <View style={s.statusDot} />
            <Text style={s.statusText} numberOfLines={1}>
              {currentLabel}
            </Text>
            <Text style={s.percentage}>{Math.round(progress)}%</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerText}>Powered by SoloSecurities</Text>
        <Text style={s.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: WHITE,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 32,
  },

  content: {
    width:      "100%",
    alignItems: "center",
  },

  // Logo (large, clean, no decoration)
  logo: {
    width:  160,
    height: 160,
  },

  // Text
  appName: {
    fontSize:      26,
    fontWeight:    "800",
    color:         BLACK,
    letterSpacing: 0.5,
    marginBottom:  6,
  },
  tagline: {
    fontSize:      14,
    fontWeight:    "500",
    color:         GRAY,
    letterSpacing: 0.3,
  },

  // Progress
  progressContainer: {
    width: "100%",
  },
  statusRow: {
    flexDirection: "row",
    alignItems:    "center",
    marginTop:     12,
    gap:           8,
  },
  statusDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: RED,
  },
  statusText: {
    flex:       1,
    fontSize:   13,
    fontWeight: "500",
    color:      GRAY,
  },
  percentage: {
    fontSize:   13,
    fontWeight: "800",
    color:      RED,
  },

  // Footer
  footer: {
    position:   "absolute",
    bottom:     Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
  },
  footerText: {
    fontSize:     11,
    color:        "#BBBBBB",
    marginBottom: 3,
  },
  version: {
    fontSize: 10,
    color:    "#CCCCCC",
  },

  // Error
  errorMsg: {
    fontSize:      13,
    color:         GRAY,
    textAlign:     "center",
    lineHeight:    20,
    paddingHorizontal: 24,
  },
  retryBtn: {
    backgroundColor:   RED,
    paddingHorizontal: 40,
    paddingVertical:   14,
    borderRadius:      12,
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowRadius:  10,
        shadowOpacity: 0.3,
        shadowOffset:  { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  retryText: {
    color:      WHITE,
    fontWeight: "800",
    fontSize:   15,
  },
});
