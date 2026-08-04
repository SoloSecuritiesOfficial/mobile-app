import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { getTodaySecurityTip } from "../services/securityTipService";

export default function SecurityTipCard() {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const [tip, setTip] = useState({
    title: "Loading...",
    message: "",
  });

  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTip();
  }, []);

  const loadTip = async () => {
    try {
      const response = await getTodaySecurityTip();

      if (response?.success) {
        setTip({
          title: response.data.title,
          message: response.data.message,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    Animated.parallel([
      Animated.timing(animation, {
        toValue: expanded ? 0 : 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: expanded ? 0 : 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    setExpanded(!expanded);
  };

  const bodyHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.header}
        onPress={toggleExpand}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.badge}>TODAY'S SECURITY TIP</Text>

          <Text style={styles.title}>{tip.title}</Text>

          <Text style={styles.subtitle}>
            Tap to learn something important
          </Text>
        </View>

        <Animated.Text
          style={[
            styles.arrow,
            {
              transform: [{ rotate: arrowRotation }],
            },
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.expandContainer,
          {
            height: bodyHeight,
          },
        ]}
      >
        <View style={styles.divider} />

        <Text style={styles.message}>{tip.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    paddingVertical: 35,
    alignItems: "center",
  },

  card: {
    backgroundColor: "#171717",
    borderRadius: 22,

    borderWidth: 1,
    borderColor: "#2A2A2A",

    overflow: "hidden",

    marginBottom: Spacing.xxl,

    shadowColor: "#E53935",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,

    backgroundColor: "#E53935",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  icon: {
    fontSize: 28,
  },

  textContainer: {
    flex: 1,
  },

  badge: {
    color: "#E53935",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#9E9E9E",
  },

  arrow: {
    fontSize: 18,
    color: "#E53935",
    marginLeft: 10,
  },

  expandContainer: {
    overflow: "hidden",
    backgroundColor: "#111111",
  },

  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginHorizontal: 18,
  },

  message: {
    ...Typography.bodySmall,

    color: "#F4F4F4",

    fontSize: 15,

    lineHeight: 25,

    paddingHorizontal: 20,
    paddingVertical: 18,
  },
});