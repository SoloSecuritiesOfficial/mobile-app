import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  RefreshControl,
  Modal,
} from "react-native";

import {
  pickProfileImage,
  uploadProfileImage,
} from "../services/uploadService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

import { BASE_URL } from "../config/api";
import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
} from "../services/authService";
import { getSecurityDashboard } from "../services/securityService";

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
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const latestUser = await fetchCurrentUser();
      if (latestUser) {
        setUser(latestUser);
      } else {
        const cachedUser = await getCurrentUser();
        setUser(cachedUser);
      }

      const dashRes = await getSecurityDashboard();
      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProfileImage = async () => {
    setProfileModalVisible(false);
    try {
      const image = await pickProfileImage();
      if (!image) return;

      const response = await uploadProfileImage(image);
      if (response.success) {
        await loadData();
        Alert.alert("Success", "Profile picture updated.");
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert("Upload Failed", error.message);
    }
  };

  const handleLogout = () => {
    setProfileModalVisible(false);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
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
      icon: "🔑",
      title: "Password Checker",
      screen: "PasswordChecker" as const,
    },
    {
      icon: "🔐",
      title: "Hash Generator",
      screen: "HashGenerator" as const,
    },
    {
      icon: "🐞",
      title: "Bug Reports",
      screen: "BugReports" as const,
    },
    {
      icon: "🛡️",
      title: "Security Scan",
      screen: "SecurityScan" as const,
    },
    {
      icon: "📚",
      title: "Learning",
      screen: "Learning" as const,
    },
    {
      icon: "📢",
      title: "CVE Updates",
      screen: "CVEUpdates" as const,
    },
    {
      icon: "🎯",
      title: "Labs",
      screen: "Labs" as const,
    },
    {
      icon: "⚙️",
      title: "Settings",
      screen: "Settings" as const,
    },
  ];

  const scorePercentage = dashboardData?.score || 85;
  const recentActivities = dashboardData?.recentActivity || [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome Back 👋</Text>
            <Text style={styles.username}>{user?.username || "Security Analyst"}</Text>
            <Text style={styles.email}>{user?.email || ""}</Text>
          </View>

          <TouchableOpacity
            style={styles.profile}
            onPress={() => setProfileModalVisible(true)}
          >
            {user?.profileImage ? (
              <Image
                source={{
                  uri: `${BASE_URL}${user.profileImage}`,
                }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileText}>
                {user?.username ? user.username.charAt(0).toUpperCase() : "S"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Security Posture Score</Text>
          <Text style={styles.score}>{scorePercentage}%</Text>
          <Text style={styles.scoreDescription}>
            {scorePercentage >= 80
              ? "Your security rating is strong. Continue performing scans and learning."
              : "Security checks required. Run a domain scan or check CVEs."}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progress, { width: `${scorePercentage}%` }]} />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {actions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.actionIcon}>{item.icon}</Text>
              <Text style={styles.actionText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {recentActivities.length === 0 ? (
            <View>
              <Text style={styles.activityTitle}>No security activity yet</Text>
              <Text style={styles.activityDescription}>
                Perform domain security scans or submit bug reports to view live logs here.
              </Text>
            </View>
          ) : (
            recentActivities.map((act: any, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.activityItem,
                  idx < recentActivities.length - 1 && styles.activityItemBorder,
                ]}
              >
                <View style={styles.activityRow}>
                  <Text style={styles.actTitle}>{act.title}</Text>
                  <Text style={styles.actType}>{act.type}</Text>
                </View>
                <Text style={styles.actDetail}>{act.detail}</Text>
                <Text style={styles.actDate}>
                  {new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Profile Popup Modal (ONLY Profile Picture Change & Logout) */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={styles.profileMenuCard}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.menuUsername}>{user?.username || "User"}</Text>
                <Text style={styles.menuEmail}>{user?.email || ""}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>ROLE: {user?.role ? user.role.toUpperCase() : "USER"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleProfileImage}>
              <Text style={styles.menuItemText}>🖼️  Change Profile Picture</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 4 }]}
              onPress={handleLogout}
            >
              <Text style={[styles.menuItemText, { color: "#EF4444", fontWeight: "700" }]}>
                🚪  Logout
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    overflow: "hidden",
  },
  profileText: {
    ...Typography.h3,
    color: Colors.textWhite,
  },
  profileImage: {
    width: "100%",
    height: "100%",
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
  activityItem: {
    paddingVertical: 8,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actTitle: {
    ...Typography.labelMedium,
    color: Colors.text,
    flex: 1,
  },
  actType: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: "700",
  },
  actDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actDate: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 20,
  },
  profileMenuCard: {
    width: 260,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  menuAvatarText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
  },
  menuUsername: {
    ...Typography.labelLarge,
    color: Colors.text,
  },
  menuEmail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  roleBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});