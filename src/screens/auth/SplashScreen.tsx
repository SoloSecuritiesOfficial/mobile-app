/**
 * SplashScreen.tsx
 *
 * Branded startup screen with a REAL progress bar driven by useStartup().
 *
 * Runs for ALL users — authenticated and unauthenticated alike — so every
 * app launch has the same consistent branded experience.
 *
 * What it does:
 *   1. Calls useStartup() which runs the startup coordinator.
 *   2. Animates the progress bar in sync with actual task completion.
 *   3. Hides the native splash screen at phase D (90%) so there is
 *      no white-screen gap between the native and custom splash.
 *   4. On completion, calls signIn() (if authenticated) or lets the
 *      AuthNavigator naturally show Login (if not authenticated).
 *   5. On fatal error, shows an error state with a retry button.
 *
 * Visual elements (unchanged from original design):
 *   - SoloSecurities logo (assets/images/logo.png)
 *   - Red (#C62828) animated progress bar
 *   - Current task label above the bar
 *   - "Powered by SoloSecurities" + version footer
 */

import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { useAuth }         from "../../context/AuthContext";
import { useStartupData }  from "../../context/StartupContext";
import { useStartup }      from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─────────────────────────────────────────────────────────────────────────────
// Animated progress bar — updates smoothly when progress value changes
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue:        progress,
      duration:       350,          // smooth but not sluggish
      useNativeDriver: false,       // width cannot use native driver
    }).start();
  }, [progress, animWidth]);

  const barWidth = animWidth.interpolate({
    inputRange:  [0, 100],
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
    width:           "100%",
    height:          6,
    backgroundColor: "#E6E6E6",
    borderRadius:    100,
    overflow:        "hidden",
  },
  fill: {
    height:          "100%",
    backgroundColor: "#C62828",
    borderRadius:    100,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const { signIn }          = useAuth();
  const { setStartupData }  = useStartupData();

  const fadeAnim            = useRef(new Animated.Value(0)).current;
  const completedRef        = useRef(false);

  // Called by useStartup when all tasks complete.
  const handleComplete = useCallback((data: StartupData) => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Share preloaded data with Dashboard via context.
    setStartupData(data);

    if (data.isAuthenticated) {
      // Swap to the authenticated stack. AppNavigator handles the transition.
      signIn();
    }
    // If not authenticated, AuthNavigator naturally advances to Login
    // because Splash has no "next" route to push and remains at the
    // bottom of the AuthStack — Login is the next screen available.
    // (The AuthNavigator has Login as a sibling; screens navigating to
    // Login from here should use navigation.navigate("Login") if needed,
    // but the existing LoginScreen link handles this organically.)
  }, [signIn, setStartupData]);

  // Startup coordinator — runs tasks and reports progress.
  const { progress, currentLabel, hasFatalError, fatalMessage, retry } =
    useStartup(handleComplete);

  // Fade in the splash content on mount.
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (hasFatalError) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.errorTitle}>Startup Failed</Text>
        <Text style={styles.errorMessage}>{fatalMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retry}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Normal startup UI ────────────────────────────────────────────────────
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

        {/* Task label — reflects what's actually happening */}
        <Text style={styles.taskLabel}>{currentLabel}</Text>

        {/* Progress bar — driven by real task completion */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles — matches original SoloSecurities visual identity
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#FFFFFF",
    justifyContent:  "center",
    alignItems:      "center",
  },

  content: {
    width:           "100%",
    alignItems:      "center",
    paddingHorizontal: 40,
  },

  logo: {
    width:        SCREEN_WIDTH * 0.55,
    height:       SCREEN_WIDTH * 0.55,
    marginBottom: 32,
  },

  taskLabel: {
    fontSize:     13,
    fontWeight:   "600",
    color:        "#888888",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  barWrap: {
    width:      "100%",
    alignItems: "stretch",
  },

  pct: {
    marginTop:  5,
    fontSize:   11,
    color:      "#BBBBBB",
    alignSelf:  "flex-end",
    fontWeight: "600",
  },

  // Error state
  errorTitle: {
    fontSize:     18,
    fontWeight:   "700",
    color:        "#111",
    marginTop:    24,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize:   13,
    color:      "#666",
    textAlign:  "center",
    paddingHorizontal: 32,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor:  "#C62828",
    paddingHorizontal: 32,
    paddingVertical:   12,
    borderRadius:      10,
  },
  retryBtnText: {
    color:      "#FFF",
    fontWeight: "700",
    fontSize:   15,
  },

  // Footer
  footer: {
    position:   "absolute",
    bottom:     30,
    alignItems: "center",
  },
  powered: {
    fontSize:     13,
    color:        "#888888",
    marginBottom: 3,
  },
  version: {
    fontSize: 11,
    color:    "#BBBBBB",
  },
});
