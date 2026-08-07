import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { getCertificates } from "../../services/certificateService";

type Props = NativeStackScreenProps<RootStackParamList, "Certificates">;

type Certificate = {
  _id: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy: string;
  issuedTo?: string;
  verified?: boolean;
  description?: string;
  skills?: string[];
  createdAt: string;
};

// ── Level-based earning guide ────────────────────────────────────
const LEVEL_CERTS = [
  { level: 5,  icon: "📜", title: "Cybersecurity Foundations",       how: "Reach Level 5 — complete quizzes and daily check-ins" },
  { level: 10, icon: "🛡️", title: "Web Security Fundamentals",       how: "Reach Level 10 — master OWASP Top 10 quizzes and web labs" },
  { level: 20, icon: "👨‍💻", title: "Ethical Hacker Certification",    how: "Reach Level 20 — complete advanced labs and penetration testing quizzes" },
  { level: 30, icon: "⚙️", title: "Advanced Security Engineering",   how: "Reach Level 30 — master network security and cryptography" },
  { level: 50, icon: "🏛️", title: "Security Architect — Master Cert", how: "Reach Level 50 — the highest SoloSecurities certification" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Web Security":      "#3B82F6",
  "Network Security":  "#8B5CF6",
  "Cloud Security":    "#06B6D4",
  "Bug Bounty":        "#EF4444",
  "CTF":               "#F59E0B",
  "Learning":          "#22C55E",
  "Other":             "#6B7280",
};

export default function CertificateScreen({ navigation }: Props) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showGuide, setShowGuide]     = useState(false);

  const loadCertificates = useCallback(async () => {
    try {
      const res = await getCertificates();
      setCertificates(res.data || res || []);
    } catch (err) {
      console.log("Certificates Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCertificates(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCertificates(); }} colors={[Colors.primary]} />
        }
      >
        {/* ── Header ── */}
        <Text style={styles.pageTitle}>📜 My Certificates</Text>
        <Text style={styles.pageSub}>Certificates are automatically awarded when you reach milestone levels</Text>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{certificates.length}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{LEVEL_CERTS.length - certificates.length > 0 ? LEVEL_CERTS.length - certificates.length : 0}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{certificates.filter(c => c.verified).length}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
        </View>

        {/* ── How to earn toggle ── */}
        <TouchableOpacity style={styles.guideToggle} onPress={() => setShowGuide(s => !s)}>
          <Text style={styles.guideToggleText}>
            {showGuide ? "▲ Hide" : "▼ Show"} How to Earn Certificates
          </Text>
        </TouchableOpacity>

        {showGuide && (
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>🏆 Level-Based Certificate Roadmap</Text>
            <Text style={styles.guideSubtitle}>
              Earn XP by completing quizzes, labs, and daily check-ins.{"\n"}
              Every 1,000 XP = 1 Level.
            </Text>
            {LEVEL_CERTS.map(lc => {
              const earned = certificates.some(c =>
                c.title.toLowerCase().includes(lc.title.toLowerCase().split(" ")[0])
              );
              return (
                <View key={lc.level} style={[styles.guideRow, earned && styles.guideRowEarned]}>
                  <View style={styles.guideLevelBadge}>
                    <Text style={styles.guideLevelText}>Lv.{lc.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>{lc.icon} {lc.title}</Text>
                    <Text style={styles.guideItemHow}>{lc.how}</Text>
                  </View>
                  {earned && <Text style={styles.guideEarnedBadge}>✓</Text>}
                </View>
              );
            })}

            <View style={styles.guideDivider} />
            <Text style={styles.guideExtraTitle}>Also earn certificates by:</Text>
            {[
              "✅ Passing any quiz with 60%+ score",
              "🎯 Completing labs (auto-issued)",
              "🏅 Winning CTF challenges",
            ].map(item => (
              <Text key={item} style={styles.guideExtraItem}>{item}</Text>
            ))}
          </View>
        )}

        {/* ── Certificate list ── */}
        {certificates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyTitle}>No Certificates Yet</Text>
            <Text style={styles.emptyText}>
              Complete quizzes, finish labs, or reach Level 5 to earn your first certificate!
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowGuide(true)}>
              <Text style={styles.emptyBtnText}>See How to Earn →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          certificates.map(item => {
            const catColor = CATEGORY_COLORS[item.category] || "#6B7280";
            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.card, { borderLeftColor: catColor }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("CertificateDetails", { id: item._id })}
              >
                {/* ── Top row: title + verified badge ── */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  {item.verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>

                {/* ── Category chip ── */}
                <View style={[styles.categoryChip, { backgroundColor: catColor + "22" }]}>
                  <Text style={[styles.categoryChipText, { color: catColor }]}>{item.category}</Text>
                </View>

                {/* ── Details ── */}
                {item.issuedTo ? (
                  <Text style={styles.detailText}>👤 Issued To: <Text style={styles.detailBold}>{item.issuedTo}</Text></Text>
                ) : null}
                <Text style={styles.detailText}>🏛️ Issued By: <Text style={styles.detailBold}>{item.issuedBy || "SoloSecurities"}</Text></Text>
                <Text style={styles.detailText}>🆔 ID: <Text style={styles.certId}>{item.certificateId}</Text></Text>
                <Text style={styles.detailText}>📅 Date: <Text style={styles.detailBold}>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Text></Text>

                {/* ── Skills ── */}
                {item.skills && item.skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {item.skills.map(s => (
                      <View key={s} style={styles.skillChip}>
                        <Text style={styles.skillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.tapHint}>Tap to view full certificate →</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content:   { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: 80 },

  pageTitle: { ...Typography.h1, color: Colors.text },
  pageSub:   { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg, lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statNum:  { fontWeight: "800", color: Colors.primary, fontSize: 22 },
  statLabel:{ color: Colors.textSecondary, fontSize: 11, marginTop: 3 },

  guideToggle: {
    backgroundColor: Colors.primary + "18",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    alignItems: "center",
  },
  guideToggleText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },

  guideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideTitle:    { fontWeight: "800", color: Colors.text, fontSize: 16, marginBottom: 6 },
  guideSubtitle: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  guideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  guideRowEarned: { opacity: 1 },
  guideLevelBadge:  { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: "center" },
  guideLevelText:   { color: "#FFF", fontWeight: "800", fontSize: 11 },
  guideItemTitle:   { fontWeight: "700", color: Colors.text, fontSize: 13, marginBottom: 2 },
  guideItemHow:     { color: Colors.textSecondary, fontSize: 11, lineHeight: 16 },
  guideEarnedBadge: { backgroundColor: "#22C55E", color: "#FFF", fontWeight: "700", fontSize: 14, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: "hidden" },
  guideDivider:     { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  guideExtraTitle:  { fontWeight: "700", color: Colors.text, fontSize: 13, marginBottom: 8 },
  guideExtraItem:   { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, lineHeight: 20 },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 32, alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle:{ fontWeight: "700", color: Colors.text, fontSize: 18, marginBottom: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  emptyBtn:  { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  cardTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  cardTitle:   { flex: 1, fontWeight: "700", color: Colors.text, fontSize: 16, lineHeight: 22 },
  verifiedBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verifiedText:  { color: "#16A34A", fontWeight: "700", fontSize: 11 },
  pendingBadge:  { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingText:   { color: "#D97706", fontWeight: "700", fontSize: 11 },
  categoryChip:  { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  categoryChipText: { fontWeight: "700", fontSize: 12 },
  detailText:    { color: Colors.textSecondary, fontSize: 12, marginBottom: 4, lineHeight: 18 },
  detailBold:    { color: Colors.text, fontWeight: "600" },
  certId:        { color: Colors.primary, fontWeight: "600", fontFamily: "monospace" },
  skillsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  skillChip:     { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  skillText:     { color: Colors.textSecondary, fontSize: 11, fontWeight: "600" },
  tapHint:       { color: Colors.primary, fontSize: 11, fontWeight: "600", textAlign: "right", marginTop: 10 },
});
