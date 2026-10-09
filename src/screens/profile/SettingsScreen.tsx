import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { useTheme } from "../../context/ThemeContext";
import AdBanner from "../../components/AdBanner";
import { showInterstitialAd } from "../../components/InterstitialAd";
import { getCurrentUser } from "../../services/authService";

const SETTINGS_KEY = "solosec_app_settings";

async function loadSettings(): Promise<{ notifications: boolean; biometrics: boolean; autoScan: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { notifications: true, biometrics: false, autoScan: true };
    return JSON.parse(raw);
  } catch {
    return { notifications: true, biometrics: false, autoScan: true };
  }
}

async function saveSettings(settings: { notifications: boolean; biometrics: boolean; autoScan: boolean }) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* non-fatal */ }
}

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(user => setIsPremium(!!(user as any)?.isPremium))
      .catch(() => {});
    loadSettings().then(s => {
      setNotifications(s.notifications);
      setBiometrics(s.biometrics);
      setAutoScan(s.autoScan);
    });
  }, []);

  const updateSetting = (key: "notifications" | "biometrics" | "autoScan", value: boolean) => {
    const next = { notifications, biometrics, autoScan, [key]: value };
    if (key === "notifications") setNotifications(value);
    if (key === "biometrics")    setBiometrics(value);
    if (key === "autoScan")      setAutoScan(value);
    saveSettings(next);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>App Settings ⚙️</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Customize security & notifications</Text>

      <AdBanner isPremium={isPremium} marginVertical={10} />

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionHeader}>Security Preferences</Text>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Push Notifications (CVEs & Alert)</Text>
          <Switch value={notifications} onValueChange={v => updateSetting("notifications", v)} />
        </View>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric App Lock (Fingerprint/FaceID)</Text>
          <Switch value={biometrics} onValueChange={v => updateSetting("biometrics", v)} />
        </View>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Automatic Background Domain Audit</Text>
          <Switch value={autoScan} onValueChange={v => updateSetting("autoScan", v)} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionHeader}>Appearance</Text>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Theme Mode</Text>
          <Switch value={isDarkMode} onValueChange={(val) => toggleTheme(val)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>About SoloSecurities</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert("SoloSecurities", "Version 1.0.0 — Production Build\n\nA cybersecurity learning platform for ethical hackers and security professionals.")}
        >
          <Text style={styles.actionText}>📱 App Version</Text>
          <Text style={styles.valueText}>v1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert(
            "🔐 Privacy Policy",
            "SoloSecurities collects minimal data required to operate:\n\n" +
            "• Email & username for account creation\n" +
            "• Learning progress & quiz scores\n" +
            "• Device FCM token for push notifications\n" +
            "• AdMob advertising ID for personalized ads (optional)\n\n" +
            "Data sharing:\n" +
            "• Firebase (Google) — push notification tokens, crash analytics\n" +
            "• AdMob (Google) — advertising ID, ad interactions, estimated revenue\n" +
            "• Render — API request logs (IP, user agent) for security\n" +
            "• MongoDB Atlas — encrypted database storage\n\n" +
            "We DO NOT:\n" +
            "• Sell your personal data to third parties\n" +
            "• Store passwords in plain text (bcrypt hashed)\n" +
            "• Access device contacts, camera, or location\n\n" +
            "All data is encrypted in transit via HTTPS/TLS.\n" +
            "JWT tokens are stored securely in platform SecureStore.\n\n" +
            "You can delete your account at any time from Profile > Account Actions.\n\n" +
            "Full policy: https://solosecurities.app/privacy"
          )}
        >
          <Text style={styles.actionText}>🔐 Privacy Policy</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert(
            "📋 Terms of Service",
            "By using SoloSecurities you agree to:\n\n" +
            "• Use the platform for ethical security learning only\n" +
            "• Not attempt to compromise other users' accounts\n" +
            "• Not use CTF knowledge for illegal activities\n" +
            "• Respect community guidelines\n\n" +
            "Violations will result in account suspension."
          )}
        >
          <Text style={styles.actionText}>📋 Terms of Service</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert(
            "🛡️ Data Safety",
            "Data collected:\n" +
            "• Account info (email, username) — required\n" +
            "• App activity (progress, scores) — required\n" +
            "• Device token (push notifications) — optional\n" +
            "• Advertising ID (AdMob) — optional, for personalized ads\n\n" +
            "Data shared with:\n" +
            "• Google Firebase — push tokens, analytics\n" +
            "• Google AdMob — ad ID, ad interactions, revenue estimates\n" +
            "• Render (hosting) — request logs (IP, user agent)\n" +
            "• MongoDB Atlas — encrypted database\n\n" +
            "Data NOT collected:\n" +
            "• Location, contacts, camera, microphone\n" +
            "• Financial information\n" +
            "• Browsing history\n\n" +
            "Data is encrypted in transit and at rest.\n" +
            "You can opt out of personalized ads in device settings."
          )}
        >
          <Text style={styles.actionText}>🛡️ Data Safety (Play Store)</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Linking.openURL("https://solosecurities.app/privacy")}
        >
          <Text style={styles.actionText}>🌐 View Full Privacy Policy Online</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={async () => {
            await showInterstitialAd(isPremium);
            Alert.alert(
              "📧 Contact Support",
              "For support or data deletion requests:\n\nsupport@solosecurities.com\n\nAccount deletion can be done from Profile → Account Actions."
            );
          }}
        >
          <Text style={styles.actionText}>📧 Contact & Support</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom banner */}
      <AdBanner isPremium={isPremium} marginVertical={12} />
      <AdBanner isPremium={isPremium} marginVertical={8} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.labelLarge,
    color: Colors.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    paddingRight: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  valueText: {
    color: Colors.textMuted,
  },
});
