/**
 * SplashScreen.tsx
 *
 * Checks whether a stored access token exists, then updates the
 * global AuthContext so AppNavigator can render the correct stack.
 *
 * C3: This screen no longer navigates directly to Dashboard or Login.
 * Instead it calls signIn() or leaves the AuthStack in place —
 * the navigator automatically transitions between stacks.
 */

import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { isLoggedIn } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SplashScreen() {
  const { signIn } = useAuth();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const barAnim    = useRef(new Animated.Value(0)).current;
  const didRun     = useRef(false);

  useEffect(() => {
    // Fade in the splash content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animate the progress bar over ~1.5 s
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Hard timeout — navigate no matter what after 3 s
    const hardTimeout = setTimeout(() => {
      if (!didRun.current) {
        didRun.current = true;
        // No stored token → stay on AuthStack (Login will render)
      }
    }, 3000);

    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        clearTimeout(hardTimeout);
        if (loggedIn && !didRun.current) {
          didRun.current = true;
          // Small delay so the bar visually finishes
          setTimeout(() => signIn(), 300);
        }
        // If not logged in, the AuthStack stays rendered — Login is next.
      } catch {
        clearTimeout(hardTimeout);
        // Auth check failed — stay on AuthStack
      }
    };

    // Small initial delay so the splash renders before async work starts
    const startTimer = setTimeout(checkAuth, 400);

    return () => {
      clearTimeout(hardTimeout);
      clearTimeout(startTimer);
    };
  }, [signIn]);

  const barWidth = barAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </Animated.View>

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
    paddingHorizontal: 40,
  },
  logo: {
    width:        SCREEN_WIDTH * 0.55,
    height:       SCREEN_WIDTH * 0.55,
    marginBottom: 40,
  },
  barTrack: {
    width:           "100%",
    height:          6,
    backgroundColor: "#E6E6E6",
    borderRadius:    100,
    overflow:        "hidden",
  },
  barFill: {
    height:          "100%",
    backgroundColor: "#C62828",
    borderRadius:    100,
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
