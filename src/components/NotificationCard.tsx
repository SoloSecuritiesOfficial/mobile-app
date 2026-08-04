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
  notificationCount?: number;
}

export default function NotificationCard({
  notificationCount = 0,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Notifications
      </Text>

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.title}>
              Unread Notifications
            </Text>

            <Text style={styles.subtitle}>
              Stay updated with the latest alerts
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.description}>
          You currently have{" "}
          <Text style={styles.highlight}>
            {notificationCount}
          </Text>{" "}
          unread notification
          {notificationCount === 1 ? "" : "s"}.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: Colors.surface,

    borderRadius: Spacing.radiusLarge,

    padding: Spacing.cardPadding,

    marginBottom: Spacing.xxl,

    borderWidth: 1,
    borderColor: "#F2F2F2",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#FFF4E5",

    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 24,
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    ...Typography.labelLarge,
    color: Colors.text,
  },

  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  badge: {
    minWidth: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: Colors.primary,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 8,
  },

  badgeText: {
    color: Colors.textWhite,
    fontWeight: "700",
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },

  description: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  highlight: {
    color: Colors.primary,
    fontWeight: "700",
  },
});