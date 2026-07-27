import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getLearningModules } from "../services/securityService";
import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";

export default function LearningScreen() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await getLearningModules();
      if (res.success && res.data) {
        setModules(res.data);
      }
    } catch (err) {
      console.log("Error loading learning modules:", err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedModule) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedModule(null)}
        >
          <Text style={styles.backText}>← Back to Lessons</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{selectedModule.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaBadge}>{selectedModule.category}</Text>
          <Text style={styles.metaText}> • {selectedModule.level} • {selectedModule.readTime}</Text>
        </View>

        <View style={styles.articleCard}>
          <Text style={styles.articleBody}>{selectedModule.content}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Cybersecurity Academy 📚</Text>
      <Text style={styles.headerSubtitle}>Master web & network defense fundamentals</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        modules.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => setSelectedModule(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.level}>{item.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
            <Text style={styles.readTime}>⏱️ {item.readTime} read</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  category: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  level: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 6,
  },
  summary: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  readTime: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  backText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  metaBadge: {
    backgroundColor: Colors.primary,
    color: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  articleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
  },
  articleBody: {
    ...Typography.bodyMedium,
    color: Colors.text,
    lineHeight: 24,
  },
});
