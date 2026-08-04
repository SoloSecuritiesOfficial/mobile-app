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
  completed?: number;
  total?: number;
}

export default function LearningProgressCard({
  completed = 0,
  total = 0,
}: Props) {
  const percentage =
    total > 0
      ? (completed / total) * 100
      : 0;

  return (
    <>
      <Text style={styles.sectionTitle}>
        Learning Progress
      </Text>

      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Completed Modules
            </Text>

            <Text style={styles.subtitle}>
              Continue learning to improve your
              cyber security skills.
            </Text>
          </View>

          <Text style={styles.icon}>
            📚
          </Text>
        </View>

        <Text style={styles.value}>
          {completed}/{total}
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progress,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Math.round(percentage)}% Completed
          </Text>

          <Text style={styles.footerText}>
            {total - completed} Remaining
          </Text>
        </View>
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
    backgroundColor: Colors.dashboardHeader,

    borderRadius: Spacing.radiusXL,

    padding: Spacing.cardPadding,

    marginBottom: Spacing.xxl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    ...Typography.bodyMedium,
    color: Colors.textWhite,
    fontWeight: "700",
  },

  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 240,
  },

  icon: {
    fontSize: 30,
  },

  value: {
    ...Typography.score,
    color: Colors.textWhite,
    marginTop: 20,
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#444444",
    borderRadius: Spacing.radiusCircle,
    overflow: "hidden",
    marginTop: 18,
  },

  progress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusCircle,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  footerText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
});