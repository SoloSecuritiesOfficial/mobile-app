import React, { useEffect } from "react";
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Typewriter from "../components/Typewriter";
import LoadingBar from "../components/LoadingBar";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Navigate to Login Screen");
      // Navigation will be added later.
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.content}>
        <Image
          source={require("../../assets/images/logo.png")}
          resizeMode="contain"
          style={styles.logo}
        />

        <Typewriter />

        <Text style={styles.subtitle}>
          Secure • Learn • Protect
        </Text>

        <LoadingBar />
      </View>

      <Text style={styles.version}>
        Version 0.1.0
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,

    // Move everything slightly upward
    paddingBottom: 60,
  },

  logo: {
    width: 400,
    height: 600,
    marginBottom: 30,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#7A7A7A",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  version: {
    textAlign: "center",
    marginBottom: 25,
    color: "#B0B0B0",
    fontSize: 13,
  },
});