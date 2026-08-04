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
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Security Score
      </Text>

      <Text style={styles.score}>
        {securityScore}%
      </Text>

      <Text style={styles.description}>
        Complete labs and learning modules
        to improve your security score.
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min(
                Math.max(securityScore, 0),
                100
              )}%`,
            },
          ]}
        />
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
  },

  title: {
    ...Typography.bodyMedium,
    color: Colors.textWhite,
  },

  score: {
    ...Typography.score,
    color: Colors.textWhite,
    marginTop: Spacing.sm,
  },

  description: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#444444",
    borderRadius: Spacing.radiusCircle,
    marginTop: Spacing.lg,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusCircle,
  },
});