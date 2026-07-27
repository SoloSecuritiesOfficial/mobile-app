import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QUESTION_BANK, LabQuestion } from "../data/questionBank";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

const LAB_XP_KEY = "solosecurities_user_xp";
const COMPLETED_LABS_KEY = "solosecurities_completed_labs";

export default function LabsScreen() {
  const [activeLab, setActiveLab] = useState<LabQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [completedLabs, setCompletedLabs] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedXP = await AsyncStorage.getItem(LAB_XP_KEY);
      const storedLabs = await AsyncStorage.getItem(COMPLETED_LABS_KEY);
      if (storedXP) setUserXP(parseInt(storedXP, 10));
      if (storedLabs) setCompletedLabs(JSON.parse(storedLabs));
    } catch (e) {
      console.log("Error loading XP data:", e);
    }
  };

  const handleLabSelect = (lab: LabQuestion) => {
    setActiveLab(lab);
    setSelectedOption(null);
    setSubmitted(false);
  };

  const handleCheckAnswer = async () => {
    if (selectedOption === null) {
      Alert.alert("Selection Required", "Please choose an answer option.");
      return;
    }

    setSubmitted(true);
    if (activeLab && selectedOption === activeLab.correctIndex) {
      if (!completedLabs.includes(activeLab.id)) {
        const newXP = userXP + activeLab.points;
        const newCompleted = [...completedLabs, activeLab.id];
        setUserXP(newXP);
        setCompletedLabs(newCompleted);

        await AsyncStorage.setItem(LAB_XP_KEY, newXP.toString());
        await AsyncStorage.setItem(COMPLETED_LABS_KEY, JSON.stringify(newCompleted));
      }
    }
  };

  const getUserRank = (xp: number) => {
    if (xp >= 2000) return { rank: "Cyber Grandmaster 👑", color: "#8B5CF6" };
    if (xp >= 1000) return { rank: "Master Security Defender 🛡️", color: "#10B981" };
    if (xp >= 500) return { rank: "AppSec Auditor 🔍", color: "#3B82F6" };
    if (xp >= 200) return { rank: "Junior Pentester 💻", color: "#F59E0B" };
    return { rank: "Security Apprentice 🐣", color: Colors.textMuted };
  };

  const currentRank = getUserRank(userXP);
  const filteredLabs = categoryFilter === "All"
    ? QUESTION_BANK
    : QUESTION_BANK.filter((l) => l.category === categoryFilter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Interactive Security Labs 🎯</Text>
      <Text style={styles.headerSubtitle}>Comprehensive question bank & hands-on XP points engine</Text>

      {/* Gamification Dashboard */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.xpLabel}>Total Earned Points</Text>
            <Text style={styles.xpValue}>{userXP} XP</Text>
          </View>
          <View style={styles.rankBox}>
            <Text style={[styles.rankText, { color: currentRank.color }]}>{currentRank.rank}</Text>
          </View>
        </View>
        <Text style={styles.completedText}>Completed Labs: {completedLabs.length} / {QUESTION_BANK.length}</Text>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {["All", "Web App", "API Security", "Cryptography", "Cloud Security", "Mobile Security", "Auth & Session", "Network Defense"].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text style={[styles.filterText, categoryFilter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeLab ? (
        <View style={styles.labCard}>
          <TouchableOpacity onPress={() => setActiveLab(null)} style={{ marginBottom: 12 }}>
            <Text style={styles.backText}>← Back to Question Bank</Text>
          </TouchableOpacity>

          <View style={styles.labHeaderRow}>
            <Text style={styles.labTitle}>{activeLab.title}</Text>
            <Text style={styles.pointsBadge}>+{activeLab.points} XP</Text>
          </View>

          <Text style={styles.questionText}>{activeLab.question}</Text>

          {activeLab.options.map((opt: string, idx: number) => {
            let itemStyle: any = styles.optionItem;
            if (selectedOption === idx) {
              itemStyle = [styles.optionItem, styles.optionSelected];
            }
            if (submitted) {
              if (idx === activeLab.correctIndex) {
                itemStyle = [styles.optionItem, styles.optionCorrect];
              } else if (selectedOption === idx && idx !== activeLab.correctIndex) {
                itemStyle = [styles.optionItem, styles.optionIncorrect];
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={itemStyle}
                disabled={submitted}
                onPress={() => setSelectedOption(idx)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {!submitted ? (
            <TouchableOpacity style={styles.submitBtn} onPress={handleCheckAnswer}>
              <Text style={styles.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.explanationBox}>
              <Text style={styles.expTitle}>
                {selectedOption === activeLab.correctIndex
                  ? `🎉 Correct! (+${activeLab.points} XP)`
                  : "❌ Incorrect"}
              </Text>
              <Text style={styles.expText}>{activeLab.explanation}</Text>
            </View>
          )}
        </View>
      ) : (
        filteredLabs.map((lab) => {
          const isDone = completedLabs.includes(lab.id);
          return (
            <TouchableOpacity key={lab.id} style={styles.card} onPress={() => handleLabSelect(lab)}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{lab.category}</Text>
                <Text style={styles.pointsTag}>{isDone ? "✅ Completed (+ " + lab.points + " XP)" : "+" + lab.points + " XP"}</Text>
              </View>
              <Text style={styles.cardTitle}>{lab.title}</Text>
              <Text style={styles.snippet}>{lab.question}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 50, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md },
  scoreCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpLabel: { color: Colors.textSecondary, fontSize: 12 },
  xpValue: { fontSize: 24, fontWeight: "800", color: Colors.primary },
  rankBox: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  rankText: { fontSize: 12, fontWeight: "700" },
  completedText: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  filterRow: { marginBottom: Spacing.md },
  filterChip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#FFF" },
  card: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, marginBottom: Spacing.md, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  category: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  pointsTag: { color: "#10B981", fontSize: 12, fontWeight: "700" },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  snippet: { ...Typography.bodySmall, color: Colors.textSecondary },
  labCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding },
  backText: { color: Colors.primary, fontWeight: "700" },
  labHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  labTitle: { ...Typography.h2, color: Colors.text, flex: 1, marginRight: 8 },
  pointsBadge: { backgroundColor: "#10B981", color: "#FFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: "700" },
  questionText: { ...Typography.bodyLarge, color: Colors.text, marginBottom: 16, lineHeight: 22 },
  optionItem: { backgroundColor: Colors.background, padding: 14, borderRadius: Spacing.radiusMedium, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { borderColor: Colors.primary, backgroundColor: "rgba(59, 130, 246, 0.15)" },
  optionCorrect: { borderColor: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.15)" },
  optionIncorrect: { borderColor: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.15)" },
  optionText: { color: Colors.text, fontSize: 14 },
  submitBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: Spacing.radiusMedium, alignItems: "center", marginTop: 10 },
  submitBtnText: { color: "#FFF", fontWeight: "700" },
  explanationBox: { marginTop: 16, padding: 14, backgroundColor: Colors.background, borderRadius: Spacing.radiusMedium },
  expTitle: { fontWeight: "700", fontSize: 16, color: Colors.text, marginBottom: 4 },
  expText: { color: Colors.textSecondary, fontSize: 13 },
});
