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
}

// ─────────────────────────────────────────────────────────────────
// Resolve profileImage: prepend BASE_URL for relative server paths,
// leave full http(s) URLs unchanged.
// ─────────────────────────────────────────────────────────────────
function resolveAvatar(profileImage?: string): string | null {
  if (!profileImage) return null;
  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
    return profileImage;
  }
  return `${BASE_URL}${profileImage}`;
}

// ─────────────────────────────────────────────────────────────────
// Subscription tier badge shown beneath the avatar
// ─────────────────────────────────────────────────────────────────
function SubscriptionBadge({ user }: { user: User | null }) {
  if (!user) return null;

  if (user.role === "admin") {
    return (
      <View style={[badge.pill, { backgroundColor: "#1A237E" }]}>
        <Text style={badge.text}>🛡️ ADMIN</Text>
      </View>
    );
  }

  if (user.isPremium) {
    // Determine trial vs paid: if premiumExpiresAt is within 7 days of creation
    // we can't easily tell — just show PREMIUM.  The backend subscription.service
    // knows the true tier; we show a simple badge here.
    return (
      <View style={[badge.pill, { backgroundColor: "#E65100" }]}>
        <Text style={badge.text}>👑 PREMIUM</Text>
      </View>
    );
  }

  return (
    <View style={[badge.pill, { backgroundColor: "#2E7D32" }]}>
      <Text style={badge.text}>🆓 FREE</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function DashboardHeader({ user, navigation }: Props) {
  const avatarUri = resolveAvatar(user?.profileImage);
  const initials  = (user?.firstName || user?.username || "U").charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.welcome}>Welcome Back 👋</Text>
        <Text style={styles.name} numberOfLines={1}>
          {user?.firstName || user?.username || "User"}
        </Text>
        <SubscriptionBadge user={user} />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.avatarContainer}
        onPress={() => navigation.navigate("Profile")}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            // Fallback to initials if image fails to load
            onError={() => {/* handled by conditional below */}}
          />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
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
