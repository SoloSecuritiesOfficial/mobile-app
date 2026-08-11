import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

interface Props {
  securityScore?: number;
}

export default function SecurityScoreCard({
  securityScore = 0,
}: Props) {
  const score = Math.min(Math.max(securityScore, 0), 100);

  const getStatus = () => {
    if (score >= 80) {
      return {
        label: "Excellent",
        message: "Your security posture is looking strong.",
        icon: "✓",
      };
    }

    if (score >= 60) {
      return {
        label: "Good",
        message: "You're protected, but there is room to improve.",
        icon: "↗",
      };
    }

    if (score >= 40) {
      return {
        label: "Needs Attention",
        message: "Complete more security activities to improve.",
        icon: "!",
      };
    }

    return {
      label: "At Risk",
      message: "Start learning and completing labs to improve.",
      icon: "!",
    };
  };

  const status = getStatus();

  return (
    <View style={styles.card}>
      {/* Top Row */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.shieldIcon}>⌾</Text>
          </View>

          <View>
            <Text style={styles.title}>Security Score</Text>

            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE SECURITY STATUS</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreWrapper}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.percent}>%</Text>
        </View>

        <Text style={styles.scoreLabel}>SECURITY LEVEL</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Protection Level</Text>
          <Text style={styles.progressValue}>{score}/100</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progress,
              {
                width: `${score}%`,
              },
            ]}
          >
            <View style={styles.progressGlow} />
          </View>
        </View>

        <View style={styles.progressScale}>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>25</Text>
          <Text style={styles.scaleText}>50</Text>
          <Text style={styles.scaleText}>75</Text>
          <Text style={styles.scaleText}>100</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.messageContainer}>
        <View style={styles.messageIndicator} />

        <View style={styles.messageContent}>
          <Text style={styles.messageTitle}>
            {status.message}
          </Text>

          <Text style={styles.description}>
            Complete labs, challenges and learning modules
            to strengthen your security score.
          </Text>
        </View>
      </View>

      {/* Bottom Stats */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>24/7</Text>
          <Text style={styles.footerLabel}>MONITORING</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>LIVE</Text>
          <Text style={styles.footerLabel}>PROTECTION</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerItem}>
          <Text style={styles.footerValue}>∞</Text>
          <Text style={styles.footerLabel}>LEARNING</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: Spacing.radiusXL,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.xxl,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.08)",

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.md,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  shieldIcon: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: "800",
  },

  title: {
    ...Typography.bodyMedium,
    color: Colors.textWhite,
    fontWeight: "700",
    fontSize: 16,
  },

  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },

  liveText: {
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.primary,
    fontWeight: "800",
  },

  /* Status */

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: "rgba(255,255,255,0.07)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusIcon: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginRight: 5,
  },

  statusText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: "700",
  },

  /* Score */

  scoreSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  scoreWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  score: {
    ...Typography.score,
    color: Colors.textWhite,

    fontSize: 54,
    lineHeight: 60,

    fontWeight: "800",

    letterSpacing: -2,
  },

  percent: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 5,
    marginLeft: 2,
  },

  scoreLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  /* Progress */

  progressContainer: {
    marginTop: Spacing.sm,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  progressLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  progressValue: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: "800",
  },

  progressTrack: {
    height: 10,

    backgroundColor: "rgba(255,255,255,0.10)",

    borderRadius: Spacing.radiusCircle,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  progress: {
    height: "100%",

    backgroundColor: Colors.primary,

    borderRadius: Spacing.radiusCircle,

    minWidth: 4,

    position: "relative",
  },

  progressGlow: {
    position: "absolute",
    right: 0,
    top: 0,

    width: 35,
    height: "100%",

    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: Spacing.radiusCircle,
  },

  progressScale: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 6,
  },

  scaleText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "600",
  },

  /* Message */

  messageContainer: {
    flexDirection: "row",

    marginTop: Spacing.xl,
    padding: 12,

    backgroundColor: "rgba(255,255,255,0.04)",

    borderRadius: 12,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  messageIndicator: {
    width: 3,

    borderRadius: 3,

    backgroundColor: Colors.primary,

    marginRight: 10,
  },

  messageContent: {
    flex: 1,
  },

  messageTitle: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },

  description: {
    ...Typography.bodySmall,

    color: Colors.textMuted,

    marginTop: 4,

    lineHeight: 17,

    fontSize: 10,
  },

  /* Footer */

  footer: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: Spacing.lg,
    paddingTop: Spacing.md,

    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  footerItem: {
    flex: 1,
    alignItems: "center",
  },

  footerValue: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  footerLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});