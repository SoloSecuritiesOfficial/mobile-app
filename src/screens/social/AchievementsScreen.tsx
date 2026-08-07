import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

interface Achievement {
  _id: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  unlocked: boolean;
  progress: number;
  requirement: { type: string; target: number };
}

const RARITY_COLORS: Record<string, string> = {
  Common:    "#6B7280",
  Rare:      "#3B82F6",
  Epic:      "#8B5CF6",
  Legendary: "#F59E0B",
};

const RARITY_BG: Record<string, string> = {
  Common:    "#F3F4F6",
  Rare:      "#EFF6FF",
  Epic:      "#F5F3FF",
  Legendary: "#FFFBEB",
};

// ── "How to earn" copy for each requirement type ─────────────────
const howToEarn = (req: { type: string; target: number }): string => {
  switch (req.type) {
    case "streak_days":
      return `Maintain a daily streak for ${req.target} consecutive days. Log in and complete any quiz or lab each day to keep your streak alive.`;
    case "quiz_completed":
      return `Complete ${req.target} quizzes. Open any quiz from the Quiz Center, answer all questions, and tap Submit.`;
    case "lab_completed":
      return `Complete ${req.target} hands-on labs. Open a lab, read the steps, and tap "Complete Lab + XP" at the bottom.`;
    case "level_reached":
      return `Reach Level ${req.target}. Earn XP by completing quizzes, labs, and daily check-ins. Every 1,000 XP = 1 Level.`;
    case "xp_earned":
      return `Earn a total of ${req.target.toLocaleString()} XP. Complete quizzes (+10 XP/correct answer), labs (+25–350 XP), and daily check-ins (+20 XP).`;
    case "friends_count":
      return `Add ${req.target} friends. Go to Friends → Search, find users, and send them friend requests.`;
    case "scan_count":
      return `Run ${req.target} security scans. Go to Security Scan, enter a domain, and tap Start Scan.`;
    default:
      return `Complete the required ${req.type.replace(/_/g, " ")} to unlock this achievement.`;
  }
};

type Filter = "all" | "unlocked" | "locked";

export default function AchievementsScreen() {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter]         = useState<Filter>("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/gamification/achievements/all");
      setAchievements(res.data?.data ?? []);
    } catch (err) {
      console.log("Achievements error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const categories = ["All", ...Array.from(new Set(achievements.map(a => a.category)))];

  const filtered = achievements
    .filter(a => {
      if (filter === "unlocked") return a.unlocked;
      if (filter === "locked")   return !a.unlocked;
      return true;
    })
    .filter(a => selectedCategory === "All" || a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXP       = achievements.filter(a => a.unlocked).reduce((s, a) => s + a.xpReward, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.headerTitle}>Achievements 🏅</Text>
        <Text style={styles.headerSub}>Unlock badges by hitting milestones • Tap any card to see how to earn it</Text>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{achievements.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalXP}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {achievements.length > 0
                ? Math.round((unlockedCount / achievements.length) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* ── How XP works ── */}
        <View style={styles.xpGuide}>
          <Text style={styles.xpGuideTitle}>⚡ How to Earn XP & Level Up</Text>
          {[
            { action: "Daily Check-in",       xp: "+20 XP" },
            { action: "Correct quiz answer",  xp: "+10 XP" },
            { action: "Complete a lab",       xp: "+25–350 XP" },
            { action: "Pass a quiz (60%+)",   xp: "+bonus XP" },
            { action: "Complete a lesson",    xp: "+10 XP" },
          ].map(({ action, xp }) => (
            <View key={action} style={styles.xpRow}>
              <Text style={styles.xpAction}>{action}</Text>
              <Text style={styles.xpAmount}>{xp}</Text>
            </View>
          ))}
          <Text style={styles.xpNote}>Every 1,000 XP = 1 Level • Level 5/10/20/30/50 unlock certificates 📜</Text>
        </View>

        {/* ── Filter tabs ── */}
        <View style={styles.filterRow}>
          {(["all", "unlocked", "locked"] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Category chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Achievement cards ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏅</Text>
            <Text style={styles.emptyTitle}>
              {filter === "unlocked" ? "No Achievements Unlocked Yet" : "No Achievements Found"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "unlocked"
                ? "Complete quizzes, labs, and maintain streaks to earn achievements."
                : "Try a different filter."}
            </Text>
          </View>
        ) : (
          filtered.map(a => {
            const isExpanded = expandedId === a._id;
            const rarityColor = RARITY_COLORS[a.rarity];
            const rarityBg    = RARITY_BG[a.rarity];

            return (
              <TouchableOpacity
                key={a._id}
                activeOpacity={0.85}
                style={[styles.card, !a.unlocked && styles.cardLocked, { borderLeftColor: rarityColor }]}
                onPress={() => setExpandedId(isExpanded ? null : a._id)}
              >
                {/* ── Icon + title row ── */}
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: rarityBg }]}>
                    <Text style={styles.iconText}>{a.unlocked ? a.icon : "🔒"}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardName, !a.unlocked && styles.textDim]} numberOfLines={1}>
                        {a.name}
                      </Text>
                      <View style={[styles.rarityBadge, { backgroundColor: rarityBg }]}>
                        <Text style={[styles.rarityText, { color: rarityColor }]}>{a.rarity}</Text>
                      </View>
                    </View>

                    <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 2}>
                      {a.description}
                    </Text>

                    <View style={styles.cardMeta}>
                      <Text style={styles.categoryText}>{a.category}</Text>
                      <Text style={styles.xpText}>+{a.xpReward} XP</Text>
                    </View>
                  </View>
                </View>

                {/* ── Progress bar (locked only) ── */}
                {!a.unlocked && a.progress > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${Math.min(a.progress, 100)}%`, backgroundColor: rarityColor }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(a.progress)}%</Text>
                  </View>
                )}

                {/* ── Unlocked chip ── */}
                {a.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedBadgeText}>✓ Unlocked</Text>
                  </View>
                )}

                {/* ── "How to Earn" expanded section ── */}
                {isExpanded && (
                  <View style={styles.howToEarnBox}>
                    <Text style={styles.howToEarnTitle}>
                      {a.unlocked ? "✓ How you earned this" : "💡 How to earn this"}
                    </Text>
                    <Text style={styles.howToEarnText}>{howToEarn(a.requirement)}</Text>
                    {!a.unlocked && a.requirement?.target > 0 && (
                      <View style={styles.targetRow}>
                        <Text style={styles.targetLabel}>Target:</Text>
                        <Text style={styles.targetValue}>
                          {a.requirement.target.toLocaleString()} {a.requirement.type.replace(/_/g, " ")}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ── Expand hint ── */}
                <Text style={styles.expandHint}>
                  {isExpanded ? "▲ Tap to collapse" : "▼ Tap to see how to earn"}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content:    { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: 100 },

  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub:   { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg, lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statNum:  { fontWeight: "800", color: Colors.primary, fontSize: 16 },
  statLabel:{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 },

  // ── XP guide ──
  xpGuide: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  xpGuideTitle: { color: "#F1F5F9", fontWeight: "700", fontSize: 14, marginBottom: 12 },
  xpRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  xpAction:{ color: "#94A3B8", fontSize: 13 },
  xpAmount:{ color: "#22C55E", fontWeight: "700", fontSize: 13 },
  xpNote:  { color: "#64748B", fontSize: 11, marginTop: 8, lineHeight: 16 },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.md },
  filterBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  filterTextActive: { color: "#FFF", fontWeight: "700" },

  catScroll: { marginBottom: Spacing.md },
  catBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText:      { color: Colors.textSecondary, fontWeight: "600", fontSize: 12 },
  catTextActive:{ color: "#FFF", fontWeight: "700" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  cardLocked: { opacity: 0.7 },
  cardTop:    { flexDirection: "row", gap: 14, marginBottom: 8 },
  iconBox:    { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  iconText:   { fontSize: 26 },
  cardInfo:   { flex: 1 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardName:   { fontWeight: "700", color: Colors.text, fontSize: 15, flex: 1, paddingRight: 8 },
  textDim:    { color: Colors.textSecondary },
  cardDesc:   { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  cardMeta:   { flexDirection: "row", justifyContent: "space-between" },
  categoryText: { color: Colors.primary, fontWeight: "600", fontSize: 11 },
  xpText:       { color: "#22C55E", fontWeight: "700", fontSize: 12 },
  rarityBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rarityText:   { fontWeight: "700", fontSize: 11 },

  progressWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  progressBg:   { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", minWidth: 32 },

  unlockedBadge:     { alignSelf: "flex-start", backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  unlockedBadgeText: { color: "#22C55E", fontWeight: "700", fontSize: 12 },

  howToEarnBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  howToEarnTitle: { fontWeight: "700", color: Colors.text, fontSize: 13, marginBottom: 6 },
  howToEarnText:  { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  targetRow:  { flexDirection: "row", gap: 8, marginTop: 8 },
  targetLabel:{ color: Colors.textMuted, fontSize: 12 },
  targetValue:{ color: Colors.primary, fontWeight: "700", fontSize: 12 },

  expandHint: { color: Colors.primary, fontSize: 11, fontWeight: "600", textAlign: "right", marginTop: 6 },

  emptyBox:   { alignItems: "center", paddingTop: 60 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginBottom: 8, textAlign: "center" },
  emptyText:  { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
});
