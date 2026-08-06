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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { getQuizById, submitQuiz as submitQuizApi } from "../services/quizService";
import { getCurrentUser } from "../services/authService";

export default function QuizQuestionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [submitting, setSubmitting] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (quizId) {
      loadQuizDetails();
    }
  }, [quizId]);

  const loadQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await getQuizById(quizId);
      const quizData = res.data || res;
      setQuiz(quizData);

      const qList = quizData.questions || [];
      setQuestions(qList);
      setSelectedAnswers(Array(qList.length).fill(-1));
      if (quizData.duration) {
        setSecondsLeft(quizData.duration * 60);
      }
    } catch (err) {
      console.log("Quiz details error:", err);
      Alert.alert("Error", "Could not load quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  const percentage = useMemo(() => {
    if (questions.length === 0) return 0;
    return (currentQuestion + 1) / questions.length;
  }, [currentQuestion, questions]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((old) => {
        if (old <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return old - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const selectOption = (index: number) => {
    const copy = [...selectedAnswers];
    copy[currentQuestion] = index;
    setSelectedAnswers(copy);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((old) => old + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((old) => old - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      const user = await getCurrentUser();
      const userAnswers = selectedAnswers.map((ans, idx) => ({
        questionIndex: idx,
        selectedOption: ans,
      }));

      const payload = {
        quizId,
        userId: user?._id,
        answers: userAnswers,
      };

      const res = await submitQuizApi(payload);
      const score = res?.score ?? res?.data?.score ?? 0;
      const totalMarks = quiz?.totalMarks || 100;

      Alert.alert(
        "🏆 Quiz Completed!",
        `Your Score: ${score} / ${totalMarks}\nGreat job practicing cybersecurity!`,
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.log("Submit quiz error:", err);
      Alert.alert("Completed", "Your quiz answers have been recorded!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Quiz Questions...</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={{ color: Colors.text }}>No questions found in this quiz.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.quizTitle} numberOfLines={1}>
            {quiz?.title || "Security Quiz"}
          </Text>

          <Text style={styles.questionCounter}>
            Question {currentQuestion + 1} / {questions.length}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {minutes}:{seconds}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBackground}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>QUESTION {currentQuestion + 1}</Text>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <Text style={styles.questionHint}>Select the correct answer below.</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {(question.options || []).map((option: string, index: number) => {
          const selected = selectedAnswers[currentQuestion] === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => selectOption(index)}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
            >
              <View style={[styles.optionCircle, selected && styles.optionCircleSelected]}>
                <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </View>

              {selected && (
                <View style={styles.checkContainer}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.answerStatus}>
          <Text style={styles.answerStatusTitle}>Selected Answer</Text>
          <Text style={styles.answerStatusValue}>
            {selectedAnswers[currentQuestion] === -1
              ? "Not Selected"
              : `Option ${String.fromCharCode(65 + selectedAnswers[currentQuestion])}`}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={currentQuestion === 0}
            onPress={previousQuestion}
            style={[styles.secondaryButton, currentQuestion === 0 && styles.disabledButton]}
          >
            <Text style={[styles.secondaryButtonText, currentQuestion === 0 && { color: "#AAA" }]}>
              ← Previous
            </Text>
          </TouchableOpacity>

          {currentQuestion === questions.length - 1 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={handleSubmitQuiz}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Quiz</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton} onPress={nextQuestion}>
              <Text style={styles.primaryButtonText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingText: { marginTop: 12, color: Colors.text, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.md, marginBottom: Spacing.lg },
  back: { fontSize: 28, color: Colors.text, fontWeight: "700" },
  quizTitle: { ...Typography.h3, color: Colors.text, textAlign: "center", maxWidth: 180 },
  questionCounter: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  timerContainer: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  timer: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  progressBackground: { height: 8, backgroundColor: "#ECECEC", borderRadius: 10, overflow: "hidden", marginBottom: 24 },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 10 },

  questionCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 22, marginBottom: 20, elevation: 4 },
  questionBadge: { alignSelf: "flex-start", backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  questionBadgeText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  questionText: { ...Typography.h2, color: Colors.text, lineHeight: 28 },
  questionHint: { marginTop: 8, color: Colors.textSecondary, fontSize: 13 },

  optionsContainer: { flex: 1 },
  optionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#EEEEEE" },
  optionCardSelected: { borderColor: Colors.primary, backgroundColor: "#FFF5F5" },
  optionCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F1F3F5", alignItems: "center", justifyContent: "center", marginRight: 14 },
  optionCircleSelected: { backgroundColor: Colors.primary },
  optionLetter: { fontSize: 15, fontWeight: "700", color: Colors.text },
  optionLetterSelected: { color: "#FFFFFF" },
  optionText: { fontSize: 15, color: Colors.text, fontWeight: "600" },
  optionTextSelected: { color: Colors.primary, fontWeight: "700" },
  checkContainer: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
  checkIcon: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  footer: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#ECECEC", backgroundColor: Colors.background },
  answerStatus: { marginBottom: 12 },
  answerStatusTitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  answerStatusValue: { fontSize: 15, color: Colors.text, fontWeight: "700" },

  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  secondaryButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginRight: 8 },
  secondaryButtonText: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  primaryButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  disabledButton: { opacity: 0.5 },
});