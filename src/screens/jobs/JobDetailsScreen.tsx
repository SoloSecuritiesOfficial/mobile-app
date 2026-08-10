import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { getJobById, trackApply } from "../../services/jobsService";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "JobDetails">;

const expColor = (l: string) =>
  ({ entry: "#2E7D32", mid: "#1565C0", senior: "#6A1B9A", lead: "#E65100" }[l] ?? "#888");
const typeColor = (t: string) =>
  ({ "full-time": "#2E7D32", "part-time": "#F9A825", contract: "#1565C0", internship: "#00695C" }[t] ?? "#888");
const locIcon = (l: string) =>
  ({ remote: "🌍", onsite: "🏢", hybrid: "⚡" }[l] ?? "📍");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return <Text style={s.emptyText}>Not specified</Text>;
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function JobDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [job,     setJob]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying,setApplying]= useState(false);

  useEffect(() => {
    getJobById(id)
      .then(res => setJob(res?.data ?? null))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!job?.applyUrl) return;
    setApplying(true);
    await trackApply(id);
    try {
      const canOpen = await Linking.canOpenURL(job.applyUrl);
      if (canOpen) {
        await Linking.openURL(job.applyUrl);
      } else {
        Alert.alert("Cannot open link", "Please visit the company website directly.");
      }
    } catch {
      Alert.alert("Error", "Could not open the application link.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
        <Text style={[Typography.h3, { color: Colors.text }]}>Job not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.primary, fontWeight: "700" }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sal = job.salary;
  const hasSal = sal?.min > 0 || sal?.max > 0;
  const salText = hasSal
    ? `${sal.currency ?? "USD"} ${(sal.min / 1000).toFixed(0)}k${sal.max > sal.min ? `–${(sal.max / 1000).toFixed(0)}k` : "+"} / year`
    : "Salary not listed";

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(job.expiresAt).getTime() - Date.now()) / 86400000
  ));

  return (
    <SafeAreaView style={s.container}>
      {/* Back */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{job.title}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={s.heroCard}>
          <View style={s.heroInitial}>
            <Text style={s.heroInitialText}>{job.company?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <Text style={s.heroTitle}>{job.title}</Text>
          <Text style={s.heroCompany}>{job.company}</Text>
          <Text style={s.heroLocation}>
            {locIcon(job.locationType)} {job.location}
          </Text>

          {/* Chips */}
          <View style={s.chips}>
            <View style={[s.chip, { backgroundColor: expColor(job.experienceLevel) + "18", borderColor: expColor(job.experienceLevel) + "44" }]}>
              <Text style={[s.chipText, { color: expColor(job.experienceLevel) }]}>{job.experienceLevel}</Text>
            </View>
            <View style={[s.chip, { backgroundColor: typeColor(job.jobType) + "18", borderColor: typeColor(job.jobType) + "44" }]}>
              <Text style={[s.chipText, { color: typeColor(job.jobType) }]}>{job.jobType}</Text>
            </View>
          </View>

          {/* Meta */}
          <View style={s.metaRow}>
            <Text style={s.salary}>💰 {salText}</Text>
            <Text style={s.meta}>{job.views ?? 0} views · {daysLeft}d left</Text>
          </View>
        </View>

        {/* About */}
        <Section title="📋 About the Role">
          <Text style={s.body}>{job.description}</Text>
        </Section>

        {/* Requirements */}
        {job.requirements?.length > 0 && (
          <Section title="✅ Requirements">
            <BulletList items={job.requirements} />
          </Section>
        )}

        {/* Responsibilities */}
        {job.responsibilities?.length > 0 && (
          <Section title="🎯 Responsibilities">
            <BulletList items={job.responsibilities} />
          </Section>
        )}

        {/* Required skills */}
        {job.requiredSkills?.length > 0 && (
          <Section title="🔑 Required Skills">
            <View style={s.skillChips}>
              {job.requiredSkills.map((skill: string, i: number) => (
                <View key={i} style={s.skillChip}>
                  <Text style={s.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Preferred skills */}
        {job.preferredSkills?.length > 0 && (
          <Section title="⭐ Nice to Have">
            <View style={s.skillChips}>
              {job.preferredSkills.map((skill: string, i: number) => (
                <View key={i} style={[s.skillChip, { backgroundColor: "#F0F0F0", borderColor: "#E0E0E0" }]}>
                  <Text style={[s.skillChipText, { color: "#666" }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply button — fixed at bottom */}
      <View style={s.applyBar}>
        <TouchableOpacity
          style={[s.applyBtn, applying && { opacity: 0.7 }]}
          onPress={handleApply}
          disabled={applying}
          activeOpacity={0.85}
        >
          {applying
            ? <ActivityIndicator color="#FFF" />
            : <Text style={s.applyBtnText}>Apply Now →</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.screen, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:    { marginRight: 12 },
  backArrow:  { fontSize: 22, color: Colors.primary, fontWeight: "700" },
  headerTitle:{ flex: 1, fontSize: 16, fontWeight: "800", color: Colors.text },

  scroll: { paddingHorizontal: Spacing.screen, paddingBottom: 20 },

  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 20,
    marginVertical: 16, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  heroInitial: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: Colors.primary + "22",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: Colors.primary + "44",
    marginBottom: 14,
  },
  heroInitialText: { fontSize: 32, fontWeight: "800", color: Colors.primary },
  heroTitle:   { fontSize: 22, fontWeight: "800", color: Colors.text, textAlign: "center", marginBottom: 4 },
  heroCompany: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary, marginBottom: 4 },
  heroLocation:{ fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },

  chips:   { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  chipText:{ fontSize: 12, fontWeight: "600" },

  metaRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  salary:  { fontSize: 13, fontWeight: "700", color: "#2E7D32" },
  meta:    { fontSize: 12, color: Colors.textMuted },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.text, marginBottom: 10 },
  body:         { fontSize: 14, color: Colors.text, lineHeight: 22 },
  emptyText:    { fontSize: 13, color: Colors.textMuted, fontStyle: "italic" },

  bullet:    { flexDirection: "row", gap: 8 },
  bulletDot: { color: Colors.primary, fontWeight: "700", fontSize: 16, lineHeight: 22 },
  bulletText:{ flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },

  skillChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.primary + "18", borderWidth: 1, borderColor: Colors.primary + "44" },
  skillChipText: { fontSize: 12, fontWeight: "600", color: Colors.primary },

  applyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    padding: Spacing.screen,
    paddingBottom: 30,
    borderTopWidth: 1, borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
  },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    elevation: 3,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  applyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
