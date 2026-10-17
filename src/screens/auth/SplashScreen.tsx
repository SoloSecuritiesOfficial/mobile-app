/**
 * SplashScreen.tsx — SoloSecurities Comprehensive Data Loader
 *
 * Single-logo cybersecurity startup screen with real-time API progress.
 * Loads all 15 GET endpoints in parallel and shows actual completion status.
 *
 * Visual:
 *   - White background
 *   - Large centered logo (no decorative elements)
 *   - Animated radar rings + scanning effects
 *   - Progress bar tracks ALL API calls
 *   - Status text shows current task
 *
 * Progress driven by useStartup() — advances only when API calls complete.
 */

import React, { useCallback, useEffect, useRef } from "react";
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
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "../../context/AuthContext";
import { useStartupData } from "../../context/StartupContext";
import { useStartup } from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import { RootStackParamList } from "../../navigation/types";

const { width: W, height: H } = Dimensions.get("window");

const WHITE = "#FFFFFF";
const BLACK = "#111111";
const RED = "#C62828";
const GRAY = "#999999";

// ─── Animated security rings ──────────────────────────────────────────────────
function SecurityRings({ opacity }: { opacity: Animated.Value }) {
  const ring1Rotation = useRef(new Animated.Value(0)).current;
  const ring2Rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ring 1: 4s clockwise
    const r1 = Animated.loop(
      Animated.timing(ring1Rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    r1.start();

    // Ring 2: 6s counter-clockwise
    const r2 = Animated.loop(
      Animated.timing(ring2Rotation, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    r2.start();

    // Scanning pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    pulse.start();

    return () => {
      r1.stop();
      r2.stop();
      pulse.stop();
    };
  }, []);

  const r1Rotate = ring1Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const r2Rotate = ring2Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.3],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.2, 0],
  });

  return (
    <Animated.View
      style={[rings.container, { opacity }]}
      pointerEvents="none"
    >
      {/* Ring 1 */}
      <Animated.View
        style={[rings.ring, rings.ring1, { transform: [{ rotate: r1Rotate }] }]}
      >
        <View style={rings.arm} />
      </Animated.View>

      {/* Ring 2 */}
      <Animated.View
        style={[rings.ring, rings.ring2, { transform: [{ rotate: r2Rotate }] }]}
      >
        <View style={rings.arm} />
      </Animated.View>

      {/* Pulse */}
      <Animated.View
        style={[
          rings.pulse,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
    </Animated.View>
  );
}

const rings = StyleSheet.create({
  container: {
    position: "absolute",
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    top: H * 0.25,
  },
  ring: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${RED}33`,
  },
  ring1: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  ring2: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderColor: `${RED}22`,
  },
  arm: {
    position: "absolute",
    width: 100,
    height: 1.5,
    backgroundColor: RED,
    left: "50%",
    opacity: 0.5,
  },
  pulse: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: RED,
  },
});

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const shimmerOp = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { width }]}>
        <Animated.View style={[pb.shimmer, { opacity: shimmerOp }]} />
      </Animated.View>
    </View>
  );
}

const pb = StyleSheet.create({
  track: {
    width: "100%",
    height: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 100,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: RED,
    borderRadius: 100,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: RED,
        shadowRadius: 8,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  shimmer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 100,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData } = useStartupData();
  const completedRef = useRef(false);

  // Entrance animations
  const ringsOp = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const barOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Rings fade in
      Animated.timing(ringsOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      // Logo springs in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Progress bar
      Animated.timing(barOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // Startup coordinator
  const handleComplete = useCallback(
    (data: StartupData) => {
      if (completedRef.current) return;
      completedRef.current = true;

      setStartupData(data);
      markStartupDone();

      if (data.isAuthenticated) {
        signIn();
      } else {
        navigation.replace("Login");
      }
    },
    [signIn, markStartupDone, setStartupData, navigation]
  );

  const { progress, currentLabel, hasFatalError, fatalMessage, retry } =
    useStartup(handleComplete);

  // Error state
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

  // Main screen
  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Animated security rings */}
      <SecurityRings opacity={ringsOp} />

      {/* Content */}
      <View style={s.content}>
        {/* Single logo */}
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOp,
            marginBottom: 28,
          }}
        >
          <Image
            source={require("../../../assets/images/logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOp,
            transform: [{ translateY: titleY }],
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <Text style={s.appName}>SoloSecurities</Text>
          <Text style={s.tagline}>Loading all security data…</Text>
        </Animated.View>

        {/* Progress */}
        <Animated.View style={[s.progressContainer, { opacity: barOp }]}>
          <ProgressBar progress={progress} />
          <View style={s.statusRow}>
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
    flex: 1,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    width: W - 64,
    alignItems: "center",
    zIndex: 10,
  },

  logo: {
    width: 180,
    height: 180,
  },

  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: BLACK,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "500",
    color: GRAY,
    letterSpacing: 0.4,
  },

  progressContainer: {
    width: "100%",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: RED,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: GRAY,
  },
  percentage: {
    fontSize: 13,
    fontWeight: "800",
    color: RED,
  },

  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#BBBBBB",
    marginBottom: 3,
  },
  version: {
    fontSize: 10,
    color: "#CCCCCC",
  },

  errorMsg: {
    fontSize: 13,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  retryBtn: {
    backgroundColor: RED,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: RED,
        shadowRadius: 10,
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  retryText: {
    color: WHITE,
    fontWeight: "800",
    fontSize: 15,
  },
});
