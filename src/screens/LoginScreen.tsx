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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen({
  navigation,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);

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

  const handleLogin = () => {
    if (!validate()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        "Success",
        "Login backend will be connected later."
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../assets/icon.png")}
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

            <View style={styles.optionsRow}>
             
              <TouchableOpacity
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
            </View>

            <View style={{ marginTop: 25 }}>
              <PrimaryButton
                title="LOGIN"
                loading={loading}
                onPress={handleLogin}
              />
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>
                Don't have an account?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Register")
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

  optionsRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  rememberText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#555555",
  },

  forgotText: {
    color: "#E53935",
    fontWeight: "600",
    fontSize: 15,
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
    color: "#E53935",
    fontWeight: "700",
  },
});