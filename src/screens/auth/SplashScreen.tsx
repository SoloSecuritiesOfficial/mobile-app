/**
 * SplashScreen.tsx — SoloSecurities
 *
 * Premium dark-navy startup experience.
 * No react-native-svg required — all visuals use Animated + View.
 *
 * Layout (top → bottom):
 *   • Ambient glow orbs (decorative, non-interactive)
 *   • Animated mini bar-chart (financial motif)
 *   • Logo (spring entrance)
 *   • "SoloSecurities" wordmark + tagline
 *   • Gradient-style progress bar + status text
 *   • Footer
 *
 * Progress is driven by useStartup() — 100% only when all API tasks finish.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY   = "#080C18";      // background
const CARD   = "#0F1729";      // surface
const BLUE   = "#1565C0";      // accent / bar left
const TEAL   = "#00897B";      // accent / bar right
const RED    = "#C62828";      // brand red (logo ring only)
const WHITE  = "#FFFFFF";
const MUTED  = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.07)";

// ─── Animated mini bar chart ──────────────────────────────────────────────────
const BAR_HEIGHTS = [28, 44, 36, 56, 40, 64, 48, 52, 38, 60, 44, 70];

function MiniChart() {
  const anims = useMemo(
    () => BAR_HEIGHTS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue:         1,
        duration:        600 + i * 60,
        delay:           i * 40,
        easing:          Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      })
    );
    Animated.stagger(40, animations).start();
  }, []);

  return (
    <View style={chart.wrap}>
      {BAR_HEIGHTS.map((h, i) => {
        const isHighlight = i === BAR_HEIGHTS.length - 1 || i === 9;
        return (
          <Animated.View
            key={i}
            style={[
              chart.bar,
              {
                height: anims[i].interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0, h],
                }),
                backgroundColor: isHighlight ? TEAL : `rgba(30,90,192,${0.45 + i * 0.02})`,
                marginRight: i < BAR_HEIGHTS.length - 1 ? 4 : 0,
              },
            ]}
          />
        );
      })}
      {/* Trend line overlay */}
      <View style={chart.lineWrap} pointerEvents="none">
        <View style={chart.trendLine} />
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  wrap:     { flexDirection: "row", alignItems: "flex-end", height: 72, marginBottom: 28 },
  bar:      { width: (W - 72 - (BAR_HEIGHTS.length - 1) * 4) / BAR_HEIGHTS.length, borderRadius: 3, minHeight: 2 },
  lineWrap: { position: "absolute", left: 0, right: 0, bottom: 32, height: 1 },
  trendLine:{ height: 1, width: "100%", backgroundColor: `${TEAL}44` },
});

// ─── Gradient-style progress bar ─────────────────────────────────────────────
// Two overlapping coloured layers create a blue→teal gradient feel without SVG.
function GradientBar({ progress }: { progress: number }) {
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

  // Shimmer
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    return () => shimmer.stopAnimation();
  }, [shimmer]);

  const shimmerOp = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { width }]}>
        {/* Blue layer */}
        <View style={[pb.colorLeft]} />
        {/* Teal overlay on right half */}
        <View style={[pb.colorRight]} />
        {/* Shimmer */}
        <Animated.View style={[pb.shine, { opacity: shimmerOp }]} />
      </Animated.View>
    </View>
  );
}

const pb = StyleSheet.create({
  track:      { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" },
  fill:       { height: "100%", borderRadius: 100, overflow: "hidden", position: "relative" },
  colorLeft:  { position: "absolute", left: 0, top: 0, bottom: 0, right: "30%", backgroundColor: BLUE },
  colorRight: { position: "absolute", left: "50%", top: 0, bottom: 0, right: 0, backgroundColor: TEAL, opacity: 0.85 },
  shine:      { position: "absolute", right: 0, top: 0, bottom: 0, width: 24, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 100 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData }          = useStartupData();
  const completedRef                = useRef(false);

  // ── Entrance animations ───────────────────────────────────────────────────
  const orb1Op      = useRef(new Animated.Value(0)).current;
  const orb2Op      = useRef(new Animated.Value(0)).current;
  const chartOp     = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOp      = useRef(new Animated.Value(0)).current;
  const wordmarkOp  = useRef(new Animated.Value(0)).current;
  const wordmarkY   = useRef(new Animated.Value(12)).current;
  const barOp       = useRef(new Animated.Value(0)).current;
  const footerOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Orbs fade in
      Animated.parallel([
        Animated.timing(orb1Op, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(orb2Op, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ]),
      // 2. Chart rises
      Animated.timing(chartOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 3. Logo springs in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 13, stiffness: 110, useNativeDriver: true }),
        Animated.timing(logoOp,    { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 4. Wordmark slides up
      Animated.parallel([
        Animated.timing(wordmarkOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(wordmarkY,  { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // 5. Bar + footer
      Animated.parallel([
        Animated.timing(barOp,    { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(footerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Startup coordinator ───────────────────────────────────────────────────
  const handleComplete = useCallback((data: StartupData) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setStartupData(data);
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
      <View style={[s.root, { justifyContent: "center", alignItems: "center", paddingHorizontal: 36 }]}>
        <StatusBar style="light" />
        <Image source={require("../../../assets/images/logo.png")} style={{ width: 80, height: 80, marginBottom: 24 }} resizeMode="contain" />
        <Text style={[s.appName, { marginBottom: 8 }]}>Startup Failed</Text>
        <Text style={[s.muted, { textAlign: "center", lineHeight: 20, marginBottom: 32 }]}>{fatalMessage}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.8}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Ambient glow orbs */}
      <Animated.View style={[s.orb1, { opacity: orb1Op }]} />
      <Animated.View style={[s.orb2, { opacity: orb2Op }]} />

      {/* Content column */}
      <View style={s.col}>

        {/* Mini bar chart */}
        <Animated.View style={{ opacity: chartOp, width: "100%" }}>
          <MiniChart />
        </Animated.View>

        {/* Logo ring */}
        <Animated.View style={[s.logoRing, { transform: [{ scale: logoScale }], opacity: logoOp }]}>
          <View style={s.logoInner}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Wordmark */}
        <Animated.View style={{ opacity: wordmarkOp, transform: [{ translateY: wordmarkY }], alignItems: "center", marginTop: 20, marginBottom: 32 }}>
          <Text style={s.appName}>SoloSecurities</Text>
          <Text style={s.tagline}>Secure • Learn • Protect</Text>
        </Animated.View>

        {/* Progress area */}
        <Animated.View style={[s.progressCard, { opacity: barOp }]}>
          <GradientBar progress={progress} />
          <View style={s.statusRow}>
            <View style={s.dot} />
            <Text style={s.statusText} numberOfLines={1}>{currentLabel}</Text>
            <Text style={s.pct}>{Math.round(progress)}%</Text>
          </View>
        </Animated.View>

      </View>

      {/* Footer */}
      <Animated.View style={[s.footer, { opacity: footerOp }]}>
        <Text style={s.footerText}>Powered by SoloSecurities</Text>
        <Text style={s.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: NAVY,
    alignItems:      "center",
    justifyContent:  "center",
    overflow:        "hidden",
  },

  // Ambient orbs
  orb1: {
    position:        "absolute",
    top:             -H * 0.12,
    right:           -W * 0.2,
    width:           W * 0.7,
    height:          W * 0.7,
    borderRadius:    W * 0.35,
    backgroundColor: BLUE,
    opacity:         0.18,
    // soft glow via shadow on iOS
    ...Platform.select({
      ios: { shadowColor: BLUE, shadowRadius: 60, shadowOpacity: 0.5 },
    }),
  },
  orb2: {
    position:        "absolute",
    bottom:          -H * 0.1,
    left:            -W * 0.15,
    width:           W * 0.55,
    height:          W * 0.55,
    borderRadius:    W * 0.275,
    backgroundColor: TEAL,
    opacity:         0.12,
    ...Platform.select({
      ios: { shadowColor: TEAL, shadowRadius: 50, shadowOpacity: 0.4 },
    }),
  },

  // Content
  col: {
    width:           W - 48,
    alignItems:      "center",
  },

  // Logo ring
  logoRing: {
    width:           96,
    height:          96,
    borderRadius:    48,
    borderWidth:     1.5,
    borderColor:     `${RED}66`,
    padding:         3,
    backgroundColor: `${RED}0F`,
    alignItems:      "center",
    justifyContent:  "center",
    // glow
    ...Platform.select({
      ios: { shadowColor: RED, shadowRadius: 20, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 0 } },
    }),
    elevation:       6,
  },
  logoInner: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: CARD,
    alignItems:      "center",
    justifyContent:  "center",
    overflow:        "hidden",
  },
  logo: {
    width:  72,
    height: 72,
  },

  // Wordmark
  appName: {
    fontSize:      24,
    fontWeight:    "800",
    color:         WHITE,
    letterSpacing: 0.6,
  },
  tagline: {
    fontSize:      13,
    fontWeight:    "500",
    color:         MUTED,
    marginTop:     5,
    letterSpacing: 0.8,
  },

  // Progress card
  progressCard: {
    width:           "100%",
    backgroundColor: CARD,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         16,
  },
  statusRow: {
    flexDirection:   "row",
    alignItems:      "center",
    marginTop:       10,
    gap:             8,
  },
  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: TEAL,
  },
  statusText: {
    flex:            1,
    fontSize:        12,
    color:           MUTED,
    fontWeight:      "500",
  },
  pct: {
    fontSize:        12,
    color:           `${TEAL}CC`,
    fontWeight:      "700",
  },

  // Footer
  footer: {
    position:   "absolute",
    bottom:     Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
  },
  footerText: {
    fontSize:  11,
    color:     "rgba(255,255,255,0.25)",
    marginBottom: 2,
  },
  version: {
    fontSize: 10,
    color:    "rgba(255,255,255,0.15)",
  },

  // Error / retry
  muted: {
    fontSize: 13,
    color:    MUTED,
  },
  retryBtn: {
    backgroundColor:   BLUE,
    paddingHorizontal: 36,
    paddingVertical:   13,
    borderRadius:      12,
  },
  retryText: {
    color:      WHITE,
    fontWeight: "700",
    fontSize:   15,
  },
});
