import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  getQuizzes,
  getUserQuizHistory,
} from "../../services/quizService";

import {
  getCurrentUser,
} from "../../services/authService";

import type {
  RootStackParamList,
} from "../../navigation/AppNavigator";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type Difficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

type Filter =
  | "All"
  | Difficulty;

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  module?: string;
  difficulty: Difficulty;

  /*
   * Backend normally provides this.
   * We also calculate a fallback from the questions array.
   */
  totalQuestions?: number;

  totalMarks?: number;

  /*
   * Kept for compatibility with backend.
   * UI timing is calculated from questions:
   *
   * 1 question = 1 minute
   */
  duration?: number;

  isPremiumOnly?: boolean;

  /*
   * Some API versions may return questions directly.
   */
  questions?: unknown[];
}

interface QuizAttempt {
  _id?: string;

  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;

  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;

  timeTaken?: number;

  createdAt?: string;
  submittedAt?: string;
}

type QuizHistoryMap =
  Record<string, QuizAttempt>;

interface QuizCardProps {
  quiz: Quiz;
  attempt?: QuizAttempt;
  onPress: (quizId: string) => void;
}

/* ============================================================================
 * COLORS
 * ========================================================================== */

const COLORS = {
  primary: "#C62828",
  primaryDark: "#8E0000",
  primaryDeep: "#5E0000",
  primaryLight: "#FDECEC",

  black: "#0B0B0C",
  blackSoft: "#151517",
  dark: "#202023",

  white: "#FFFFFF",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceSoft: "#FAFAFA",

  border: "#E7E7EA",
  borderDark: "#D6D6DA",

  text: "#111113",
  textSecondary: "#626269",
  textMuted: "#929298",

  success: "#16834A",
  successBackground: "#EAF7EF",

  danger: "#C62828",
  dangerBackground: "#FDECEC",

  warning: "#B76A00",
  warningBackground: "#FFF4DF",

  premium: "#9B6500",
  premiumBackground: "#FFF3D2",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

/**
 * Get number of questions safely.
 *
 * Priority:
 * 1. totalQuestions from backend
 * 2. questions.length
 * 3. 0
 */
function getQuestionCount(
  quiz: Quiz,
): number {
  const backendCount =
    Number(quiz.totalQuestions);

  if (
    Number.isFinite(backendCount) &&
    backendCount > 0
  ) {
    return backendCount;
  }

  if (
    Array.isArray(quiz.questions) &&
    quiz.questions.length > 0
  ) {
    return quiz.questions.length;
  }

  return 0;
}

/**
 * Quiz timing rule:
 *
 * 1 question = 1 minute.
 *
 * 10 questions = 10 minutes.
 * 20 questions = 20 minutes.
 */
function getQuizDurationMinutes(
  quiz: Quiz,
): number {
  const questionCount =
    getQuestionCount(quiz);

  if (questionCount <= 0) {
    return 0;
  }

  return questionCount;
}

/**
 * Total marks.
 *
 * Prefer backend value.
 * Otherwise use 1 point per question.
 */
function getTotalMarks(
  quiz: Quiz,
): number {
  const backendMarks =
    Number(quiz.totalMarks);

  if (
    Number.isFinite(backendMarks) &&
    backendMarks > 0
  ) {
    return backendMarks;
  }

  return getQuestionCount(quiz);
}

function getDifficultyColor(
  difficulty: Difficulty,
): string {
  switch (difficulty) {
    case "Beginner":
      return COLORS.success;

    case "Intermediate":
      return COLORS.warning;

    case "Advanced":
      return COLORS.danger;

    default:
      return COLORS.primary;
  }
}

function getDifficultyBackground(
  difficulty: Difficulty,
): string {
  switch (difficulty) {
    case "Beginner":
      return COLORS.successBackground;

    case "Intermediate":
      return COLORS.warningBackground;

    case "Advanced":
      return COLORS.dangerBackground;

    default:
      return COLORS.primaryLight;
  }
}

/**
 * Convert API date safely.
 */
function getAttemptTimestamp(
  attempt: QuizAttempt,
): number {
  const value =
    attempt.submittedAt ??
    attempt.createdAt;

  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

/* ============================================================================
 * QUIZ CARD
 * ========================================================================== */

const QuizCard = memo(function QuizCard({
  quiz,
  attempt,
  onPress,
}: QuizCardProps) {
  const difficultyColor =
    getDifficultyColor(
      quiz.difficulty,
    );

  const difficultyBackground =
    getDifficultyBackground(
      quiz.difficulty,
    );

  const questionCount =
    getQuestionCount(quiz);

  const durationMinutes =
    getQuizDurationMinutes(quiz);

  const totalMarks =
    getTotalMarks(quiz);

  const hasAttempt =
    Boolean(attempt);

  const handlePress = () => {
    onPress(quiz._id);
  };

  return (
    <View style={styles.quizCard}>

      {/* ================================================================
       * HEADER
       * ============================================================ */}

      <View style={styles.cardHeader}>

        <View style={styles.cardHeaderLeft}>

          <View style={styles.moduleIcon}>
            <Text style={styles.moduleIconText}>
              Q
            </Text>
          </View>

          <View style={styles.titleContainer}>

            <Text
              style={styles.quizTitle}
              numberOfLines={2}
            >
              {quiz.title}
            </Text>

            {!!quiz.module && (
              <Text
                style={styles.moduleText}
                numberOfLines={1}
              >
                {quiz.module}
              </Text>
            )}

          </View>

        </View>

        <View style={styles.badgeColumn}>

          {quiz.isPremiumOnly && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>
                PREMIUM
              </Text>
            </View>
          )}

          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  difficultyBackground,
              },
            ]}
          >
            <View
              style={[
                styles.difficultyDot,
                {
                  backgroundColor:
                    difficultyColor,
                },
              ]}
            />

            <Text
              style={[
                styles.difficultyText,
                {
                  color:
                    difficultyColor,
                },
              ]}
            >
              {quiz.difficulty}
            </Text>
          </View>

        </View>

      </View>

      {/* ================================================================
       * DESCRIPTION
       * ============================================================ */}

      {!!quiz.description && (
        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {quiz.description}
        </Text>
      )}

      {/* ================================================================
       * LATEST ATTEMPT
       * ============================================================ */}

      {attempt && (
        <View
          style={[
            styles.completedContainer,
            {
              backgroundColor:
                attempt.passed
                  ? COLORS.successBackground
                  : COLORS.dangerBackground,
            },
          ]}
        >

          <View
            style={[
              styles.completedIcon,
              {
                backgroundColor:
                  attempt.passed
                    ? COLORS.success
                    : COLORS.danger,
              },
            ]}
          >
            <Text style={styles.completedIconText}>
              ✓
            </Text>
          </View>

          <View style={styles.completedContent}>

            <View style={styles.completedTitleRow}>

              <Text
                style={[
                  styles.completedTitle,
                  {
                    color:
                      attempt.passed
                        ? COLORS.success
                        : COLORS.danger,
                  },
                ]}
              >
                Completed
              </Text>

              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      attempt.passed
                        ? COLORS.success
                        : COLORS.danger,
                  },
                ]}
              >
                <Text style={styles.resultBadgeText}>
                  {attempt.passed
                    ? "PASSED"
                    : "COMPLETED"}
                </Text>
              </View>

            </View>

            <Text style={styles.completedSubtitle}>
              Latest score{" "}
              {attempt.score}
              /
              {attempt.totalMarks ||
                totalMarks}
              {"  •  "}
              {Math.round(
                Number(
                  attempt.percentage || 0,
                ),
              )}
              %
            </Text>

          </View>

        </View>
      )}

      {/* ================================================================
       * QUIZ INFORMATION
       * ============================================================ */}

      <View style={styles.infoRow}>

        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>
            ?
          </Text>

          <View>
            <Text style={styles.infoValue}>
              {questionCount}
            </Text>

            <Text style={styles.infoLabel}>
              Questions
            </Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>
            ⏱
          </Text>

          <View>
            <Text style={styles.infoValue}>
              {durationMinutes}
            </Text>

            <Text style={styles.infoLabel}>
              Minutes
            </Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>
            ★
          </Text>

          <View>
            <Text style={styles.infoValue}>
              {totalMarks}
            </Text>

            <Text style={styles.infoLabel}>
              Marks
            </Text>
          </View>
        </View>

      </View>

      {/* ================================================================
       * ACTION
       * ============================================================ */}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          hasAttempt
            ? `Retake ${quiz.title}`
            : `Start ${quiz.title}`
        }
        onPress={handlePress}
        style={({ pressed }) => [
          styles.startButton,

          quiz.isPremiumOnly &&
            styles.premiumStartButton,

          pressed &&
            styles.buttonPressed,
        ]}
      >

        <Text style={styles.startButtonText}>
          {quiz.isPremiumOnly
            ? "👑  Premium Quiz"
            : hasAttempt
              ? "Retake Quiz"
              : "Start Quiz"}
        </Text>

        <Text style={styles.startButtonArrow}>
          →
        </Text>

      </Pressable>

    </View>
  );
});

/* ============================================================================
 * MAIN SCREEN
 * ========================================================================== */

export default function QuizScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("All");

  const [quizzes, setQuizzes] =
    useState<Quiz[]>([]);

  const [quizHistory, setQuizHistory] =
    useState<QuizHistoryMap>({});

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================================
   * LOAD QUIZZES + LATEST ATTEMPTS
   * ======================================================================== */

  const loadQuizzes = useCallback(
    async (
      showLoader = true,
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError(null);

        const user =
          await getCurrentUser();

        const [
          quizResponse,
          historyResponse,
        ] = await Promise.all([
          getQuizzes(),

          user?._id
            ? getUserQuizHistory(
                user._id,
              )
            : Promise.resolve([]),
        ]);

        /* ================================================================
         * QUIZ DATA
         * ============================================================ */

        const quizData =
          Array.isArray(quizResponse)
            ? quizResponse
            : quizResponse?.data ?? [];

        const normalizedQuizzes: Quiz[] =
          Array.isArray(quizData)
            ? quizData.map(
                (quiz: any) => {
                  const questions =
                    Array.isArray(
                      quiz?.questions,
                    )
                      ? quiz.questions
                      : undefined;

                  const backendCount =
                    Number(
                      quiz?.totalQuestions,
                    );

                  const totalQuestions =
                    Number.isFinite(
                      backendCount,
                    ) &&
                    backendCount > 0
                      ? backendCount
                      : questions?.length ??
                        0;

                  /*
                   * IMPORTANT:
                   *
                   * Every question gets exactly
                   * one minute.
                   */
                  const duration =
                    totalQuestions > 0
                      ? totalQuestions
                      : Number(
                          quiz?.duration,
                        ) || 0;

                  return {
                    ...quiz,

                    _id: String(
                      quiz?._id,
                    ),

                    totalQuestions,

                    duration,
                  };
                },
              )
            : [];

        setQuizzes(
          normalizedQuizzes,
        );

        /* ================================================================
         * ATTEMPT HISTORY
         *
         * Backend already sorts:
         *
         * createdAt: -1
         *
         * Therefore FIRST attempt for a quiz
         * is the latest attempt.
         *
         * NEVER overwrite it with an older attempt.
         * ============================================================ */

        const historyData =
          Array.isArray(
            historyResponse,
          )
            ? historyResponse
            : historyResponse?.data ?? [];

        const sortedHistory =
          Array.isArray(historyData)
            ? [...historyData].sort(
                (
                  a: any,
                  b: any,
                ) =>
                  getAttemptTimestamp(
                    b,
                  ) -
                  getAttemptTimestamp(
                    a,
                  ),
              )
            : [];

        const historyMap: QuizHistoryMap =
          {};

        sortedHistory.forEach(
          (attempt: any) => {
            const quizId =
              attempt?.quiz?._id ??
              attempt?.quiz;

            if (!quizId) {
              return;
            }

            const normalizedId =
              String(quizId);

            /*
             * CRITICAL FIX:
             *
             * If we already have an attempt
             * for this quiz, it is newer.
             *
             * Do NOT overwrite it.
             */
            if (
              historyMap[
                normalizedId
              ]
            ) {
              return;
            }

            historyMap[
              normalizedId
            ] = {
              _id: attempt?._id
                ? String(
                    attempt._id,
                  )
                : undefined,

              score:
                Number(
                  attempt?.score,
                ) || 0,

              totalMarks:
                Number(
                  attempt?.totalMarks,
                ) || 0,

              percentage:
                Number(
                  attempt?.percentage,
                ) || 0,

              passed:
                Boolean(
                  attempt?.passed,
                ),

              correctAnswers:
                Number(
                  attempt?.correctAnswers,
                ) || 0,

              wrongAnswers:
                Number(
                  attempt?.wrongAnswers,
                ) || 0,

              skippedQuestions:
                Number(
                  attempt?.skippedQuestions,
                ) || 0,

              timeTaken:
                Number(
                  attempt?.timeTaken,
                ) || 0,

              createdAt:
                attempt?.createdAt,

              submittedAt:
                attempt?.submittedAt,
            };
          },
        );

        setQuizHistory(
          historyMap,
        );

      } catch (err) {
        console.error(
          "[QuizScreen] Failed to load quizzes:",
          err,
        );

        setError(
          "Unable to load quizzes. Please check your connection and try again.",
        );

        /*
         * Do not destroy existing data
         * during a failed refresh.
         */
        setQuizzes(
          previous =>
            previous.length > 0
              ? previous
              : [],
        );

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* ==========================================================================
   * REFRESH WHEN SCREEN GETS FOCUS
   *
   * This is important after returning from QuizQuestion.
   *
   * When the user submits/retakes a quiz:
   *
   * QuizQuestion
   *       ↓
   * backend creates attempt
   *       ↓
   * result screen
   *       ↓
   * QuizScreen gets focus
   *       ↓
   * getUserQuizHistory()
   *       ↓
   * latest result displayed
   * ======================================================================== */

  useFocusEffect(
    useCallback(() => {
      loadQuizzes(false);
    }, [loadQuizzes]),
  );

  /* ==========================================================================
   * INITIAL LOAD
   * ======================================================================== */

  useEffect(() => {
    loadQuizzes(true);
  }, [loadQuizzes]);

  /* ==========================================================================
   * REFRESH
   * ======================================================================== */

  const handleRefresh =
    useCallback(async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      await loadQuizzes(false);
    }, [
      loadQuizzes,
      refreshing,
    ]);

  /* ==========================================================================
   * FILTERED QUIZZES
   * ======================================================================== */

  const filteredQuizzes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return quizzes.filter(
        quiz => {
          const matchesSearch =
            !query ||
            quiz.title
              .toLowerCase()
              .includes(query) ||
            (quiz.module ?? "")
              .toLowerCase()
              .includes(query) ||
            (quiz.description ?? "")
              .toLowerCase()
              .includes(query);

          const matchesFilter =
            filter === "All" ||
            quiz.difficulty ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      quizzes,
      search,
      filter,
    ]);

  /* ==========================================================================
   * STATISTICS
   * ======================================================================== */

  const statistics =
    useMemo(() => {
      const totalQuestions =
        quizzes.reduce(
          (sum, quiz) =>
            sum +
            getQuestionCount(
              quiz,
            ),
          0,
        );

      /*
       * Number of unique quizzes
       * with at least one attempt.
       */
      const completed =
        quizzes.reduce(
          (count, quiz) =>
            quizHistory[
              quiz._id
            ]
              ? count + 1
              : count,
          0,
        );

      const beginner =
        quizzes.filter(
          quiz =>
            quiz.difficulty ===
            "Beginner",
        ).length;

      const intermediate =
        quizzes.filter(
          quiz =>
            quiz.difficulty ===
            "Intermediate",
        ).length;

      const advanced =
        quizzes.filter(
          quiz =>
            quiz.difficulty ===
            "Advanced",
        ).length;

      return {
        totalQuestions,
        completed,
        beginner,
        intermediate,
        advanced,
      };
    }, [
      quizzes,
      quizHistory,
    ]);

  /* ==========================================================================
   * NAVIGATION
   * ======================================================================== */

  const openQuiz =
    useCallback(
      (quizId: string) => {
        navigation.navigate(
          "QuizQuestion",
          {
            quizId,
          },
        );
      },
      [navigation],
    );

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={
            COLORS.primaryDark
          }
        />

        <View style={styles.loadingIcon}>
          <Text
            style={
              styles.loadingIconText
            }
          >
            Q
          </Text>
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingTitle}>
          Loading quizzes
        </Text>

        <Text
          style={
            styles.loadingSubtitle
          }
        >
          Preparing your security
          challenges...
        </Text>
      </SafeAreaView>
    );
  }

  /* ==========================================================================
   * ERROR
   * ======================================================================== */

  if (
    error &&
    quizzes.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.errorScreen}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View style={styles.errorIcon}>
          <Text
            style={
              styles.errorIconText
            }
          >
            !
          </Text>
        </View>

        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorMessage}>
          {error}
        </Text>

        <Pressable
          onPress={() =>
            loadQuizzes(true)
          }
          style={({ pressed }) => [
            styles.retryButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ==========================================================================
   * MAIN UI
   * ======================================================================== */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.primaryDark
        }
      />

      <FlatList
        data={filteredQuizzes}

        keyExtractor={item =>
          String(item._id)
        }

        showsVerticalScrollIndicator={
          false
        }

        keyboardShouldPersistTaps="handled"

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            colors={[
              COLORS.primary,
            ]}
            tintColor={
              COLORS.primary
            }
          />
        }

        contentContainerStyle={
          styles.listContent
        }

        ListHeaderComponent={
          <>
            {/* ================================================================
             * HERO
             * ============================================================ */}

            <View style={styles.hero}>

              <View
                style={
                  styles.heroGlow
                }
              />

              <View
                style={
                  styles.heroTopRow
                }
              >
                <View
                  style={
                    styles.heroText
                  }
                >
                  <Text
                    style={
                      styles.heroEyebrow
                    }
                  >
                    SOLOSECURITIES
                  </Text>

                  <Text
                    style={
                      styles.heroTitle
                    }
                  >
                    Security Quiz
                  </Text>

                  <Text
                    style={
                      styles.heroSubtitle
                    }
                  >
                    Test your knowledge.
                    {"\n"}
                    Strengthen your
                    security skills.
                  </Text>
                </View>

                <View
                  style={
                    styles.heroBadge
                  }
                >
                  <Text
                    style={
                      styles.heroBadgeIcon
                    }
                  >
                    Q
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.heroFooter
                }
              >
                <Text
                  style={
                    styles.heroFooterText
                  }
                >
                  LEARN
                </Text>

                <Text
                  style={
                    styles.heroFooterDot
                  }
                >
                  •
                </Text>

                <Text
                  style={
                    styles.heroFooterText
                  }
                >
                  PRACTICE
                </Text>

                <Text
                  style={
                    styles.heroFooterDot
                  }
                >
                  •
                </Text>

                <Text
                  style={
                    styles.heroFooterText
                  }
                >
                  IMPROVE
                </Text>
              </View>

            </View>

            {/* ================================================================
             * STATISTICS
             * ============================================================ */}

            <View
              style={
                styles.statsGrid
              }
            >

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {quizzes.length}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  QUIZZES
                </Text>
              </View>

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {
                    statistics.totalQuestions
                  }
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  QUESTIONS
                </Text>
              </View>

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        COLORS.success,
                    },
                  ]}
                >
                  {
                    statistics.completed
                  }
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  COMPLETED
                </Text>
              </View>

              <View
                style={
                  styles.statCard
                }
              >
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        COLORS.primary,
                    },
                  ]}
                >
                  {
                    statistics.advanced
                  }
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  ADVANCED
                </Text>
              </View>

            </View>

            {/* ================================================================
             * SEARCH
             * ============================================================ */}

            <View
              style={
                styles.searchContainer
              }
            >
              <Text
                style={
                  styles.searchIcon
                }
              >
                ⌕
              </Text>

              <TextInput
                value={search}
                onChangeText={
                  setSearch
                }
                placeholder="Search quizzes..."
                placeholderTextColor={
                  COLORS.textMuted
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={
                  styles.searchInput
                }
                accessibilityLabel="Search quizzes"
              />

              {search.length >
                0 && (
                <Pressable
                  onPress={() =>
                    setSearch("")
                  }
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text
                    style={
                      styles.clearSearch
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              )}
            </View>

            {/* ================================================================
             * FILTERS
             * ============================================================ */}

            <View
              style={
                styles.filterRow
              }
            >
              {(
                [
                  "All",
                  "Beginner",
                  "Intermediate",
                  "Advanced",
                ] as Filter[]
              ).map(item => {
                const active =
                  filter === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setFilter(
                        item,
                      )
                    }
                    style={[
                      styles.filterChip,
                      active &&
                        styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ================================================================
             * SECTION
             * ============================================================ */}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Available Quizzes
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {
                    filteredQuizzes.length
                  }{" "}
                  {filteredQuizzes.length ===
                  1
                    ? "quiz"
                    : "quizzes"}{" "}
                  available
                </Text>
              </View>
            </View>
          </>
        }

        renderItem={({
          item,
        }) => (
          <QuizCard
            quiz={item}
            attempt={
              quizHistory[
                item._id
              ]
            }
            onPress={
              openQuiz
            }
          />
        )}

        ListEmptyComponent={
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Text
                style={
                  styles.emptyIconText
                }
              >
                Q
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No quizzes found
            </Text>

            <Text
              style={
                styles.emptyMessage
              }
            >
              {search.trim()
                ? "Try a different search keyword."
                : "No quizzes are available right now."}
            </Text>

            {search.trim() && (
              <Pressable
                onPress={() => {
                  setSearch("");
                  setFilter(
                    "All",
                  );
                }}
                style={
                  styles.emptyButton
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Clear Filters
                </Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.background,
    paddingHorizontal: 32,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.primary,
    marginBottom: 26,
  },

  loadingIconText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
  },

  loadingTitle: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  loadingSubtitle: {
    marginTop: 7,
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * ERROR
   * ------------------------------------------------------------------------ */

  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.background,
    paddingHorizontal: 32,
  },

  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.dangerBackground,
    marginBottom: 20,
  },

  errorIconText: {
    color: COLORS.danger,
    fontSize: 30,
    fontWeight: "900",
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 9,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 24,
    minWidth: 140,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.primary,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  /* --------------------------------------------------------------------------
   * HERO
   * ------------------------------------------------------------------------ */

  hero: {
    position: "relative",
    backgroundColor:
      COLORS.primaryDark,
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -65,
    top: -80,
    backgroundColor:
      "rgba(255,255,255,0.06)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  heroText: {
    flex: 1,
    paddingRight: 15,
  },

  heroEyebrow: {
    color: "#F5B4B4",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  heroTitle: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },

  heroSubtitle: {
    marginTop: 9,
    color: "#F5DADA",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },

  heroBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.primary,
    borderWidth: 1,
    borderColor: "#E46C6C",
  },

  heroBadgeIcon: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
  },

  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor:
      "rgba(255,255,255,0.15)",
  },

  heroFooterText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  heroFooterDot: {
    color: "#E88B8B",
    marginHorizontal: 9,
    fontSize: 11,
  },

  /* --------------------------------------------------------------------------
   * STATS
   * ------------------------------------------------------------------------ */

  statsGrid: {
    flexDirection: "row",
    marginHorizontal: -4,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    minHeight: 78,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  statValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * SEARCH
   * ------------------------------------------------------------------------ */

  searchContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  searchIcon: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "700",
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    minHeight: 50,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },

  clearSearch: {
    color: COLORS.textMuted,
    fontSize: 26,
    lineHeight: 28,
    paddingLeft: 8,
  },

  /* --------------------------------------------------------------------------
   * FILTERS
   * ------------------------------------------------------------------------ */

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor:
      "#EEEEF0",
    marginRight: 7,
    borderWidth: 1,
    borderColor:
      "transparent",
  },

  filterChipActive: {
    backgroundColor:
      COLORS.primary,
    borderColor:
      COLORS.primary,
  },

  filterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  /* --------------------------------------------------------------------------
   * SECTION
   * ------------------------------------------------------------------------ */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },

  /* --------------------------------------------------------------------------
   * CARD
   * ------------------------------------------------------------------------ */

  quizCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius: 21,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,

    shadowColor: "#000000",
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
  },

  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor:
      COLORS.primaryLight,
  },

  moduleIconText: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "900",
  },

  titleContainer: {
    flex: 1,
  },

  quizTitle: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },

  moduleText: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  badgeColumn: {
    alignItems: "flex-end",
  },

  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor:
      COLORS.premiumBackground,
    marginBottom: 6,
  },

  premiumBadgeText: {
    color: COLORS.premium,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },

  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  difficultyText: {
    fontSize: 9,
    fontWeight: "900",
  },

  description: {
    marginTop: 14,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  /* --------------------------------------------------------------------------
   * COMPLETION
   * ------------------------------------------------------------------------ */

  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 10,
    borderRadius: 13,
  },

  completedIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  completedIconText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  completedContent: {
    flex: 1,
  },

  completedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  completedTitle: {
    fontSize: 12,
    fontWeight: "900",
  },

  completedSubtitle: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  resultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  resultBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "900",
  },

  /* --------------------------------------------------------------------------
   * INFO
   * ------------------------------------------------------------------------ */

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor:
      COLORS.border,
  },

  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  infoIcon: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    marginRight: 6,
  },

  infoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  infoLabel: {
    marginTop: 1,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  infoDivider: {
    width: 1,
    height: 28,
    backgroundColor:
      COLORS.border,
  },

  /* --------------------------------------------------------------------------
   * BUTTON
   * ------------------------------------------------------------------------ */

  startButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor:
      COLORS.primary,
  },

  premiumStartButton: {
    backgroundColor:
      COLORS.black,
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  startButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  startButtonArrow: {
    marginLeft: 9,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  /* --------------------------------------------------------------------------
   * EMPTY
   * ------------------------------------------------------------------------ */

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 55,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.primaryLight,
  },

  emptyIconText: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "900",
  },

  emptyTitle: {
    marginTop: 17,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  emptyMessage: {
    marginTop: 7,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor:
      COLORS.primary,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
});