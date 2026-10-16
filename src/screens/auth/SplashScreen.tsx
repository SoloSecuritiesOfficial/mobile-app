/**
 * SplashScreen.tsx — SoloSecurities
 *
 * Runs on EVERY cold start for ALL users (authenticated + new).
 * The progress bar only reaches 100% when all API calls finish or fail.
 * No fake timers — every step of the bar represents real work.
 *
 * Startup flow:
 *   Phase A (0→35%)  : Read token from SecureStore + load theme
 *   Phase B (35→60%) : Validate session / refresh JWT with backend
 *   Phase C (60→90%) : Load profile, dashboard, certs, notifications
 *   Phase D (90→100%): Brief visual finish → navigate
 *
 * Visual:
 *   - Logo springs in with scale+fade
 *   - Typewriter cycles through security taglines
 *   - Progress bar advances only as each task completes
 *   - Current task name shown below bar so user knows what's loading
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth }        from "../../context/AuthContext";
import { useStartupData } from "../../context/StartupContext";
import { useStartup }     from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import { RootStackParamList } from "../../navigation/types";

const { width: W } = Dimensions.get("window");

// ─── Taglines ─────────────────────────────────────────────────────────────────
const TAGLINES = [
  "Protecting Every Click",
  "Learn Cybersecurity",
  "Think Like a Hacker",
  "Defend Like a Pro",
  "Bug Bounty Platform",
  "Secure • Learn • Protect",
];
const TYPE_MS   = 70;
const DELETE_MS = 35;
const PAUSE_MS  = 1600;

function useTypewriter() {
  const [text,     setText]     = useState("");
  const [phrase,   setPhrase]   = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = TAGLINES[phrase];
    if (!deleting && text === full) {
      const t = setTimeout(() => setDeleting(true), PAUSE_MS);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setPhrase(p => (p + 1) % TAGLINES.length);
      return;
    }
    const t = setTimeout(() => {
      setText(prev => deleting ? prev.slice(0, -1) : full.slice(0, prev.length + 1));
    }, deleting ? DELETE_MS : TYPE_MS);
    return () => clearTimeout(t);
  }, [text, deleting, phrase]);

  return text;
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         progress,
      duration:        500,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const width = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  // Shimmer pulse on fill
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const shimmerOp = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <View style={bar.track}>
      <Animated.View style={[bar.fill, { width }]}>
        <Animated.View style={[bar.shine, { opacity: shimmerOp }]} />
      </Animated.View>
    </View>
  );
}

const bar = StyleSheet.create({
  track: { width: "100%", height: 5, backgroundColor: "#EBEBEB", borderRadius: 100, overflow: "hidden" },
  fill:  { height: "100%", backgroundColor: "#C62828", borderRadius: 100, overflow: "hidden" },
  shine: { position: "absolute", right: 0, top: 0, bottom: 0, width: 28, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 100 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData }          = useStartupData();
  const completedRef                = useRef(false);
  const text                        = useTypewriter();

  // Enter animations
  const logoScale   = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentY    = useRef(new Animated.Value(20)).current;
  const contentOp   = useRef(new Animated.Value(0)).current;
  const footerOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(contentOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(contentY,  { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(footerOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    });
  }, []);

  // Called by useStartup when ALL tasks finish (done or skipped/failed)
  const handleComplete = useCallback((data: StartupData) => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Store preloaded data so Dashboard can render immediately
    setStartupData(data);

    // Mark startup complete — AppNavigator will now swap to AppStack
    markStartupDone();

    if (data.isAuthenticated) {
      // signIn sets isAuthenticated=true; combined with startupDone=true,
      // AppNavigator renders AppNavigatorInner → Dashboard
      signIn();
    } else {
      // Not authenticated — navigate to Login within AuthStack
      navigation.replace("Login");
    }
  }, [signIn, markStartupDone, setStartupData, navigation]);

  const { progress, currentLabel, hasFatalError, fatalMessage, retry } =
    useStartup(handleComplete);

  // Error state
  if (hasFatalError) {
    return (
      <View style={s.container}>
        <StatusBar style="dark" />
        <Image source={require("../../../assets/images/logo.png")} style={s.errorLogo} resizeMode="contain" />
        <Text style={s.errorTitle}>Could not start app</Text>
        <Text style={s.errorMsg}>{fatalMessage}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.8}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Logo */}
      <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, marginBottom: 24 }}>
        <Image source={require("../../../assets/images/logo.png")} style={s.logo} resizeMode="contain" />
      </Animated.View>

      {/* Content block */}
      <Animated.View style={[s.lower, { opacity: contentOp, transform: [{ translateY: contentY }] }]}>

        {/* App name */}
        <Text style={s.appName}>SoloSecurities</Text>

        {/* Typewriter */}
        <View style={s.taglineRow}>
          <Text style={s.tagline} numberOfLines={1}>
            {text}<Text style={s.cursor}>|</Text>
          </Text>
        </View>

        {/* Progress bar + label */}
        <View style={s.barBlock}>
          <ProgressBar progress={progress} />
          <View style={s.barMeta}>
            <Text style={s.taskLabel} numberOfLines={1}>{currentLabel}</Text>
            <Text style={s.pct}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[s.footer, { opacity: footerOp }]}>
        <Text style={s.footerText}>Powered by SoloSecurities</Text>
        <Text style={s.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 36,
  },
  logo:      { width: W * 0.52, height: W * 0.52 },
  lower:     { width: "100%", alignItems: "center" },
  appName:   { fontSize: 22, fontWeight: "800", color: "#111", letterSpacing: 0.4, marginBottom: 6 },
  taglineRow:{ height: 28, justifyContent: "center", marginBottom: 24 },
  tagline:   { fontSize: 15, fontWeight: "600", color: "#555", letterSpacing: 0.2 },
  cursor:    { color: "#C62828", fontWeight: "700" },
  barBlock:  { width: "100%" },
  barMeta:   { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  taskLabel: { fontSize: 12, color: "#999", fontWeight: "500", flex: 1 },
  pct:       { fontSize: 12, color: "#CCC", fontWeight: "700", marginLeft: 8 },
  footer:    { position: "absolute", bottom: 32, alignItems: "center" },
  footerText:{ fontSize: 12, color: "#AAA", marginBottom: 2 },
  version:   { fontSize: 10, color: "#CCC" },
  errorLogo: { width: W * 0.4, height: W * 0.4, marginBottom: 24 },
  errorTitle:{ fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 8 },
  errorMsg:  { fontSize: 13, color: "#777", textAlign: "center", paddingHorizontal: 32, lineHeight: 20, marginBottom: 28 },
  retryBtn:  { backgroundColor: "#C62828", paddingHorizontal: 36, paddingVertical: 13, borderRadius: 12 },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
