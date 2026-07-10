import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import LoadingBar from "../components/LoadingBar";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Splash"
>;

const messages = [
  "Your Digital Shield",
  "Secure • Learn • Protect",
  "Cybersecurity Starts Here",
  "Protecting Your Digital World",
];

export default function SplashScreen({
  navigation,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const navigationDone = useRef(false);

  const [text, setText] = useState("");

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    let charIndex = 0;
    let deleting = false;
    let currentMessage = 0;

    const typingInterval = setInterval(() => {
      const fullText = messages[currentMessage];

      if (!deleting) {
        charIndex++;

        setText(fullText.substring(0, charIndex));

        if (charIndex >= fullText.length) {
          deleting = true;
        }
      } else {
        charIndex--;

        setText(fullText.substring(0, charIndex));

        if (charIndex <= 0) {
          deleting = false;

          currentMessage =
            (currentMessage + 1) % messages.length;
        }
      }
    }, 90);

    return () => {
      clearInterval(typingInterval);
    };
  }, [fadeAnim]);

  const handleLoadingComplete = () => {
    if (navigationDone.current) return;

    navigationDone.current = true;

    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.tagline}>
          {text}
          <Text style={styles.cursor}>|</Text>
        </Text>

        <LoadingBar
          onComplete={handleLoadingComplete}
        />
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.powered}>
          Powered by SoloSecurities
        </Text>

        <Text style={styles.version}>
          Version 1.0.0
        </Text>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logo: {
    width: 260,
    height: 260,
    marginBottom: 24,
  },

  tagline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
    minHeight: 32,
    marginBottom: 30,
  },

  cursor: {
    color: "#C62828",
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
  },

  powered: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },

  version: {
    fontSize: 12,
    color: "#999999",
  },
});