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
  const [tip, setTip] = useState({ title: "Loading...", message: "", category: "" });

  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTip();

    // Subtle pulse on the shield icon to draw attention
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const loadTip = async () => {
    try {
      const response = await getTodaySecurityTip();
      if (response?.success && response.data) {
        setTip({
          title:    response.data.title    ?? "Stay Secure",
          message:  response.data.message  ?? "",
          category: response.data.category ?? "Security",
        });
      }
    } catch (err) {
      console.log("Tip load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    setExpanded(!expanded);
  };

  const bodyHeight = expandAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 200],
  });

  const arrowRotation = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading today's tip…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>

        {/* ── Top accent line ── */}
        <View style={styles.accentLine} />

        {/* ── Header row ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.header}
          onPress={toggleExpand}
        >
          {/* Animated shield icon */}
          <Animated.View
            style={[styles.iconBox, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={styles.iconEmoji}>🛡️</Text>
          </Animated.View>

          {/* Text block */}
          <View style={styles.textBlock}>
            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>TODAY'S TIP</Text>
              </View>
              {tip.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{tip.category}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.tipTitle} numberOfLines={2}>
              {tip.title}
            </Text>

            <Text style={styles.tapHint}>
              {expanded ? "Tap to collapse" : "Tap to read more →"}
            </Text>
          </View>

          {/* Chevron */}
          <Animated.View
            style={[styles.chevronBox, { transform: [{ rotate: arrowRotation }] }]}
          >
            <Text style={styles.chevron}>⌄</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* ── Expandable body ── */}
        <Animated.View style={[styles.bodyWrap, { height: bodyHeight }]}>
          <View style={styles.bodyDivider} />
          <View style={styles.bodyContent}>
            <Text style={styles.bodyText}>{tip.message}</Text>
          </View>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  wrapper: {
    marginBottom: Spacing.lg,
  },

  // ── Loading placeholder ────────────────────────────────
  loaderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: Spacing.screen,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  // ── Card shell ────────────────────────────────────────
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0F172A",      // Deep navy — distinct from rest of dashboard
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#6366F1",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  // Coloured top stripe
  accentLine: {
    height: 4,
    backgroundColor: Colors.primary,
    width: "100%",
  },

  // ── Header ────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "44",
  },
  iconEmoji: { fontSize: 26 },

  textBlock: { flex: 1 },

  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  badgePill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  categoryPill: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryPillText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F1F5F9",
    lineHeight: 21,
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },

  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },

  // ── Expanded body ─────────────────────────────────────
  bodyWrap: {
    overflow: "hidden",
    backgroundColor: "#080F1E",
  },
  bodyDivider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginHorizontal: 16,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bodyText: {
    ...Typography.bodySmall,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 24,
  },
});
