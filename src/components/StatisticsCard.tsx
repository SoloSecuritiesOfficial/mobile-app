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
  reports?: number;
  certificates?: number;
  rank?: string;
  streak?: number;
}

export default function StatisticsCard({
  reports = 0,
  certificates = 0,
  rank = "#0",
  streak = 0,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Statistics
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>
            🐞
          </Text>

          <Text style={styles.statValue}>
            {reports}
          </Text>

          <Text style={styles.statLabel}>
            Reports
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>
            🏆
          </Text>

          <Text style={styles.statValue}>
            {certificates}
          </Text>

          <Text style={styles.statLabel}>
            Certificates
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>
            🥇
          </Text>

          <Text style={styles.statValue}>
            {rank}
          </Text>

          <Text style={styles.statLabel}>
            Rank
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>
            🔥
          </Text>

          <Text style={styles.statValue}>
            {streak}
          </Text>

          <Text style={styles.statLabel}>
            Day Streak
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

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  statCard: {
    width: "48%",
    backgroundColor: Colors.surface,

    borderRadius: Spacing.radiusLarge,

    paddingVertical: 22,

    alignItems: "center",

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

  statIcon: {
    fontSize: 30,
    marginBottom: 10,
  },

  statValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 5,
  },

  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});