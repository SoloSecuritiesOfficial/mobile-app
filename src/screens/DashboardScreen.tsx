import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Image } from "react-native";

import {
  pickProfileImage,
  uploadProfileImage,
} from "../services/uploadService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
} from "../services/authService";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Dashboard"
>;

export default function DashboardScreen({
  navigation,
}: Props) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

const loadUser = async () => {
  try {
    const latestUser = await fetchCurrentUser();

    if (latestUser) {
      setUser(latestUser);
      return;
    }

    const cachedUser = await getCurrentUser();
    setUser(cachedUser);
  } catch (error) {
    console.log(error);
  }
};
const handleProfileImage = async () => {
  try {
    const image = await pickProfileImage();

    if (!image) return;

    const response =
      await uploadProfileImage(image);

    if (response.success) {
      await loadUser();

      Alert.alert(
        "Success",
        "Profile picture updated."
      );
    }
  } catch (error: any) {
    console.log(error);

    Alert.alert(
      "Upload Failed",
      error.message
    );
  }
};
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("Login");
          },
        },
      ]
    );
  };

  const actions = [
    {
      icon: "🐞",
      title: "Bug Reports",
    },
    {
      icon: "🛡️",
      title: "Security Scan",
    },
    {
      icon: "📚",
      title: "Learning",
    },
    {
      icon: "📢",
      title: "CVE Updates",
    },
    {
      icon: "🎯",
      title: "Labs",
    },
    {
      icon: "⚙️",
      title: "Settings",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}

        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>
              Welcome Back 👋
            </Text>

            <Text style={styles.username}>
             {user?.username || "User"}
            </Text>

            <Text style={styles.email}>
              {user?.email || ""}
            </Text>
          </View>
<TouchableOpacity
  style={styles.profile}
  onPress={handleProfileImage}
>
  {user?.profileImage ? (
    <Image
      source={{
        uri: `http://192.168.1.7:5000${user.profileImage}`,
      }}
      style={styles.profileImage}
    />
  ) : (
    <Text style={styles.profileText}>
      {user?.username
        ? user.username.charAt(0).toUpperCase()
        : "U"}
    </Text>
  )}
</TouchableOpacity>
        </View>

        {/* Security Score */}

        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>
            Security Score
          </Text>

          <Text style={styles.score}>
            85%
          </Text>

          <Text
            style={
              styles.scoreDescription
            }
          >
            Your security level is good.
            Keep learning and scanning.
          </Text>

          <View
            style={styles.progressTrack}
          >
            <View
              style={styles.progress}
            />
          </View>
        </View>

        {/* Quick Actions */}

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actions}>
          {actions.map(
            (item, index) => (
              <TouchableOpacity
                key={index}
                style={
                  styles.actionCard
                }
              >
                <Text
                  style={
                    styles.actionIcon
                  }
                >
                  {item.icon}
                </Text>

                <Text
                  style={
                    styles.actionText
                  }
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Activity */}

        <Text style={styles.sectionTitle}>
          Recent Activity
        </Text>

        <View
          style={styles.activityCard}
        >
          <Text
            style={styles.activityTitle}
          >
            No security activity yet
          </Text>

          <Text
            style={
              styles.activityDescription
            }
          >
            Start using the app to see
            your activity here.
          </Text>
        </View>

        {/* Logout */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>
              </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },

  welcome: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  username: {
    ...Typography.h1,
    color: Colors.text,
    marginTop: Spacing.xs,
  },

  email: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  profile: {
    width: Spacing.avatarMedium,
    height: Spacing.avatarMedium,
    borderRadius: Spacing.radiusCircle,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    ...Typography.h3,
    color: Colors.textWhite,
  },

  scoreCard: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: Spacing.radiusXL,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.xxl,
  },

  scoreTitle: {
    ...Typography.bodyMedium,
    color: Colors.textWhite,
  },

  score: {
    ...Typography.score,
    color: Colors.textWhite,
    marginTop: Spacing.sm,
  },

  scoreDescription: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#444444",
    borderRadius: Spacing.radiusCircle,
    marginTop: Spacing.lg,
    overflow: "hidden",
  },

  progress: {
    width: "85%",
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusCircle,
  },

  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
  },

  actionCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    elevation: 2,
  },

  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.md,
  },
profileImage: {
  width: "100%",
  height: "100%",
  borderRadius: 100,
},
  actionText: {
    ...Typography.labelMedium,
    color: Colors.text,
  },

  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
  },

  activityTitle: {
    ...Typography.labelLarge,
    color: Colors.text,
  },

  activityDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

  logoutButton: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.radiusLarge,
    alignItems: "center",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textWhite,
  },
});