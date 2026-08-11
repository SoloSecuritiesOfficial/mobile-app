import React from "react";
import { View, Text, StyleSheet } from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

interface Props {
  notificationCount?: number;
}

export default function NotificationCard({ notificationCount = 0 }: Props) {
  const count = Math.max(notificationCount, 0);
  const hasNotifications = count > 0;

  return (
    <>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <Text style={styles.sectionSubtitle}>
            Security alerts and updates
          </Text>
        </View>

        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Card */}
      <View style={[styles.card, !hasNotifications && styles.cardEmpty]}>
        {/* Top */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              hasNotifications ? styles.iconActive : styles.iconInactive,
            ]}
          >
            <View style={styles.bellBody}>
              <View style={styles.bellTop} />
              <View style={styles.bellClapper} />
            </View>

            {hasNotifications && <View style={styles.notificationDot} />}
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {hasNotifications
                  ? "Unread Notifications"
                  : "You're All Caught Up"}
              </Text>
            </View>

            <Text style={styles.subtitle}>
              {hasNotifications
                ? "You have new security updates"
                : "No new security alerts right now"}
            </Text>
          </View>

          {/* Count */}
          <View style={[styles.badge, !hasNotifications && styles.badgeEmpty]}>
            <Text
              style={[
                styles.badgeText,
                !hasNotifications && styles.badgeTextEmpty,
              ]}
            >
              {count}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIcon,
              hasNotifications
                ? styles.statusIconActive
                : styles.statusIconInactive,
            ]}
          >
            <Text style={styles.statusIconText}>
              {hasNotifications ? "!" : "✓"}
            </Text>
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {hasNotifications
                ? "Action may be required"
                : "Everything looks clear"}
            </Text>

            <Text style={styles.description}>
              {hasNotifications ? (
                <>
                  You currently have{" "}
                  <Text style={styles.highlight}>{count}</Text> unread
                  notification
                  {count === 1 ? "" : "s"} waiting for review.
                </>
              ) : (
                "You're up to date with all your security notifications."
              )}
            </Text>
          </View>
        </View>

        {/* Bottom Status Bar */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View
              style={[
                styles.footerDot,
                hasNotifications
                  ? styles.footerDotActive
                  : styles.footerDotInactive,
              ]}
            />

            <Text style={styles.footerText}>
              {hasNotifications ? "New activity detected" : "No new activity"}
            </Text>
          </View>

          <Text style={styles.footerArrow}>›</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  /* Section */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,

    fontWeight: "800",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,

    marginTop: 2,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 20,

    backgroundColor: "rgba(255, 0, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.10)",
  },

  liveDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: Colors.primary,

    marginRight: 5,
  },

  liveText: {
    color: Colors.primary,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1,
  },

  /* Card */

  card: {
    backgroundColor: Colors.surface,

    borderRadius: Spacing.radiusLarge,

    padding: Spacing.cardPadding,

    marginBottom: Spacing.xxl,

    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",

    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  cardEmpty: {
    borderColor: "rgba(0,0,0,0.05)",
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 54,
    height: 54,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",

    borderWidth: 1,
  },

  iconActive: {
    backgroundColor: "rgba(255, 0, 0, 0.08)",
    borderColor: "rgba(255, 0, 0, 0.12)",
  },

  iconInactive: {
    backgroundColor: "rgba(0,0,0,0.035)",
    borderColor: "rgba(0,0,0,0.05)",
  },

  /* Bell */

  bellBody: {
    width: 22,
    height: 22,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",
  },

  bellTop: {
    width: 14,
    height: 14,

    borderWidth: 2,
    borderBottomWidth: 0,

    borderColor: Colors.primary,

    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  bellClapper: {
    position: "absolute",

    bottom: 2,

    width: 20,
    height: 2,

    backgroundColor: Colors.primary,

    borderRadius: 2,
  },

  notificationDot: {
    position: "absolute",

    top: 9,
    right: 9,

    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: Colors.primary,

    borderWidth: 2,
    borderColor: Colors.surface,
  },

  /* Info */

  info: {
    flex: 1,

    marginLeft: 14,
    marginRight: 10,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    ...Typography.labelLarge,

    color: Colors.text,

    fontWeight: "800",

    fontSize: 14,
  },

  subtitle: {
    ...Typography.bodySmall,

    color: Colors.textSecondary,

    marginTop: 4,

    lineHeight: 17,
  },

  /* Badge */

  badge: {
    minWidth: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: Colors.primary,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 9,

    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  badgeEmpty: {
    backgroundColor: "rgba(0,0,0,0.06)",

    shadowOpacity: 0,
    elevation: 0,
  },

  badgeText: {
    color: Colors.textWhite,

    fontWeight: "900",
    fontSize: 14,
  },

  badgeTextEmpty: {
    color: Colors.textSecondary,
  },

  /* Divider */

  divider: {
    height: 1,

    backgroundColor: "rgba(0,0,0,0.06)",

    marginVertical: 16,
  },

  /* Status */

  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  statusIcon: {
    width: 30,
    height: 30,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  statusIconActive: {
    backgroundColor: "rgba(255, 0, 0, 0.09)",
  },

  statusIconInactive: {
    backgroundColor: "rgba(0, 150, 80, 0.08)",
  },

  statusIconText: {
    color: Colors.primary,

    fontSize: 13,
    fontWeight: "900",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    color: Colors.text,

    fontSize: 12,
    fontWeight: "800",

    marginBottom: 3,
  },

  description: {
    ...Typography.bodyMedium,

    color: Colors.textSecondary,

    lineHeight: 20,

    fontSize: 11,
  },

  highlight: {
    color: Colors.primary,

    fontWeight: "900",
  },

  /* Footer */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: 16,
    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 7,
  },

  footerDotActive: {
    backgroundColor: Colors.primary,
  },

  footerDotInactive: {
    backgroundColor: "#4CAF50",
  },

  footerText: {
    color: Colors.textSecondary,

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 0.2,
  },

  footerArrow: {
    color: Colors.textSecondary,

    fontSize: 22,
    fontWeight: "300",

    lineHeight: 20,
  },
});
