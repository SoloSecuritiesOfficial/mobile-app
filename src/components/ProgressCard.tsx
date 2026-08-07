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
  learningCompleted?: number;
  learningTotal?: number;
  labCompleted?: number;
  labTotal?: number;
}

export default function ProgressCard({
  learningCompleted = 0,
  learningTotal = 0,
  labCompleted = 0,
  labTotal = 0,
}: Props) {

  const learningPct = learningTotal > 0
    ? Math.min(Math.round((learningCompleted / learningTotal) * 100), 100)
    : 0;

  const labPct = labTotal > 0
    ? Math.min(Math.round((labCompleted / labTotal) * 100), 100)
    : 0;

  const labRemaining  = Math.max(labTotal - labCompleted, 0);
  const learnRemaining = Math.max(learningTotal - learningCompleted, 0);

  return (
    <>
      <Text style={styles.sectionTitle}>
        Progress
      </Text>

      <View style={styles.container}>
        {/* Learning */}
        <View style={styles.card}>
          <Text style={styles.icon}>📚</Text>
          <Text style={styles.value}>
            {learningCompleted}/{learningTotal}
          </Text>
          <Text style={styles.label}>Learning</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progress, { width: `${learningPct}%` }]} />
          </View>
          <Text style={styles.pctText}>{learningPct}% • {learnRemaining} left</Text>
        </View>

        {/* Labs */}
        <View style={styles.card}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.value}>
            {labCompleted}/{labTotal}
          </Text>
          <Text style={styles.label}>Labs</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progress, { width: `${labPct}%` }]} />
          </View>
          <Text style={styles.pctText}>{labPct}% • {labRemaining} left</Text>
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

  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
  },

  card: {
    width: "48%",

    backgroundColor: Colors.surface,

    borderRadius: Spacing.radiusLarge,

    padding: Spacing.cardPadding,

    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  icon: {
    fontSize: 30,
    marginBottom: 10,
  },

  value: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },

  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  progressTrack: {
    width: "100%",
    height: 6,

    backgroundColor: "#E5E7EB",

    borderRadius: 20,

    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },

  pctText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
    fontSize: 11,
  },
});