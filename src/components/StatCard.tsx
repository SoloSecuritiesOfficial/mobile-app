import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = "#E53935",
}: StatCardProps) {
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

      <Text
        numberOfLines={1}
        style={styles.value}
      >
        {value}
      </Text>

      <Text
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",

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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  icon: {
    fontSize: 24,
  },

  value: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },

  title: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
});