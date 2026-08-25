import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
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
import AdBanner from "../../components/AdBanner";

import {
  fetchCurrentUser,
  getCurrentUser,
  dailyCheckIn,
} from "../../services/authService";
import { getSecurityDashboard } from "../../services/securityService";
import { getCertificates } from "../../services/certificateService";
import {
  getUnreadNotificationCount,
  checkAndTriggerDeviceNotifications,
} from "../../services/notificationService";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

// ─── types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  _id?: string;
  type?: string;
  title?: string;
  points?: number;
}

interface ProgressEntry {
  completed: number;
  total:     number;
  pct:       number;
}

interface DashboardData {
  securityScore?:   number;
  reports?:         number;
  rank?:            string;
  streak?:          number;
  learningCompleted?: number;
  learningTotal?:     number;
  labCompleted?:      number;
  labTotal?:          number;
  quizCompleted?:     number;
  quizTotal?:         number;
  ctfCompleted?:      number;
  ctfTotal?:          number;
  scoreBreakdown?:    any | null;
  recentActivity?: ActivityItem[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, string> = {
  LAB:         "🎯",
  CERTIFICATE: "🏆",
  LEARNING:    "📚",
  SCAN:        "🛡️",
  BUG_REPORT:  "🐞",
  QUIZ:        "📝",
  CTF:         "🚩",
};

/** Build a capped ProgressEntry from raw done/total values. */
function prog(done: number | undefined, total: number | undefined): ProgressEntry {
  const t    = total ?? 0;
  const d    = Math.min(done ?? 0, t);
  const pct  = t > 0 ? Math.round((d / t) * 100) : 0;
  return { completed: d, total: t, pct };
}

// ─── Progress Detail Modal ────────────────────────────────────────────────────

interface ProgressDetailConfig {
  emoji:     string;
  label:     string;
  color:     string;
  entry:     ProgressEntry;
  navigate?: () => void;
  navLabel?: string;
}

function ProgressDetailModal({
  config,
  onClose,
}: {
  config: ProgressDetailConfig | null;
  onClose: () => void;
}) {
  if (!config) return null;
  const { emoji, label, color, entry, navigate, navLabel } = config;
  const remaining = entry.total - entry.completed;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={pd.overlay} onPress={onClose}>
        <Pressable style={pd.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={pd.handle} />

          {/* Header */}
          <View style={[pd.header, { borderBottomColor: color + "33" }]}>
            <View style={[pd.iconWrap, { backgroundColor: color + "22" }]}>
              <Text style={pd.emoji}>{emoji}</Text>
            </View>
            <Text style={pd.title}>{label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={pd.closeBtn}>
              <Text style={pd.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Big pct */}
          <View style={pd.pctRow}>
            <Text style={[pd.pctNum, { color }]}>{entry.pct}%</Text>
            <Text style={pd.pctSub}>overall completion</Text>
          </View>

          {/* Progress bar */}
          <View style={pd.barWrap}>
            <View style={pd.barTrack}>
              <View
                style={[
                  pd.barFill,
                  { width: `${entry.pct}%` as any, backgroundColor: color },
                ]}
              />
            </View>
          </View>

          {/* Stat rows */}
          {[
            { label: "Total Available", value: String(entry.total),    icon: "📋" },
            { label: "Completed",       value: String(entry.completed), icon: "✅" },
            { label: "Remaining",       value: String(remaining),       icon: "⏳" },
            {
              label: "Status",
              value:
                entry.pct === 100
                  ? "All done! 🎉"
                  : entry.pct >= 75
                  ? "Almost there!"
                  : entry.pct >= 50
                  ? "Halfway through"
                  : entry.pct > 0
                  ? "Just getting started"
                  : "Not started yet",
              icon: "🏁",
            },
          ].map((row, i, arr) => (
            <View
              key={i}
              style={[pd.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={pd.rowIcon}>{row.icon}</Text>
              <Text style={pd.rowLabel}>{row.label}</Text>
              <Text style={[pd.rowValue, { color }]}>{row.value}</Text>
            </View>
          ))}

          {/* Navigate CTA */}
          {navigate && navLabel && (
            <TouchableOpacity
              style={[pd.navBtn, { backgroundColor: color }]}
              onPress={() => { onClose(); navigate(); }}
            >
              <Text style={pd.navBtnText}>{navLabel} →</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── ProgressRow ──────────────────────────────────────────────────────────────

function ProgressRow({
  emoji,
  label,
  color,
  entry,
  onPress,
  isLast,
}: {
  emoji:   string;
  label:   string;
  color:   string;
  entry:   ProgressEntry;
  onPress: () => void;
  isLast:  boolean;
}) {
  return (
    <>
      <TouchableOpacity
        style={pr.row}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text style={pr.icon}>{emoji}</Text>
        <View style={pr.info}>
          <View style={pr.topRow}>
            <Text style={pr.label}>{label}</Text>
            <View style={pr.countWrap}>
              <Text style={[pr.count, { color }]}>
                {entry.completed}/{entry.total}
              </Text>
              <Text style={pr.tapHint}>tap for details</Text>
            </View>
          </View>
          <View style={pr.track}>
            <View
              style={[
                pr.fill,
                {
                  width: entry.total > 0 ? `${entry.pct}%` as any : "0%",
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={pr.meta}>
            {entry.pct}% complete
            {entry.total > 0
              ? ` • ${entry.total - entry.completed} remaining`
              : " • No content yet"}
          </Text>
        </View>
      </TouchableOpacity>
      {!isLast && <View style={pr.divider} />}
    </>
  );
}

// ─── DashboardScreen ──────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }: Props) {
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]         = useState(false);
  const [user,              setUser]               = useState<any>(null);
  const [dashboard,         setDashboard]          = useState<DashboardData>({});
  const [certificateCount,  setCertificateCount]   = useState(0);
  const [notificationCount, setNotificationCount]  = useState(0);
  const [progressModal,     setProgressModal]      = useState<ProgressDetailConfig | null>(null);

  // ── data loading ────────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const latestUser   = await fetchCurrentUser();
      const fallbackUser = await getCurrentUser();
      setUser(latestUser ?? fallbackUser);

      const dashRes = await getSecurityDashboard();
      // Backend returns { success, data: { ... } }
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

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      const poll = setInterval(loadDashboard, 30_000); // poll every 30 s (was 10 s — too aggressive)
      return () => clearInterval(poll);
    }, [loadDashboard]),
  );

  // ── loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // ── progress entries ─────────────────────────────────────────────────────────
  const learning = prog(dashboard.learningCompleted, dashboard.learningTotal);
  const labs     = prog(dashboard.labCompleted,      dashboard.labTotal);
  const quiz     = prog(dashboard.quizCompleted,     dashboard.quizTotal);
  const ctf      = prog(dashboard.ctfCompleted,      dashboard.ctfTotal);

  // Overall progress = weighted average of all 4 categories
  const totalDone  = learning.completed + labs.completed + quiz.completed + ctf.completed;
  const totalItems = learning.total     + labs.total     + quiz.total     + ctf.total;
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // ── progress rows config ─────────────────────────────────────────────────────
  const progressRows: Array<{
    emoji: string; label: string; color: string; entry: ProgressEntry;
    navLabel: string; navigate: () => void;
  }> = [
    {
      emoji: "📚", label: "Learning Modules", color: "#3B82F6",
      entry: learning,
      navLabel: "Go to Learning",
      navigate: () => navigation.navigate("Learning"),
    },
    {
      emoji: "🎯", label: "Hands-on Labs", color: "#22C55E",
      entry: labs,
      navLabel: "Go to Labs",
      navigate: () => navigation.navigate("Labs"),
    },
    {
      emoji: "📝", label: "Quizzes", color: "#F59E0B",
      entry: quiz,
      navLabel: "Go to Quiz",
      navigate: () => navigation.navigate("Quiz"),
    },
    {
      emoji: "🚩", label: "CTF Challenges", color: "#EF4444",
      entry: ctf,
      navLabel: "Go to CTF",
      navigate: () => navigation.navigate("CTF"),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
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
        {/* ── 1. Header ── */}
        <DashboardHeader user={user} navigation={navigation} />

        {/* ── 2. Daily Check-in ── */}
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

        {/* ── 3. Security Score (chips + score number are clickable) ── */}
        <SecurityScoreCard
          securityScore={dashboard.securityScore ?? 0}
          xp={user?.xp ?? 0}
          points={user?.points ?? 0}
          level={user?.level ?? 1}
          streak={dashboard.streak ?? 0}
          scoreBreakdown={dashboard.scoreBreakdown ?? null}
        />

        {/* ── 4. Overview badges ── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewRow}>
          <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("BugReports")}>
            <View style={styles.overviewIconWrap}>
              <Text style={styles.overviewEmoji}>🐞</Text>
              {(dashboard.reports ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{dashboard.reports}</Text>
                </View>
              )}
            </View>
            <Text style={styles.overviewLabel}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("Certificates")}>
            <View style={styles.overviewIconWrap}>
              <Text style={styles.overviewEmoji}>🏆</Text>
              {certificateCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{certificateCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.overviewLabel}>Certs</Text>
          </TouchableOpacity>

          <View style={styles.overviewItem}>
            <View style={styles.overviewIconWrap}>
              <Text style={styles.overviewEmoji}>🥇</Text>
            </View>
            <Text style={styles.overviewLabel} numberOfLines={1} ellipsizeMode="tail">
              {(dashboard.rank ?? "—").replace("#", "").substring(0, 6)}
            </Text>
          </View>

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

          <TouchableOpacity style={styles.overviewItem} onPress={() => navigation.navigate("Notifications")}>
            <View style={styles.overviewIconWrap}>
              <Text style={styles.overviewEmoji}>🔔</Text>
              {notificationCount > 0 && (
                <View style={[styles.badge, styles.badgeRed]}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.overviewLabel}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Progress — all 4 categories ── */}
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Progress</Text>
          {/* Overall pill */}
          <View style={styles.overallPill}>
            <Text style={styles.overallText}>{overallPct}% overall</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          {progressRows.map((row, i) => (
            <ProgressRow
              key={row.label}
              emoji={row.emoji}
              label={row.label}
              color={row.color}
              entry={row.entry}
              isLast={i === progressRows.length - 1}
              onPress={() =>
                setProgressModal({
                  emoji:    row.emoji,
                  label:    row.label,
                  color:    row.color,
                  entry:    row.entry,
                  navigate: row.navigate,
                  navLabel: row.navLabel,
                })
              }
            />
          ))}
        </View>

        {/* ── 6. Recent Activity ── */}
        {(dashboard.recentActivity ?? []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityCard}>
              {(dashboard.recentActivity ?? []).slice(0, 5).map((item, idx, arr) => (
                <View
                  key={item._id ?? idx}
                  style={[
                    styles.activityItem,
                    idx === Math.min(arr.length, 5) - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.activityIcon}>
                    {ACTIVITY_ICONS[item.type ?? ""] ?? "⚡"}
                  </Text>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.points ? (
                    <Text style={styles.activityXP}>+{item.points} XP</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── 7. Daily Security Tip ── */}
        <SecurityTipCard />

        {/* ── 8. Ad banner ── */}
        <AdBanner isPremium={user?.isPremium} marginVertical={12} />

        {/* ── 9. Quick Actions ── */}
        <QuickActions navigation={navigation} />

        {/* ── 10. Premium banner ── */}
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => navigation.navigate("Premium")}
        >
          <Text style={styles.premiumBannerIcon}>👑</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumBannerTitle}>Unlock Premium</Text>
            <Text style={styles.premiumBannerSub}>
              All labs, CTF challenges, ad-free & more
            </Text>
          </View>
          <Text style={styles.premiumBannerArrow}>›</Text>
        </TouchableOpacity>

        {/* ── 11. Compliance ── */}
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
      </ScrollView>

      {/* ── Progress detail modal (rendered outside ScrollView so it overlays) ── */}
      <ProgressDetailModal
        config={progressModal}
        onClose={() => setProgressModal(null)}
      />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content: { padding: Spacing.screen, paddingBottom: Spacing.xxl },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },

  // streak banner
  streakBanner: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  streakBannerIcon:  { fontSize: 24 },
  streakBannerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  streakBannerSub:   { color: "#AAAAAA", fontSize: 12, marginTop: 2 },
  streakBannerBtn:   {
    backgroundColor: Colors.primary, color: "#FFFFFF",
    fontSize: 12, fontWeight: "700",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, overflow: "hidden",
  },

  // overview
  overviewRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  overviewItem:     { alignItems: "center", flex: 1 },
  overviewIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    justifyContent: "center", alignItems: "center", marginBottom: 6, position: "relative",
  },
  overviewEmoji: { fontSize: 24 },
  overviewLabel: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary, textAlign: "center", maxWidth: 54 },

  badge:       { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", paddingHorizontal: 3, borderWidth: 2, borderColor: Colors.background },
  badgeOrange: { backgroundColor: "#F59E0B" },
  badgeRed:    { backgroundColor: "#EF4444" },
  badgeText:   { color: "#FFF", fontSize: 9, fontWeight: "800", lineHeight: 11 },

  // progress header row (title + overall pill side-by-side)
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.lg, marginBottom: Spacing.md },
  overallPill:    { backgroundColor: Colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + "44" },
  overallText:    { color: Colors.primary, fontSize: 11, fontWeight: "700" },

  // progress card
  progressCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },

  // activity
  activityCard:  { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  activityItem:  { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  activityIcon:  { fontSize: 18 },
  activityTitle: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: "600" },
  activityXP:    { color: "#10B981", fontWeight: "700", fontSize: 12 },

  // premium banner
  premiumBanner:      { backgroundColor: Colors.primary, borderRadius: Spacing.radiusLarge, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: Spacing.md },
  premiumBannerIcon:  { fontSize: 28 },
  premiumBannerTitle: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  premiumBannerSub:   { color: "#FFD0D0", fontSize: 12, marginTop: 2 },
  premiumBannerArrow: { color: "#FFF", fontSize: 28, fontWeight: "700" },

  // compliance
  complianceCard:  { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  complianceTitle: { fontWeight: "700", color: Colors.text, fontSize: 13, marginBottom: 10 },
  complianceItem:  { fontSize: 12, color: Colors.textSecondary, marginBottom: 5, lineHeight: 18 },
  complianceLink:  { color: Colors.primary, fontWeight: "700", fontSize: 12, marginTop: 8 },
});

// ── ProgressRow sub-styles ────────────────────────────────────────────────────

const pr = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8 },
  icon:    { fontSize: 22, marginTop: 2 },
  info:    { flex: 1 },
  topRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  label:   { fontWeight: "700", color: Colors.text, fontSize: 13, flex: 1 },
  countWrap: { alignItems: "flex-end" },
  count:   { fontWeight: "800", fontSize: 13 },
  tapHint: { fontSize: 9, color: Colors.textSecondary, marginTop: 1 },
  track:   { height: 8, backgroundColor: Colors.border, borderRadius: 10, overflow: "hidden" },
  fill:    { height: "100%", borderRadius: 10, minWidth: 2 },
  meta:    { fontSize: 11, color: Colors.textSecondary, marginTop: 5 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
});

// ── ProgressDetailModal sub-styles ───────────────────────────────────────────

const pd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:   { backgroundColor: Colors.surface ?? "#1A1A2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, maxHeight: "80%" },
  handle:  { width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },

  header:   { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  emoji:    { fontSize: 20 },
  title:    { flex: 1, fontSize: 17, fontWeight: "800", color: Colors.text ?? "#FFF" },
  closeBtn: { padding: 6 },
  closeText:{ fontSize: 14, color: Colors.textSecondary ?? "#AAA", fontWeight: "700" },

  pctRow:  { alignItems: "center", paddingTop: 18, paddingBottom: 6 },
  pctNum:  { fontSize: 52, fontWeight: "900", lineHeight: 58 },
  pctSub:  { fontSize: 12, color: Colors.textSecondary ?? "#AAA", marginTop: 2, fontWeight: "600" },

  barWrap:  { paddingHorizontal: 24, marginBottom: 8 },
  barTrack: { height: 10, backgroundColor: Colors.border ?? "#333", borderRadius: 10, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: 10, minWidth: 4 },

  row:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", marginHorizontal: 20, gap: 10 },
  rowIcon:  { fontSize: 16, width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary ?? "#AAA", fontWeight: "500" },
  rowValue: { fontSize: 14, fontWeight: "800" },

  navBtn:     { marginHorizontal: 20, marginTop: 18, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  navBtnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
});
