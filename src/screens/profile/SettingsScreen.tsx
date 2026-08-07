import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [autoScan, setAutoScan] = useState(true);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>App Settings ⚙️</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Customize security & notifications</Text>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionHeader}>Security Preferences</Text>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Push Notifications (CVEs & Alert)</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric App Lock (Fingerprint/FaceID)</Text>
          <Switch value={biometrics} onValueChange={setBiometrics} />
        </View>

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Automatic Background Domain Audit</Text>
          <Switch value={autoScan} onValueChange={setAutoScan} />
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
            "• Device FCM token for push notifications\n\n" +
            "We DO NOT:\n" +
            "• Sell your data to third parties\n" +
            "• Store passwords in plain text\n" +
            "• Access device contacts, camera, or location\n\n" +
            "All data is encrypted in transit via HTTPS/TLS.\n" +
            "JWT tokens are stored securely on device.\n\n" +
            "You can delete your account at any time from Profile > Account Actions."
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
            "• Device token (push notifications) — optional\n\n" +
            "Data NOT collected:\n" +
            "• Location, contacts, camera, microphone\n" +
            "• Financial information\n" +
            "• Browsing history\n\n" +
            "Data is encrypted and never shared with advertisers."
          )}
        >
          <Text style={styles.actionText}>🛡️ Data Safety (Play Store)</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={() => Alert.alert(
            "📧 Contact Support",
            "For support or data deletion requests:\n\nsupport@solosecurities.com\n\nAccount deletion can be done from Profile → Account Actions."
          )}
        >
          <Text style={styles.actionText}>📧 Contact & Support</Text>
          <Text style={styles.valueText}>↗</Text>
        </TouchableOpacity>
      </View>
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
