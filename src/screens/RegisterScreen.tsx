import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const register = () => {
    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        "Success",
        "Registration backend will be added later."
      );
    }, 1500);
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
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Join SoloSecurities today
          </Text>

          <InputField
            label="Full Name"
            icon="account-outline"
            placeholder="Enter your name"
            value={fullName}
            onChangeText={setFullName}
          />

          <InputField
            label="Email"
            icon="email-outline"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="Create password"
            password
            value={password}
            onChangeText={setPassword}
          />

          <InputField
            label="Confirm Password"
            icon="lock-check-outline"
            placeholder="Confirm password"
            password
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              title="CREATE ACCOUNT"
              loading={loading}
              onPress={register}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginText}>
                Login
              </Text>
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
    backgroundColor: "#fff",
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 35,
  },

  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
  },

  footerText: {
    color: "#666",
    fontSize: 15,
  },

  loginText: {
    marginLeft: 6,
    color: "#E53935",
    fontWeight: "700",
    fontSize: 15,
  },
});