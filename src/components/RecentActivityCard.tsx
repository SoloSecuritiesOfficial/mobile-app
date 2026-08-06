import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";


interface ActivityItem {
  _id?: string;
  type?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  points?: number;
}

interface Props {
  securityScore?: number;
  reports?: number;
  certificateCount?: number;
  learningCompleted?: number;
  learningTotal?: number;
  labCompleted?: number;
  labTotal?: number;
  activities?: ActivityItem[];
}

export default function RecentActivityCard({
  securityScore = 0,
  reports = 0,
  certificateCount = 0,
  learningCompleted = 0,
  learningTotal = 0,
  labCompleted = 0,
  labTotal = 0,
  activities = [],
}: Props) {
  const getActivityIcon = (type?: string) => {
    switch (type) {
      case "LAB":
        return "⚡";
      case "CERTIFICATE":
        return "🏆";
      case "LEARNING":
        return "📚";
      case "SCAN":
        return "🛡️";
      case "BUG_REPORT":
        return "🐞";
      default:
        return "🎯";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity & Live Feed ⚡</Text>

      {activities && activities.length > 0 ? (
        <View style={{ marginTop: Spacing.sm }}>
          {activities.slice(0, 4).map((item, idx) => (
            <View key={item._id || idx.toString()} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{getActivityIcon(item.type)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.activityDesc}>{item.description}</Text> : null}
              </View>
              {item.points ? <Text style={styles.pointsBadge}>+{item.points} XP</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.description}>
          Security Score : {securityScore}%{"\n\n"}
          Reports Submitted : {reports}{"\n\n"}
          Certificates Earned : {certificateCount}{"\n\n"}
          Learning Progress : {learningCompleted} / {learningTotal}{"\n\n"}
          Labs Completed : {labCompleted} / {labTotal}
        </Text>
      )}
    </View>
  );
}




const styles = StyleSheet.create({


  container: {

    backgroundColor:
      Colors.surface,


    borderRadius:
      Spacing.radiusLarge,


    padding:
      Spacing.cardPadding,


    marginBottom:
      Spacing.xxl,


    elevation: 2,


    shadowColor: "#000",

    shadowOpacity: 0.05,

    shadowRadius: 5,


    shadowOffset: {

      width: 0,

      height: 2,

    },

  },



  title: {

    ...Typography.labelLarge,

    color:
      Colors.text,

  },



  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  activityTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: "600",
  },
  activityDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pointsBadge: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 12,
  },
});