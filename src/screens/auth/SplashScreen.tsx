/**
 * SplashScreen.tsx — SoloSecurities
 *
 * Theme-accurate startup screen:
 * - Dark mode: #121212 background, #1E1E1E surface, #C62828 accent
 * - Light mode: #FFFFFF background, #F8F9FA surface, #C62828 accent
 *
 * Cannot use useTheme() here because ThemeProvider reads AsyncStorage
 * asynchronously and hasn't resolved yet when the splash mounts.
 * Instead, the splash reads the same AsyncStorage key directly so it
 * respects the user's preference from the very first frame.
 *
 * No blue. No teal. Only the existing brand palette.
 * No new dependencies — all visuals use Animated + View.
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
import AsyncStorage               from "@react-native-async-storage/async-storage";

import { useAuth }          from "../../context/AuthContext";
import { useStartupData }   from "../../context/StartupContext";
import { useStartup }       from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import { RootStackParamList } from "../../navigation/types";

const { width: W, height: H } = Dimensions.get("window");

// ─── Theme palette (mirrors ThemeContext exactly) ─────────────────────────────
const PALETTE = {
  dark: {
    bg:      "#121212",
    surface: "#1E1E1E",
    header:  "#0A0A0A",
    text:    "#F5F5F5",
    muted:   "#AAAAAA",
    border:  "#2C2C2C",
    status:  "light" as const,
  },
  light: {
    bg:      "#FFFFFF",
    surface: "#F8F9FA",
    header:  "#111111",
    text:    "#111111",
    muted:   "#555555",
    border:  "#E0E0E0",
    status:  "dark" as const,
  },
};

const RED        = "#C62828";   // primary brand — bar, ring, dot, shimmer
const RED_DIM    = "#8E0000";   // darker shade for depth
const RED_LIGHT  = "#EF5350";   // lighter for highlights
const THEME_KEY  = "@app_theme_dark";

// ─── Bar chart (financial motif, theme-aware) ─────────────────────────────────
const BAR_HEIGHTS = [22, 38, 30, 50, 36, 58, 44, 48, 34, 56, 42, 65];

type ThemeColors = {
  bg: string; surface: string; header: string;
  text: string; muted: string; border: string;
  status: "light" | "dark";
};

function MiniChart({ colors }: { colors: ThemeColors }) {
  const anims = useMemo(
    () => BAR_HEIGHTS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    Animated.stagger(
      35,
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue:         1,
          duration:        500 + i * 40,
          delay:           i * 30,
          easing:          Easing.out(Easing.back(1.1)),
          useNativeDriver: false,
        })
      )
    ).start();
  }, []);

  return (
    <View style={ch.wrap}>
      {BAR_HEIGHTS.map((h, i) => {
        const isLast    = i === BAR_HEIGHTS.length - 1;
        const isAccent  = i >= BAR_HEIGHTS.length - 2;
        const opacity   = 0.3 + (i / BAR_HEIGHTS.length) * 0.5;
        return (
          <Animated.View
            key={i}
            style={[
              ch.bar,
              {
                height: anims[i].interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0, h],
                }),
                backgroundColor: isAccent
                  ? (isLast ? RED : RED_LIGHT)
                  : `${RED}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
                marginRight: i < BAR_HEIGHTS.length - 1 ? 4 : 0,
              },
            ]}
          />
        );
      })}
      {/* Baseline */}
      <View style={[ch.baseline, { backgroundColor: colors.border }]} />
    </View>
  );
}

const ch = StyleSheet.create({
  wrap:     { flexDirection: "row", alignItems: "flex-end", height: 68, marginBottom: 28, position: "relative" },
  bar:      { width: (W - 48 - 56 - (BAR_HEIGHTS.length - 1) * 4) / BAR_HEIGHTS.length, borderRadius: 3, minHeight: 2 },
  baseline: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1 },
});

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress, colors }: { progress: number; colors: ThemeColors }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         progress,
      duration:        450,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const width = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  // Red shimmer pulse
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const shimmerOp = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={[pr.track, { backgroundColor: colors.border }]}>
      <Animated.View style={[pr.fill, { width, backgroundColor: RED }]}>
        {/* Darker red left edge for depth */}
        <View style={[pr.edge, { backgroundColor: RED_DIM }]} />
        {/* Lighter right highlight */}
        <View style={[pr.highlight, { backgroundColor: RED_LIGHT }]} />
        {/* Shimmer */}
        <Animated.View style={[pr.shine, { opacity: shimmerOp }]} />
      </Animated.View>
    </View>
  );
}

const pr = StyleSheet.create({
  track:     { width: "100%", height: 5, borderRadius: 100, overflow: "hidden" },
  fill:      { height: "100%", borderRadius: 100, overflow: "hidden" },
  edge:      { position: "absolute", left: 0, top: 0, bottom: 0, width: "25%", opacity: 0.6 },
  highlight: { position: "absolute", right: 0, top: 0, bottom: 0, width: "20%", opacity: 0.7 },
  shine:     { position: "absolute", right: 0, top: 0, bottom: 0, width: 20, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 100 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData }          = useStartupData();
  const completedRef                = useRef(false);

  // Read saved theme preference directly so the splash matches the user's
  // chosen theme from the first frame, before ThemeProvider resolves.
  const [isDark, setIsDark] = useState(true); // default dark until resolved
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(v => { if (v !== null) setIsDark(v === "true"); })
      .catch(() => {}); // keep default on error
  }, []);

  const C = isDark ? PALETTE.dark : PALETTE.light;

  // ── Entrance animations ───────────────────────────────────────────────────
  const glowOp    = useRef(new Animated.Value(0)).current;
  const chartOp   = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOp    = useRef(new Animated.Value(0)).current;
  const wordOp    = useRef(new Animated.Value(0)).current;
  const wordY     = useRef(new Animated.Value(14)).current;
  const barOp     = useRef(new Animated.Value(0)).current;
  const footerOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Glow orb
      Animated.timing(glowOp,  { toValue: 1, duration: 500, useNativeDriver: true }),
      // Chart
      Animated.timing(chartOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Logo
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 13, stiffness: 115, useNativeDriver: true }),
        Animated.timing(logoOp,    { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      // Wordmark
      Animated.parallel([
        Animated.timing(wordOp, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(wordY,  { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Progress + footer
      Animated.parallel([
        Animated.timing(barOp,    { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(footerOp, { toValue: 1, duration: 350, useNativeDriver: true }),
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
      <View style={[s.root, { backgroundColor: C.bg, justifyContent: "center", alignItems: "center", paddingHorizontal: 36 }]}>
        <StatusBar style={C.status} />
        <Image source={require("../../../assets/images/logo.png")} style={{ width: 80, height: 80, marginBottom: 24 }} resizeMode="contain" />
        <Text style={[s.appName, { color: C.text, marginBottom: 8 }]}>Startup Failed</Text>
        <Text style={[s.tagline, { color: C.muted, textAlign: "center", marginBottom: 32 }]}>{fatalMessage}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.8}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      <StatusBar style={C.status} />

      {/* Brand red ambient glow — top-right corner */}
      <Animated.View
        style={[
          s.glow,
          {
            opacity:         glowOp,
            backgroundColor: RED,
          },
        ]}
      />

      {/* Content column */}
      <View style={s.col}>

        {/* Animated bar chart */}
        <Animated.View style={{ opacity: chartOp, width: "100%" }}>
          <MiniChart colors={C} />
        </Animated.View>

        {/* Logo with ring */}
        <Animated.View
          style={[
            s.logoRing,
            {
              borderColor:     `${RED}55`,
              backgroundColor: isDark ? `${RED}12` : `${RED}08`,
              transform:       [{ scale: logoScale }],
              opacity:         logoOp,
            },
          ]}
        >
          <View style={[s.logoInner, { backgroundColor: C.surface }]}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Wordmark */}
        <Animated.View
          style={{
            opacity:         wordOp,
            transform:       [{ translateY: wordY }],
            alignItems:      "center",
            marginTop:       20,
            marginBottom:    28,
          }}
        >
          <Text style={[s.appName, { color: C.text }]}>SoloSecurities</Text>
          <Text style={[s.tagline, { color: C.muted }]}>Secure • Learn • Protect</Text>
        </Animated.View>

        {/* Progress card */}
        <Animated.View
          style={[
            s.card,
            {
              opacity:         barOp,
              backgroundColor: C.surface,
              borderColor:     C.border,
            },
          ]}
        >
          <ProgressBar progress={progress} colors={C} />

          <View style={s.statusRow}>
            {/* Pulsing red dot */}
            <View style={[s.dot, { backgroundColor: RED }]} />
            <Text style={[s.statusLabel, { color: C.muted }]} numberOfLines={1}>
              {currentLabel}
            </Text>
            <Text style={[s.pct, { color: RED }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        </Animated.View>

      </View>

      {/* Footer */}
      <Animated.View style={[s.footer, { opacity: footerOp }]}>
        <Text style={[s.footerLine, { color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }]}>
          Powered by SoloSecurities
        </Text>
        <Text style={[s.footerLine, { color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)", fontSize: 10 }]}>
          v1.0.0
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:      1,
    alignItems:"center",
    justifyContent: "center",
    overflow:  "hidden",
  },

  // Brand glow orb — top-right, red, very subtle
  glow: {
    position:     "absolute",
    top:          -H * 0.15,
    right:        -W * 0.25,
    width:        W * 0.65,
    height:       W * 0.65,
    borderRadius: W * 0.325,
    opacity:      0.08,
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowRadius:  80,
        shadowOpacity: 0.5,
        shadowOffset:  { width: 0, height: 0 },
      },
    }),
  },

  col: {
    width:      W - 48,
    alignItems: "center",
  },

  // Logo
  logoRing: {
    width:        96,
    height:       96,
    borderRadius: 48,
    borderWidth:  1.5,
    padding:      3,
    alignItems:   "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowRadius:  18,
        shadowOpacity: 0.3,
        shadowOffset:  { width: 0, height: 0 },
      },
      android: { elevation: 4 },
    }),
  },
  logoInner: {
    width:        88,
    height:       88,
    borderRadius: 44,
    alignItems:   "center",
    justifyContent: "center",
    overflow:     "hidden",
  },
  logo: {
    width:  72,
    height: 72,
  },

  // Wordmark
  appName: {
    fontSize:      23,
    fontWeight:    "800",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize:      13,
    fontWeight:    "500",
    marginTop:     5,
    letterSpacing: 0.7,
  },

  // Card
  card: {
    width:        "100%",
    borderRadius: 16,
    borderWidth:  1,
    padding:      16,
  },
  statusRow: {
    flexDirection:  "row",
    alignItems:     "center",
    marginTop:      10,
    gap:            8,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  statusLabel: {
    flex:       1,
    fontSize:   12,
    fontWeight: "500",
  },
  pct: {
    fontSize:   12,
    fontWeight: "800",
  },

  // Footer
  footer: {
    position:   "absolute",
    bottom:     Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
  },
  footerLine: {
    fontSize:     11,
    marginBottom: 2,
  },

  // Retry
  retryBtn: {
    backgroundColor:   RED,
    paddingHorizontal: 36,
    paddingVertical:   13,
    borderRadius:      12,
    ...Platform.select({
      ios:     { shadowColor: RED, shadowRadius: 8, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  retryText: {
    color:      "#FFF",
    fontWeight: "700",
    fontSize:   15,
  },
});
