import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";
import LogoutButton from "../components/LogoutButton";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

import {
  fetchCurrentUser,
  getCurrentUser,
} from "../services/authService";

import {
  getSecurityDashboard,
} from "../services/securityService";

import {
  getCertificates,
} from "../services/certificateService";

import {
  getUnreadNotificationCount,
} from "../services/notificationService";
import SecurityTipCard from "../components/SecurityTipCard";
import QuickActions from "../components/QuickAction";
type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "Dashboard"
  >;

interface User {
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

interface DashboardData {
  securityScore?: number;
  reports?: number;
  rank?: string;
  streak?: number;

  learningCompleted?: number;
  learningTotal?: number;

  labCompleted?: number;
  labTotal?: number;
}

export default function DashboardScreen({
  navigation,
}: Props) {

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<User | null>(null);

  const [dashboard, setDashboard] =
    useState<DashboardData>({});

  const [certificateCount,
    setCertificateCount] =
    useState(0);

  const [notificationCount,
    setNotificationCount] =
    useState(0);

  const loadDashboard =
    useCallback(async () => {

      try {

        // Latest user from backend

        const latestUser =
          await fetchCurrentUser();

        if (latestUser) {
          setUser(latestUser);
        } else {
          const cachedUser =
            await getCurrentUser();

          setUser(cachedUser);
        }

        // Dashboard

        const dashboardResponse =
          await getSecurityDashboard();

        setDashboard(
          dashboardResponse.data ??
          dashboardResponse ??
          {}
        );

        // Certificates

        const certificates =
          await getCertificates();

        setCertificateCount(

          certificates.data?.length ??

          certificates.length ??

          0

        );

        // Notifications

        const notification =
          await getUnreadNotificationCount();

        setNotificationCount(

          notification.data?.count ??

          notification.count ??

          0

        );

      } catch (error) {

        console.log(
          "Dashboard Error:",
          error
        );

      } finally {

        setLoading(false);

      }

    }, []);

  useEffect(() => {

    loadDashboard();

  }, [loadDashboard]);


  if (loading) {

    return (

      <SafeAreaView
        style={styles.loader}
      >

        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

      </SafeAreaView>

    );

  }

  return ( <SafeAreaView style={styles.container}>

  <ScrollView
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >

    {/* ================= HEADER ================= */}

    <View style={styles.header}>

      <View>

        <Text style={styles.welcome}>
          Welcome Back 👋
        </Text>

        <Text style={styles.username}>
          {
            user?.firstName ||
            user?.username ||
            "User"
          }
        </Text>

        <Text style={styles.email}>
          {user?.email ?? ""}
        </Text>

      </View>

      <TouchableOpacity
        style={styles.profile}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Profile")
        }
      >

        {
          user?.profileImage ? (

            <Image
              source={{
                uri: user.profileImage,
              }}
              style={styles.profileImage}
            />

          ) : (

            <Text style={styles.profileText}>
              {
                user?.username
                  ? user.username
                      .charAt(0)
                      .toUpperCase()
                  : "U"
              }
            </Text>

          )
        }

      </TouchableOpacity>

    </View>
    

    {/* ================= SECURITY SCORE ================= */}

    <View style={styles.scoreCard}>

      <Text style={styles.scoreTitle}>
        Security Score
      </Text>

      <Text style={styles.score}>
        {dashboard.securityScore ?? 0}%
      </Text>

      <Text style={styles.scoreDescription}>
        Complete labs and learning
        modules to improve your
        security score.
      </Text>

      <View style={styles.progressTrack}>

        <View
          style={[
            styles.progress,
            {
              width: `${
                dashboard.securityScore ?? 0
              }%`,
            },
          ]}
        />

      </View>

    </View>

    {/* ================= QUICK ACTIONS ================= */}

     <QuickActions navigation={navigation} />

    {/* ================= RECENT ACTIVITY ================= */}

    <Text style={styles.sectionTitle}>
      Recent Activity
    </Text>

    <View style={styles.activityCard}>

      <Text style={styles.activityTitle}>
        Dashboard Overview
      </Text>

      <Text style={styles.activityDescription}>
        Security Score :
        {" "}
        {dashboard.securityScore ?? 0}
        %

        {"\n\n"}

        Reports Submitted :
        {" "}
        {dashboard.reports ?? 0}

        {"\n\n"}

        Certificates Earned :
        {" "}
        {certificateCount}

        {"\n\n"}

        Learning Progress :
        {" "}
        {dashboard.learningCompleted ?? 0}
        /
        {dashboard.learningTotal ?? 0}

        {"\n\n"}

        Labs Completed :
        {" "}
        {dashboard.labCompleted ?? 0}
        /
        {dashboard.labTotal ?? 0}
      </Text>

    </View> 
         {/* ================= CYBER SECURITY TIP ================= */}

<SecurityTipCard />

        {/* ================= PROGRESS ================= */}

        <Text style={styles.sectionTitle}>
          Progress
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>

            <Text style={styles.statValue}>
              {dashboard.learningCompleted || 0}/
              {dashboard.learningTotal || 0}
            </Text>

            <Text style={styles.statLabel}>
              Learning
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>

            <Text style={styles.statValue}>
              {dashboard.labCompleted || 0}/
              {dashboard.labTotal || 0}
            </Text>

            <Text style={styles.statLabel}>
              Labs
            </Text>
          </View>
        </View>


      



    {/* ================= STATISTICS ================= */}

    <Text style={styles.sectionTitle}>
      Statistics
    </Text>

    <View style={styles.statsContainer}>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>
          🐞
        </Text>

        <Text style={styles.statValue}>
          {dashboard?.reports || 0}
        </Text>

        <Text style={styles.statLabel}>
          Reports
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>
          🏆
        </Text>

        <Text style={styles.statValue}>
          {certificateCount}
        </Text>

        <Text style={styles.statLabel}>
          Certificates
        </Text>
      </View>

    </View>

    <View style={styles.statsContainer}>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>
          🥇
        </Text>

        <Text style={styles.statValue}>
          {dashboard?.rank || "#0"}
        </Text>

        <Text style={styles.statLabel}>
          Rank
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>
          🔥
        </Text>

        <Text style={styles.statValue}>
          {dashboard?.streak || 0}
        </Text>

        <Text style={styles.statLabel}>
          Day Streak
        </Text>
      </View>

    </View>


    {/* ================= LEARNING PROGRESS ================= */}

    <Text style={styles.sectionTitle}>
      Learning Progress
    </Text>

    <View style={styles.scoreCard}>

      <Text style={styles.scoreTitle}>
        Completed Modules
      </Text>

      <Text style={styles.score}>
        {dashboard?.learningCompleted || 0}/
        {dashboard?.learningTotal || 0}
      </Text>

      <Text style={styles.scoreDescription}>
        Continue learning to improve
        your cyber security skills.
      </Text>

      <View style={styles.progressTrack}>

        <View
          style={[
            styles.progress,
            {
              width: `${
                dashboard?.learningTotal
                  ? (
                      (dashboard.learningCompleted || 0) /
                      dashboard.learningTotal
                    ) * 100
                  : 0
              }%`,
            },
          ]}
        />

      </View>

    </View>
        {/* ================= LABS PROGRESS ================= */}

    <Text style={styles.sectionTitle}>
      Labs Progress
    </Text>

    <View style={styles.scoreCard}>

      <Text style={styles.scoreTitle}>
        Completed Labs
      </Text>

      <Text style={styles.score}>
        {dashboard?.labCompleted || 0}/
        {dashboard?.labTotal || 0}
      </Text>

      <Text style={styles.scoreDescription}>
        Complete practical labs to
        strengthen your penetration
        testing skills.
      </Text>

      <View style={styles.progressTrack}>

        <View
          style={[
            styles.progress,
            {
              width: `${
                dashboard?.labTotal
                  ? (
                      (dashboard.labCompleted || 0) /
                      dashboard.labTotal
                    ) * 100
                  : 0
              }%`,
            },
          ]}
        />

      </View>

    </View>

    {/* ================= NOTIFICATIONS ================= */}

    <Text style={styles.sectionTitle}>
      Notifications
    </Text>

    <View style={styles.activityCard}>

      <Text style={styles.activityTitle}>
        Unread Notifications
      </Text>

      <Text style={styles.activityDescription}>
        You currently have{" "}
        <Text
          style={{
            fontWeight: "700",
            color: Colors.primary,
          }}
        >
          {notificationCount}
        </Text>{" "}
        unread notification
        {notificationCount === 1 ? "" : "s"}.
      </Text>

    </View>

    {/* ================= LOGOUT ================= */}

 <LogoutButton />

  </ScrollView>

</SafeAreaView>

);
}
const styles = StyleSheet.create({

  /* ================= CONTAINER ================= */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },


  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },


  content: {
    padding: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },


  /* ================= HEADER ================= */

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


  /* ================= PROFILE ================= */

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
    borderRadius: 100,
  },


  /* ================= SECURITY SCORE ================= */


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
  /* ================= QUICK ACTION CARDS ================= */

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

  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  shadowOffset: {
    width: 0,
    height: 2,
  },
},


actionIcon: {
  fontSize: 28,
  marginBottom: Spacing.md,
},


actionText: {
  ...Typography.labelMedium,
  color: Colors.text,
},



/* ================= RECENT ACTIVITY ================= */


activityCard: {
  backgroundColor: Colors.surface,
  borderRadius: Spacing.radiusLarge,
  padding: Spacing.cardPadding,
  marginBottom: Spacing.xxl,

  elevation: 2,

  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  shadowOffset: {
    width: 0,
    height: 2,
  },
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



/* ================= CYBER SECURITY TIP ================= */


tipCard: {
  backgroundColor: "#E8F5E9",
  borderRadius: Spacing.radiusLarge,
  padding: Spacing.cardPadding,
  marginBottom: Spacing.xxl,
},


tipTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#2E7D32",
  marginBottom: Spacing.sm,
},


tipText: {
  ...Typography.bodySmall,
  color: Colors.textSecondary,
  lineHeight: 22,
},



/* ================= STATISTICS ================= */


statsContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: Spacing.md,
},


statCard: {
  width: "48%",
  backgroundColor: Colors.surface,
  borderRadius: Spacing.radiusLarge,
  paddingVertical: 20,
  alignItems: "center",

  elevation: 2,

  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  shadowOffset: {
    width: 0,
    height: 2,
  },
},


statIcon: {
  fontSize: 28,
  marginBottom: 8,
},


statValue: {
  ...Typography.h2,
  color: Colors.text,
  marginBottom: 4,
},


statLabel: {
  ...Typography.bodySmall,
  color: Colors.textSecondary,
},
/* ================= LOGOUT ================= */

logoutButton: {
  marginTop: Spacing.lg,

  backgroundColor: Colors.primary,

  paddingVertical: 16,

  borderRadius: Spacing.radiusLarge,

  alignItems: "center",

  marginBottom: Spacing.xxl,
},


logoutText: {
  fontSize: 16,

  fontWeight: "700",

  color: Colors.textWhite,
},

sectionTitle: {
  ...Typography.h3,
  color: Colors.text,
  marginBottom: Spacing.md,
  marginTop: Spacing.lg,
},
});
