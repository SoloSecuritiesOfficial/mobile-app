import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const messages = [
  "Protecting Every Click",
  "Learn Cybersecurity",
  "Think Like a Hacker",
  "Defend Like a Professional",
  "Bug Bounty Platform",
];

export default function App() {
  const [displayText, setDisplayText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentMessage = messages[messageIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentMessage.substring(0, displayText.length + 1));

        if (displayText === currentMessage) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setDisplayText(currentMessage.substring(0, displayText.length - 1));

        if (displayText === "") {
          setIsDeleting(false);
          setMessageIndex((prev) => (prev + 1) % messages.length);
        }
      }
    }, isDeleting ? 45 : 85);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, messageIndex]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.typewriter}>
          {displayText}
          <Text style={styles.cursor}>|</Text>
        </Text>

        <Text style={styles.subtitle}>
          Secure • Learn • Protect
        </Text>
      </View>

      <Text style={styles.version}>
        Version 0.1.0
      </Text>

      <StatusBar style="dark" />
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

    // Move everything slightly upward
    paddingBottom: 70,
    paddingHorizontal: 25,
  },

  logo: {
    width: 400,
    height: 600,
    marginBottom: 50,
  },

  typewriter: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    minHeight: 34,
  },

  cursor: {
    color: "#1554B8",
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#8A8A8A",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  version: {
    textAlign: "center",
    color: "#B0B0B0",
    marginBottom: 25,
    fontSize: 13,
  },
});