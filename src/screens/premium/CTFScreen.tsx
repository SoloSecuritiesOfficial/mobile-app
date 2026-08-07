import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

type Tab = "challenges" | "leaderboard" | "solved";

interface CTFChallenge {
  _id: string;
  challengeId: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  points: number;
  solves: any[];
  hints: { cost: number; hint: string; unlocked: boolean }[];
  tags: string[];
  isPremiumOnly: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22C55E",
  Medium: "#F59E0B",
  Hard: "#EF4444",
  Insane: "#7C3AED",
};

export default function CTFScreen() {
  const [tab, setTab] = useState<Tab>("challenges");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [challenges, setChallenges] = useState<CTFChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [solved, setSolved] = useState<CTFChallenge[]>([]);

  const [selectedChallenge, setSelectedChallenge] = useState<CTFChallenge | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const loadData = useCallback(async () => {
    try {
      const [cRes, lRes, sRes] = await Promise.all([
        api.get("/ctf"),
        api.get("/ctf/leaderboard"),
        api.get("/ctf/solved"),
      ]);
      setChallenges(cRes.data?.data ?? []);
      setLeaderboard(lRes.data?.data ?? []);
      setSolved(sRes.data?.data ?? []);
    } catch (err) {
      console.log("CTF load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSubmitFlag = async () => {
    if (!selectedChallenge || !flagInput.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/ctf/${selectedChallenge.challengeId}/submit`, { flag: flagInput.trim() });
      if (res.data?.success) {
        Alert.alert("🎉 Correct!", `${res.data.isFirstBlood ? "🩸 First Blood! " : ""}You earned ${res.data.xpEarned} XP!`);
        setSelectedChallenge(null);
        setFlagInput("");
        loadData();
      } else {
        Alert.alert("❌ Incorrect", "Wrong flag. Keep trying!");
      }
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.premiumRequired) {
        Alert.alert(
          "👑 Premium Required",
          err?.response?.data?.message || "This challenge requires a Premium subscription.",
          [{ text: "OK" }]
        );
        setSelectedChallenge(null);
      } else {
        Alert.alert("❌ Incorrect", err?.response?.data?.message || "Wrong flag. Try again!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(challenges.map(c => c.category)))];
  const solvedIds = new Set(solved.map(s => s.challengeId));

  const filtered = filterCategory === "All"
    ? challenges
    : challenges.filter(c => c.category === filterCategory);

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
        <Text style={styles.headerTitle}>CTF Arena 🚩</Text>
        <Text style={styles.headerSub}>Capture The Flag security challenges</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{challenges.length}</Text>
            <Text style={styles.statPillLabel}>Challenges</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{solved.length}</Text>
            <Text style={styles.statPillLabel}>Solved</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{solved.reduce((acc, c) => acc + c.points, 0)}</Text>
            <Text style={styles.statPillLabel}>Points</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["challenges", "leaderboard", "solved"] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* CHALLENGES */}
        {tab === "challenges" && (
          <>
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, filterCategory === cat && styles.catBtnActive]}
                  onPress={() => setFilterCategory(cat)}
                >
                  <Text style={[styles.catBtnText, filterCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🚩</Text>
                <Text style={styles.emptyTitle}>No CTF Challenges Yet</Text>
                <Text style={styles.emptyText}>Challenges will be added by the admin. Check back soon!</Text>
              </View>
            ) : (
              filtered.map(c => {
                const isSolved = solvedIds.has(c.challengeId);
                return (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.card, isSolved && styles.cardSolved]}
                    onPress={() => { setSelectedChallenge(c); setFlagInput(""); }}
                  >
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={styles.cardTitle}>{c.title}</Text>
                        <Text style={styles.cardCategory}>{c.category}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[c.difficulty] + "22" }]}>
                          <Text style={[styles.diffBadgeText, { color: DIFFICULTY_COLORS[c.difficulty] }]}>{c.difficulty}</Text>
                        </View>
                        <Text style={styles.cardPoints}>{c.points} pts</Text>
                      </View>
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
                    <View style={styles.cardBottom}>
                      <Text style={styles.cardSolves}>👥 {c.solves?.length ?? 0} solves</Text>
                      {isSolved && <View style={styles.solvedBadge}><Text style={styles.solvedBadgeText}>✓ Solved</Text></View>}
                      {(c.isPremiumOnly || c.difficulty === "Hard" || c.difficulty === "Insane") && (
                        <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>👑 Premium</Text></View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          leaderboard.length === 0
            ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>🏆</Text><Text style={styles.emptyTitle}>No Scores Yet</Text><Text style={styles.emptyText}>Be the first to solve a CTF challenge!</Text></View>
            : leaderboard.map((u, i) => (
              <View key={i} style={styles.lbCard}>
                <Text style={[styles.lbRank, i < 3 && styles.lbRankTop]}>{i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`}</Text>
                <View style={styles.lbInfo}>
                  <Text style={styles.lbName}>{u.username}</Text>
                  <Text style={styles.lbSolves}>{u.ctfSolves} solves</Text>
                </View>
                <Text style={styles.lbPoints}>{u.ctfPoints} pts</Text>
              </View>
            ))
        )}

        {/* SOLVED */}
        {tab === "solved" && (
          solved.length === 0
            ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>🔓</Text><Text style={styles.emptyTitle}>No Solved Challenges</Text><Text style={styles.emptyText}>Solve your first CTF challenge to see it here.</Text></View>
            : solved.map(c => (
              <View key={c._id} style={[styles.card, styles.cardSolved]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardPoints}>{c.points} pts</Text>
                </View>
                <Text style={styles.cardCategory}>{c.category} • {c.difficulty}</Text>
              </View>
            ))
        )}
      </ScrollView>

      {/* Challenge Detail Modal */}
      <Modal visible={!!selectedChallenge} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={() => setSelectedChallenge(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕ Close</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{selectedChallenge?.title}</Text>
              <Text style={styles.modalMeta}>{selectedChallenge?.category} • {selectedChallenge?.difficulty} • {selectedChallenge?.points} pts</Text>
              <Text style={styles.modalDesc}>{selectedChallenge?.description}</Text>

              {selectedChallenge?.hints?.length ? (
                <>
                  <Text style={styles.modalSection}>💡 Hints</Text>
                  {selectedChallenge.hints.map((h, i) => (
                    <View key={i} style={styles.hintCard}>
                      <Text style={styles.hintCost}>Cost: {h.cost} pts</Text>
                      {h.unlocked
                        ? <Text style={styles.hintText}>{h.hint}</Text>
                        : <Text style={styles.hintLocked}>🔒 Locked — tap to unlock</Text>}
                    </View>
                  ))}
                </>
              ) : null}

              <Text style={styles.modalSection}>🚩 Submit Flag</Text>
              <TextInput
                style={styles.flagInput}
                placeholder="flag{...}"
                placeholderTextColor={Colors.textMuted}
                value={flagInput}
                onChangeText={setFlagInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.submitFlagBtn}
                onPress={handleSubmitFlag}
                disabled={submitting || !flagInput.trim()}
              >
                {submitting
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.submitFlagBtnText}>Submit Flag →</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statPill: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", flex: 1, borderWidth: 1, borderColor: Colors.border },
  statPillNum: { fontWeight: "800", color: Colors.primary, fontSize: 18 },
  statPillLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  tabRow: { flexDirection: "row", paddingHorizontal: Spacing.screen, gap: 8, marginBottom: Spacing.sm },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: "#FFF", fontWeight: "700" },
  content: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  catScroll: { marginBottom: Spacing.md },
  catBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 12 },
  catBtnTextActive: { color: "#FFF", fontWeight: "700" },
  card: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardSolved: { borderColor: "#22C55E", borderWidth: 1.5 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { ...Typography.bodyMedium, color: Colors.text, fontWeight: "700", flex: 1, paddingRight: 8 },
  cardCategory: { color: Colors.primary, fontSize: 12, fontWeight: "600" },
  cardDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardSolves: { color: Colors.textMuted, fontSize: 12 },
  cardPoints: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffBadgeText: { fontWeight: "700", fontSize: 11 },
  solvedBadge: { backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  solvedBadgeText: { color: "#22C55E", fontWeight: "700", fontSize: 11 },
  premiumBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  premiumBadgeText: { color: "#D97706", fontWeight: "700", fontSize: 11 },
  lbCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  lbRank: { fontSize: 20, marginRight: 14, minWidth: 36, textAlign: "center", color: Colors.textMuted, fontWeight: "700" },
  lbRankTop: { fontSize: 26 },
  lbInfo: { flex: 1 },
  lbName: { fontWeight: "700", color: Colors.text, fontSize: 15 },
  lbSolves: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  lbPoints: { color: Colors.primary, fontWeight: "800", fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: Colors.border },
  modalClose: { alignSelf: "flex-end", marginBottom: 12 },
  modalCloseText: { color: Colors.textSecondary, fontWeight: "600" },
  modalTitle: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  modalMeta: { color: Colors.primary, fontWeight: "600", fontSize: 13, marginBottom: 12 },
  modalDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  modalSection: { fontWeight: "700", color: Colors.text, fontSize: 15, marginBottom: 10, marginTop: 8 },
  hintCard: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  hintCost: { color: Colors.primary, fontWeight: "600", fontSize: 12, marginBottom: 4 },
  hintText: { color: Colors.text, fontSize: 13 },
  hintLocked: { color: Colors.textMuted, fontSize: 13 },
  flagInput: { backgroundColor: Colors.background, color: Colors.text, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "monospace", fontSize: 14, marginBottom: 12 },
  submitFlagBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  submitFlagBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginBottom: 8 },
  emptyText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
});
