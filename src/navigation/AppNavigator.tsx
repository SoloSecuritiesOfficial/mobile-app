import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef } from "./navigationRef";

// RootStackParamList lives in types.ts — NOT defined here — so that
// navigationRef.ts can import it without pulling in AppNavigator and every
// screen it imports, which was the root cause of the circular-dependency crash.
import { RootStackParamList } from "./types";

// Re-export so existing imports of RootStackParamList from AppNavigator still
// compile without changes (tasks 4 will migrate them, but this keeps the
// build green in the meantime).
export type { RootStackParamList };

import ErrorBoundary from "../components/ErrorBoundary";

// ── Auth ───────────────────────────────────────────────────────────────────
import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import NotificationPermissionScreen from "../screens/auth/NotificationPermissionScreen";

// ── Dashboard ──────────────────────────────────────────────────────────────
import DashboardScreen from "../screens/dashboard/DashboardScreen";

// ── Learning & Labs ────────────────────────────────────────────────────────
import LearningScreen from "../screens/learning/LearningScreen";
import LearningDetailsScreen from "../screens/learning/LearningDetailsScreen";
import LabsScreen from "../screens/learning/LabsScreen";
import LabDetailsScreen from "../screens/learning/LabDetailsScreen";

// ── Quiz ───────────────────────────────────────────────────────────────────
import QuizScreen from "../screens/quiz/QuizScreen";
import QuizQuestionScreen from "../screens/quiz/QuizQuestionScreen";

// ── Security ───────────────────────────────────────────────────────────────
import SecurityScanScreen from "../screens/security/SecurityScanScreen";
import ScanHistoryScreen from "../screens/security/ScanHistoryScreen";
import CVEUpdatesScreen from "../screens/security/CVEUpdatesScreen";
import BugReportsScreen from "../screens/security/BugReportsScreen";

// ── Certificates ───────────────────────────────────────────────────────────
import CertificateScreen from "../screens/certificates/CertificateScreen";
import CertificateDetailsScreen from "../screens/certificates/CertificateDetailsScreen";

// ── Profile ────────────────────────────────────────────────────────────────
import ProfileScreen from "../screens/profile/ProfileScreen";
import ProfileSettingsScreen from "../screens/profile/ProfileSettingsScreen";
import AccountSettingsScreen from "../screens/profile/AccountSettingsScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import NotificationScreen from "../screens/profile/NotificationScreen";

// ── Jobs ───────────────────────────────────────────────────────────────────
import JobsScreen from "../screens/jobs/JobsScreen";
import JobDetailsScreen from "../screens/jobs/JobDetailsScreen";

// ── Chat ───────────────────────────────────────────────────────────────────
import ChatListScreen from "../screens/chat/ChatListScreen";
import ChatScreen from "../screens/chat/ChatScreen";

// ── Social ─────────────────────────────────────────────────────────────────
import FriendsScreen from "../screens/social/FriendsScreen";
import FriendProfileScreen from "../screens/social/FriendProfileScreen";
import LeaderboardScreen from "../screens/social/LeaderboardScreen";
import AchievementsScreen from "../screens/social/AchievementsScreen";

// ── Premium & CTF ──────────────────────────────────────────────────────────
import PremiumScreen from "../screens/premium/PremiumScreen";
import CTFScreen from "../screens/premium/CTFScreen";

// ── Tools ──────────────────────────────────────────────────────────────────
import PasswordCheckerScreen from "../screens/tools/PasswordCheckerScreen";
import HashGeneratorScreen from "../screens/tools/HashGeneratorScreen";
import ToolsScreen from "../screens/tools/ToolsScreen";

// ── Rewards ────────────────────────────────────────────────────────────────
import AdRewardScreen from "../screens/rewards/AdRewardScreen";

function withErrorBoundary<P extends object>(Component: React.ComponentType<P>) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        <Stack.Screen name="Splash"                  component={withErrorBoundary(SplashScreen)} />
        <Stack.Screen name="Login"                   component={withErrorBoundary(LoginScreen)} />
        <Stack.Screen name="Register"                component={withErrorBoundary(RegisterScreen)} />
        <Stack.Screen name="ForgotPassword"          component={withErrorBoundary(ForgotPasswordScreen)} />
        <Stack.Screen name="NotificationPermission"  component={withErrorBoundary(NotificationPermissionScreen)} />
        <Stack.Screen name="Dashboard"               component={withErrorBoundary(DashboardScreen)} />
        <Stack.Screen name="Learning"                component={withErrorBoundary(LearningScreen)} />
        <Stack.Screen name="LearningDetails"         component={withErrorBoundary(LearningDetailsScreen)} />
        <Stack.Screen name="Labs"                    component={withErrorBoundary(LabsScreen)} />
        <Stack.Screen name="LabDetails"              component={withErrorBoundary(LabDetailsScreen)} />
        <Stack.Screen name="Quiz"                    component={withErrorBoundary(QuizScreen)} />
        <Stack.Screen name="QuizQuestion"            component={withErrorBoundary(QuizQuestionScreen)} />
        <Stack.Screen name="SecurityScan"            component={withErrorBoundary(SecurityScanScreen)} />
        <Stack.Screen name="ScanHistory"             component={withErrorBoundary(ScanHistoryScreen)} />
        <Stack.Screen name="CVEUpdates"              component={withErrorBoundary(CVEUpdatesScreen)} />
        <Stack.Screen name="BugReports"              component={withErrorBoundary(BugReportsScreen)} />
        <Stack.Screen name="Certificates"            component={withErrorBoundary(CertificateScreen)} />
        <Stack.Screen name="CertificateDetails"      component={withErrorBoundary(CertificateDetailsScreen)} />
        <Stack.Screen name="Profile"                 component={withErrorBoundary(ProfileScreen)} />
        <Stack.Screen name="ProfileSettings"         component={withErrorBoundary(ProfileSettingsScreen)} />
        <Stack.Screen name="AccountSettings"         component={withErrorBoundary(AccountSettingsScreen)} />
        <Stack.Screen name="Settings"                component={withErrorBoundary(SettingsScreen)} />
        <Stack.Screen name="Notifications"           component={withErrorBoundary(NotificationScreen)} />
        <Stack.Screen name="Jobs"                    component={withErrorBoundary(JobsScreen)} />
        <Stack.Screen name="JobDetails"              component={withErrorBoundary(JobDetailsScreen)} />
        <Stack.Screen name="ChatList"                component={withErrorBoundary(ChatListScreen)} />
        <Stack.Screen name="Chat"                    component={withErrorBoundary(ChatScreen)} />
        <Stack.Screen name="Friends"                 component={withErrorBoundary(FriendsScreen)} />
        <Stack.Screen name="FriendProfile"           component={withErrorBoundary(FriendProfileScreen)} />
        <Stack.Screen name="Leaderboard"             component={withErrorBoundary(LeaderboardScreen)} />
        <Stack.Screen name="Achievements"            component={withErrorBoundary(AchievementsScreen)} />
        <Stack.Screen name="Premium"                 component={withErrorBoundary(PremiumScreen)} />
        <Stack.Screen name="CTF"                     component={withErrorBoundary(CTFScreen)} />
        <Stack.Screen name="PasswordChecker"         component={withErrorBoundary(PasswordCheckerScreen)} />
        <Stack.Screen name="HashGenerator"           component={withErrorBoundary(HashGeneratorScreen)} />
        <Stack.Screen name="Tools"                   component={withErrorBoundary(ToolsScreen)} />
        <Stack.Screen name="AdRewards"               component={withErrorBoundary(AdRewardScreen)} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
