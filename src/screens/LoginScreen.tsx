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
import { loginUser, loginWithGoogle } from "../services/authService";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen({
  navigation,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      // Calls backend endpoint for Google auth payload verification
      const res = await loginWithGoogle({
        googleUser: {
          email: "demo_user@gmail.com",
          name: "Security Demo User",
          photoUrl: "",
        },
      });

      setGoogleLoading(false);
      if (res.success) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Google Login Failed", res.message || "Could not authenticate with Google.");
      }
    } catch (err: any) {
      setGoogleLoading(false);
      Alert.alert("Google Auth Error", err.message || "Firebase Google Auth connection error.");
    }
  };

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
        email
      )
    ) {
      newErrors.email = "Enter a valid email";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
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

    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password,
      });

      setLoading(false);

      if (response.success) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert(
          "Login Failed",
          response.message || "Invalid email or password."
        );
      }
    } catch (error: any) {
      setLoading(false);
      const serverErr =
        error.response?.data?.message ||
        error.message ||
        "Could not connect to backend server. Ensure backend-api is running on port 5000.";

      Alert.alert("Connection Error", serverErr);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
            Login to your SoloSecurities account
          </Text>

          <View style={styles.form}>
            <InputField
              label="Email Address"
              icon="email-outline"
              placeholder="Enter your email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <InputField
              label="Password"
              icon="lock-outline"
              placeholder="Enter your password"
              password
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() =>
                navigation.navigate(
                  "ForgotPassword"
                )
              }
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 25 }}>
              <PrimaryButton
                title="LOGIN"
                loading={loading}
                onPress={handleLogin}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              <Text style={styles.googleButtonText}>🌐  Sign in with Google</Text>
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>
                Don't have an account?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    "Register"
                  )
                }
              >
                <Text style={styles.registerText}>
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
    backgroundColor: "#FFFFFF",
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  dividerText: {
    marginHorizontal: 12,
    color: "#888888",
    fontSize: 13,
    fontWeight: "600",
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    elevation: 1,
  },

  googleButtonText: {
    color: "#333333",
    fontSize: 15,
    fontWeight: "700",
  },

  bottomRow: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "center",
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