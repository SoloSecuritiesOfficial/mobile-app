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

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

import { RootStackParamList } from "../../navigation/AppNavigator";

import { registerUser } from "../../services/authService";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen({
  navigation,
}: Props) {
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validate = () => {
    let valid = true;

    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    const username = name.trim();

    // ================= USERNAME =================

    if (!username) {
      newErrors.name = "Username is required";
      valid = false;
    } else if (
      !/^[a-zA-Z0-9_]{3,20}$/.test(username)
    ) {
      newErrors.name =
        "Username must be 3-20 characters and contain only letters, numbers and _";
      valid = false;
    }

    // ================= EMAIL =================

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
      valid = false;
    }

    // ================= PASSWORD =================

    if (!password) {
      newErrors.password =
        "Password is required";
      valid = false;
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+])[A-Za-z\d@$!%*?&^#()[\]{}\-_=+]{8,64}$/.test(
        password
      )
    ) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, number and special character.";
      valid = false;
    }

    // ================= CONFIRM PASSWORD =================

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Confirm password is required";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    if (loading) return;

    try {
      setLoading(true);

      console.log("Username:", name.trim());
      console.log("Email:", email.trim());
      console.log("Password:", password);

      const response = await registerUser({
        username: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response?.success) {
        Alert.alert(
          "Account Created",
          "Welcome to SoloSecurities",
          [
            {
              text: "Continue",
              onPress: () =>
                navigation.replace("Dashboard"),
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Registration Failed",
        response?.message ??
          "Unable to create account"
      );
    } catch (error: any) {
      console.log(
        "Register Error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Registration Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
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
          source={require("../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Join SoloSecurities today
        </Text>

        <View style={styles.form}>
          <InputField
            label="Username"
            icon="account-outline"
            placeholder="Enter username"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <InputField
            label="Email Address"
            icon="email-outline"
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />

          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="Enter password"
            password
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <InputField
            label="Confirm Password"
            icon="lock-outline"
            placeholder="Confirm password"
            password
            value={confirmPassword}
            onChangeText={
              setConfirmPassword
            }
            error={
              errors.confirmPassword
            }
          />

          <PrimaryButton
            title="CREATE ACCOUNT"
            loading={loading}
            onPress={handleRegister}
          />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            disabled={loading}
            onPress={() =>
              navigation.replace("Login")
            }
          >
            <Text style={styles.loginText}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
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
    color: "#111",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 35,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  form: {
    width: "100%",
  },

  bottomRow: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomText: {
    fontSize: 15,
    color: "#555",
  },

  loginText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#C62828",
  },
});