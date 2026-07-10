import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LoadingBarProps = {
  onComplete?: () => void;
};

const loadingMessages = [
  "Initializing Application...",
  "Loading Security Modules...",
  "Connecting Secure Services...",
  "Preparing Dashboard...",
  "Verifying System...",
  "System Ready ✓",
];

export default function LoadingBar({
  onComplete,
}: LoadingBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  const [messageIndex, setMessageIndex] = useState(0);

  const completed = useRef(false);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    const messageTimer = setInterval(() => {
      setMessageIndex((current) => {
        if (current < loadingMessages.length - 1) {
          return current + 1;
        }

        return current;
      });
    }, 800);


    const finishTimer = setTimeout(() => {
      if (!completed.current) {
        completed.current = true;

        onComplete?.();
      }
    }, 5200);


    return () => {
      clearInterval(messageTimer);
      clearTimeout(finishTimer);
    };
  }, []);


  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });


  return (
    <View style={styles.container}>

      <Text style={styles.loadingText}>
        {loadingMessages[messageIndex]}
      </Text>


      <View style={styles.track}>
        <Animated.View
          style={[
            styles.progress,
            {
              width,
            },
          ]}
        />
      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    width: "85%",
    marginTop: 35,
    alignItems: "center",
  },


  loadingText: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 0.3,
  },


  track: {
    width: "100%",
    height: 8,
    backgroundColor: "#E6E6E6",
    borderRadius: 100,
    overflow: "hidden",
  },


  progress: {
    height: "100%",
    backgroundColor: "#C62828",
    borderRadius: 100,
  },

});