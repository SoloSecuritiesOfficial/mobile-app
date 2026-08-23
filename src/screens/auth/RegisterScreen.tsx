import React, { useState } from "react";
import {
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
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { registerUser } from "../../services/authService";
import { hasPushBeenAsked } from "../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });

  // ── shared post-auth navigation ────────────────────────────────
  const afterAuth = async () => {
    const asked = await hasPushBeenAsked();
    navigation.replace(asked ? "Dashboard" : "NotificationPermission");
  };

  const validate = () => {
    let valid = true;
    const e = { name: "", email: "", password: "", confirmPassword: "" };

    if (!name.trim()) {
      e.name = "Username is required"; valid = false;
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(name.trim())) {
      e.name = "3-20 chars: letters, numbers and _ only"; valid = false;
    }

    if (!email.trim()) {
      e.email = "Email is required"; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Enter a valid email address"; valid = false;
    }

    if (!password) {
      e.password = "Password is required"; valid = false;
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+])[A-Za-z\d@$!%*?&^#()[\]{}\-_=+]{8,64}$/.test(password)
    ) {
      e.password = "Min 8 chars with uppercase, lowercase, number & special character."; valid = false;
    }

    if (!confirmPassword) {
      e.confirmPassword = "Confirm password is required"; valid = false;
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match"; valid = false;
    }

    setErrors(e);
    return valid;
  };

  const handleRegister = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const res = await registerUser({
        username: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (res?.success) {
        Alert.alert("Account Created", "Welcome to SoloSecurities!", [
          { text: "Continue", onPress: afterAuth },
        ]);
        return;
      }
      Alert.alert("Registration Failed", res?.message ?? "Unable to create account");
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err?.response?.data?.message ?? err?.message ?? "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (res: any) => {
    if (res?.success) await afterAuth();
  };

  const handleGoogleError = (err: any) => {
    Alert.alert(
      "Google Sign-In Failed",
      err?.message ?? "Could not sign in with Google.",
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SoloSecurities today</Text>

        {/* ── Google Sign-In (top — fastest path for new users) ── */}
        <GoogleSignInButton
          label="Sign up with Google"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or create with email</Text>
          <View style={styles.dividerLine} />
        </View>

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
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          <View style={styles.button}>
            <PrimaryButton title="CREATE ACCOUNT" loading={loading} onPress={handleRegister} />
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account?</Text>
          <TouchableOpacity disabled={loading} onPress={() => navigation.replace("Login")}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40, backgroundColor: "#FFFFFF" },
  logo:        { width: 120, height: 120, alignSelf: "center", marginBottom: 20 },
  title:       { fontSize: 30, fontWeight: "700", color: "#111", textAlign: "center" },
  subtitle:    { marginTop: 10, marginBottom: 22, fontSize: 16, color: "#666", textAlign: "center" },
  form:        { width: "100%", marginTop: 4 },
  button:      { marginTop: 20 },

  divider:     { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8E8E8" },
  dividerText: { fontSize: 12, color: "#AAA", fontWeight: "600" },

  bottomRow:   { marginTop: 28, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  bottomText:  { fontSize: 15, color: "#555" },
  loginText:   { marginLeft: 6, fontSize: 15, fontWeight: "700", color: "#C62828" },
});
