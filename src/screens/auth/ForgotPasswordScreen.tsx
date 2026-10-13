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
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { RootStackParamList } from "../../navigation/types";
import api from "../../services/api";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "ForgotPassword"
>;

export default function ForgotPasswordScreen({
  navigation,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // Route matches backend: POST /api/auth/request-password-reset
      await api.post("/auth/request-password-reset", { email: trimmed });
      Alert.alert(
        "Email Sent",
        "If an account exists for that email, a password reset link has been sent. Please check your inbox.",
        [{ text: "Back to Login", onPress: () => navigation.navigate("Login") }],
      );
    } catch (err: any) {
      // For security, show the same message regardless of whether the email exists
      Alert.alert(
        "Email Sent",
        "If an account exists for that email, a password reset link has been sent. Please check your inbox.",
        [{ text: "Back to Login", onPress: () => navigation.navigate("Login") }],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Forgot Password
          </Text>

          {/* Banner ad removed — ads must not appear on password reset screens */}

          <Text style={styles.subtitle}>
            Enter your registered email address.
            {"\n"}
            We'll send you a password reset link.
          </Text>

          <InputField
            label="Email Address"
            icon="email-outline"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ marginTop: 25 }}>
            <PrimaryButton
              title="SEND RESET LINK"
              loading={loading}
              onPress={handleReset}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
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
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
    lineHeight: 24,
  },

  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  footerText: {
    fontSize: 15,
    color: "#666",
  },

  loginText: {
    marginLeft: 6,
    color: "#E53935",
    fontSize: 15,
    fontWeight: "700",
  },
});