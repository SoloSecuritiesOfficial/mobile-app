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
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { useTheme } from "../context/ThemeContext";

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
          onPress={() => Alert.alert("SoloSecurities", "Version 1.0.0 Realtime Build")}
        >
          <Text style={styles.actionText}>App Version</Text>
          <Text style={styles.valueText}>v1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert("Privacy Policy", "All network scans and reports are encrypted and strictly stored in your user account context.")}
        >
          <Text style={styles.actionText}>Privacy & Security Terms</Text>
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
