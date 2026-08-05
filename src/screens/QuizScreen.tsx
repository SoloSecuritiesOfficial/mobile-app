import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
} from "react-native";

import {
  useNavigation,
} from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import Colors from "../theme/colors";
import Typography from "../theme/typography";
import Spacing from "../theme/spacing";

import {
  getQuizzes,
} from "../services/quizService";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

type Navigation =
  NativeStackNavigationProp<
    RootStackParamList
  >;

interface Quiz {
  _id: string;

  title: string;

  description: string;

  module: string;

  difficulty:
    | "Beginner"
    | "Intermediate"
    | "Advanced";

  totalQuestions: number;

  totalMarks: number;

  duration: number;
}

export default function QuizScreen() {

  const navigation =
    useNavigation<Navigation>();

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [quizzes, setQuizzes] =
    useState<Quiz[]>([]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {

    try {

      setLoading(true);

      const response =
        await getQuizzes();

      if (
        Array.isArray(response)
      ) {

        setQuizzes(response);

      } else if (
        response?.data
      ) {

        setQuizzes(response.data);

      } else {

        setQuizzes([]);

      }

    } catch (error) {

      console.log(
        "Quiz Error",
        error
      );

      setQuizzes([]);

    } finally {

      setLoading(false);

    }

  };

  const onRefresh =
    useCallback(async () => {

      setRefreshing(true);

      await loadQuizzes();

      setRefreshing(false);

    }, []);

  const filteredQuizzes =
    useMemo(() => {

      return quizzes.filter(
        (quiz) =>
          quiz.title
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          quiz.module
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [
      quizzes,
      search,
    ]);

  const difficultyColor = (
    difficulty: string
  ) => {

    switch (difficulty) {

      case "Beginner":
        return "#2ECC71";

      case "Intermediate":
        return "#F39C12";

      case "Advanced":
        return "#E74C3C";

      default:
        return Colors.primary;

    }

  };

  const totalQuestions =
    quizzes.reduce(
      (sum, quiz) =>
        sum +
        quiz.totalQuestions,
      0
    );

  const beginnerCount =
    quizzes.filter(
      (q) =>
        q.difficulty ===
        "Beginner"
    ).length;

  const advancedCount =
    quizzes.filter(
      (q) =>
        q.difficulty ===
        "Advanced"
    ).length;

  if (loading) {

    return (

      <SafeAreaView
        style={styles.loadingContainer}
      >

        <StatusBar
          barStyle="light-content"
          backgroundColor={
            Colors.primary
          }
        />

        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text
          style={styles.loadingText}
        >
          Loading Security Quizzes...
        </Text>

      </SafeAreaView>

    );

  }
    return (

    <SafeAreaView
      style={styles.container}
    >

      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
      />

      {/* Header */}

      <View style={styles.header}>

        <Text style={styles.headerTitle}>
          Security Quiz Center
        </Text>

        <Text style={styles.headerSubtitle}>
          Learn • Practice • Earn XP
        </Text>

      </View>

      {/* Statistics */}

      <View
        style={styles.statsContainer}
      >

        <View
          style={styles.statCard}
        >

          <Text
            style={styles.statNumber}
          >
            {quizzes.length}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Quizzes
          </Text>

        </View>

        <View
          style={styles.statCard}
        >

          <Text
            style={styles.statNumber}
          >
            {totalQuestions}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Questions
          </Text>

        </View>

        <View
          style={styles.statCard}
        >

          <Text
            style={styles.statNumber}
          >
            {beginnerCount}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Beginner
          </Text>

        </View>

        <View
          style={styles.statCard}
        >

          <Text
            style={styles.statNumber}
          >
            {advancedCount}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Advanced
          </Text>

        </View>

      </View>

      {/* Search */}

      <TextInput
        placeholder="Search quizzes..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* Quiz List */}

      <FlatList
        data={filteredQuizzes}
        keyExtractor={(item) => item._id}

        showsVerticalScrollIndicator={false}

        refreshControl={

          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[
              Colors.primary,
            ]}
            tintColor={
              Colors.primary
            }
          />

        }

        contentContainerStyle={{
          paddingBottom: 120,
        }}

        ListEmptyComponent={() => (

          <View
            style={styles.empty}
          >

            <Text
              style={styles.emptyEmoji}
            >
              📚
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No Quiz Found
            </Text>

            <Text
              style={styles.emptyText}
            >
              Try another keyword.
            </Text>

          </View>

        )}

        renderItem={({ item }) => (
                    <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
              navigation.navigate(
                "QuizQuestion",
                {
                  quizId: item._id,
                }
              )
            }
          >

            {/* Top Row */}

            <View style={styles.topRow}>

              <Text
                numberOfLines={2}
                style={styles.title}
              >
                {item.title}
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      difficultyColor(
                        item.difficulty
                      ),
                  },
                ]}
              >
                <Text
                  style={styles.badgeText}
                >
                  {item.difficulty}
                </Text>
              </View>

            </View>

            {/* Description */}

            <Text
              numberOfLines={2}
              style={styles.description}
            >
              {item.description}
            </Text>

            {/* Module */}

            <View style={styles.module}>
              <Text
                style={styles.moduleText}
              >
                {item.module}
              </Text>
            </View>

            {/* Information */}

            <View
              style={styles.infoRow}
            >

              <View
                style={styles.infoBox}
              >

                <Text
                  style={styles.infoValue}
                >
                  {item.totalQuestions}
                </Text>

                <Text
                  style={styles.infoLabel}
                >
                  Questions
                </Text>

              </View>

              <View
                style={styles.infoBox}
              >

                <Text
                  style={styles.infoValue}
                >
                  {item.duration}
                </Text>

                <Text
                  style={styles.infoLabel}
                >
                  Minutes
                </Text>

              </View>

              <View
                style={styles.infoBox}
              >

                <Text
                  style={styles.infoValue}
                >
                  {item.totalMarks}
                </Text>

                <Text
                  style={styles.infoLabel}
                >
                  Marks
                </Text>

              </View>

            </View>

            {/* Button */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={() =>
                navigation.navigate(
                  "QuizQuestion",
                  {
                    quizId: item._id,
                  }
                )
              }
            >

              <Text
                style={styles.buttonText}
              >
                Start Quiz →
              </Text>

            </TouchableOpacity>

          </TouchableOpacity>
        )}

      />

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 18,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
  },

  loadingText: {
    marginTop: 18,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
  },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 22,
    marginTop: 18,
    marginBottom: 20,

    shadowColor: "#C1121F",
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#F3F3F3",
    marginTop: 8,
    fontSize: 15,
    fontWeight: "500",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  statNumber: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "800",
  },

  statLabel: {
    marginTop: 4,
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },

  search: {
    backgroundColor: "#FFF",
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#111",

    borderWidth: 1,
    borderColor: "#ECECEC",

    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,

    borderWidth: 1,
    borderColor: "#F0F0F0",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
    paddingRight: 10,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },

  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 11,
  },

  description: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
    lineHeight: 22,
  },

  module: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#FFF2F3",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
  },

  moduleText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  infoBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 14,
  },

  infoValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },

  infoLabel: {
    marginTop: 4,
    color: "#777",
    fontSize: 11,
    fontWeight: "600",
  },

  button: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,

    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  empty: {
    marginTop: 90,
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 70,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
});