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
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { loginUser } from "../../services/authService";
import { hasPushBeenAsked } from "../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({ email: "", password: "" });

  // ── shared post-auth navigation ────────────────────────────────
  const afterAuth = async () => {
    const asked = await hasPushBeenAsked();
    navigation.replace(asked ? "Dashboard" : "NotificationPermission");
  };

  const validate = () => {
    let valid = true;
    const e = { email: "", password: "" };
    if (!email.trim()) {
      e.email = "Email is required"; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Enter a valid email address"; valid = false;
    }
    if (!password) {
      e.password = "Password is required"; valid = false;
    }
    setErrors(e);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });
      if (res?.success) {
        await afterAuth();
        return;
      }
      Alert.alert("Login Failed", res?.message ?? "Invalid email or password.");
    } catch (err: any) {
      Alert.alert(
        "Login Failed",
        err?.response?.data?.message ?? err?.message ?? "Unable to login.",
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
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to your{"\n"}SoloSecurities account
          </Text>

          <View style={styles.form}>
            <InputField
              label="Email Address"
              icon="email-outline"
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: "" }); }}
              error={errors.email}
            />

            <InputField
              label="Password"
              icon="lock-outline"
              placeholder="Enter password"
              password
              value={password}
              onChangeText={(v) => { setPassword(v); if (errors.password) setErrors({ ...errors, password: "" }); }}
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotContainer}
              disabled={loading}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.button}>
              <PrimaryButton title="LOGIN" loading={loading} onPress={handleLogin} />
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Google Sign-In ── */}
            <GoogleSignInButton
              label="Continue with Google"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don't have an account?</Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#FFFFFF" },
  scroll:          { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
  logo:            { width: 120, height: 120, alignSelf: "center", marginBottom: 20 },
  title:           { fontSize: 30, fontWeight: "700", textAlign: "center", color: "#111111" },
  subtitle:        { marginTop: 10, marginBottom: 35, fontSize: 16, textAlign: "center", color: "#666666", lineHeight: 24 },
  form:            { width: "100%" },
  forgotContainer: { alignItems: "flex-end", marginTop: 10 },
  forgotText:      { color: "#C62828", fontWeight: "600", fontSize: 14 },
  button:          { marginTop: 25 },

  // divider
  divider:         { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: "#E8E8E8" },
  dividerText:     { fontSize: 13, color: "#AAA", fontWeight: "600" },

  bottomRow:       { marginTop: 28, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  bottomText:      { color: "#555555", fontSize: 15 },
  registerText:    { marginLeft: 6, color: "#C62828", fontWeight: "700", fontSize: 15 },
});
