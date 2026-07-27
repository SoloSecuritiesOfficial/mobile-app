import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Share,
} from "react-native";
import { getBugReports } from "../services/securityService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

export default function BugReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getBugReports();
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.log("Error loading bug reports:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShareReport = async (item: any) => {
    const platformName = item.platform || "HackerOne";
    try {
      await Share.share({
        message: `🐞 SoloSecurities Bug Bounty Writeup:\n\nPlatform: ${platformName}\nTitle: ${item.title}\nSeverity: ${item.severity}\nTarget: ${item.targetSystem}\n\n${item.description}\n\nRead more writeups on SoloSecurities App!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "#EF4444";
      case "High":
        return "#F97316";
      case "Medium":
        return "#EAB308";
      default:
        return "#3B82F6";
    }
  };

  const getPlatformTagColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "hackerone":
        return "#3B82F6";
      case "bugcrowd":
        return "#F97316";
      case "intigriti":
        return "#10B981";
      default:
        return "#8B5CF6";
    }
  };

  const renderReportItem = ({ item }: { item: any }) => {
    const platformName = item.platform || "HackerOne";
    return (
      <View style={styles.card}>
        <View style={styles.platformRow}>
          <View style={[styles.platformBadge, { backgroundColor: getPlatformTagColor(platformName) }]}>
            <Text style={styles.platformBadgeText}>🌐 {platformName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getSeverityBadgeColor(item.severity) }]}>
            <Text style={styles.badgeText}>{item.severity}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.targetText}>Target: {item.targetSystem || "General Web Application"}</Text>
        <Text style={styles.descText}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>Status: <Text style={styles.statusVal}>{item.status}</Text></Text>
          <TouchableOpacity onPress={() => handleShareReport(item)}>
            <Text style={styles.shareText}>📲 Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Bug Bounty Writeups 🐞</Text>
          <Text style={styles.headerSubtitle}>Latest public disclosures from HackerOne, Bugcrowd & Intigriti</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item, idx) => item._id || idx.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReports();
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No bug reports available at this moment.</Text>
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
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
  platformRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  targetText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginBottom: 6,
    fontWeight: "600",
  },
  descText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  statusVal: {
    color: Colors.text,
    fontWeight: "700",
  },
  shareText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: 40,
  },
});
