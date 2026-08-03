import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import { getLearningModuleById } from "../services/securityService";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "LearningDetails"
>;

interface LearningModule {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  level: string;
  readTime: string;
  summary?: string;
  content: string;
}

export default function LearningDetailsScreen({
  navigation,
  route,
}: Props) {
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [module, setModule] =
    useState<LearningModule | null>(null);

  useEffect(() => {
    loadModule();
  }, []);

  const loadModule = async () => {
    try {
      setLoading(true);

      const res = await getLearningModuleById(id);

      if (res.success) {
        setModule(res.data);
      } else {
        setModule(res);
      }
    } catch (err) {
      console.log("Learning Details Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </SafeAreaView>
    );
  }

  if (!module) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Lesson not found
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {module.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {module.category}
            </Text>
          </View>

          <Text style={styles.meta}>
            {module.level} • {module.readTime}
          </Text>
        </View>

        {module.summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Summary
            </Text>

            <Text style={styles.summary}>
              {module.summary}
            </Text>
          </View>
        ) : null}

        <View style={styles.article}>
          <Text style={styles.articleTitle}>
            Lesson
          </Text>

          <Text style={styles.body}>
            {module.content}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: Spacing.screen,
    paddingBottom: 50,
  },

  back: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 20,
  },

  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 14,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },

  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
  },

  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },

  meta: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: 20,
  },

  summaryTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 8,
  },

  summary: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  article: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
  },

  articleTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 12,
  },

  body: {
    ...Typography.bodyMedium,
    color: Colors.text,
    lineHeight: 28,
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 20,
  },

  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});