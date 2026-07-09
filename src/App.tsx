import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const messages = [
  "Your Digital Shield",
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

    const speed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentMessage.substring(0, displayText.length + 1));

        if (displayText === currentMessage) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentMessage.substring(0, displayText.length - 1));

        if (displayText === "") {
          setIsDeleting(false);
          setMessageIndex((prev) => (prev + 1) % messages.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, messageIndex]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.tagline}>
        {displayText}
        <Text style={styles.cursor}>|</Text>
      </Text>

      <Text style={styles.subtitle}>
        Secure • Learn • Protect
      </Text>

      <Text style={styles.version}>
        Version 0.1.0
      </Text>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  logo: {
    width: 400,
    height: 600,
    marginBottom: 12,
  },

  tagline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    minHeight: 34,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  cursor: {
    color: "#1554B8",
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  version: {
    position: "absolute",
    bottom: 40,
    fontSize: 14,
    color: "#9CA3AF",
  },
});