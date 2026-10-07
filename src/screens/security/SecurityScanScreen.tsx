import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from "react-native";
import { startSecurityScan, getScanHistory } from "../../services/securityService";
import { getCurrentUser } from "../../services/authService";
import AdBanner from "../../components/AdBanner";
import { showInterstitialAd } from "../../components/InterstitialAd";
import RewardedAdGate from "../../components/RewardedAdGate";
import Colors from "../../theme/colors";
import { useResponsive, useStyles } from "../../hooks";

export default function SecurityScanScreen() {
  const styles = useStyles(styleFactory);

  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setError(null);
      const [res, user] = await Promise.all([
        getScanHistory(),
        getCurrentUser(),
      ]);
      if (res.success && res.data) {
        setHistory(res.data);
      }
      setIsPremium(!!(user as any)?.isPremium);
    } catch (err) {
      console.log("Error loading scan history:", err);
      setError(err instanceof Error ? err.message : "Failed to load scan history");
    }
  };

  const handleStartScan = async () => {
    if (!target.trim()) {
      Alert.alert("Input Required", "Please enter a target domain or URL (e.g. example.com)");
      return;
    }

    try {
      setScanning(true);
      setCurrentScan(null);
      setError(null);
      // Show interstitial before scan results appear
      await showInterstitialAd(isPremium);
      const res = await startSecurityScan(target);
      if (res.success && res.data) {
        setCurrentScan(res.data);
        loadHistory();
      } else {
        setError(res.message || "Failed to complete security scan.");
      }
    } catch (err: any) {
      setError(err.message || "Network error running security scan");
    } finally {
      setScanning(false);
    }
  };

  if (error && !currentScan && history.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={loadHistory}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Security Scan 🛡️</Text>
      <Text style={styles.headerSubtitle}>Analyze target domain HTTPS SSL certificate & security headers</Text>

      <AdBanner isPremium={isPremium} marginVertical={8} />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Target Host (e.g. example.com)"
          placeholderTextColor={Colors.textMuted}
          value={target}
          onChangeText={setTarget}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartScan}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.scanButtonText}>Start Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Current Scan Results */}
      {currentScan && (
        <View style={styles.resultCard}>
          <Text style={styles.resultHeader}>Scan Results: {currentScan.target}</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Security Rating:</Text>
            <Text
              style={[
                styles.scoreValue,
                { color: currentScan.score >= 80 ? "#10B981" : currentScan.score >= 50 ? "#F59E0B" : "#EF4444" },
              ]}
            >
              {currentScan.score}%
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>SSL Certificate Status:</Text>
          <Text style={styles.detailText}>
            • Valid: {currentScan.details.sslValid ? "✅ Yes" : "❌ No"}
          </Text>
          <Text style={styles.detailText}>• Status: {currentScan.details.sslIssuer}</Text>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>HTTP Security Headers:</Text>
          <Text style={styles.detailText}>
            • Strict-Transport-Security (HSTS): {currentScan.details.headers.hsts ? "✅ Enabled" : "❌ Missing"}
          </Text>
          <Text style={styles.detailText}>
            • Content-Security-Policy (CSP): {currentScan.details.headers.csp ? "✅ Enabled" : "❌ Missing"}
          </Text>
          <Text style={styles.detailText}>
            • X-Frame-Options: {currentScan.details.headers.xFrameOptions ? "✅ Protected" : "❌ Vulnerable"}
          </Text>
          <Text style={styles.detailText}>
            • X-Content-Type-Options: {currentScan.details.headers.xContentTypeOptions ? "✅ Protected" : "❌ Missing"}
          </Text>

          {currentScan.details.vulnerabilitiesFound?.length > 0 && (
            <View style={styles.vulnBox}>
              <Text style={styles.vulnHeader}>Detected Findings ({currentScan.details.vulnerabilitiesFound.length}):</Text>
              {currentScan.details.vulnerabilitiesFound.map((v: string, idx: number) => (
                <Text key={idx} style={styles.vulnItem}>⚠️ {v}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* History */}
      <AdBanner isPremium={isPremium} marginVertical={8} />
      <Text style={styles.historyTitle}>Scan History</Text>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>No previous scans logged yet.</Text>
      ) : (
        history.map((item, index) => (
          <View key={index} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTarget}>{item.target}</Text>
              <Text style={styles.historyScore}>{item.score}%</Text>
            </View>
            <Text style={styles.historyDate}>
              {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}
      <AdBanner isPremium={isPremium} marginVertical={12} />

      {/* Rewarded ad — watch to unlock extra scan credits */}
      <RewardedAdGate
        isPremium={isPremium}
        label="🎁 Watch Ad — Unlock Extra Scan"
        onReward={() => Alert.alert("🎁 Reward Earned", "Extra scan credit unlocked!")}
        style={{ marginBottom: 16 }}
      />
    </ScrollView>
  );
}

const styleFactory = (spacing: any, typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  headerTitle: {
    ...typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: spacing.radiusLarge,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: spacing.radiusLarge,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: spacing.radiusLarge,
    padding: spacing.cardPadding,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    ...typography.h3,
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  scoreLabel: {
    ...typography.bodyMedium,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: Colors.text,
    marginBottom: 6,
  },
  detailText: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  vulnBox: {
    marginTop: spacing.md,
    backgroundColor: "#311B1B",
    padding: 12,
    borderRadius: spacing.radiusMedium,
  },
  vulnHeader: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  vulnItem: {
    color: "#FCA5A5",
    fontSize: 12,
    marginVertical: 2,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: spacing.radiusMedium,
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTarget: {
    ...typography.labelLarge,
    color: Colors.text,
  },
  historyScore: {
    fontWeight: "700",
    color: Colors.primary,
  },
  historyDate: {
    ...typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 8,
  },
  historyTitle: {
    ...typography.h1,
    fontSize: 20,
    marginTop: spacing.xl,
  },
  // error state
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.screen },
  errorCard: { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  errorIcon: { fontSize: spacing.iconXL, marginBottom: spacing.md },
  errorTitle: { ...typography.h3, color: Colors.text, marginBottom: spacing.sm, textAlign: "center" },
  errorMessage: { ...typography.bodyMedium, color: Colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  errorButton: { backgroundColor: Colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: spacing.radiusMedium },
  errorButtonText: { color: "#FFF", ...typography.button },
});