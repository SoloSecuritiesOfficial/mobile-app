import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../navigation/AppNavigator";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

import DashboardHeader from "../../components/DashboardHeader";
import SecurityScoreCard from "../../components/SecurityScoreCard";
import SecurityTipCard from "../../components/SecurityTipCard";
import QuickActions from "../../components/QuickAction";

import { fetchCurrentUser, getCurrentUser, dailyCheckIn } from "../../services/authService";
import { getSecurityDashboard } from "../../services/securityService";
import { getCertificates } from "../../services/certificateService";
import { getUnreadNotificationCount, checkAndTriggerDeviceNotifications } from "../../services/notificationService";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

interface ActivityItem {
  _id?: string;
  type?: string;
  title?: string;
  points?: number;
}

interface DashboardData {
  securityScore?: number;
  reports?: number;
  rank?: string;
  streak?: number;
  learningCompleted?: number;
  learningTotal?: number;
  labCompleted?: number;
  labTotal?: number;
  recentActivity?: ActivityItem[];
}

const ACTIVITY_ICONS: Record<string, string> = {
  LAB: "🎯",
  CERTIFICATE: "🏆",
  LEARNING: "📚",
  SCAN: "🛡️",
  BUG_REPORT: "🐞",
};

export default function DashboardScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [certificateCount, setCertificateCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const latestUser = await fetchCurrentUser();
      setUser(latestUser ?? (await getCurrentUser()));

      const dashRes = await getSecurityDashboard();
      setDashboard(dashRes.data ?? dashRes ?? {});

      const certs = await getCertificates();
      setCertificateCount(certs.data?.length ?? certs.length ?? 0);

      const notif = await getUnreadNotificationCount();
      setNotificationCount(notif.data?.count ?? notif.count ?? 0);

      await checkAndTriggerDeviceNotifications();
    } catch (err) {
      console.log("Dashboard Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // Progress helpers — capped
  const lTotal = dashboard.learningTotal ?? 0;
  const lDone  = Math.min(dashboard.learningCompleted ?? 0, lTotal);
  const lPct   = lTotal > 0 ? Math.round((lDone / lTotal) * 100) : 0;

  const bTotal = dashboard.labTotal ?? 0;
  const bDone  = Math.min(dashboard.labCompleted ?? 0, bTotal);
  const bPct   = bTotal > 0 ? Math.round((bDone / bTotal) * 100) : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadDashboard(); }}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >

      {/* ── 1. Header (avatar + greeting + notification bell) ── */}
      <DashboardHeader user={user} navigation={navigation} />

      {/* ── 2. Daily Streak Check-in ── */}
      <TouchableOpacity
        style={styles.streakBanner}
        onPress={async () => {
          try { await dailyCheckIn(); loadDashboard(); }
          catch (err) { console.log("Check-in error:", err); }
        }}
      >
        <Text style={styles.streakBannerIcon}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakBannerTitle}>Daily Check-in</Text>
          <Text style={styles.streakBannerSub}>
            {dashboard.streak || 0}-day streak • Tap to claim +20 XP
          </Text>
        </View>
        <Text style={styles.streakBannerBtn}>Check In ✓</Text>
      </TouchableOpacity>

      {/* ── 3. Security Score (with progress bar) ── */}
      <SecurityScoreCard securityScore={dashboard.securityScore ?? 0} />

      {/* ── 4. Overview — icon + badge style ── */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.overviewRow}>

        {/* Bug Reports */}
        <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("BugReports")}>
          <View style={styles.overviewIconWrap}>
            <Text style={styles.overviewEmoji}>🐞</Text>
            {(dashboard.reports ?? 0) > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{dashboard.reports}</Text></View>
            )}
          </View>
          <Text style={styles.overviewLabel}>Reports</Text>
        </TouchableOpacity>

        {/* Certificates */}
        <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("Certificates")}>
          <View style={styles.overviewIconWrap}>
            <Text style={styles.overviewEmoji}>🏆</Text>
            {certificateCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{certificateCount}</Text></View>
            )}
          </View>
          <Text style={styles.overviewLabel}>Certs</Text>
        </TouchableOpacity>

        {/* Rank — no badge, just text below */}
        <View style={styles.overviewItem}>
          <View style={styles.overviewIconWrap}>
            <Text style={styles.overviewEmoji}>🥇</Text>
          </View>
          <Text style={styles.overviewLabel} numberOfLines={1} ellipsizeMode="tail">
            {(dashboard.rank ?? "—").replace("#", "").substring(0, 6)}
          </Text>
        </View>

        {/* Streak */}
        <View style={styles.overviewItem}>
          <View style={styles.overviewIconWrap}>
            <Text style={styles.overviewEmoji}>🔥</Text>
            {(dashboard.streak ?? 0) > 0 && (
              <View style={[styles.badge, styles.badgeOrange]}>
                <Text style={styles.badgeText}>{dashboard.streak}</Text>
              </View>
            )}
          </View>
          <Text style={styles.overviewLabel}>Streak</Text>
        </View>

        {/* Notifications */}
        <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("Notifications")}>
          <View style={styles.overviewIconWrap}>
            <Text style={styles.overviewEmoji}>🔔</Text>
            {notificationCount > 0 && (
              <View style={[styles.badge, styles.badgeRed]}>
                <Text style={styles.badgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.overviewLabel}>Alerts</Text>
        </TouchableOpacity>

      </View>

      {/* ── 5. Combined progress card (Learning + Labs) ── */}
      <Text style={styles.sectionTitle}>Progress</Text>
      <View style={styles.progressCard}>

        {/* Learning */}
        <View style={styles.progressRow}>
          <Text style={styles.progressIcon}>📚</Text>
          <View style={styles.progressInfo}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Learning Modules</Text>
              <Text style={styles.progressCount}>{lDone}/{lTotal}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${lPct}%` }]} />
            </View>
            <Text style={styles.progressMeta}>{lPct}% complete • {Math.max(lTotal - lDone, 0)} remaining</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Labs */}
        <View style={styles.progressRow}>
          <Text style={styles.progressIcon}>🎯</Text>
          <View style={styles.progressInfo}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Hands-on Labs</Text>
              <Text style={styles.progressCount}>{bDone}/{bTotal}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${bPct}%` }]} />
            </View>
            <Text style={styles.progressMeta}>{bPct}% complete • {Math.max(bTotal - bDone, 0)} remaining</Text>
          </View>
        </View>

      </View>

      {/* ── 6. Recent Activity ── */}
      {(dashboard.recentActivity ?? []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {(dashboard.recentActivity ?? []).slice(0, 5).map((item, idx) => (
              <View key={item._id ?? idx} style={[styles.activityItem, idx === (Math.min((dashboard.recentActivity?.length ?? 0), 5) - 1) && { borderBottomWidth: 0 }]}>
                <Text style={styles.activityIcon}>
                  {ACTIVITY_ICONS[item.type ?? ""] ?? "⚡"}
                </Text>
                <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                {item.points ? <Text style={styles.activityXP}>+{item.points} XP</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── 7. Daily Security Tip ── */}
      <SecurityTipCard />

      {/* ── Quick Actions (all screens in one grid) ── */}
      <QuickActions navigation={navigation} />

      {/* ── Premium banner ── */}
      <TouchableOpacity
        style={styles.premiumBanner}
        onPress={() => navigation.navigate("Premium")}
      >
        <Text style={styles.premiumBannerIcon}>👑</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.premiumBannerTitle}>Unlock Premium</Text>
          <Text style={styles.premiumBannerSub}>All labs, CTF challenges, ad-free & more</Text>
        </View>
        <Text style={styles.premiumBannerArrow}>›</Text>
      </TouchableOpacity>

      {/* ── Play Store Compliance ── */}
      <View style={styles.complianceCard}>
        <Text style={styles.complianceTitle}>🔐 Privacy & Security</Text>
        <Text style={styles.complianceItem}>✅ Data encrypted in transit (HTTPS/TLS)</Text>
        <Text style={styles.complianceItem}>✅ JWT tokens stored in SecureStore</Text>
        <Text style={styles.complianceItem}>✅ No sensitive data logged or shared</Text>
        <Text style={styles.complianceItem}>✅ Minimal permissions required</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.complianceLink}>View Privacy Policy & Settings →</Text>
        </TouchableOpacity>
      </View>

      {/* ── 10. Logout ── */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  content: {
    padding: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },

  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // ── Streak banner ──────────────────────────────────
  streakBanner: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBannerIcon: { fontSize: 24 },
  streakBannerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  streakBannerSub:   { color: "#AAAAAA", fontSize: 12, marginTop: 2 },
  streakBannerBtn: {
    backgroundColor: Colors.primary,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },

  // ── Overview (icon + badge) ────────────────────────
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  overviewItem: {
    alignItems: "center",
    flex: 1,
  },
  overviewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
  },
  overviewEmoji: {
    fontSize: 24,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 54,
  },

  // Badge (count bubble on icon corner)
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeOrange: {
    backgroundColor: "#F59E0B",
  },
  badgeRed: {
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },

  // ── Combined progress card ─────────────────────────
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
  },
  progressIcon: { fontSize: 24, marginTop: 2 },
  progressInfo: { flex: 1 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontWeight: "700", color: Colors.text, fontSize: 13 },
  progressCount: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  progressMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },

  // ── Recent Activity ────────────────────────────────
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  activityIcon:  { fontSize: 18 },
  activityTitle: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: "600" },
  activityXP:    { color: "#10B981", fontWeight: "700", fontSize: 12 },

  // ── Premium banner ─────────────────────────────────
  premiumBanner: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusLarge,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  premiumBannerIcon:  { fontSize: 28 },
  premiumBannerTitle: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  premiumBannerSub:   { color: "#FFD0D0", fontSize: 12, marginTop: 2 },
  premiumBannerArrow: { color: "#FFF", fontSize: 28, fontWeight: "700" },

  // ── Play Store Compliance card ──────────────────────
  complianceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  complianceTitle: {
    fontWeight: "700",
    color: Colors.text,
    fontSize: 13,
    marginBottom: 10,
  },
  complianceItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 5,
    lineHeight: 18,
  },
  complianceLink: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 8,
  },
});
