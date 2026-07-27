import React from "react";
import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";


import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CVEUpdatesScreen from "../screens/CVEUpdatesScreen";
import SecurityScanScreen from "../screens/SecurityScanScreen";
import BugReportsScreen from "../screens/BugReportsScreen";
import LearningScreen from "../screens/LearningScreen";
import LabsScreen from "../screens/LabsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PasswordCheckerScreen from "../screens/PasswordCheckerScreen";
import HashGeneratorScreen from "../screens/HashGeneratorScreen";


export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  CVEUpdates: undefined;
  SecurityScan: undefined;
  BugReports: undefined;
  Learning: undefined;
  Labs: undefined;
  Settings: undefined;
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
          contentStyle: {
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* Feature Action Screens */}
        <Stack.Screen name="CVEUpdates" component={CVEUpdatesScreen} />
        <Stack.Screen name="SecurityScan" component={SecurityScanScreen} />
        <Stack.Screen name="BugReports" component={BugReportsScreen} />
        <Stack.Screen name="Learning" component={LearningScreen} />
        <Stack.Screen name="Labs" component={LabsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PasswordChecker" component={PasswordCheckerScreen} />
        <Stack.Screen name="HashGenerator" component={HashGeneratorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}