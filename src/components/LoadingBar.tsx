import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  Text,
} from "react-native";

export default function LoadingBar() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 100,
        duration: 4000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>
        Initializing SoloSecurities...
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
    marginTop: 40,
    alignItems: "center",
  },

  loadingText: {
    marginBottom: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  track: {
    width: "100%",
    height: 8,
    backgroundColor: "#ECECEC",
    borderRadius: 100,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: "#D32F2F",
    borderRadius: 100,
  },
});