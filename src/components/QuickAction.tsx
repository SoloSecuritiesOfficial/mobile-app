import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "Dashboard"
  >;
};

const actions = [
  {
    title: "Bug Reports",
    icon: "🐞",
    screen: "BugReports",
  },
  {
    title: "Security Scan",
    icon: "🛡️",
    screen: "SecurityScan",
  },
  {
    title: "Learning",
    icon: "📚",
    screen: "Learning",
  },
  {
    title: "CVE Updates",
    icon: "📢",
    screen: "CVEUpdates",
  },
  {
    title: "Labs",
    icon: "🎯",
    screen: "Labs",
  },
  {
    title: "Certificates",
    icon: "🏆",
    screen: "Certificates",
  },
  {
    title: "Notifications",
    icon: "🔔",
    screen: "Notifications",
  },
  {
    title: "Settings",
    icon: "⚙️",
    screen: "Settings",
  },
] as const;

export default function QuickActions({
  navigation,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.container}>
        {actions.map((item) => (
          <TouchableOpacity
            key={item.title}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate(item.screen as never)
            }
          >
            <Text style={styles.icon}>
              {item.icon}
            </Text>

            <Text style={styles.title}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },

  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
  },

  card: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,

    borderWidth: 1,
    borderColor: "#F2F2F2",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  icon: {
    fontSize: 30,
    marginBottom: 12,
  },

  title: {
    ...Typography.labelMedium,
    color: Colors.text,
  },
});