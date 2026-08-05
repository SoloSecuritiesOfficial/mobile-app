import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

const QUIZ_TIME = 10 * 60;

const dummyQuestions = [
  {
    id: "1",
    question: "What is SQL Injection?",
    options: [
      "Attack on Database",
      "Password Hashing",
      "Firewall",
      "Encryption",
    ],
    answer: 0,
  },
  {
    id: "2",
    question: "Which protocol is secure?",
    options: [
      "HTTP",
      "FTP",
      "HTTPS",
      "Telnet",
    ],
    answer: 2,
  },
  {
    id: "3",
    question: "Which tool captures packets?",
    options: [
      "Wireshark",
      "Photoshop",
      "Excel",
      "Chrome",
    ],
    answer: 0,
  },
  {
    id: "4",
    question: "OWASP Top 10 belongs to?",
    options: [
      "Networking",
      "Web Security",
      "Linux",
      "Programming",
    ],
    answer: 1,
  },
  {
    id: "5",
    question: "Strong password should contain?",
    options: [
      "Only numbers",
      "Only letters",
      "Uppercase Lowercase Symbols Numbers",
      "Only symbols",
    ],
    answer: 2,
  },
];

export default function QuizQuestionScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    Array(dummyQuestions.length).fill(-1)
  );

  const [secondsLeft, setSecondsLeft] = useState(QUIZ_TIME);

  const progress = useRef(new Animated.Value(0)).current;

  const question = dummyQuestions[currentQuestion];

  const percentage = useMemo(() => {
    return (currentQuestion + 1) / dummyQuestions.length;
  }, [currentQuestion]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((old) => {
        if (old <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return old - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const seconds = String(
    secondsLeft % 60
  ).padStart(2, "0");

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
    if (currentQuestion < dummyQuestions.length - 1) {
      setCurrentQuestion((old) => old + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((old) => old - 1);
    }
  };

  const skipQuestion = () => {
    nextQuestion();
  };

  const submitQuiz = () => {
    console.log(selectedAnswers);
    alert("Quiz Submitted");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.background}
        barStyle="dark-content"
      />

      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.quizTitle}>
            OWASP Top 10 Quiz
          </Text>

          <Text style={styles.questionCounter}>
            Question {currentQuestion + 1} / {dummyQuestions.length}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {minutes}:{seconds}
          </Text>
        </View>
      </View>

      {/* Progress */}

      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
            },
          ]}
        />
      </View>
            {/* Question Card */}

      <View style={styles.questionCard}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>
            QUESTION {currentQuestion + 1}
          </Text>
        </View>

        <Text style={styles.questionText}>
          {question.question}
        </Text>

        <Text style={styles.questionHint}>
          Select the correct answer below.
        </Text>
      </View>

      {/* Options */}

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const selected =
            selectedAnswers[currentQuestion] === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => selectOption(index)}
              style={[
                styles.optionCard,
                selected &&
                  styles.optionCardSelected,
              ]}
            >
              <View
                style={[
                  styles.optionCircle,
                  selected &&
                    styles.optionCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    selected &&
                      styles.optionLetterSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </View>

              {selected && (
                <View style={styles.checkContainer}>
                  <Text style={styles.checkIcon}>
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}

      <View style={styles.footer}>
        <View style={styles.answerStatus}>
          <Text style={styles.answerStatusTitle}>
            Answer
          </Text>

          <Text style={styles.answerStatusValue}>
            {selectedAnswers[currentQuestion] === -1
              ? "Not Selected"
              : `Option ${String.fromCharCode(
                  65 +
                    selectedAnswers[
                      currentQuestion
                    ]
                )}`}
          </Text>
        </View>

                </View>

        <View style={styles.buttonRow}>
          {/* Previous */}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={currentQuestion === 0}
            onPress={previousQuestion}
            style={[
              styles.secondaryButton,
              currentQuestion === 0 &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                currentQuestion === 0 && {
                  color: "#AAA",
                },
              ]}
            >
              ← Previous
            </Text>
          </TouchableOpacity>

          {/* Skip */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={skipQuestion}
            style={styles.skipButton}
          >
            <Text style={styles.skipButtonText}>
              Skip
            </Text>
          </TouchableOpacity>

          {/* Next / Submit */}

          {currentQuestion ===
          dummyQuestions.length - 1 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={submitQuiz}
            >
              <Text style={styles.primaryButtonText}>
                Submit
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryButton}
              onPress={nextQuestion}
            >
              <Text style={styles.primaryButtonText}>
                Next →
              </Text>
            </TouchableOpacity>
          )}
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
    paddingHorizontal:
      Spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  back: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: "700",
  },

  quizTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: "center",
  },

  questionCounter: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  timerContainer: {
    backgroundColor:
      Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  timer: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#ECECEC",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },

  progressFill: {
    height: "100%",
    backgroundColor:
      Colors.primary,
    borderRadius: 10,
  },

  questionCard: {
    backgroundColor:
      Colors.surface,
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
    elevation: 4,
  },

  questionBadge: {
    alignSelf: "flex-start",
    backgroundColor:
      Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 18,
  },

  questionBadgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },

  questionText: {
    ...Typography.h2,
    color: Colors.text,
    lineHeight: 34,
  },

  questionHint: {
    marginTop: 10,
    color:
      Colors.textSecondary,
    fontSize: 14,
  },

  optionsContainer: {
    flex: 1,
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
    optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF5F5",
  },

  optionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F3F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  optionCircleSelected: {
    backgroundColor: Colors.primary,
  },

  optionLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  optionLetterSelected: {
    color: "#FFFFFF",
  },

  optionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },

  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },

  checkIcon: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    backgroundColor: Colors.background,
  },

  answerStatus: {
    marginBottom: 18,
  },

  answerStatusTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  answerStatusValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "700",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  secondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  skipButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },

  skipButtonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,

    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.5,
  },
});