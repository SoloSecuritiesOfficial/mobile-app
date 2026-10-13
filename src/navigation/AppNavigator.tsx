/**
 * AppNavigator.tsx
 *
 * C3 — Auth guard: screens are split into two stacks.
 *
 *   AuthStack  — public screens (Login, Register, ForgotPassword)
 *   AppStack   — authenticated screens (Dashboard and everything else)
 *
 * The navigator renders ONLY the correct stack based on
 * AuthContext.isAuthenticated. This makes it impossible to reach any
 * authenticated screen via deep link or navigation.navigate() without
 * a stored access token — the navigator simply won't render those routes.
 *
 * Flow:
 *   App opens → SplashScreen (AuthStack) checks token → calls signIn() or
 *   stays on Login → AuthContext re-renders → AppStack replaces AuthStack.
 */

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef } from "./navigationRef";

// RootStackParamList lives in types.ts (not here) to avoid circular deps.
import { RootStackParamList } from "./types";
export type { RootStackParamList };

import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";

// ── Auth screens ───────────────────────────────────────────────────────────
import SplashScreen                from "../screens/auth/SplashScreen";
import LoginScreen                 from "../screens/auth/LoginScreen";
import RegisterScreen              from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen        from "../screens/auth/ForgotPasswordScreen";
import NotificationPermissionScreen from "../screens/auth/NotificationPermissionScreen";

// ── Dashboard ──────────────────────────────────────────────────────────────
import DashboardScreen             from "../screens/dashboard/DashboardScreen";

// ── Learning & Labs ────────────────────────────────────────────────────────
import LearningScreen              from "../screens/learning/LearningScreen";
import LearningDetailsScreen       from "../screens/learning/LearningDetailsScreen";
import LabsScreen                  from "../screens/learning/LabsScreen";
import LabDetailsScreen            from "../screens/learning/LabDetailsScreen";

// ── Quiz ───────────────────────────────────────────────────────────────────
import QuizScreen                  from "../screens/quiz/QuizScreen";
import QuizQuestionScreen          from "../screens/quiz/QuizQuestionScreen";

// ── Security ───────────────────────────────────────────────────────────────
import SecurityScanScreen          from "../screens/security/SecurityScanScreen";
import ScanHistoryScreen           from "../screens/security/ScanHistoryScreen";
import CVEUpdatesScreen            from "../screens/security/CVEUpdatesScreen";
import BugReportsScreen            from "../screens/security/BugReportsScreen";

// ── Certificates ───────────────────────────────────────────────────────────
import CertificateScreen           from "../screens/certificates/CertificateScreen";
import CertificateDetailsScreen    from "../screens/certificates/CertificateDetailsScreen";

// ── Profile ────────────────────────────────────────────────────────────────
import ProfileScreen               from "../screens/profile/ProfileScreen";
import ProfileSettingsScreen       from "../screens/profile/ProfileSettingsScreen";
import AccountSettingsScreen       from "../screens/profile/AccountSettingsScreen";
import SettingsScreen              from "../screens/profile/SettingsScreen";
import NotificationScreen          from "../screens/profile/NotificationScreen";

// ── Jobs ───────────────────────────────────────────────────────────────────
import JobsScreen                  from "../screens/jobs/JobsScreen";
import JobDetailsScreen            from "../screens/jobs/JobDetailsScreen";

// ── Chat ───────────────────────────────────────────────────────────────────
import ChatListScreen              from "../screens/chat/ChatListScreen";
import ChatScreen                  from "../screens/chat/ChatScreen";

// ── Social ─────────────────────────────────────────────────────────────────
import FriendsScreen               from "../screens/social/FriendsScreen";
import FriendProfileScreen         from "../screens/social/FriendProfileScreen";
import LeaderboardScreen           from "../screens/social/LeaderboardScreen";
import AchievementsScreen          from "../screens/social/AchievementsScreen";

// ── Premium & CTF ──────────────────────────────────────────────────────────
import PremiumScreen               from "../screens/premium/PremiumScreen";
import CTFScreen                   from "../screens/premium/CTFScreen";

// ── Tools ──────────────────────────────────────────────────────────────────
import PasswordCheckerScreen       from "../screens/tools/PasswordCheckerScreen";
import HashGeneratorScreen         from "../screens/tools/HashGeneratorScreen";
import ToolsScreen                 from "../screens/tools/ToolsScreen";

// ── Rewards ────────────────────────────────────────────────────────────────
import AdRewardScreen              from "../screens/rewards/AdRewardScreen";

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary HOC — wraps every screen so individual crashes don't kill
// the whole app.
// ─────────────────────────────────────────────────────────────────────────────
function wb<P extends object>(Component: React.ComponentType<P>) {
  return function WithBoundary(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack navigators
// ─────────────────────────────────────────────────────────────────────────────
const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack  = createNativeStackNavigator<RootStackParamList>();

const SCREEN_OPTIONS = {
  headerShown: false,
  animation: "slide_from_right" as const,
  contentStyle: { backgroundColor: "#FFFFFF" },
};

// Public screens — visible only when NOT authenticated
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={SCREEN_OPTIONS} initialRouteName="Splash">
      <AuthStack.Screen name="Splash"           component={wb(SplashScreen)} />
      <AuthStack.Screen name="Login"            component={wb(LoginScreen)} />
      <AuthStack.Screen name="Register"         component={wb(RegisterScreen)} />
      <AuthStack.Screen name="ForgotPassword"   component={wb(ForgotPasswordScreen)} />
    </AuthStack.Navigator>
  );
}

// Authenticated screens — visible only when authenticated
function AppNavigatorInner() {
  return (
    <AppStack.Navigator screenOptions={SCREEN_OPTIONS} initialRouteName="NotificationPermission">
      <AppStack.Screen name="NotificationPermission" component={wb(NotificationPermissionScreen)} />
      <AppStack.Screen name="Dashboard"              component={wb(DashboardScreen)} />
      <AppStack.Screen name="Learning"               component={wb(LearningScreen)} />
      <AppStack.Screen name="LearningDetails"        component={wb(LearningDetailsScreen)} />
      <AppStack.Screen name="Labs"                   component={wb(LabsScreen)} />
      <AppStack.Screen name="LabDetails"             component={wb(LabDetailsScreen)} />
      <AppStack.Screen name="Quiz"                   component={wb(QuizScreen)} />
      <AppStack.Screen name="QuizQuestion"           component={wb(QuizQuestionScreen)} />
      <AppStack.Screen name="SecurityScan"           component={wb(SecurityScanScreen)} />
      <AppStack.Screen name="ScanHistory"            component={wb(ScanHistoryScreen)} />
      <AppStack.Screen name="CVEUpdates"             component={wb(CVEUpdatesScreen)} />
      <AppStack.Screen name="BugReports"             component={wb(BugReportsScreen)} />
      <AppStack.Screen name="Certificates"           component={wb(CertificateScreen)} />
      <AppStack.Screen name="CertificateDetails"     component={wb(CertificateDetailsScreen)} />
      <AppStack.Screen name="Profile"                component={wb(ProfileScreen)} />
      <AppStack.Screen name="ProfileSettings"        component={wb(ProfileSettingsScreen)} />
      <AppStack.Screen name="AccountSettings"        component={wb(AccountSettingsScreen)} />
      <AppStack.Screen name="Settings"               component={wb(SettingsScreen)} />
      <AppStack.Screen name="Notifications"          component={wb(NotificationScreen)} />
      <AppStack.Screen name="Jobs"                   component={wb(JobsScreen)} />
      <AppStack.Screen name="JobDetails"             component={wb(JobDetailsScreen)} />
      <AppStack.Screen name="ChatList"               component={wb(ChatListScreen)} />
      <AppStack.Screen name="Chat"                   component={wb(ChatScreen)} />
      <AppStack.Screen name="Friends"                component={wb(FriendsScreen)} />
      <AppStack.Screen name="FriendProfile"          component={wb(FriendProfileScreen)} />
      <AppStack.Screen name="Leaderboard"            component={wb(LeaderboardScreen)} />
      <AppStack.Screen name="Achievements"           component={wb(AchievementsScreen)} />
      <AppStack.Screen name="Premium"                component={wb(PremiumScreen)} />
      <AppStack.Screen name="CTF"                    component={wb(CTFScreen)} />
      <AppStack.Screen name="PasswordChecker"        component={wb(PasswordCheckerScreen)} />
      <AppStack.Screen name="HashGenerator"          component={wb(HashGeneratorScreen)} />
      <AppStack.Screen name="Tools"                  component={wb(ToolsScreen)} />
      <AppStack.Screen name="AdRewards"              component={wb(AdRewardScreen)} />
    </AppStack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root navigator — chooses which stack to render based on auth state
// ─────────────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  // Show a blank loading screen while the initial token check runs.
  // This prevents any stack from mounting before auth state is known.
  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppNavigatorInner /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
