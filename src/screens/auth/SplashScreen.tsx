import React, { useEffect, useRef } from "react";
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

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const barAnim     = useRef(new Animated.Value(0)).current;
  const didNavigate = useRef(false);

  // Safe navigate — only once, never crashes
  const goNext = (loggedIn: boolean) => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    navigation.replace(loggedIn ? "Dashboard" : "Login");
  };

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

    // Hard timeout — if anything hangs, navigate after 3 s no matter what
    const hardTimeout = setTimeout(() => goNext(false), 3000);

    // Check auth token — resolves quickly from SecureStore
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        clearTimeout(hardTimeout);
        // Small delay so the bar visually finishes
        setTimeout(() => goNext(loggedIn), 300);
      } catch {
        clearTimeout(hardTimeout);
        setTimeout(() => goNext(false), 300);
      }
    };

    // Small initial delay so the splash renders before async work starts
    const startTimer = setTimeout(checkAuth, 400);

    return () => {
      clearTimeout(hardTimeout);
      clearTimeout(startTimer);
    };
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

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

        {/* Loading bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
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
