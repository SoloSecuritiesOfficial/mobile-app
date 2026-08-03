import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

interface ActivityCardProps {
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  color?: string;
}

export default function ActivityCard({
  icon,
  title,
  subtitle,
  time,
  color = "#E53935",
}: ActivityCardProps) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: color },
        ]}
      >
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.time}>
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 16,

    marginBottom: 15,

    elevation: 3,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  iconContainer: {
    width: 54,
    height: 54,

    borderRadius: 27,

    justifyContent: "center",

    alignItems: "center",

    marginRight: 15,
  },

  icon: {
    fontSize: 24,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 16,

    fontWeight: "700",

    color: "#111",
  },

  subtitle: {
    marginTop: 4,

    color: "#666",

    fontSize: 14,
  },

  time: {
    color: "#999",

    fontSize: 12,

    fontWeight: "600",
  },
});