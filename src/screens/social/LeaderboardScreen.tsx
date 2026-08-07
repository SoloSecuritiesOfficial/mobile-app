import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import { getCurrentUser } from "../../services/authService";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

type Tab = "xp" | "level" | "streak" | "quiz";

interface LeaderboardEntry {
  _id: string;
  username: string;
  profileImage?: string;
  xp?: number;
  level?: number;
  dailyStreak?: number;
  quizzesCompleted?: number;
  points?: number;
  rank?: string;
  ctfPoints?: number;
  ctfSolves?: number;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "xp",     label: "XP",     icon: "⚡" },
  { key: "level",  label: "Level",  icon: "🎖️" },
  { key: "streak", label: "Streak", icon: "🔥" },
  { key: "quiz",   label: "Quiz",   icon: "🧠" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>("xp");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [res, user] = await Promise.all([
        api.get(`/gamification/leaderboard?type=${tab}&limit=50`),
        getCurrentUser(),
      ]);
      setData(res.data?.data ?? []);
      setCurrentUserId(user?._id ?? null);
    } catch (err) {
      console.log("Leaderboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const getMetric = (entry: LeaderboardEntry) => {
    switch (tab) {
      case "xp":     return `${entry.xp ?? entry.points ?? 0} XP`;
      case "level":  return `Level ${entry.level ?? 1}`;
      case "streak": return `${entry.dailyStreak ?? 0} days`;
      case "quiz":   return `${entry.quizzesCompleted ?? 0} quizzes`;
    }
  };

  const currentUserIndex = data.findIndex(e => e._id === currentUserId);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard 🏆</Text>
        <Text style={styles.headerSub}>Top security learners worldwide</Text>
        {currentUserIndex >= 0 && (
          <View style={styles.yourRankBanner}>
            <Text style={styles.yourRankText}>
              Your Rank: #{currentUserIndex + 1} • {getMetric(data[currentUserIndex])}
            </Text>
          </View>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 Podium */}
        {data.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd place */}
            <View style={styles.podiumItem}>
              <Text style={styles.podiumMedal}>{MEDALS[1]}</Text>
              <View style={[styles.podiumAvatar, { backgroundColor: "#9CA3AF" }]}>
                <Text style={styles.podiumAvatarText}>{(data[1]?.username ?? "?").substring(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{data[1]?.username}</Text>
              <Text style={styles.podiumMetric}>{getMetric(data[1])}</Text>
            </View>

            {/* 1st place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <Text style={[styles.podiumMedal, { fontSize: 32 }]}>{MEDALS[0]}</Text>
              <View style={[styles.podiumAvatar, { backgroundColor: Colors.primary, width: 64, height: 64, borderRadius: 32 }]}>
                <Text style={[styles.podiumAvatarText, { fontSize: 22 }]}>{(data[0]?.username ?? "?").substring(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={[styles.podiumName, { fontWeight: "800" }]} numberOfLines={1}>{data[0]?.username}</Text>
              <Text style={styles.podiumMetric}>{getMetric(data[0])}</Text>
            </View>

            {/* 3rd place */}
            <View style={styles.podiumItem}>
              <Text style={styles.podiumMedal}>{MEDALS[2]}</Text>
              <View style={[styles.podiumAvatar, { backgroundColor: "#CD7F32" }]}>
                <Text style={styles.podiumAvatarText}>{(data[2]?.username ?? "?").substring(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{data[2]?.username}</Text>
              <Text style={styles.podiumMetric}>{getMetric(data[2])}</Text>
            </View>
          </View>
        )}

        {/* Full List */}
        {data.slice(3).map((entry, idx) => {
          const rank = idx + 4;
          const isMe = entry._id === currentUserId;
          return (
            <View key={entry._id} style={[styles.card, isMe && styles.cardMe]}>
              <Text style={styles.rankNum}>#{rank}</Text>
              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>{(entry.username ?? "?").substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryName}>{entry.username} {isMe ? "(You)" : ""}</Text>
                <Text style={styles.entryLevel}>Level {entry.level ?? 1}</Text>
              </View>
              <Text style={styles.entryMetric}>{getMetric(entry)}</Text>
            </View>
          );
        })}

        {data.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>Be the first to appear on the leaderboard!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  yourRankBanner: { backgroundColor: Colors.primary + "22", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10, alignSelf: "flex-start" },
  yourRankText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  tabRow: { flexDirection: "row", paddingHorizontal: Spacing.screen, gap: 8, marginBottom: Spacing.md },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: Colors.surface, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  tabText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: "#FFF", fontWeight: "700" },
  content: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", marginBottom: Spacing.xl, gap: 12 },
  podiumItem: { alignItems: "center", flex: 1 },
  podiumFirst: { marginBottom: 16 },
  podiumMedal: { fontSize: 24, marginBottom: 6 },
  podiumAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  podiumAvatarText: { color: "#FFF", fontWeight: "700", fontSize: 18 },
  podiumName: { color: Colors.text, fontWeight: "700", fontSize: 12, textAlign: "center" },
  podiumMetric: { color: Colors.primary, fontWeight: "700", fontSize: 12, marginTop: 2 },
  card: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardMe: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primary + "11" },
  rankNum: { minWidth: 36, color: Colors.textMuted, fontWeight: "700", fontSize: 14 },
  entryAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginRight: 12 },
  entryAvatarText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  entryInfo: { flex: 1 },
  entryName: { fontWeight: "700", color: Colors.text, fontSize: 14 },
  entryLevel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  entryMetric: { color: Colors.primary, fontWeight: "800", fontSize: 15 },
  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginBottom: 8 },
  emptyText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center" },
});
