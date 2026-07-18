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


export type RootStackParamList = {

  Splash: undefined;

  Login: undefined;

  Register: undefined;

  ForgotPassword: undefined;

  Dashboard: undefined;

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

          animation:
            "slide_from_right",

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


      </Stack.Navigator>


    </NavigationContainer>

  );

}