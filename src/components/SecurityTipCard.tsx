import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { getTodaySecurityTip } from "../services/securityTipService";

interface SecurityTip {
  title: string;
  message: string;
  category: string;
}

const DEFAULT_TIP: SecurityTip = {
  title: "Stay Secure",
  message:
    "Keep your accounts protected by using strong, unique passwords and enabling two-factor authentication wherever possible.",
  category: "Security",
};

export default function SecurityTipCard() {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tip, setTip] = useState<SecurityTip>(DEFAULT_TIP);
  const [bodyHeight, setBodyHeight] = useState(0);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ─────────────────────────────────────────────
  // Load today's security tip
  // ─────────────────────────────────────────────

  const loadTip = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getTodaySecurityTip();

      if (response?.success && response?.data) {
        setTip({
          title: response.data.title?.trim() || "Stay Secure",
          message: response.data.message?.trim() || DEFAULT_TIP.message,
          category: response.data.category?.trim() || "Security",
        });
      } else {
        setTip(DEFAULT_TIP);
      }
    } catch (error) {
      console.log("Security tip load error:", error);
      setTip(DEFAULT_TIP);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Initial load + icon pulse
  // ─────────────────────────────────────────────

  useEffect(() => {
    loadTip();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoopRef.current.start();

    return () => {
      pulseLoopRef.current?.stop();
      pulseAnim.stopAnimation();
      expandAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [loadTip, expandAnim, pulseAnim, rotateAnim]);

  // ─────────────────────────────────────────────
  // Measure actual body height
  // ─────────────────────────────────────────────

  const handleBodyLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;

    if (height > 0 && Math.abs(height - bodyHeight) > 1) {
      setBodyHeight(height);
    }
  }, [bodyHeight]);

  // ─────────────────────────────────────────────
  // Expand / collapse
  // ─────────────────────────────────────────────

  const toggleExpand = useCallback(() => {
    if (!bodyHeight) return;

    const nextValue = expanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: nextValue,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      Animated.timing(rotateAnim, {
        toValue: nextValue,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setExpanded(!expanded);
  }, [bodyHeight, expanded, expandAnim, rotateAnim]);

  // ─────────────────────────────────────────────
  // Animated styles
  // ─────────────────────────────────────────────

  const animatedBodyHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bodyHeight],
  });

  const animatedBodyOpacity = expandAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.3, 1],
  });

  const animatedBodyTranslate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>

        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>Today's Security Tip</Text>
          <Text style={styles.loadingText}>Preparing your daily tip…</Text>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Main card
  // ─────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Premium accent */}
        <View style={styles.accentLine} />

        {/* Header */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={toggleExpand}
          style={styles.header}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? "Collapse today's security tip"
              : "Expand today's security tip"
          }
          accessibilityState={{ expanded }}
        >
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconGlow}>
              <Text style={styles.shieldIcon}>🛡️</Text>
            </View>
          </Animated.View>

          {/* Main information */}
          <View style={styles.textContainer}>
            <View style={styles.badges}>
              <View style={styles.todayBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.todayBadgeText}>TODAY'S TIP</Text>
              </View>

              {tip.category.length > 0 && (
                <View style={styles.categoryBadge}>
                  <Text
                    style={styles.categoryText}
                    numberOfLines={1}
                  >
                    {tip.category}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={styles.title}
              numberOfLines={2}
            >
              {tip.title}
            </Text>

            <Text style={styles.actionText}>
              {expanded ? "Tap to hide" : "Tap to read tip"}
            </Text>
          </View>

          {/* Chevron */}
          <Animated.View
            style={[
              styles.chevronContainer,
              {
                transform: [{ rotate: arrowRotation }],
              },
            ]}
          >
            <Text style={styles.chevron}>⌄</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* 
          Hidden measurement container.
          It remains outside the visible animated height so
          the actual message height can be measured.
        */}
        <View
          pointerEvents="none"
          style={styles.measureContainer}
          onLayout={handleBodyLayout}
        >
          <View style={styles.bodyInner}>
            <Text style={styles.bodyText}>{tip.message}</Text>
          </View>
        </View>

        {/* Animated body */}
        <Animated.View
          style={[
            styles.animatedBody,
            {
              height: animatedBodyHeight,
              opacity: animatedBodyOpacity,
            },
          ]}
        >
          <View style={styles.divider} />

          <Animated.View
            style={[
              styles.bodyAnimatedContent,
              {
                transform: [
                  {
                    translateY: animatedBodyTranslate,
                  },
                ],
              },
            ]}
          >
            <View style={styles.tipIndicator}>
              <Text style={styles.tipIndicatorIcon}>💡</Text>
            </View>

            <Text style={styles.bodyText}>
              {tip.message}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: Spacing.lg,
  },

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────

  loadingCard: {
    width: "100%",
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
  },

  loadingIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary + "18",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "35",
  },

  loadingContent: {
    flex: 1,
    marginLeft: 12,
  },

  loadingTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },

  loadingText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  // ─────────────────────────────────────────────
  // Card
  // ─────────────────────────────────────────────

  card: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1E293B",

    shadowColor: Colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  accentLine: {
    width: "100%",
    height: 3,
    backgroundColor: Colors.primary,
  },

  // ─────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────

  header: {
    width: "100%",
    minHeight: 92,
    paddingHorizontal: 15,
    paddingVertical: 15,

    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 17,

    backgroundColor: Colors.primary + "16",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: Colors.primary + "38",

    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  iconGlow: {
    width: 44,
    height: 44,
    borderRadius: 14,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: Colors.primary + "0D",
  },

  shieldIcon: {
    fontSize: 27,
  },

  // ─────────────────────────────────────────────
  // Text
  // ─────────────────────────────────────────────

  textContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
    marginRight: 8,
  },

  badges: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  todayBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: Colors.primary,

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 7,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 5,
  },

  todayBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  categoryBadge: {
    maxWidth: 100,
    marginLeft: 6,

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 7,

    backgroundColor: "#172033",
    borderWidth: 1,
    borderColor: "#273449",
  },

  categoryText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },

  actionText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  // ─────────────────────────────────────────────
  // Chevron
  // ─────────────────────────────────────────────

  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 11,

    backgroundColor: "#172033",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#273449",
  },

  chevron: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: -4,
  },

  // ─────────────────────────────────────────────
  // Measurement
  // ─────────────────────────────────────────────

  measureContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 92,

    opacity: 0,

    zIndex: -1,
  },

  // ─────────────────────────────────────────────
  // Animated body
  // ─────────────────────────────────────────────

  animatedBody: {
    overflow: "hidden",
    backgroundColor: "#080E1A",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#253247",
    marginHorizontal: 15,
  },

  bodyAnimatedContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,

    flexDirection: "row",
    alignItems: "flex-start",
  },

  bodyInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,

    flexDirection: "row",
    alignItems: "flex-start",
  },

  tipIndicator: {
    width: 30,
    height: 30,
    borderRadius: 9,

    backgroundColor: Colors.primary + "18",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 10,
  },

  tipIndicatorIcon: {
    fontSize: 15,
  },

  bodyText: {
    flex: 1,

    color: "#CBD5E1",

    fontSize: 13.5,
    lineHeight: 22,

    fontWeight: "500",
  },
});