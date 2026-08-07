import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ── Auth ───────────────────────────────────────────────────────────────────
import SplashScreen          from "../screens/auth/SplashScreen";
import LoginScreen            from "../screens/auth/LoginScreen";
import RegisterScreen         from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen   from "../screens/auth/ForgotPasswordScreen";

// ── Dashboard ──────────────────────────────────────────────────────────────
import DashboardScreen        from "../screens/dashboard/DashboardScreen";

// ── Learning & Labs ────────────────────────────────────────────────────────
import LearningScreen         from "../screens/learning/LearningScreen";
import LearningDetailsScreen  from "../screens/learning/LearningDetailsScreen";
import LabsScreen             from "../screens/learning/LabsScreen";
import LabDetailsScreen       from "../screens/learning/LabDetailsScreen";

// ── Quiz ───────────────────────────────────────────────────────────────────
import QuizScreen             from "../screens/quiz/QuizScreen";
import QuizQuestionScreen     from "../screens/quiz/QuizQuestionScreen";

// ── Security ───────────────────────────────────────────────────────────────
import SecurityScanScreen     from "../screens/security/SecurityScanScreen";
import ScanHistoryScreen      from "../screens/security/ScanHistoryScreen";
import CVEUpdatesScreen       from "../screens/security/CVEUpdatesScreen";
import BugReportsScreen       from "../screens/security/BugReportsScreen";

// ── Certificates ───────────────────────────────────────────────────────────
import CertificateScreen      from "../screens/certificates/CertificateScreen";
import CertificateDetailsScreen from "../screens/certificates/CertificateDetailsScreen";

// ── Profile ────────────────────────────────────────────────────────────────
import ProfileScreen          from "../screens/profile/ProfileScreen";
import SettingsScreen         from "../screens/profile/SettingsScreen";
import NotificationScreen     from "../screens/profile/NotificationScreen";

// ── Social ─────────────────────────────────────────────────────────────────
import FriendsScreen          from "../screens/social/FriendsScreen";
import LeaderboardScreen      from "../screens/social/LeaderboardScreen";
import AchievementsScreen     from "../screens/social/AchievementsScreen";

// ── Premium & CTF ──────────────────────────────────────────────────────────
import PremiumScreen          from "../screens/premium/PremiumScreen";
import CTFScreen              from "../screens/premium/CTFScreen";

// ── Tools ──────────────────────────────────────────────────────────────────
import PasswordCheckerScreen  from "../screens/tools/PasswordCheckerScreen";
import HashGeneratorScreen    from "../screens/tools/HashGeneratorScreen";

export type RootStackParamList = {
  // Auth
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // Core
  Dashboard: undefined;
  // Learning
  Learning: undefined;
  LearningDetails: { id: string };
  Labs: undefined;
  LabDetails: { id: string };
  // Quiz
  Quiz: undefined;
  QuizQuestion: { quizId: string };
  // Security
  SecurityScan: undefined;
  ScanHistory: undefined;
  CVEUpdates: undefined;
  BugReports: undefined;
  // Certificates
  Certificates: undefined;
  CertificateDetails: { id: string };
  // Profile
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  // Social
  Friends: undefined;
  Leaderboard: undefined;
  Achievements: undefined;
  // Premium & CTF
  Premium: undefined;
  CTF: undefined;
  // Tools
  PasswordChecker: undefined;
  HashGenerator: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        {/* ── Auth ── */}
        <Stack.Screen name="Splash"             component={SplashScreen} />
        <Stack.Screen name="Login"              component={LoginScreen} />
        <Stack.Screen name="Register"           component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword"     component={ForgotPasswordScreen} />

        {/* ── Dashboard ── */}
        <Stack.Screen name="Dashboard"          component={DashboardScreen} />

        {/* ── Learning & Labs ── */}
        <Stack.Screen name="Learning"           component={LearningScreen} />
        <Stack.Screen name="LearningDetails"    component={LearningDetailsScreen} />
        <Stack.Screen name="Labs"               component={LabsScreen} />
        <Stack.Screen name="LabDetails"         component={LabDetailsScreen} />

        {/* ── Quiz ── */}
        <Stack.Screen name="Quiz"               component={QuizScreen} />
        <Stack.Screen name="QuizQuestion"       component={QuizQuestionScreen} />

        {/* ── Security ── */}
        <Stack.Screen name="SecurityScan"       component={SecurityScanScreen} />
        <Stack.Screen name="ScanHistory"        component={ScanHistoryScreen} />
        <Stack.Screen name="CVEUpdates"         component={CVEUpdatesScreen} />
        <Stack.Screen name="BugReports"         component={BugReportsScreen} />

        {/* ── Certificates ── */}
        <Stack.Screen name="Certificates"       component={CertificateScreen} />
        <Stack.Screen name="CertificateDetails" component={CertificateDetailsScreen} />

        {/* ── Profile ── */}
        <Stack.Screen name="Profile"            component={ProfileScreen} />
        <Stack.Screen name="Settings"           component={SettingsScreen} />
        <Stack.Screen name="Notifications"      component={NotificationScreen} />

        {/* ── Social ── */}
        <Stack.Screen name="Friends"            component={FriendsScreen} />
        <Stack.Screen name="Leaderboard"        component={LeaderboardScreen} />
        <Stack.Screen name="Achievements"       component={AchievementsScreen} />

        {/* ── Premium & CTF ── */}
        <Stack.Screen name="Premium"            component={PremiumScreen} />
        <Stack.Screen name="CTF"                component={CTFScreen} />

        {/* ── Tools ── */}
        <Stack.Screen name="PasswordChecker"    component={PasswordCheckerScreen} />
        <Stack.Screen name="HashGenerator"      component={HashGeneratorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
