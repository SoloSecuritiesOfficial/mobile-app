import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

import DashboardScreen from "../screens/DashboardScreen";
import QuizScreen from "../screens/QuizScreen";
import QuizQuestionScreen from "../screens/QuizQuestionScreen";

import CVEUpdatesScreen from "../screens/CVEUpdatesScreen";

import SecurityScanScreen from "../screens/SecurityScanScreen";
import ScanHistoryScreen from "../screens/security/ScanHistoryScreen";

import BugReportsScreen from "../screens/BugReportsScreen";

import LearningScreen from "../screens/LearningScreen";
import LearningDetailsScreen from "../screens/LearningDetailsScreen";

import LabsScreen from "../screens/LabsScreen";
import LabDetailsScreen from "../screens/LabDetailsScreen";

import CertificateScreen from "../screens/CertificateScreen";
import CertificateDetailsScreen from "../screens/CertificateDetailsScreen";

import NotificationScreen from "../screens/NotificationScreen";

import ProfileScreen from "../screens/ProfileScreen";

import SettingsScreen from "../screens/SettingsScreen";

import PasswordCheckerScreen from "../screens/PasswordCheckerScreen";
import HashGeneratorScreen from "../screens/HashGeneratorScreen";

export type RootStackParamList = {
  Splash: undefined;

  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  Dashboard: undefined;

  Quiz: undefined;

  QuizQuestion: {
    quizId: string;
  };

  CVEUpdates: undefined;

  SecurityScan: undefined;
  ScanHistory: undefined;

  BugReports: undefined;

  Learning: undefined;
  LearningDetails: {
    id: string;
  };

  Labs: undefined;
  LabDetails: {
    id: string;
  };

  Certificates: undefined;
  CertificateDetails: {
    id: string;
  };

  Notifications: undefined;

  Profile: undefined;

  Settings: undefined;

  PasswordChecker: undefined;
  HashGenerator: undefined;
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
        />

        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
        />

        <Stack.Screen
          name="QuizQuestion"
          component={QuizQuestionScreen}
        />

        <Stack.Screen
          name="CVEUpdates"
          component={CVEUpdatesScreen}
        />

        <Stack.Screen
          name="SecurityScan"
          component={SecurityScanScreen}
        />

        <Stack.Screen
          name="ScanHistory"
          component={ScanHistoryScreen}
        />

        <Stack.Screen
          name="BugReports"
          component={BugReportsScreen}
        />

        <Stack.Screen
          name="Learning"
          component={LearningScreen}
        />

        <Stack.Screen
          name="LearningDetails"
          component={LearningDetailsScreen}
        />

        <Stack.Screen
          name="Labs"
          component={LabsScreen}
        />

        <Stack.Screen
          name="LabDetails"
          component={LabDetailsScreen}
        />

        <Stack.Screen
          name="Certificates"
          component={CertificateScreen}
        />

        <Stack.Screen
          name="CertificateDetails"
          component={CertificateDetailsScreen}
        />

        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />

        <Stack.Screen
          name="PasswordChecker"
          component={PasswordCheckerScreen}
        />

        <Stack.Screen
          name="HashGenerator"
          component={HashGeneratorScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}