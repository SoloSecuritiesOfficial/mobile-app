import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

import { RootStackParamList } from "../navigation/AppNavigator";

import { loginUser } from "../services/authService";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen({
  navigation,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validate = () => {
    let valid = true;

    const newErrors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password =
        "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    if (loading) return;

    setLoading(true);

    try {
      const response =
        await loginUser({
          email: email.trim(),
          password,
        });

      if (response?.success) {
        navigation.replace(
          "Dashboard"
        );
        return;
      }

      Alert.alert(
        "Login Failed",
        response?.message ||
          "Invalid email or password."
      );
    } catch (error: any) {
      console.error(
        "Email Login Error:",
        error
      );

      const serverError =
        error?.response?.data?.message ||
        error?.message ||
        "Could not connect to backend server.";

      Alert.alert(
        "Connection Error",
        serverError
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scroll
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Login to your
            SoloSecurities account
          </Text>

          <View style={styles.form}>
            <InputField
              label="Email Address"
              icon="email-outline"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);

                if (errors.email) {
                  setErrors(
                    (previous) => ({
                      ...previous,
                      email: "",
                    })
                  );
                }
              }}
              error={errors.email}
            />

            <InputField
              label="Password"
              icon="lock-outline"
              placeholder="Enter your password"
              password
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);

                if (errors.password) {
                  setErrors(
                    (previous) => ({
                      ...previous,
                      password: "",
                    })
                  );
                }
              }}
              error={errors.password}
            />

            <TouchableOpacity
              style={
                styles.forgotContainer
              }
              onPress={() =>
                navigation.navigate(
                  "ForgotPassword"
                )
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.forgotText
                }
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.loginButtonContainer
              }
            >
              <PrimaryButton
                title="LOGIN"
                loading={loading}
                onPress={
                  handleLogin
                }
              />
            </View>

            <View
              style={
                styles.bottomRow
              }
            >
              <Text
                style={
                  styles.bottomText
                }
              >
                Don't have an
                account?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    "Register"
                  )
                }
                disabled={loading}
              >
                <Text
                  style={
                    styles.registerText
                  }
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      "#FFFFFF",
  },

  keyboardView: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent:
      "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 35,
    textAlign: "center",
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },

  form: {
    width: "100%",
  },

  forgotContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },

  forgotText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 15,
  },

  loginButtonContainer: {
    marginTop: 25,
  },

  bottomRow: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent:
      "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  bottomText: {
    fontSize: 15,
    color: "#555555",
  },

  registerText: {
    marginLeft: 6,
    fontSize: 15,
    color: "#C62828",
    fontWeight: "700",
  },
});