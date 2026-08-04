import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

interface User {
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

interface Props {
  user: User | null;
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "Dashboard"
  >;
}

export default function DashboardHeader({
  user,
  navigation,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.welcome}>
          Welcome Back 👋
        </Text>

        <Text style={styles.name}>
          {user?.firstName ||
            user?.username ||
            "User"}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.avatarContainer}
        onPress={() =>
          navigation.navigate("Profile")
        }
      >
        {user?.profileImage ? (
          <Image
            source={{
              uri: user.profileImage,
            }}
            style={styles.avatar}
          />
        ) : (
          <Text style={styles.avatarText}>
            {(
              user?.firstName ||
              user?.username ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },

  leftSection: {
    flex: 1,
    paddingRight: 16,
  },

  welcome: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  name: {
    ...Typography.h1,
    color: Colors.text,
    marginTop: Spacing.xs,
  },

  email: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  avatarContainer: {
    width: Spacing.avatarMedium,
    height: Spacing.avatarMedium,

    borderRadius: Spacing.radiusCircle,

    backgroundColor: Colors.primary,

    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",

    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    ...Typography.h3,
    color: Colors.textWhite,
    fontWeight: "700",
  },
});