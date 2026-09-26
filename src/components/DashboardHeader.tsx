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
import { BASE_URL } from "../config/api";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { formatMicros } from "../services/adRewardService";

interface User {
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  role?: string;
}

interface Props {
  user: User | null;
  navigation: NativeStackNavigationProp<RootStackParamList, "Dashboard">;
  /** Live ad-reward available balance in micro-units (from backend wallet) */
  rewardBalance?: number;
}

function resolveAvatar(profileImage?: string): string | null {
  if (!profileImage) return null;
  if (profileImage.startsWith("data:image/")) return profileImage;
  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) return profileImage;
  return `${BASE_URL}${profileImage}`;
}

function SubscriptionBadge({ user }: { user: User | null }) {
  if (!user) return null;
  if (user.role === "admin") {
    return <View style={[badge.pill, { backgroundColor: "#1A237E" }]}><Text style={badge.text}>🛡️ ADMIN</Text></View>;
  }
  if (user.isPremium) {
    return <View style={[badge.pill, { backgroundColor: "#E65100" }]}><Text style={badge.text}>👑 PREMIUM</Text></View>;
  }
  return <View style={[badge.pill, { backgroundColor: "#2E7D32" }]}><Text style={badge.text}>🆓 FREE</Text></View>;
}

export default function DashboardHeader({ user, navigation, rewardBalance = 0 }: Props) {
  const avatarUri = resolveAvatar(user?.profileImage);
  const initials  = (user?.firstName || user?.username || "U").charAt(0).toUpperCase();
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => { setImageError(false); }, [avatarUri]);

  return (
    <View style={styles.container}>

      {/* Left — greeting + name + tier badge */}
      <View style={styles.leftSection}>
        <Text style={styles.welcome}>Welcome Back 👋</Text>
        <Text style={styles.name} numberOfLines={1}>
          {user?.firstName || user?.username || "User"}
        </Text>
        <SubscriptionBadge user={user} />
      </View>

      {/* Right — reward chip + avatar */}
      <View style={styles.rightSection}>

        {/* Reward balance chip — tap → AdRewards */}
        <TouchableOpacity
          style={styles.rewardChip}
          onPress={() => navigation.navigate("AdRewards")}
          activeOpacity={0.75}
        >
          <Text style={styles.rewardIcon}>💰</Text>
          <Text style={styles.rewardAmount}>{formatMicros(rewardBalance, "USD")}</Text>
        </TouchableOpacity>

        {/* Profile avatar */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.avatarContainer}
          onPress={() => navigation.navigate("Profile")}
        >
          {avatarUri && !imageError ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </TouchableOpacity>

      </View>
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
    paddingRight: 12,
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

  // right side: chip + avatar side by side
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // reward chip
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  rewardIcon:   { fontSize: 13 },
  rewardAmount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2E7D32",
  },

  // avatar
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
    shadowOffset: { width: 0, height: 3 },
  },
  avatar:     { width: "100%", height: "100%" },
  avatarText: { ...Typography.h3, color: Colors.textWhite, fontWeight: "700" },
});

const badge = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
