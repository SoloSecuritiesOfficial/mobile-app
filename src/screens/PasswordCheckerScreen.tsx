import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

export default function PasswordCheckerScreen() {
  const [passwordInput, setPasswordInput] = useState("");

  const evaluatePassword = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 25;
    if (pass.length >= 16) score += 15;
    if (/[A-Z]/.test(pass)) score += 10;
    if (/[a-z]/.test(pass)) score += 10;
    if (/[0-9]/.test(pass)) score += 10;
    if (/[^A-Za-z0-9]/.test(pass)) score += 10;

    let rating = "Weak";
    let color = "#EF4444";
    if (score >= 80) { rating = "Very Strong"; color = "#10B981"; }
    else if (score >= 60) { rating = "Strong"; color = "#3B82F6"; }
    else if (score >= 40) { rating = "Moderate"; color = "#F59E0B"; }

    return { score, rating, color };
  };

  const passMetrics = evaluatePassword(passwordInput);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Password Strength Auditor 🔑</Text>
      <Text style={styles.headerSubtitle}>Analyze password entropy, character length & complexity</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Password Auditor</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password to test strength..."
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={passwordInput}
          onChangeText={setPasswordInput}
        />

        {passwordInput.length > 0 && (
          <View style={styles.metricBox}>
            <View style={styles.scoreRow}>
              <Text style={styles.label}>Security Rating:</Text>
              <Text style={[styles.rating, { color: passMetrics.color }]}>
                {passMetrics.rating} ({passMetrics.score}%)
              </Text>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${passMetrics.score}%`, backgroundColor: passMetrics.color }]} />
            </View>

            <Text style={styles.ruleText}>
              • Length: {passwordInput.length} chars {passwordInput.length >= 12 ? "✅ (Good)" : "⚠️ (Min 12+ recommended)"}
            </Text>
            <Text style={styles.ruleText}>
              • Uppercase & Lowercase (A-Z, a-z): {/[A-Z]/.test(passwordInput) && /[a-z]/.test(passwordInput) ? "✅ Yes" : "❌ No"}
            </Text>
            <Text style={styles.ruleText}>
              • Numeric Digits (0-9): {/[0-9]/.test(passwordInput) ? "✅ Yes" : "❌ No"}
            </Text>
            <Text style={styles.ruleText}>
              • Special Symbols (!@#$%^&*): {/[^A-Za-z0-9]/.test(passwordInput) ? "✅ Yes" : "❌ No"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 50, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, marginBottom: Spacing.md },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 12 },
  input: { backgroundColor: Colors.background, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: Spacing.radiusMedium, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  metricBox: { marginTop: 8, padding: 12, backgroundColor: Colors.background, borderRadius: Spacing.radiusMedium },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: Colors.textSecondary, fontSize: 13 },
  rating: { fontWeight: "700", fontSize: 14 },
  barTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  ruleText: { color: Colors.textSecondary, fontSize: 13, marginVertical: 4 },
});
