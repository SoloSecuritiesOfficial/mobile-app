import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../../navigation/types";

import {
  getLearningModules,
  getLearningProgress,
} from "../../services/securityService";

import {
  getCurrentUser,
} from "../../services/authService";

import LearningProgressCard from "../../components/LearningProgressCard";
import AdBanner from "../../components/AdBanner";
import { showInterstitialAd } from "../../components/InterstitialAd";

import Colors from "../../theme/colors";
import { useResponsive, useStyles } from "../../hooks";


type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "Learning"
  >;


interface LearningModule {
  _id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  level: string;
  readTime: string;
  completed?: boolean;
  isPremiumOnly?: boolean;
}


interface LearningProgress {
  progress: number;
  completed: number;
  total: number;
}

const styleFactory = (spacing: any, typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  headerTitle: {
    ...typography.h1,
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: Colors.text,
    marginBottom: spacing.lg,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: spacing.radiusLarge,
    padding: spacing.cardPadding,
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.h3,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: spacing.radiusLarge,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  category: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  level: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cardTitle: {
    ...typography.h3,
    color: Colors.text,
    marginBottom: 8,
  },
  summary: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readTime: {
    ...typography.bodySmall,
    color: Colors.textMuted,
  },
  completedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  completedText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: spacing.radiusMedium,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabBtnText: {
    ...typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.screen },
  errorCard: { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  errorIcon: { fontSize: spacing.iconXL, marginBottom: spacing.md },
  errorTitle: { ...typography.h3, color: Colors.text, marginBottom: spacing.sm, textAlign: "center" },
  errorMessage: { ...typography.bodyMedium, color: Colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  errorButton: { backgroundColor: Colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: spacing.radiusMedium },
  errorButtonText: { color: "#FFF", ...typography.button },
});

export default function LearningScreen({
  navigation,
}: Props) {
  const styles = useStyles(styleFactory);

  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "remaining">("all");
  const [progress, setProgress] = useState<LearningProgress>({ progress: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLearningData = useCallback(async () => {
    try {
      setError(null);
      const [
        modulesResponse,
        progressResponse,
        user,
      ] = await Promise.all([
        getLearningModules(),
        getLearningProgress(),
        getCurrentUser(),
      ]);

      setIsPremium(!!(user as any)?.isPremium);

      const moduleData =
        modulesResponse.data ??
        modulesResponse.modules ??
        [];

      const progressData =
        progressResponse.data ??
        progressResponse;

      // Backend returns flat fields: completedLessons, totalLessons, progress, completedLessonIds
      // It also returns a nested .learning wrapper for dashboard compatibility — handle both
      const completedIds = Array.isArray(progressData.completedLessonIds)
        ? progressData.completedLessonIds
        : Array.isArray(progressData.completedLessons)
        ? progressData.completedLessons
        : [];

      const updatedModules =
        moduleData.map(
          (item: LearningModule) => ({
            ...item,
            completed: completedIds.includes(item._id),
          })
        );

      setModules(updatedModules);

      setProgress({
        progress:
          progressData.learning?.percentage ??
          progressData.progress ??
          0,

        completed:
          progressData.learning?.completed ??
          progressData.completedLessons ??
          progressData.completed ??
          0,

        total:
          progressData.learning?.total ??
          progressData.totalLessons ??
          progressData.total ??
          moduleData.length,
      });
    } catch (error) {
      console.log("Learning Error:", error);
      setError(error instanceof Error ? error.message : "Failed to load learning modules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLearningData();
      
      // ✅ AUTO-REFRESH: Poll for new learning modules every 10 seconds
      const pollInterval = setInterval(() => {
        loadLearningData();
      }, 10000);
      
      return () => clearInterval(pollInterval);
    }, [loadLearningData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLearningData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={loadLearningData}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.headerTitle}>
        Cybersecurity Academy 📚
      </Text>

      <Text style={styles.headerSubtitle}>
        Master security skills through
        structured learning modules.
      </Text>

      <LearningProgressCard
        completed={progress.completed}
        total={progress.total}
      />

      {/* Ad — shown to free users between progress and module list */}
      <AdBanner isPremium={isPremium} marginVertical={8} />

      <View style={styles.section}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
              All ({modules.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "completed" && styles.tabBtnActive]}
            onPress={() => setActiveTab("completed")}
          >
            <Text style={[styles.tabBtnText, activeTab === "completed" && styles.tabBtnTextActive]}>
              Completed ({modules.filter(m => m.completed).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "remaining" && styles.tabBtnActive]}
            onPress={() => setActiveTab("remaining")}
          >
            <Text style={[styles.tabBtnText, activeTab === "remaining" && styles.tabBtnTextActive]}>
              Remaining ({modules.filter(m => !m.completed).length})
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {activeTab === "all" ? "Available Modules" : activeTab === "completed" ? "Completed Modules" : "Remaining Modules"}
        </Text>

        {
          modules.filter(m => {
            if (activeTab === "completed") return m.completed;
            if (activeTab === "remaining") return !m.completed;
            return true;
          }).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {activeTab === "completed"
                  ? "No Completed Modules Yet"
                  : activeTab === "remaining"
                  ? "All Modules Completed! 🎉"
                  : "No Learning Modules Available"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "completed"
                  ? "Select a module and tap 'Mark as Completed' to track your progress."
                  : activeTab === "remaining"
                  ? "Great work! You have completed all available modules."
                  : "Learning modules are being added. Pull down to refresh."}
              </Text>
            </View>
          ) : (
            modules
              .filter(m => {
                if (activeTab === "completed") return m.completed;
                if (activeTab === "remaining") return !m.completed;
                return true;
              })
              .map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={async () => {
                    if ((item as any).isPremiumOnly) {
                      Alert.alert(
                        "👑 Premium Required",
                        `"${item.title}" is a Premium module. Upgrade to unlock it.`,
                        [{ text: "OK" }]
                      );
                      return;
                    }
                    await showInterstitialAd(isPremium);
                    navigation.navigate("LearningDetails", { id: item._id });
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.category}>
                      {item.category}
                    </Text>
                    <Text style={styles.level}>
                      {item.level}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.summary}>
                    {item.summary}
                  </Text>

                  <View style={styles.bottomRow}>
                    <Text style={styles.readTime}>
                      ⏱ {item.readTime}
                    </Text>

                    {(item as any).isPremiumOnly && (
                      <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ color: "#D97706", fontWeight: "700", fontSize: 11 }}>👑 Premium</Text>
                      </View>
                    )}

                    {
                      item.completed &&
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>
                          ✓ Completed
                        </Text>
                      </View>
                    }
                  </View>
                </TouchableOpacity>
              ))
          )
        }
      </View>

      {/* Bottom banner — shown after module list */}
      <AdBanner isPremium={isPremium} marginVertical={12} />
      <AdBanner isPremium={isPremium} marginVertical={8} />

    </ScrollView>
  );
}