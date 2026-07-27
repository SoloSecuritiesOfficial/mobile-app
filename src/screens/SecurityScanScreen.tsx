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
} from "react-native";
import { startSecurityScan, getScanHistory } from "../services/securityService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

export default function SecurityScanScreen() {
  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getScanHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.log("Error loading scan history:", err);
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
      const res = await startSecurityScan(target);
      if (res.success && res.data) {
        setCurrentScan(res.data);
        loadHistory();
      } else {
        Alert.alert("Scan Error", res.message || "Failed to complete security scan.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Network error running security scan");
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Security Scan 🛡️</Text>
      <Text style={styles.headerSubtitle}>Analyze target domain HTTPS SSL certificate & security headers</Text>

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
      <Text style={[styles.headerTitle, { fontSize: 20, marginTop: Spacing.xl }]}>Scan History</Text>
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
  inputContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Spacing.radiusLarge,
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
    borderRadius: Spacing.radiusLarge,
  },
  scanButtonText: {
    color: Colors.textWhite,
    fontWeight: "700",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  scoreLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: 6,
  },
  detailText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  vulnBox: {
    marginTop: Spacing.md,
    backgroundColor: "#311B1B",
    padding: 12,
    borderRadius: Spacing.radiusMedium,
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
    borderRadius: Spacing.radiusMedium,
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTarget: {
    ...Typography.labelLarge,
    color: Colors.text,
  },
  historyScore: {
    fontWeight: "700",
    color: Colors.primary,
  },
  historyDate: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 8,
  },
});
