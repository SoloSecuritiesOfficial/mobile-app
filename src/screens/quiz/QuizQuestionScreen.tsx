import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

import {
  getQuizById,
  submitQuiz as submitQuizApi,
} from "../../services/quizService";

import { getCurrentUser } from "../../services/authService";

/* ========================================================================== */
/* TYPES                                                                      */
/* ========================================================================== */

type Question = {
  _id?: string;
  id?: string;
  questionId?: string;

  question?: string;

  options?: string[];

  correctAnswer?: number | string;

  explanation?: string;

  points?: number;
};

type Quiz = {
  _id?: string;
  id?: string;

  title?: string;

  description?: string;

  questions?: Question[];

  totalQuestions?: number;

  totalMarks?: number;

  duration?: number;
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
  timeTaken: number;
}

interface RouteParams {
  quizId: string;
}

/* ========================================================================== */
/* CONSTANTS                                                                  */
/* ========================================================================== */

const PASS_PERCENTAGE = 60;

/**
 * REQUIRED QUIZ RULE:
 *
 * Every question = 1 minute.
 *
 * 10 questions = 10 minutes
 * 20 questions = 20 minutes
 * 30 questions = 30 minutes
 */
const SECONDS_PER_QUESTION = 60;

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function getQuestionId(question: Question, index: number): string {
  return String(
    question._id ??
      question.id ??
      question.questionId ??
      index + 1
  );
}

function getQuestionPoints(question: Question): number {
  const points = Number(question.points);

  return Number.isFinite(points) && points > 0 ? points : 10;
}

function getCorrectAnswerIndex(question: Question): number {
  if (typeof question.correctAnswer === "number") {
    return question.correctAnswer;
  }

  if (typeof question.correctAnswer === "string") {
    const numeric = Number(question.correctAnswer);

    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const letter = question.correctAnswer.trim().toUpperCase();

    if (/^[A-Z]$/.test(letter)) {
      return letter.charCodeAt(0) - 65;
    }
  }

  return -1;
}

function calculateLocalResult(
  questions: Question[],
  selectedAnswers: number[],
  timeTaken: number
): QuizResult {
  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let skippedQuestions = 0;

  let totalMarks = 0;

  questions.forEach((question, index) => {
    const points = getQuestionPoints(question);

    totalMarks += points;

    const selectedAnswer = selectedAnswers[index];

    if (
      selectedAnswer === undefined ||
      selectedAnswer === null ||
      selectedAnswer === -1
    ) {
      skippedQuestions += 1;
      return;
    }

    const correctAnswer = getCorrectAnswerIndex(question);

    if (
      correctAnswer !== -1 &&
      selectedAnswer === correctAnswer
    ) {
      correctAnswers += 1;
      score += points;
    } else {
      wrongAnswers += 1;
    }
  });

  const totalQuestions = questions.length;

  const percentage =
    totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;

  return {
    score,
    totalMarks,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    percentage,
    xpEarned: correctAnswers * 10,
    passed: percentage >= PASS_PERCENTAGE,
    timeTaken,
  };
}

function normalizeQuizResponse(response: any): Quiz {
  /**
   * Your current service appears to return the already-unwrapped
   * quiz object, but this also handles common Axios response shapes.
   */
  const raw =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  return raw as Quiz;
}

function normalizeSubmitResponse(response: any): any {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    {}
  );
}

function getMotivation(
  percentage: number,
  passed: boolean
) {
  if (percentage === 100) {
    return {
      emoji: "🏆",
      title: "Perfect Score!",
      message:
        "Outstanding! Every answer was correct. Your security knowledge is exceptional.",
    };
  }

  if (percentage >= 90) {
    return {
      emoji: "🌟",
      title: "Exceptional!",
      message:
        "Incredible result. You clearly have a strong understanding of this topic.",
    };
  }

  if (percentage >= 80) {
    return {
      emoji: "🎉",
      title: "Great Job!",
      message:
        "Excellent work. You have mastered most of this content.",
    };
  }

  if (percentage >= 70) {
    return {
      emoji: "👍",
      title: "Good Job!",
      message:
        "Well done. Review the questions you missed and push your score even higher.",
    };
  }

  if (passed) {
    return {
      emoji: "✅",
      title: "You Passed!",
      message:
        "Nice work. You cleared the passing mark. Keep learning and improve your score.",
    };
  }

  if (percentage >= 40) {
    return {
      emoji: "📚",
      title: "Almost There",
      message:
        "Good effort. Review the learning material and try the quiz again.",
    };
  }

  return {
    emoji: "💪",
    title: "Keep Going!",
    message:
      "Every attempt is progress. Study the topic and come back stronger.",
  };
}

/* ========================================================================== */
/* MAIN SCREEN                                                                */
/* ========================================================================== */

export default function QuizQuestionScreen() {
  const navigation = useNavigation<any>();

  const route =
    useRoute<any>();

  const { quizId } =
    (route.params ?? {}) as RouteParams;

  /* ------------------------------------------------------------------------ */
  /* STATE                                                                    */
  /* ------------------------------------------------------------------------ */

  const [loading, setLoading] =
    useState(true);

  const [quiz, setQuiz] =
    useState<Quiz | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswers, setSelectedAnswers] =
    useState<number[]>([]);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] =
    useState<QuizResult | null>(null);

  const [showResult, setShowResult] =
    useState(false);

  const [autoSubmitted, setAutoSubmitted] =
    useState(false);

  const progress =
    useRef(new Animated.Value(0)).current;

  const submittingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /* ------------------------------------------------------------------------ */
  /* CLEANUP                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ======================================================================== */
  /* LOAD QUIZ                                                                */
  /* ======================================================================== */

  const loadQuiz = useCallback(
    async (showLoader = true) => {
      if (!quizId) {
        Alert.alert(
          "Quiz Error",
          "Quiz ID was not provided.",
          [
            {
              text: "Go Back",
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );

        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const response =
          await getQuizById(quizId);

        const data =
          normalizeQuizResponse(response);

        const loadedQuestions =
          Array.isArray(data.questions)
            ? data.questions
            : [];

        /*
         * IMPORTANT:
         *
         * Do not trust totalQuestions from
         * the database when the actual questions
         * array is available.
         *
         * The actual question array is the source
         * of truth for this screen.
         */
        const actualTotalQuestions =
          loadedQuestions.length;

        const actualTotalMarks =
          loadedQuestions.reduce(
            (total, question) =>
              total +
              getQuestionPoints(question),
            0
          );

        /*
         * IMPORTANT TIMER RULE:
         *
         * 1 question = 1 minute.
         */
        const quizDurationSeconds =
          actualTotalQuestions *
          SECONDS_PER_QUESTION;

        const normalizedQuiz: Quiz = {
          ...data,
          questions: loadedQuestions,
          totalQuestions:
            actualTotalQuestions,
          totalMarks:
            actualTotalMarks,
          duration:
            actualTotalQuestions,
        };

        if (!mountedRef.current) {
          return;
        }

        setQuiz(normalizedQuiz);

        setQuestions(
          loadedQuestions
        );

        setSelectedAnswers(
          Array(actualTotalQuestions).fill(-1)
        );

        setCurrentQuestion(0);

        setSecondsLeft(
          quizDurationSeconds
        );

        setResult(null);

        setShowResult(false);

        setSubmitting(false);

        submittingRef.current = false;

        setAutoSubmitted(false);
      } catch (error: any) {
        console.log(
          "[Quiz] Load error:",
          error?.response?.data ??
            error?.message ??
            error
        );

        if (!mountedRef.current) {
          return;
        }

        if (
          error?.response?.status === 403 &&
          error?.response?.data?.premiumRequired
        ) {
          Alert.alert(
            "👑 Premium Required",
            error?.response?.data
              ?.message ??
              "This quiz requires a Premium subscription.",
            [
              {
                text: "OK",
                onPress: () =>
                  navigation.goBack(),
              },
            ]
          );

          return;
        }

        Alert.alert(
          "Unable to Load Quiz",
          error?.response?.data?.message ??
            "Could not load the quiz. Please try again.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [quizId, navigation]
  );

  useEffect(() => {
    loadQuiz(true);
  }, [loadQuiz]);

  /* ======================================================================== */
  /* DERIVED VALUES                                                           */
  /* ======================================================================== */

  const totalQuestions =
    questions.length;

  const totalMarks =
    useMemo(
      () =>
        questions.reduce(
          (sum, question) =>
            sum +
            getQuestionPoints(question),
          0
        ),
      [questions]
    );

  const progressPercentage =
    totalQuestions > 0
      ? ((currentQuestion + 1) /
          totalQuestions) *
        100
      : 0;

  const currentQuestionData =
    questions[currentQuestion];

  const currentSelectedAnswer =
    selectedAnswers[currentQuestion] ??
    -1;

  const minutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const seconds = String(
    secondsLeft % 60
  ).padStart(2, "0");

  const formattedTime =
    `${minutes}:${seconds}`;

  const isLastQuestion =
    currentQuestion ===
    totalQuestions - 1;

  const answeredCount =
    selectedAnswers.filter(
      (answer) => answer !== -1
    ).length;

  const unansweredCount =
    totalQuestions -
    answeredCount;

  const timerIsCritical =
    secondsLeft <= 60;

  const timerIsWarning =
    secondsLeft <= 180 &&
    secondsLeft > 60;

  /* ======================================================================== */
  /* PROGRESS ANIMATION                                                       */
  /* ======================================================================== */

  useEffect(() => {
    Animated.timing(progress, {
      toValue:
        totalQuestions > 0
          ? currentQuestion /
            totalQuestions
          : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [
    currentQuestion,
    totalQuestions,
    progress,
  ]);

  /* ======================================================================== */
  /* SELECT ANSWER                                                            */
  /* ======================================================================== */

  const selectAnswer = useCallback(
    (answerIndex: number) => {
      if (
        submitting ||
        showResult
      ) {
        return;
      }

      setSelectedAnswers(
        (previous) => {
          const updated = [
            ...previous,
          ];

          updated[currentQuestion] =
            answerIndex;

          return updated;
        }
      );
    },
    [
      currentQuestion,
      submitting,
      showResult,
    ]
  );

  /* ======================================================================== */
  /* TIMER                                                                     */
  /* ======================================================================== */

  const submitQuiz = useCallback(
    async (
      reason:
        | "manual"
        | "timeout" = "manual"
    ) => {
      /*
       * Prevent duplicate submissions.
       *
       * This is especially important when:
       * - timer reaches 0
       * - user presses Submit at same time
       */
      if (
        submittingRef.current ||
        showResult
      ) {
        return;
      }

      submittingRef.current = true;

      setSubmitting(true);

      try {
        const user =
          await getCurrentUser();

        const timeLimit =
          totalQuestions *
          SECONDS_PER_QUESTION;

        const timeTaken =
          Math.min(
            timeLimit,
            Math.max(
              0,
              timeLimit -
                secondsLeft
            )
          );

        const answers =
          questions.map(
            (question, index) => ({
              questionId:
                getQuestionId(
                  question,
                  index
                ),

              selectedAnswer:
                selectedAnswers[
                  index
                ] ?? -1,
            })
          );

        console.log(
          "[Quiz] Submitting:",
          {
            quizId,
            userId: user?._id,
            totalQuestions,
            totalMarks,
            timeTaken,
            reason,
          }
        );

        const response =
          await submitQuizApi({
            quizId,
            userId: user?._id,
            timeTaken,
            answers,
          });

        const data =
          normalizeSubmitResponse(
            response
          );

        /*
         * Always calculate locally as a fallback.
         *
         * Backend remains the preferred source
         * when valid values are returned.
         */
        const localResult =
          calculateLocalResult(
            questions,
            selectedAnswers,
            timeTaken
          );

        const backendTotalMarks =
          Number(
            data?.totalMarks
          );

        const backendTotalQuestions =
          Number(
            data?.totalQuestions
          );

        const backendScore =
          Number(data?.score);

        const backendPercentage =
          Number(
            data?.percentage
          );

        const finalTotalMarks =
          backendTotalMarks > 0
            ? backendTotalMarks
            : localResult.totalMarks;

        const finalTotalQuestions =
          backendTotalQuestions > 0
            ? backendTotalQuestions
            : localResult.totalQuestions;

        const finalScore =
          Number.isFinite(
            backendScore
          )
            ? backendScore
            : localResult.score;

        const finalPercentage =
          Number.isFinite(
            backendPercentage
          )
            ? backendPercentage
            : finalTotalMarks > 0
              ? Math.round(
                  (finalScore /
                    finalTotalMarks) *
                    100
                )
              : 0;

        const finalCorrect =
          Number.isFinite(
            Number(
              data?.correctAnswers
            )
          )
            ? Number(
                data.correctAnswers
              )
            : localResult.correctAnswers;

        const finalWrong =
          Number.isFinite(
            Number(
              data?.wrongAnswers
            )
          )
            ? Number(
                data.wrongAnswers
              )
            : localResult.wrongAnswers;

        const finalSkipped =
          Number.isFinite(
            Number(
              data?.skippedQuestions
            )
          )
            ? Number(
                data.skippedQuestions
              )
            : localResult.skippedQuestions;

        const finalXP =
          Number.isFinite(
            Number(data?.xpEarned)
          )
            ? Number(data.xpEarned)
            : localResult.xpEarned;

        const finalPassed =
          typeof data?.passed ===
          "boolean"
            ? data.passed
            : finalPercentage >=
              PASS_PERCENTAGE;

        const finalResult: QuizResult =
          {
            score:
              finalScore,

            totalMarks:
              finalTotalMarks,

            totalQuestions:
              finalTotalQuestions,

            correctAnswers:
              finalCorrect,

            wrongAnswers:
              finalWrong,

            skippedQuestions:
              finalSkipped,

            percentage:
              finalPercentage,

            xpEarned:
              finalXP,

            passed:
              finalPassed,

            timeTaken,
          };

        if (
          !mountedRef.current
        ) {
          return;
        }

        setResult(
          finalResult
        );

        setShowResult(true);

        if (reason === "timeout") {
          setAutoSubmitted(true);
        }
      } catch (error: any) {
        console.log(
          "[Quiz] Submit error:",
          error?.response?.data ??
            error?.message ??
            error
        );

        /*
         * If backend submission fails,
         * don't pretend it was successfully
         * saved remotely.
         *
         * But show the calculated result so
         * the user isn't left on a broken screen.
         */
        const localResult =
          calculateLocalResult(
            questions,
            selectedAnswers,
            Math.min(
              totalQuestions *
                SECONDS_PER_QUESTION,
              Math.max(
                0,
                totalQuestions *
                  SECONDS_PER_QUESTION -
                  secondsLeft
              )
            )
          );

        if (
          mountedRef.current
        ) {
          setResult(
            localResult
          );

          setShowResult(true);

          Alert.alert(
            "Submission Warning",
            error?.response?.data
              ?.message ??
              "Your result was calculated locally, but the server could not confirm the submission. Please check your connection and retry.",
            [
              {
                text: "OK",
              },
            ]
          );
        }
      } finally {
        submittingRef.current =
          false;

        if (
          mountedRef.current
        ) {
          setSubmitting(false);
        }
      }
    },
    [
      quizId,
      questions,
      selectedAnswers,
      secondsLeft,
      totalQuestions,
      totalMarks,
      showResult,
    ]
  );

  useEffect(() => {
    if (
      loading ||
      totalQuestions === 0 ||
      showResult ||
      submitting
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setSecondsLeft(
          (previous) => {
            if (previous <= 1) {
              clearInterval(timer);

              /*
               * Do not call submitQuiz inside the
               * state setter.
               *
               * Schedule it after the state update.
               */
              setTimeout(() => {
                submitQuiz("timeout");
              }, 0);

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    loading,
    totalQuestions,
    showResult,
    submitting,
    submitQuiz,
  ]);

  /* ======================================================================== */
  /* NAVIGATION                                                               */
  /* ======================================================================== */

  const goPrevious = () => {
    if (
      currentQuestion > 0 &&
      !submitting
    ) {
      setCurrentQuestion(
        (previous) =>
          previous - 1
      );
    }
  };

  const goNext = () => {
    if (
      currentQuestion <
        totalQuestions - 1 &&
      !submitting
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );
    }
  };

  const handleSubmitPress =
    () => {
      if (
        submitting ||
        showResult
      ) {
        return;
      }

      Alert.alert(
        "Submit Quiz?",
        unansweredCount > 0
          ? `You have ${unansweredCount} unanswered question${
              unansweredCount > 1
                ? "s"
                : ""
            }. Do you want to submit anyway?`
          : "Are you sure you want to submit your quiz?",
        [
          {
            text: "Continue Quiz",
            style: "cancel",
          },
          {
            text: "Submit",
            style: "default",
            onPress: () =>
              submitQuiz(
                "manual"
              ),
          },
        ]
      );
    };

  /* ======================================================================== */
  /* RETAKE                                                                    */
  /* ======================================================================== */

  const handleRetake =
    async () => {
      setShowResult(false);

      setResult(null);

      setSubmitting(false);

      submittingRef.current =
        false;

      setAutoSubmitted(false);

      /*
       * Reload from backend.
       *
       * This is important because the quiz
       * may have changed and because the next
       * attempt must start from fresh state.
       */
      await loadQuiz(true);
    };

  /* ======================================================================== */
  /* LOADING                                                                   */
  /* ======================================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <StatusBar
          backgroundColor={
            Colors.background
          }
          barStyle="dark-content"
        />

        <View
          style={
            styles.loadingCard
          }
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <ActivityIndicator
              size="large"
              color={
                Colors.primary
              }
            />
          </View>

          <Text
            style={
              styles.loadingTitle
            }
          >
            Preparing your quiz
          </Text>

          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Loading questions and
            calculating your time limit…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ======================================================================== */
  /* EMPTY QUIZ                                                               */
  /* ======================================================================== */

  if (
    !quiz ||
    totalQuestions === 0
  ) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <StatusBar
          backgroundColor={
            Colors.background
          }
          barStyle="dark-content"
        />

        <View
          style={
            styles.emptyCard
          }
        >
          <Text
            style={
              styles.emptyEmoji
            }
          >
            📭
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            No Questions Available
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            This quiz doesn't have any
            questions yet.
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const q =
    currentQuestionData;

  const options =
    Array.isArray(q?.options)
      ? q.options
      : [];

  const progressWidth =
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

  /* ======================================================================== */
  /* RENDER                                                                   */
  /* ======================================================================== */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        backgroundColor={
          Colors.background
        }
        barStyle="dark-content"
      />

      {/* ================================================================== */}
      {/* TOP HEADER                                                         */}
      {/* ================================================================== */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            navigation.goBack()
          }
          disabled={submitting}
        >
          <Text
            style={
              styles.backIcon
            }
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.headerContent
          }
        >
          <Text
            style={
              styles.headerEyebrow
            }
          >
            QUIZ
          </Text>

          <Text
            style={
              styles.quizTitle
            }
            numberOfLines={1}
          >
            {quiz.title ??
              "Security Quiz"}
          </Text>
        </View>

        {/* Timer */}
        <View
          style={[
            styles.timerContainer,
            timerIsCritical &&
              styles.timerCritical,
            timerIsWarning &&
              styles.timerWarning,
          ]}
        >
          <Text
            style={
              styles.timerIcon
            }
          >
            ⏱
          </Text>

          <Text
            style={[
              styles.timerText,
              timerIsCritical &&
                styles.timerTextCritical,
            ]}
          >
            {formattedTime}
          </Text>
        </View>
      </View>

      {/* ================================================================== */}
      {/* PROGRESS                                                          */}
      {/* ================================================================== */}

      <View
        style={
          styles.progressSection
        }
      >
        <View
          style={
            styles.progressTopRow
          }
        >
          <Text
            style={
              styles.progressQuestion
            }
          >
            Question{" "}
            {currentQuestion + 1}{" "}
            of {totalQuestions}
          </Text>

          <Text
            style={
              styles.progressPercentage
            }
          >
            {Math.round(
              progressPercentage
            )}
            %
          </Text>
        </View>

        <View
          style={
            styles.progressBackground
          }
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width:
                  progressWidth,
              },
            ]}
          />
        </View>

        <View
          style={
            styles.progressMeta
          }
        >
          <Text
            style={
              styles.progressMetaText
            }
          >
            {answeredCount} answered
          </Text>

          <Text
            style={
              styles.progressMetaText
            }
          >
            {totalMarks} marks
          </Text>
        </View>
      </View>

      {/* ================================================================== */}
      {/* QUESTION                                                          */}
      {/* ================================================================== */}

      <ScrollView
        style={
          styles.questionScroll
        }
        contentContainerStyle={
          styles.questionContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.questionCard
          }
        >
          <View
            style={
              styles.questionCardTop
            }
          >
            <View
              style={
                styles.questionBadge
              }
            >
              <Text
                style={
                  styles.questionBadgeText
                }
              >
                Q{currentQuestion + 1}
              </Text>
            </View>

            <View
              style={
                styles.pointsBadge
              }
            >
              <Text
                style={
                  styles.pointsBadgeText
                }
              >
                {getQuestionPoints(q)}{" "}
                {getQuestionPoints(q) ===
                1
                  ? "point"
                  : "points"}
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.questionText
            }
          >
            {q.question ??
              "Question unavailable"}
          </Text>

          <Text
            style={
              styles.answerHint
            }
          >
            Select the best answer
          </Text>
        </View>

        {/* ================================================================= */}
        {/* OPTIONS                                                          */}
        {/* ================================================================= */}

        <View
          style={
            styles.optionsContainer
          }
        >
          {options.map(
            (
              option,
              index
            ) => {
              const isSelected =
                currentSelectedAnswer ===
                index;

              const letter =
                String.fromCharCode(
                  65 + index
                );

              return (
                <TouchableOpacity
                  key={`${getQuestionId(
                    q,
                    currentQuestion
                  )}-${index}`}
                  style={[
                    styles.option,
                    isSelected &&
                      styles.optionSelected,
                  ]}
                  activeOpacity={
                    0.85
                  }
                  onPress={() =>
                    selectAnswer(
                      index
                    )
                  }
                  disabled={
                    submitting
                  }
                >
                  <View
                    style={[
                      styles.optionLetterContainer,
                      isSelected &&
                        styles.optionLetterContainerSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetter,
                        isSelected &&
                          styles.optionLetterSelected,
                      ]}
                    >
                      {letter}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      isSelected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>

                  {isSelected && (
                    <View
                      style={
                        styles.selectedCheck
                      }
                    >
                      <Text
                        style={
                          styles.selectedCheckText
                        }
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* ================================================================= */}
        {/* QUESTION INFO                                                    */}
        {/* ================================================================= */}

        <View
          style={
            styles.questionInfo
          }
        >
          <Text
            style={
              styles.questionInfoIcon
            }
          >
            ⏱
          </Text>

          <Text
            style={
              styles.questionInfoText
            }
          >
            You have approximately{" "}
            1 minute per question.
          </Text>
        </View>
      </ScrollView>

      {/* ================================================================== */}
      {/* FOOTER                                                            */}
      {/* ================================================================== */}

      <View
        style={styles.footer}
      >
        <View
          style={
            styles.footerStatus
          }
        >
          <View
            style={[
              styles.statusDot,
              currentSelectedAnswer !==
                -1 &&
                styles.statusDotAnswered,
            ]}
          />

          <Text
            style={
              styles.footerStatusText
            }
          >
            {currentSelectedAnswer ===
            -1
              ? "Not answered"
              : "Answer selected"}
          </Text>
        </View>

        <View
          style={
            styles.footerButtons
          }
        >
          <TouchableOpacity
            style={[
              styles.previousButton,
              currentQuestion ===
                0 &&
                styles.disabledButton,
            ]}
            disabled={
              currentQuestion ===
                0 ||
              submitting
            }
            onPress={
              goPrevious
            }
          >
            <Text
              style={[
                styles.previousButtonText,
                currentQuestion ===
                  0 &&
                  styles.disabledButtonText,
              ]}
            >
              ←
            </Text>

            <Text
              style={[
                styles.previousButtonLabel,
                currentQuestion ===
                  0 &&
                  styles.disabledButtonText,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {isLastQuestion ? (
            <TouchableOpacity
              style={
                styles.submitButton
              }
              onPress={
                handleSubmitPress
              }
              disabled={
                submitting
              }
              activeOpacity={
                0.85
              }
            >
              {submitting ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Submit Quiz
                  </Text>

                  <Text
                    style={
                      styles.submitButtonIcon
                    }
                  >
                    ✓
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={
                styles.nextButton
              }
              onPress={
                goNext
              }
              disabled={
                submitting
              }
              activeOpacity={
                0.85
              }
            >
              <Text
                style={
                  styles.nextButtonText
                }
              >
                Next Question
              </Text>

              <Text
                style={
                  styles.nextButtonIcon
                }
              >
                →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================================================================== */}
      {/* RESULT MODAL                                                      */}
      {/* ================================================================== */}

      <Modal
        visible={
          showResult &&
          !!result
        }
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {}}
      >
        {result && (
          <QuizResultScreen
            result={result}
            quizTitle={
              quiz.title ??
              "Security Quiz"
            }
            questions={
              questions
            }
            selectedAnswers={
              selectedAnswers
            }
            autoSubmitted={
              autoSubmitted
            }
            onRetry={
              handleRetake
            }
            onDone={() =>
              navigation.goBack()
            }
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

/* ========================================================================== */
/* RESULT SCREEN                                                              */
/* ========================================================================== */

function QuizResultScreen({
  result,
  quizTitle,
  questions,
  selectedAnswers,
  autoSubmitted,
  onRetry,
  onDone,
}: {
  result: QuizResult;
  quizTitle: string;
  questions: Question[];
  selectedAnswers: number[];
  autoSubmitted: boolean;
  onRetry: () => void;
  onDone: () => void;
}) {
  const motivation =
    getMotivation(
      result.percentage,
      result.passed
    );

  const scoreColor =
    result.percentage >= 80
      ? "#16A34A"
      : result.percentage >= 60
        ? "#D97706"
        : "#DC2626";

  const timeMinutes =
    Math.floor(
      result.timeTaken / 60
    );

  const timeSeconds =
    result.timeTaken % 60;

  return (
    <SafeAreaView
      style={resultStyles.container}
    >
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <ScrollView
        contentContainerStyle={
          resultStyles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}

        <View
          style={
            resultStyles.resultHeader
          }
        >
          <View>
            <Text
              style={
                resultStyles.resultEyebrow
              }
            >
              QUIZ COMPLETED
            </Text>

            <Text
              style={
                resultStyles.resultQuizTitle
              }
              numberOfLines={2}
            >
              {quizTitle}
            </Text>
          </View>

          <View
            style={
              resultStyles.completedBadge
            }
          >
            <Text
              style={
                resultStyles.completedBadgeText
              }
            >
              ✓
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* AUTO SUBMITTED                                                  */}
        {/* ================================================================ */}

        {autoSubmitted && (
          <View
            style={
              resultStyles.timeoutBanner
            }
          >
            <Text
              style={
                resultStyles.timeoutIcon
              }
            >
              ⏰
            </Text>

            <View
              style={
                resultStyles.timeoutContent
              }
            >
              <Text
                style={
                  resultStyles.timeoutTitle
                }
              >
                Time's Up
              </Text>

              <Text
                style={
                  resultStyles.timeoutText
                }
              >
                Your quiz was automatically
                submitted when the timer
                reached zero.
              </Text>
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* SCORE HERO                                                       */}
        {/* ================================================================ */}

        <View
          style={[
            resultStyles.scoreHero,
            {
              borderColor:
                scoreColor,
            },
          ]}
        >
          <Text
            style={
              resultStyles.resultEmoji
            }
          >
            {motivation.emoji}
          </Text>

          <Text
            style={
              resultStyles.motivationTitle
            }
          >
            {motivation.title}
          </Text>

          <View
            style={
              resultStyles.scoreRow
            }
          >
            <Text
              style={[
                resultStyles.scoreNumber,
                {
                  color:
                    scoreColor,
                },
              ]}
            >
              {result.score}
            </Text>

            <Text
              style={
                resultStyles.scoreSlash
              }
            >
              /
            </Text>

            <Text
              style={
                resultStyles.scoreTotal
              }
            >
              {result.totalMarks}
            </Text>
          </View>

          <Text
            style={
              resultStyles.percentage
            }
          >
            {result.percentage}%
          </Text>

          <View
            style={[
              resultStyles.statusBadge,
              result.passed
                ? resultStyles.statusPassed
                : resultStyles.statusFailed,
            ]}
          >
            <Text
              style={[
                resultStyles.statusBadgeText,
                {
                  color:
                    result.passed
                      ? "#166534"
                      : "#991B1B",
                },
              ]}
            >
              {result.passed
                ? "✓ PASSED"
                : "✕ FAILED"}
            </Text>
          </View>

          <Text
            style={
              resultStyles.motivationMessage
            }
          >
            {motivation.message}
          </Text>
        </View>

        {/* ================================================================ */}
        {/* STATS                                                            */}
        {/* ================================================================ */}

        <View
          style={
            resultStyles.statsGrid
          }
        >
          <ResultStat
            value={
              result.correctAnswers
            }
            label="Correct"
            color="#16A34A"
            icon="✓"
          />

          <ResultStat
            value={
              result.wrongAnswers
            }
            label="Wrong"
            color="#DC2626"
            icon="×"
          />

          <ResultStat
            value={
              result.skippedQuestions
            }
            label="Skipped"
            color="#6B7280"
            icon="—"
          />

          <ResultStat
            value={`+${result.xpEarned}`}
            label="XP"
            color="#D97706"
            icon="★"
          />
        </View>

        {/* ================================================================ */}
        {/* TIME                                                             */}
        {/* ================================================================ */}

        <View
          style={
            resultStyles.timeCard
          }
        >
          <View
            style={
              resultStyles.timeIconContainer
            }
          >
            <Text
              style={
                resultStyles.timeIcon
              }
            >
              ⏱
            </Text>
          </View>

          <View
            style={
              resultStyles.timeContent
            }
          >
            <Text
              style={
                resultStyles.timeLabel
              }
            >
              Time Taken
            </Text>

            <Text
              style={
                resultStyles.timeValue
              }
            >
              {String(
                timeMinutes
              ).padStart(2, "0")}
              :
              {String(
                timeSeconds
              ).padStart(2, "0")}
            </Text>
          </View>

          <View
            style={
              resultStyles.timeContentRight
            }
          >
            <Text
              style={
                resultStyles.timeLabel
              }
            >
              Questions
            </Text>

            <Text
              style={
                resultStyles.timeValue
              }
            >
              {result.totalQuestions}
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* REVIEW                                                           */}
        {/* ================================================================ */}

        <Text
          style={
            resultStyles.sectionTitle
          }
        >
          Question Review
        </Text>

        {questions.map(
          (
            question,
            index
          ) => {
            const userAnswer =
              selectedAnswers[
                index
              ] ?? -1;

            const correctAnswer =
              getCorrectAnswerIndex(
                question
              );

            const isSkipped =
              userAnswer === -1;

            const isCorrect =
              !isSkipped &&
              userAnswer ===
                correctAnswer;

            const accentColor =
              isCorrect
                ? "#16A34A"
                : isSkipped
                  ? "#6B7280"
                  : "#DC2626";

            return (
              <View
                key={getQuestionId(
                  question,
                  index
                )}
                style={[
                  resultStyles.reviewCard,
                  {
                    borderLeftColor:
                      accentColor,
                  },
                ]}
              >
                <View
                  style={
                    resultStyles.reviewHeader
                  }
                >
                  <View
                    style={
                      resultStyles.reviewQuestionNumber
                    }
                  >
                    <Text
                      style={
                        resultStyles.reviewQuestionNumberText
                      }
                    >
                      Q{index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[
                      resultStyles.reviewStatus,
                      {
                        color:
                          accentColor,
                      },
                    ]}
                  >
                    {isCorrect
                      ? "✓ Correct"
                      : isSkipped
                        ? "— Skipped"
                        : "✕ Incorrect"}
                  </Text>

                  <Text
                    style={
                      resultStyles.reviewPoints
                    }
                  >
                    {getQuestionPoints(
                      question
                    )}{" "}
                    pts
                  </Text>
                </View>

                <Text
                  style={
                    resultStyles.reviewQuestion
                  }
                >
                  {question.question ??
                    "Question unavailable"}
                </Text>

                {!isSkipped && (
                  <View
                    style={
                      resultStyles.answerRow
                    }
                  >
                    <Text
                      style={
                        resultStyles.answerLabel
                      }
                    >
                      Your answer
                    </Text>

                    <Text
                      style={[
                        resultStyles.answerText,
                        {
                          color:
                            isCorrect
                              ? "#15803D"
                              : "#B91C1C",
                        },
                      ]}
                    >
                      {question.options?.[
                        userAnswer
                      ] ??
                        "Unknown"}
                    </Text>
                  </View>
                )}

                {!isCorrect && (
                  <View
                    style={
                      resultStyles.correctAnswerBox
                    }
                  >
                    <Text
                      style={
                        resultStyles.correctLabel
                      }
                    >
                      Correct answer
                    </Text>

                    <Text
                      style={
                        resultStyles.correctText
                      }
                    >
                      {question.options?.[
                        correctAnswer
                      ] ??
                        "Not available"}
                    </Text>
                  </View>
                )}

                {!!question.explanation && (
                  <View
                    style={
                      resultStyles.explanation
                    }
                  >
                    <Text
                      style={
                        resultStyles.explanationTitle
                      }
                    >
                      💡 Explanation
                    </Text>

                    <Text
                      style={
                        resultStyles.explanationText
                      }
                    >
                      {
                        question.explanation
                      }
                    </Text>
                  </View>
                )}
              </View>
            );
          }
        )}

        {/* ================================================================ */}
        {/* ACTIONS                                                          */}
        {/* ================================================================ */}

        <View
          style={
            resultStyles.actions
          }
        >
          <TouchableOpacity
            style={
              resultStyles.retryButton
            }
            onPress={onRetry}
            activeOpacity={
              0.85
            }
          >
            <Text
              style={
                resultStyles.retryIcon
              }
            >
              ↻
            </Text>

            <Text
              style={
                resultStyles.retryText
              }
            >
              Retake Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              resultStyles.doneButton
            }
            onPress={onDone}
            activeOpacity={
              0.85
            }
          >
            <Text
              style={
                resultStyles.doneText
              }
            >
              Done
            </Text>

            <Text
              style={
                resultStyles.doneIcon
              }
            >
              →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========================================================================== */
/* RESULT STAT                                                                */
/* ========================================================================== */

function ResultStat({
  value,
  label,
  color,
  icon,
}: {
  value: number | string;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <View
      style={
        resultStyles.statCard
      }
    >
      <View
        style={[
          resultStyles.statIcon,
          {
            backgroundColor:
              `${color}15`,
          },
        ]}
      >
        <Text
          style={[
            resultStyles.statIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          resultStyles.statValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          resultStyles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* ========================================================================== */
/* QUIZ STYLES                                                                */
/* ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
  },

  center: {
    flex: 1,
    justifyContent:
      "center",
    alignItems:
      "center",
    backgroundColor:
      Colors.background,
    padding: 24,
  },

  loadingCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor:
      Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor:
      Colors.border,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent:
      "center",
    alignItems:
      "center",
    backgroundColor:
      "#C6282812",
    marginBottom: 18,
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },

  loadingSubtitle: {
    marginTop: 8,
    color:
      Colors.textSecondary,
    fontSize: 13,
    textAlign:
      "center",
    lineHeight: 20,
  },

  emptyCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor:
      Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor:
      Colors.border,
  },

  emptyEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },

  emptyText: {
    color:
      Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADER                                                                */
  /* ---------------------------------------------------------------------- */

  header: {
    flexDirection:
      "row",
    alignItems:
      "center",
    paddingHorizontal:
      18,
    paddingTop: 10,
    paddingBottom: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      Colors.surface,
    borderWidth: 1,
    borderColor:
      Colors.border,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    color: Colors.text,
    fontWeight: "400",
    marginTop: -3,
  },

  headerContent: {
    flex: 1,
    paddingHorizontal: 12,
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    color:
      Colors.primary,
    marginBottom: 2,
  },

  quizTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 17,
  },

  timerContainer: {
    minWidth: 84,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      "#111111",
    flexDirection:
      "row",
    alignItems:
      "center",
    justifyContent:
      "center",
    paddingHorizontal: 10,
  },

  timerWarning: {
    backgroundColor:
      "#B45309",
  },

  timerCritical: {
    backgroundColor:
      "#B91C1C",
  },

  timerIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    marginRight: 5,
  },

  timerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  timerTextCritical: {
    color: "#FFFFFF",
  },

  /* ---------------------------------------------------------------------- */
  /* PROGRESS                                                               */
  /* ---------------------------------------------------------------------- */

  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  progressTopRow: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom: 8,
  },

  progressQuestion: {
    fontSize: 12,
    fontWeight: "700",
    color:
      Colors.text,
  },

  progressPercentage: {
    fontSize: 12,
    fontWeight: "800",
    color:
      Colors.primary,
  },

  progressBackground: {
    height: 7,
    borderRadius: 8,
    backgroundColor:
      "#E8E8E8",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor:
      Colors.primary,
  },

  progressMeta: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    marginTop: 7,
  },

  progressMetaText: {
    fontSize: 10,
    color:
      Colors.textSecondary,
    fontWeight: "600",
  },

  /* ---------------------------------------------------------------------- */
  /* QUESTION                                                              */
  /* ---------------------------------------------------------------------- */

  questionScroll: {
    flex: 1,
  },

  questionContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },

  questionCard: {
    backgroundColor:
      Colors.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor:
      Colors.border,
    marginBottom: 16,

    shadowColor:
      "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  questionCardTop: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom: 18,
  },

  questionBadge: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor:
      Colors.primary,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  questionBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  pointsBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor:
      "#C6282810",
  },

  pointsBadgeText: {
    color:
      Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  questionText: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 20,
    lineHeight: 29,
  },

  answerHint: {
    marginTop: 13,
    color:
      Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---------------------------------------------------------------------- */
  /* OPTIONS                                                                */
  /* ---------------------------------------------------------------------- */

  optionsContainer: {
    marginBottom: 8,
  },

  option: {
    minHeight: 66,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      Colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },

  optionSelected: {
    borderColor:
      Colors.primary,
    backgroundColor:
      "#C6282809",
  },

  optionLetterContainer: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      "#F1F3F5",
    justifyContent:
      "center",
    alignItems:
      "center",
    marginRight: 13,
  },

  optionLetterContainerSelected: {
    backgroundColor:
      Colors.primary,
  },

  optionLetter: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  optionLetterSelected: {
    color: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  optionTextSelected: {
    color:
      Colors.primary,
    fontWeight: "800",
  },

  selectedCheck: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor:
      "#16A34A",
    justifyContent:
      "center",
    alignItems:
      "center",
    marginLeft: 8,
  },

  selectedCheckText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  /* ---------------------------------------------------------------------- */
  /* QUESTION INFO                                                          */
  /* ---------------------------------------------------------------------- */

  questionInfo: {
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#F8FAFC",
    borderRadius: 13,
    padding: 12,
    marginTop: 2,
  },

  questionInfoIcon: {
    fontSize: 14,
    marginRight: 8,
  },

  questionInfoText: {
    flex: 1,
    color:
      Colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  /* ---------------------------------------------------------------------- */
  /* FOOTER                                                                 */
  /* ---------------------------------------------------------------------- */

  footer: {
    backgroundColor:
      Colors.surface,
    borderTopWidth: 1,
    borderTopColor:
      Colors.border,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },

  footerStatus: {
    flexDirection:
      "row",
    alignItems:
      "center",
    marginBottom: 9,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      "#D1D5DB",
    marginRight: 7,
  },

  statusDotAnswered: {
    backgroundColor:
      "#16A34A",
  },

  footerStatusText: {
    fontSize: 10,
    color:
      Colors.textSecondary,
    fontWeight: "600",
  },

  footerButtons: {
    flexDirection:
      "row",
    gap: 10,
  },

  previousButton: {
    flex: 0.8,
    height: 50,
    borderRadius: 14,
    backgroundColor:
      "#F3F4F6",
    justifyContent:
      "center",
    alignItems:
      "center",
    flexDirection:
      "row",
    gap: 5,
  },

  previousButtonText: {
    fontSize: 19,
    color: Colors.text,
    fontWeight: "700",
  },

  previousButtonLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  nextButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    backgroundColor:
      Colors.primary,
    justifyContent:
      "center",
    alignItems:
      "center",
    flexDirection:
      "row",
    gap: 8,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  nextButtonIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  submitButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    backgroundColor:
      "#111111",
    justifyContent:
      "center",
    alignItems:
      "center",
    flexDirection:
      "row",
    gap: 8,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  submitButtonIcon: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.4,
  },

  disabledButtonText: {
    color: "#999999",
  },

  primaryButton: {
    minWidth: 150,
    height: 48,
    borderRadius: 14,
    backgroundColor:
      Colors.primary,
    justifyContent:
      "center",
    alignItems:
      "center",
    paddingHorizontal: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});

/* ========================================================================== */
/* RESULT STYLES                                                              */
/* ========================================================================== */

const resultStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 50,
  },

  resultHeader: {
    flexDirection:
      "row",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    marginBottom: 18,
  },

  resultEyebrow: {
    color:
      Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  resultQuizTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: "900",
    maxWidth: 280,
  },

  completedBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor:
      "#16A34A",
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  completedBadgeText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  /* ---------------------------------------------------------------------- */
  /* TIMEOUT                                                                */
  /* ---------------------------------------------------------------------- */

  timeoutBanner: {
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFF7ED",
    borderWidth: 1,
    borderColor:
      "#FED7AA",
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
  },

  timeoutIcon: {
    fontSize: 23,
    marginRight: 10,
  },

  timeoutContent: {
    flex: 1,
  },

  timeoutTitle: {
    color:
      "#9A3412",
    fontSize: 13,
    fontWeight: "900",
  },

  timeoutText: {
    marginTop: 2,
    color:
      "#C2410C",
    fontSize: 11,
    lineHeight: 17,
  },

  /* ---------------------------------------------------------------------- */
  /* HERO                                                                   */
  /* ---------------------------------------------------------------------- */

  scoreHero: {
    backgroundColor:
      Colors.surface,
    borderRadius: 25,
    borderWidth: 2,
    padding: 25,
    alignItems:
      "center",
    marginBottom: 14,
  },

  resultEmoji: {
    fontSize: 46,
    marginBottom: 5,
  },

  motivationTitle: {
    color: Colors.text,
    fontSize: 23,
    fontWeight: "900",
  },

  scoreRow: {
    flexDirection:
      "row",
    alignItems:
      "flex-end",
    marginTop: 12,
  },

  scoreNumber: {
    fontSize: 60,
    lineHeight: 65,
    fontWeight: "900",
  },

  scoreSlash: {
    color:
      Colors.textSecondary,
    fontSize: 32,
    fontWeight: "700",
    marginHorizontal: 5,
    marginBottom: 5,
  },

  scoreTotal: {
    color:
      Colors.textSecondary,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6,
  },

  percentage: {
    color:
      Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  statusBadge: {
    marginTop: 13,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusPassed: {
    backgroundColor:
      "#DCFCE7",
  },

  statusFailed: {
    backgroundColor:
      "#FEE2E2",
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  motivationMessage: {
    color:
      Colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 15,
  },

  /* ---------------------------------------------------------------------- */
  /* STATS                                                                  */
  /* ---------------------------------------------------------------------- */

  statsGrid: {
    flexDirection:
      "row",
    gap: 8,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor:
      Colors.surface,
    borderRadius: 17,
    paddingVertical: 13,
    alignItems:
      "center",
    borderWidth: 1,
    borderColor:
      Colors.border,
  },

  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent:
      "center",
    alignItems:
      "center",
    marginBottom: 5,
  },

  statIconText: {
    fontSize: 14,
    fontWeight: "900",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    color:
      Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  /* ---------------------------------------------------------------------- */
  /* TIME CARD                                                              */
  /* ---------------------------------------------------------------------- */

  timeCard: {
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      Colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      Colors.border,
    padding: 14,
    marginBottom: 25,
  },

  timeIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      "#C6282812",
    justifyContent:
      "center",
    alignItems:
      "center",
    marginRight: 11,
  },

  timeIcon: {
    fontSize: 19,
  },

  timeContent: {
    flex: 1,
  },

  timeContentRight: {
    alignItems:
      "flex-end",
  },

  timeLabel: {
    color:
      Colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  timeValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },

  /* ---------------------------------------------------------------------- */
  /* REVIEW                                                                 */
  /* ---------------------------------------------------------------------- */

  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 19,
    marginBottom: 12,
  },

  reviewCard: {
    backgroundColor:
      Colors.surface,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor:
      Colors.border,
    borderRightColor:
      Colors.border,
    borderBottomColor:
      Colors.border,
    padding: 15,
    marginBottom: 11,
  },

  reviewHeader: {
    flexDirection:
      "row",
    alignItems:
      "center",
    marginBottom: 9,
  },

  reviewQuestionNumber: {
    minWidth: 37,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor:
      "#F3F4F6",
    justifyContent:
      "center",
    alignItems:
      "center",
    marginRight: 8,
  },

  reviewQuestionNumberText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: "900",
  },

  reviewStatus: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
  },

  reviewPoints: {
    color:
      Colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  reviewQuestion: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 10,
  },

  answerRow: {
    backgroundColor:
      "#F8FAFC",
    borderRadius: 10,
    padding: 9,
    marginBottom: 7,
  },

  answerLabel: {
    color:
      Colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    textTransform:
      "uppercase",
    marginBottom: 2,
  },

  answerText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },

  correctAnswerBox: {
    backgroundColor:
      "#F0FDF4",
    borderRadius: 10,
    padding: 9,
    marginBottom: 7,
  },

  correctLabel: {
    color:
      "#15803D",
    fontSize: 9,
    fontWeight: "800",
    textTransform:
      "uppercase",
    marginBottom: 2,
  },

  correctText: {
    color:
      "#166534",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },

  explanation: {
    backgroundColor:
      "#FFF7ED",
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },

  explanationTitle: {
    color:
      "#9A3412",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 3,
  },

  explanationText: {
    color:
      "#7C2D12",
    fontSize: 11,
    lineHeight: 17,
  },

  /* ---------------------------------------------------------------------- */
  /* ACTIONS                                                                */
  /* ---------------------------------------------------------------------- */

  actions: {
    flexDirection:
      "row",
    gap: 10,
    marginTop: 18,
  },

  retryButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor:
      Colors.primary,
    backgroundColor:
      Colors.surface,
    justifyContent:
      "center",
    alignItems:
      "center",
    flexDirection:
      "row",
    gap: 7,
  },

  retryIcon: {
    color:
      Colors.primary,
    fontSize: 20,
    fontWeight: "700",
  },

  retryText: {
    color:
      Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  doneButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    backgroundColor:
      Colors.primary,
    justifyContent:
      "center",
    alignItems:
      "center",
    flexDirection:
      "row",
    gap: 7,
  },

  doneText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  doneIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});