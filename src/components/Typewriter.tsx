import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

const messages = [
  "Your Digital Shield",
  "Learn Cybersecurity",
  "Practice Real Scenarios",
  "Bug Hunting & Reports",
  "Threat Intelligence",
  "Secure Your Future",
];

export default function Typewriter() {
  const [displayText, setDisplayText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const cursor = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursor);
  }, []);

  // Typewriter effect
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
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, messageIndex]);

  return (
    <Text style={styles.text}>
      {displayText}
      <Text style={styles.cursor}>
        {showCursor ? "|" : " "}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    minHeight: 35,
    paddingHorizontal: 20,
  },

  cursor: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
});