import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { getQuizById, submitQuiz as submitQuizApi } from "../../services/quizService";
import { getCurrentUser } from "../../services/authService";

// ─── Motivational messages based on score ───────────────────────
const getMotivation = (pct: number, passed: boolean) => {
  if (pct === 100) return { emoji: "🏆", title: "Perfect Score!", msg: "Outstanding! You answered every question correctly. You're a cybersecurity expert!" };
  if (pct >= 90)  return { emoji: "🌟", title: "Exceptional!", msg: "Incredible result! You clearly have deep knowledge of this topic. Keep it up!" };
  if (pct >= 80)  return { emoji: "🎉", title: "Great Job!", msg: "Excellent work! You've mastered most of this content. A little more practice and you'll be perfect." };
  if (pct >= 70)  return { emoji: "👍", title: "Good Job!", msg: "Well done! You passed with a solid score. Review the questions you missed to sharpen your skills." };
  if (pct >= 60)  return { emoji: "✅", title: "You Passed!", msg: "You cleared the passing mark. Keep studying and try again to improve your score!" };
  if (pct >= 40)  return { emoji: "📚", title: "Almost There", msg: "Good effort! Review the learning modules on this topic and try again — you're getting closer." };
  return { emoji: "💪", title: "Keep Going!", msg: "Every expert was once a beginner. Study the material, take notes, and come back stronger!" };
};

interface QuizResult {
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  xpEarned: number;
  passed: boolean;
}

export default function QuizQuestionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId } = route.params || {};

  const [loading, setLoading]         = useState(true);
  const [quiz, setQuiz]               = useState<any>(null);
  const [questions, setQuestions]     = useState<any[]>([]);
  const [currentQ, setCurrentQ]       = useState(0);
  const [selected, setSelected]       = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<QuizResult | null>(null);
  const [showResult, setShowResult]   = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  // ── Load quiz ──────────────────────────────────────────────────
  useEffect(() => { if (quizId) loadQuiz(); }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const res = await getQuizById(quizId);
      // getQuizById returns response.data.data — already the quiz object
      const data = res ?? {};
      
      // Calculate totalMarks from questions if stored value is 0 or missing
      const qs: any[] = data?.questions ?? [];
      const computedTotalMarks = qs.reduce((sum: number, q: any) => sum + (q.points ?? 10), 0);
      
      // Patch totalMarks if it's 0 or missing
      if (!data.totalMarks || data.totalMarks === 0) {
        data.totalMarks = computedTotalMarks;
      }
      if (!data.totalQuestions || data.totalQuestions === 0) {
        data.totalQuestions = qs.length;
      }

      setQuiz(data);
      setQuestions(qs);
      setSelected(Array(qs.length).fill(-1));
      if (data?.duration) setSecondsLeft(data.duration * 60);
    } catch (err: any) {
      console.log("loadQuiz error:", err);
      if (err?.response?.status === 403 && err?.response?.data?.premiumRequired) {
        Alert.alert(
          "👑 Premium Required",
          err?.response?.data?.message || "This quiz requires a Premium subscription.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error", "Could not load quiz questions.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar animation ─────────────────────────────────────
  const pct = useMemo(() => questions.length ? (currentQ + 1) / questions.length : 0, [currentQ, questions]);
  useEffect(() => {
    Animated.timing(progress, { toValue: pct, duration: 300, useNativeDriver: false }).start();
  }, [pct]);

  // ── Countdown timer ────────────────────────────────────────────
  useEffect(() => {
    if (loading || questions.length === 0 || showResult) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, questions, showResult]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const selectOption = (i: number) => {
    const copy = [...selected];
    copy[currentQ] = i;
    setSelected(copy);
  };

  // ── Submit quiz ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const user = await getCurrentUser();
      const initialSec = quiz?.duration ? quiz.duration * 60 : 600;

      // Compute totalMarks locally as ground truth
      const localTotalMarks = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);

      const res = await submitQuizApi({
        quizId,
        userId: user?._id,
        timeTaken: Math.max(0, initialSec - secondsLeft),
        answers: selected.map((ans, idx) => ({
          questionId: String(idx + 1),
          selectedAnswer: ans,
        })),
      });

      // Backend returns { score, totalMarks, totalQuestions, correctAnswers, ... }
      // at response.data level (submitQuiz returns response.data)
      const d = res ?? {};

      // Use backend values but fall back to locally-computed totals
      // to prevent 7/0 when DB has stale totalMarks=0
      const totalMarks     = (d?.totalMarks     && d.totalMarks     > 0) ? d.totalMarks     : localTotalMarks;
      const totalQuestions = (d?.totalQuestions && d.totalQuestions > 0) ? d.totalQuestions : questions.length;
      const score          = d?.score            ?? 0;
      const correct        = d?.correctAnswers   ?? 0;
      const wrong          = d?.wrongAnswers     ?? 0;
      const skipped        = d?.skippedQuestions ?? 0;
      const pctVal         = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

      setResult({
        score,
        totalMarks,
        totalQuestions,
        correctAnswers:   correct,
        wrongAnswers:     wrong,
        skippedQuestions: skipped,
        percentage:       (d?.percentage != null) ? d.percentage : pctVal,
        xpEarned:         d?.xpEarned  ?? 0,
        passed:           d?.passed    ?? pctVal >= 60,
      });
      setShowResult(true);
    } catch (err: any) {
      console.log("Submit error:", err?.response?.data ?? err.message);
      // Compute result locally from user's answers
      const localTotalMarks = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
      const correct = selected.filter((ans, idx) => ans === questions[idx]?.correctAnswer).length;
      const score   = selected.reduce((sum, ans, idx) => {
        if (ans === questions[idx]?.correctAnswer) return sum + (questions[idx]?.points ?? 10);
        return sum;
      }, 0);
      const wrong   = selected.filter((ans, idx) => ans !== -1 && ans !== questions[idx]?.correctAnswer).length;
      const skipped = selected.filter(a => a === -1).length;
      const pct     = localTotalMarks > 0 ? Math.round((score / localTotalMarks) * 100) : 0;

      setResult({
        score,
        totalMarks:       localTotalMarks,
        totalQuestions:   questions.length,
        correctAnswers:   correct,
        wrongAnswers:     wrong,
        skippedQuestions: skipped,
        percentage:       pct,
        xpEarned:         correct * 10,
        passed:           pct >= 60,
      });
      setShowResult(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Quiz…</Text>
      </SafeAreaView>
    );
  }

  if (!questions.length) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: Colors.text, marginBottom: 16 }}>No questions in this quiz.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.quizTitle} numberOfLines={1}>{quiz?.title || "Security Quiz"}</Text>
          <Text style={styles.qCounter}>
            Q {currentQ + 1} of {questions.length} • {questions.length} Questions • {questions.reduce((s, q) => s + (q.points ?? 10), 0)} Marks
          </Text>
        </View>

        <View style={[styles.timerBadge, secondsLeft < 60 && styles.timerBadgeRed]}>
          <Text style={styles.timerText}>{mm}:{ss}</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* ── Question card ── */}
      <View style={styles.qCard}>
        <View style={styles.qBadge}>
          <Text style={styles.qBadgeText}>QUESTION {currentQ + 1}</Text>
          <Text style={styles.qPoints}>{q.points ?? 1} pt{(q.points ?? 1) > 1 ? "s" : ""}</Text>
        </View>
        <Text style={styles.qText}>{q.question}</Text>
      </View>

      {/* ── Options ── */}
      <View style={styles.options}>
        {(q.options || []).map((opt: string, i: number) => {
          const isSelected = selected[currentQ] === i;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => selectOption(i)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                <Text style={[styles.optionLetter, isSelected && { color: "#FFF" }]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
              {isSelected && (
                <View style={styles.checkBadge}><Text style={styles.checkIcon}>✓</Text></View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.selectedLabel}>
          {selected[currentQ] === -1 ? "No answer selected" : `Selected: Option ${String.fromCharCode(65 + selected[currentQ])}`}
        </Text>
        <View style={styles.footerBtns}>
          <TouchableOpacity
            style={[styles.secBtn, currentQ === 0 && styles.btnDisabled]}
            disabled={currentQ === 0}
            onPress={() => setCurrentQ(c => c - 1)}
          >
            <Text style={[styles.secBtnText, currentQ === 0 && { color: "#AAA" }]}>← Prev</Text>
          </TouchableOpacity>

          {currentQ === questions.length - 1 ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Submit Quiz ✓</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setCurrentQ(c => c + 1)}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Result Modal ── */}
      {showResult && result && (
        <Modal visible={showResult} animationType="slide" transparent={false}>
          <ResultScreen
            result={result}
            quizTitle={quiz?.title || "Security Quiz"}
            questions={questions}
            selectedAnswers={selected}
            onRetry={() => {
              // Close modal first, then fully reset state
              setShowResult(false);
              setResult(null);
              setSubmitting(false);
              setCurrentQ(0);
              setSelected(Array(questions.length).fill(-1));
              setSecondsLeft(quiz?.duration ? quiz.duration * 60 : 600);
            }}
            onDone={() => navigation.goBack()}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// RESULT SCREEN COMPONENT
// ════════════════════════════════════════════════════════════════
function ResultScreen({
  result, quizTitle, questions, selectedAnswers, onRetry, onDone,
}: {
  result: QuizResult;
  quizTitle: string;
  questions: any[];
  selectedAnswers: number[];
  onRetry: () => void;
  onDone: () => void;
}) {
  const { emoji, title, msg } = getMotivation(result.percentage, result.passed);

  const scoreColor =
    result.percentage >= 80 ? "#22C55E" :
    result.percentage >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <SafeAreaView style={rs.container}>
      <ScrollView contentContainerStyle={rs.content} showsVerticalScrollIndicator={false}>

        {/* ── Score hero ── */}
        <View style={[rs.hero, { borderColor: scoreColor }]}>
          <Text style={rs.heroEmoji}>{emoji}</Text>
          <Text style={rs.heroTitle}>{title}</Text>

          {/* Big score display */}
          <View style={rs.scoreRow}>
            <Text style={[rs.scoreNum, { color: scoreColor }]}>{result.score}</Text>
            <Text style={rs.scoreDivider}>/</Text>
            <Text style={rs.scoreDenom}>{result.totalMarks}</Text>
          </View>
          <Text style={rs.scoreLabel}>
            {result.percentage}% • {result.totalQuestions} question{result.totalQuestions !== 1 ? "s" : ""}
          </Text>

          <View style={[rs.passChip, result.passed ? rs.passChipGreen : rs.passChipRed]}>
            <Text style={rs.passChipText}>{result.passed ? "✓ PASSED" : "✗ FAILED"}</Text>
          </View>
        </View>

        {/* ── Motivation message ── */}
        <View style={rs.motivationCard}>
          <Text style={rs.motivationMsg}>{msg}</Text>
        </View>

        {/* ── Stats grid ── */}
        <View style={rs.statsGrid}>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: "#22C55E" }]}>{result.correctAnswers}</Text>
            <Text style={rs.statLabel}>Correct ✓</Text>
          </View>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: "#EF4444" }]}>{result.wrongAnswers}</Text>
            <Text style={rs.statLabel}>Wrong ✗</Text>
          </View>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: "#9CA3AF" }]}>{result.skippedQuestions}</Text>
            <Text style={rs.statLabel}>Skipped</Text>
          </View>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: "#F59E0B" }]}>+{result.xpEarned}</Text>
            <Text style={rs.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* ── Per-question breakdown ── */}
        <Text style={rs.sectionTitle}>Question Review</Text>
        {questions.map((q: any, idx: number) => {
          const userAns   = selectedAnswers[idx];
          const correct   = q.correctAnswer;
          const isCorrect = userAns === correct;
          const isSkipped = userAns === -1;

          const borderColor = isCorrect ? "#22C55E" : isSkipped ? "#9CA3AF" : "#EF4444";
          const bgColor     = isCorrect ? "#F0FDF4" : isSkipped ? "#F9FAFB" : "#FEF2F2";

          return (
            <View key={idx} style={[rs.qReview, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
              <View style={rs.qReviewHeader}>
                <Text style={rs.qReviewNum}>Q{idx + 1}</Text>
                <Text style={[rs.qReviewStatus, { color: borderColor }]}>
                  {isCorrect ? "✓ Correct" : isSkipped ? "— Skipped" : "✗ Wrong"}
                  {" · "}{q.points ?? 1} pt{(q.points ?? 1) > 1 ? "s" : ""}
                </Text>
              </View>

              <Text style={rs.qReviewText}>{q.question}</Text>

              {/* Show user's answer */}
              {!isSkipped && (
                <Text style={[rs.answerTag, { color: isCorrect ? "#16A34A" : "#DC2626" }]}>
                  Your answer: {q.options?.[userAns] ?? "—"}
                </Text>
              )}

              {/* Show correct answer if wrong */}
              {!isCorrect && (
                <Text style={rs.correctTag}>
                  ✓ Correct: {q.options?.[correct] ?? "—"}
                </Text>
              )}

              {/* Explanation */}
              {q.explanation ? (
                <View style={rs.explanationBox}>
                  <Text style={rs.explanationLabel}>💡 Explanation</Text>
                  <Text style={rs.explanationText}>{q.explanation}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* ── Actions ── */}
        <View style={rs.actions}>
          <TouchableOpacity style={rs.retryBtn} onPress={onRetry}>
            <Text style={rs.retryBtnText}>🔄 Retake Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rs.doneBtn} onPress={onDone}>
            <Text style={rs.doneBtnText}>Done →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES — Quiz screen
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingText: { marginTop: 12, color: Colors.text, fontWeight: "600" },

  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.md, marginBottom: Spacing.md },
  back:         { fontSize: 28, color: Colors.text, fontWeight: "700", paddingRight: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  quizTitle:    { ...Typography.h3, color: Colors.text, textAlign: "center", maxWidth: 200 },
  qCounter:     { fontSize: 11, color: Colors.textSecondary, marginTop: 3, textAlign: "center" },
  timerBadge:   { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timerBadgeRed:{ backgroundColor: "#EF4444" },
  timerText:    { color: "#FFF", fontWeight: "700", fontSize: 15 },

  progressBg:   { height: 6, backgroundColor: "#ECECEC", borderRadius: 10, overflow: "hidden", marginBottom: 20 },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 10 },

  qCard:        { backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
  qBadge:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qBadgeText:   { backgroundColor: Colors.primary, color: "#FFF", fontWeight: "700", fontSize: 11, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  qPoints:      { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  qText:        { ...Typography.h3, color: Colors.text, lineHeight: 26 },

  options:             { flex: 1 },
  option:              { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: "#EEEEEE" },
  optionSelected:      { borderColor: Colors.primary, backgroundColor: "#FFF5F5" },
  optionCircle:        { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F3F5", justifyContent: "center", alignItems: "center", marginRight: 12 },
  optionCircleSelected:{ backgroundColor: Colors.primary },
  optionLetter:        { fontWeight: "700", fontSize: 14, color: Colors.text },
  optionText:          { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "600" },
  optionTextSelected:  { color: Colors.primary, fontWeight: "700" },
  checkBadge:          { width: 22, height: 22, borderRadius: 11, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  checkIcon:           { color: "#FFF", fontWeight: "700", fontSize: 13 },

  footer:         { paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#ECECEC", backgroundColor: Colors.background },
  selectedLabel:  { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  footerBtns:     { flexDirection: "row", gap: 10 },
  secBtn:         { flex: 1, height: 48, borderRadius: 12, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  secBtnText:     { color: Colors.text, fontSize: 14, fontWeight: "700" },
  primaryBtn:     { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  btnDisabled:    { opacity: 0.4 },
});

// ════════════════════════════════════════════════════════════════
// STYLES — Result screen
// ════════════════════════════════════════════════════════════════
const rs = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: 80 },

  hero: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  heroEmoji:    { fontSize: 52, marginBottom: 8 },
  heroTitle:    { fontSize: 22, fontWeight: "800", color: Colors.text, marginBottom: 16 },
  scoreRow:     { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  scoreNum:     { fontSize: 56, fontWeight: "900", lineHeight: 60 },
  scoreDivider: { fontSize: 36, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 },
  scoreDenom:   { fontSize: 30, fontWeight: "700", color: Colors.textSecondary, marginBottom: 6 },
  scoreLabel:   { color: Colors.textSecondary, fontSize: 14, marginTop: 8 },
  passChip:     { marginTop: 14, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  passChipGreen:{ backgroundColor: "#DCFCE7" },
  passChipRed:  { backgroundColor: "#FEE2E2" },
  passChipText: { fontWeight: "800", fontSize: 13 },

  motivationCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  motivationMsg: { color: "#0C4A6E", fontSize: 14, lineHeight: 22, fontWeight: "500" },

  statsGrid:  { flexDirection: "row", gap: 8, marginBottom: Spacing.lg },
  statBox:    { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statNum:    { fontSize: 22, fontWeight: "800" },
  statLabel:  { color: Colors.textSecondary, fontSize: 10, marginTop: 4, fontWeight: "600" },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  qReview: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  qReviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  qReviewNum:    { fontWeight: "800", color: Colors.text, fontSize: 13 },
  qReviewStatus: { fontWeight: "700", fontSize: 12 },
  qReviewText:   { color: Colors.text, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  answerTag:     { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  correctTag:    { color: "#16A34A", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  explanationBox:{ backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 8, padding: 10, marginTop: 4 },
  explanationLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  explanationText:  { color: Colors.text, fontSize: 12, lineHeight: 18 },

  actions:     { flexDirection: "row", gap: 12, marginTop: Spacing.xl },
  retryBtn:    { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 2, borderColor: Colors.primary, alignItems: "center" },
  retryBtnText:{ color: Colors.primary, fontWeight: "700", fontSize: 14 },
  doneBtn:     { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center" },
  doneBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
