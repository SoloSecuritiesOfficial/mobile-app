import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Share,
} from "react-native";
import { getCVEUpdates } from "../services/securityService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

export default function CVEUpdatesScreen() {
  const [cves, setCves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCVEs();
  }, []);

  const fetchCVEs = async () => {
    try {
      setLoading(true);
      const res = await getCVEUpdates();
      if (res.success && res.data) {
        setCves(res.data);
      }
    } catch (err) {
      console.log("Error fetching CVEs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShareCVE = async (item: any) => {
    const cveCode = item.cveId || item.id;
    try {
      await Share.share({
        message: `📢 SoloSecurities Security Advisory:\n\n${cveCode}: ${item.title}\nSeverity: ${item.severity} (${item.score || 7.5})\n\n${item.description}\n\nRead more at SoloSecurities App!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const filteredCVEs = cves.filter(
    (item) =>
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cveId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#EF4444";
      case "high":
        return "#F97316";
      case "medium":
        return "#EAB308";
      default:
        return "#3B82F6";
    }
  };

  const renderCVEItem = ({ item }: { item: any }) => {
    const sevColor = getSeverityColor(item.severity || "High");
    const cveCode = item.cveId || item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cveId}>{cveCode}</Text>
          <View style={[styles.badge, { backgroundColor: sevColor }]}>
            <Text style={styles.badgeText}>{item.severity} ({item.score || 7.5})</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>Published: {item.published}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.remediation && (
          <View style={styles.remediationBox}>
            <Text style={styles.remediationTitle}>Suggested Remediation:</Text>
            <Text style={styles.remediationText}>{item.remediation}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => handleShareCVE(item)}
          >
            <Text style={styles.shareBtnText}>📲 Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL(`https://nvd.nist.gov/vuln/detail/${cveCode}`)}
          >
            <Text style={styles.linkButtonText}>NIST NVD ↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>CVE Vulnerability Feed 📢</Text>
          <Text style={styles.headerSubtitle}>Real-time security advisories & patch updates from API</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search CVE ID or keyword..."
        placeholderTextColor={Colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredCVEs}
          keyExtractor={(item, idx) => item.id || item.cveId || idx.toString()}
          renderItem={renderCVEItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCVEs();
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No CVE advisories found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
    paddingHorizontal: Spacing.screen,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Spacing.radiusLarge,
    fontSize: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  cveId: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.radiusCircle,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  remediationBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: Spacing.radiusMedium,
    marginBottom: Spacing.sm,
  },
  remediationTitle: {
    ...Typography.labelMedium,
    color: Colors.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  remediationText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  shareBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  shareBtnText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: 30,
  },
});
