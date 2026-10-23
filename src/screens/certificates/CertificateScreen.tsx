import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { getCertificates } from "../../services/certificateService";
import { getCurrentUser } from "../../services/authService";
import AdBanner from "../../components/AdBanner";

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
  createdAt?: string;
  issueDate?: string;
  status?: "active" | "revoked" | string;
};

const LEVEL_CERTS = [
  { level: 5, icon: "📜", title: "Cybersecurity Foundations", how: "Complete quizzes and daily check-ins." },
  { level: 10, icon: "🛡️", title: "Web Security Fundamentals", how: "Build your skills through web security quizzes and labs." },
  { level: 20, icon: "🧑‍💻", title: "Ethical Hacker Certification", how: "Complete advanced labs and penetration-testing quizzes." },
  { level: 30, icon: "⚙️", title: "Advanced Security Engineering", how: "Master network security and cryptography." },
  { level: 50, icon: "🏆", title: "Security Architect — Master Certificate", how: "Reach the highest milestone in the SoloSecurities roadmap." },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Web Security": "#3478F6",
  "Network Security": "#8758E8",
  "Cloud Security": "#0891B2",
  "Bug Bounty": "#E5484D",
  CTF: "#D97706",
  Learning: "#169B62",
  Other: "#64748B",
};

const BRAND = "#D92D3A";
const INK = "#172033";
const MUTED = "#667085";
const BORDER = "#E7EAF0";
const SURFACE = "#FFFFFF";
const CANVAS = "#F5F7FB";

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeCertificates(response: any): Certificate[] {
  const candidates = [
    response?.data?.data,
    response?.data,
    response?.certificates,
    response,
  ];
  const result = candidates.find(Array.isArray);
  return result || [];
}

export default function CertificateScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCertificates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const [certificateResponse, userResponse] = await Promise.all([
        getCertificates(),
        getCurrentUser(),
      ]);

      const user = (userResponse as any)?.data?.data
        ?? (userResponse as any)?.data
        ?? userResponse;

      setIsPremium(Boolean((user as any)?.isPremium));
      setCertificates(normalizeCertificates(certificateResponse));
    } catch (err: any) {
      setError(
        err?.response?.data?.message
        || err?.message
        || "We couldn't load your certificates. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const verifiedCount = useMemo(
    () => certificates.filter((certificate) => certificate.verified && certificate.status !== "revoked").length,
    [certificates]
  );

  const earnedMilestones = useMemo(
    () => LEVEL_CERTS.filter((milestone) =>
      certificates.some((certificate) =>
        certificate.title?.toLowerCase().includes(milestone.title.toLowerCase().split(" ")[0])
      )
    ).length,
    [certificates]
  );

  const openCertificate = (id: string) => {
    navigation.navigate("CertificateDetails", { id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "left", "right"]}>
        <View style={styles.loadingMark}>
          <Image source={require("../../../assets/images/logo.png")} style={styles.loadingLogo} resizeMode="contain" />
        </View>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.loadingTitle}>Loading your achievements</Text>
        <Text style={styles.loadingSubtitle}>Preparing your security credentials…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "left", "right"]}>
        <View style={styles.errorIcon}><Text style={styles.errorEmoji}>!</Text></View>
        <Text style={styles.errorTitle}>Certificates couldn't load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => void loadCertificates()} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadCertificates(true)}
            tintColor={BRAND}
            colors={[BRAND]}
          />
        }
      >
        <AdBanner isPremium={isPremium} marginVertical={6} />

        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoFrame}>
              <Image source={require("../../../assets/images/logo.png")} style={styles.brandLogo} resizeMode="contain" />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>SoloSecurities</Text>
              <Text style={styles.brandEyebrow}>ACHIEVEMENT CENTER</Text>
            </View>
          </View>
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>SECURE • LEARN • GROW</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroDecorOne} />
          <View style={styles.heroDecorTwo} />
          <View style={styles.heroCopy}>
            <View style={styles.heroEyebrow}>
              <Text style={styles.heroEyebrowText}>YOUR PROGRESS, RECOGNIZED</Text>
            </View>
            <Text style={styles.heroTitle}>Your security journey.{ "\n" }Your achievements.</Text>
            <Text style={styles.heroSubtitle}>
              A collection of the skills, milestones and security work you've earned with SoloSecurities.
            </Text>
            <View style={styles.heroBottomRow}>
              <View style={styles.heroCount}>
                <Text style={styles.heroCountNumber}>{certificates.length}</Text>
                <Text style={styles.heroCountLabel}>CERTIFICATES EARNED</Text>
              </View>
              <View style={styles.heroSeal}>
                <Text style={styles.heroSealStar}>✦</Text>
                <Text style={styles.heroSealText}>VERIFIED{"\n"}SKILLS</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FDECEF" }]}><Text>🏅</Text></View>
            <Text style={styles.statNum}>{certificates.length}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F7EF" }]}><Text>✓</Text></View>
            <Text style={styles.statNum}>{verifiedCount}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#EEF2FF" }]}><Text>🎯</Text></View>
            <Text style={styles.statNum}>{Math.max(LEVEL_CERTS.length - earnedMilestones, 0)}</Text>
            <Text style={styles.statLabel}>Milestones left</Text>
          </View>
        </View>

        <AdBanner isPremium={isPremium} marginVertical={8} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR RECORD</Text>
            <Text style={styles.sectionTitle}>My certificates</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{certificates.length} total</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.guideToggle}
          onPress={() => setShowGuide((value) => !value)}
          activeOpacity={0.82}
        >
          <View style={styles.guideToggleIcon}><Text style={styles.guideToggleEmoji}>🧭</Text></View>
          <View style={styles.guideToggleCopy}>
            <Text style={styles.guideToggleTitle}>Certificate roadmap</Text>
            <Text style={styles.guideToggleSubtitle}>See how to unlock the next milestone</Text>
          </View>
          <Text style={styles.guideChevron}>{showGuide ? "−" : "+"}</Text>
        </TouchableOpacity>

        {showGuide && (
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Build your credentials</Text>
            <Text style={styles.guideSubtitle}>
              Earn experience by completing learning activities, quizzes and labs. Milestone requirements may depend on the features enabled for your account.
            </Text>
            {LEVEL_CERTS.map((milestone) => {
              const earned = certificates.some((certificate) =>
                certificate.title?.toLowerCase().includes(milestone.title.toLowerCase().split(" ")[0])
              );
              return (
                <View key={milestone.level} style={styles.guideRow}>
                  <View style={[styles.guideLevelBadge, earned && styles.guideLevelBadgeEarned]}>
                    <Text style={[styles.guideLevelText, earned && styles.guideLevelTextEarned]}>
                      {earned ? "✓" : `LV ${milestone.level}`}
                    </Text>
                  </View>
                  <View style={styles.guideItemCopy}>
                    <Text style={styles.guideItemTitle}>{milestone.icon} {milestone.title}</Text>
                    <Text style={styles.guideItemHow}>{milestone.how}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.guideNote}>
              <Text style={styles.guideNoteText}>Other possible achievements include quiz completion, lab completion and CTF participation when those features issue certificates.</Text>
            </View>
          </View>
        )}

        {certificates.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIllustration}>
              <Image source={require("../../../assets/images/logo.png")} style={styles.emptyLogo} resizeMode="contain" />
              <Text style={styles.emptyCap}>✦</Text>
            </View>
            <Text style={styles.emptyEyebrow}>YOUR FIRST MILESTONE STARTS HERE</Text>
            <Text style={styles.emptyTitle}>Your story is just beginning</Text>
            <Text style={styles.emptyText}>
              Complete available learning activities, quizzes or labs to build your security portfolio. Your earned certificates will appear here.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowGuide(true)} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Explore the roadmap</Text>
              <Text style={styles.emptyBtnArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          certificates.map((item) => {
            const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
            const isRevoked = item.status === "revoked";
            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.certificateCard, isRevoked && styles.revokedCard]}
                activeOpacity={0.88}
                onPress={() => openCertificate(item._id)}
              >
                <View style={[styles.certificateAccent, { backgroundColor: categoryColor }]} />
                <View style={styles.certificateCardContent}>
                  <View style={styles.certificateBrandRow}>
                    <View style={styles.miniLogoFrame}>
                      <Image source={require("../../../assets/images/logo.png")} style={styles.miniLogo} resizeMode="contain" />
                    </View>
                    <View style={styles.certificateBrandCopy}>
                      <Text style={styles.certificateBrandName}>SOLOSECURITIES</Text>
                      <Text style={styles.certificateBrandSub}>CERTIFICATE OF ACHIEVEMENT</Text>
                    </View>
                    <View style={[styles.statusBadge, isRevoked ? styles.revokedBadge : item.verified ? styles.verifiedBadge : styles.pendingBadge]}>
                      <Text style={[styles.statusBadgeText, isRevoked ? styles.revokedText : item.verified ? styles.verifiedText : styles.pendingText]}>
                        {isRevoked ? "Revoked" : item.verified ? "Verified" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />
                  <Text style={styles.cardOverline}>THIS CERTIFICATE IS AWARDED TO</Text>
                  <Text style={styles.cardRecipient} numberOfLines={2}>{item.issuedTo || "Certificate holder"}</Text>
                  <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
                  {!!item.description && <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>}

                  <View style={styles.cardMetaRow}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                    <Text style={styles.categoryText}>{item.category || "Other"}</Text>
                    <View style={styles.metaBullet} />
                    <Text style={styles.dateText}>{formatDate(item.issueDate || item.createdAt)}</Text>
                  </View>

                  {!!item.skills?.length && (
                    <View style={styles.skillsRow}>
                      {item.skills.slice(0, 4).map((skill, index) => (
                        <View key={`${skill}-${index}`} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {item.skills.length > 4 && (
                        <View style={styles.skillChip}><Text style={styles.skillText}>+{item.skills.length - 4}</Text></View>
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.idBlock}>
                      <Text style={styles.idLabel}>CERTIFICATE ID</Text>
                      <Text style={styles.certId} numberOfLines={1}>{item.certificateId || "ID unavailable"}</Text>
                    </View>
                    <View style={styles.viewCertificateButton}>
                      <Text style={styles.viewCertificateText}>View certificate ↗</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteMark}>✦</Text>
          <Text style={styles.bottomNoteText}>Keep learning. Keep building. Let your work speak for itself.</Text>
        </View>

        <AdBanner isPremium={isPremium} marginVertical={8} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  content: { paddingHorizontal: Spacing.screen, paddingTop: 12, paddingBottom: 44 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: CANVAS, padding: 28 },
  loadingMark: { width: 76, height: 76, borderRadius: 24, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  loadingLogo: { width: 48, height: 48 },
  loadingTitle: { color: INK, fontWeight: "800", fontSize: 17, marginTop: 16 },
  loadingSubtitle: { color: MUTED, fontSize: 13, marginTop: 6 },
  errorIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#FDECEC", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  errorEmoji: { fontSize: 30, fontWeight: "900", color: BRAND },
  errorTitle: { color: INK, fontSize: 20, fontWeight: "800", textAlign: "center" },
  errorText: { color: MUTED, fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 8, marginBottom: 22 },
  primaryButton: { backgroundColor: BRAND, borderRadius: 14, paddingHorizontal: 26, paddingVertical: 13 },
  primaryButtonText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  topBar: { marginTop: 10, marginBottom: 18 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoFrame: { width: 46, height: 46, borderRadius: 15, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", marginRight: 11 },
  brandLogo: { width: 32, height: 32 },
  brandTextWrap: { flex: 1 },
  brandName: { color: INK, fontSize: 17, fontWeight: "900", letterSpacing: -0.3 },
  brandEyebrow: { color: BRAND, fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginTop: 3 },
  topBadge: { alignSelf: "flex-start", marginTop: 13, backgroundColor: "#FDECEF", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  topBadgeText: { color: BRAND, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  hero: { minHeight: 255, backgroundColor: "#171F35", borderRadius: 26, padding: 22, overflow: "hidden", marginBottom: 16 },
  heroDecorOne: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#273554", right: -88, top: -75, opacity: 0.85 },
  heroDecorTwo: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: "#485878", right: -26, bottom: -78 },
  heroCopy: { zIndex: 1 },
  heroEyebrow: { alignSelf: "flex-start", backgroundColor: "#FFFFFF16", borderColor: "#FFFFFF2A", borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  heroEyebrowText: { color: "#F5B9BF", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  heroTitle: { color: "#FFFFFF", fontSize: 26, lineHeight: 32, fontWeight: "900", letterSpacing: -0.6, marginTop: 17 },
  heroSubtitle: { color: "#D0D7E5", fontSize: 12, lineHeight: 19, marginTop: 9, maxWidth: 290 },
  heroBottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22 },
  heroCount: { borderLeftWidth: 3, borderLeftColor: "#F05A67", paddingLeft: 12 },
  heroCountNumber: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", lineHeight: 32 },
  heroCountLabel: { color: "#BFC9DB", fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 4 },
  heroSeal: { width: 65, height: 65, borderRadius: 33, borderWidth: 1, borderColor: "#F5B9BF", backgroundColor: "#FFFFFF10", alignItems: "center", justifyContent: "center", transform: [{ rotate: "8deg" }] },
  heroSealStar: { color: "#F5B9BF", fontSize: 20, lineHeight: 22 },
  heroSealText: { color: "#FFFFFF", fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.7, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, minWidth: 0, backgroundColor: SURFACE, borderRadius: 17, borderWidth: 1, borderColor: BORDER, paddingVertical: 13, paddingHorizontal: 8, alignItems: "center" },
  statIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  statNum: { color: INK, fontWeight: "900", fontSize: 21 },
  statLabel: { color: MUTED, fontSize: 10, fontWeight: "700", marginTop: 3, textAlign: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8, marginBottom: 12 },
  sectionEyebrow: { color: BRAND, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginBottom: 4 },
  sectionTitle: { ...Typography.h1, color: INK, fontSize: 22, fontWeight: "900" },
  countPill: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 100, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 2 },
  countPillText: { color: MUTED, fontSize: 11, fontWeight: "800" },
  guideToggle: { flexDirection: "row", alignItems: "center", backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 13, marginBottom: 12 },
  guideToggleIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FDECEF", alignItems: "center", justifyContent: "center", marginRight: 11 },
  guideToggleEmoji: { fontSize: 19 },
  guideToggleCopy: { flex: 1 },
  guideToggleTitle: { color: INK, fontSize: 13, fontWeight: "800" },
  guideToggleSubtitle: { color: MUTED, fontSize: 11, marginTop: 3 },
  guideChevron: { color: BRAND, fontSize: 25, fontWeight: "500", paddingHorizontal: 4 },
  guideCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 20, padding: 16, marginBottom: 16 },
  guideTitle: { color: INK, fontWeight: "900", fontSize: 16 },
  guideSubtitle: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  guideRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EEF0F4", gap: 11 },
  guideLevelBadge: { minWidth: 47, paddingHorizontal: 7, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F2F4F7", alignItems: "center" },
  guideLevelBadgeEarned: { backgroundColor: "#E7F7EE" },
  guideLevelText: { color: MUTED, fontSize: 10, fontWeight: "900" },
  guideLevelTextEarned: { color: "#13834D", fontSize: 14 },
  guideItemCopy: { flex: 1 },
  guideItemTitle: { color: INK, fontSize: 12, fontWeight: "800", lineHeight: 17 },
  guideItemHow: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 3 },
  guideNote: { backgroundColor: "#F7F8FA", borderRadius: 12, padding: 11, marginTop: 7 },
  guideNoteText: { color: MUTED, fontSize: 11, lineHeight: 17 },
  emptyCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 24, padding: 23, alignItems: "center", marginTop: 5, marginBottom: 16 },
  emptyIllustration: { width: 104, height: 104, borderRadius: 30, backgroundColor: "#FDECEF", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyLogo: { width: 69, height: 69 },
  emptyCap: { position: "absolute", right: 12, top: 8, color: BRAND, fontSize: 21 },
  emptyEyebrow: { color: BRAND, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 20, lineHeight: 26, fontWeight: "900", textAlign: "center", marginTop: 8 },
  emptyText: { color: MUTED, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 9, marginBottom: 18 },
  emptyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: BRAND, borderRadius: 13, paddingHorizontal: 17, paddingVertical: 12, width: "100%" },
  emptyBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  emptyBtnArrow: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginLeft: 8 },
  certificateCard: { flexDirection: "row", backgroundColor: SURFACE, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  revokedCard: { opacity: 0.78 },
  certificateAccent: { width: 5 },
  certificateCardContent: { flex: 1, padding: 15 },
  certificateBrandRow: { flexDirection: "row", alignItems: "center" },
  miniLogoFrame: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#F8F9FC", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", marginRight: 9 },
  miniLogo: { width: 26, height: 26 },
  certificateBrandCopy: { flex: 1 },
  certificateBrandName: { color: INK, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  certificateBrandSub: { color: MUTED, fontSize: 7, fontWeight: "800", letterSpacing: 0.7, marginTop: 3 },
  statusBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 6 },
  verifiedBadge: { backgroundColor: "#E8F7EF" },
  verifiedText: { color: "#13834D" },
  pendingBadge: { backgroundColor: "#FFF4D8" },
  pendingText: { color: "#9A6700" },
  revokedBadge: { backgroundColor: "#FDECEC" },
  revokedText: { color: "#C2303A" },
  statusBadgeText: { fontSize: 9, fontWeight: "900" },
  cardDivider: { height: 1, backgroundColor: BORDER, marginVertical: 13 },
  cardOverline: { color: MUTED, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  cardRecipient: { color: BRAND, fontSize: 18, lineHeight: 24, fontWeight: "900", marginTop: 5 },
  cardTitle: { color: INK, fontSize: 15, lineHeight: 21, fontWeight: "800", marginTop: 5 },
  cardDescription: { color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 6 },
  cardMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 12 },
  categoryDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  categoryText: { color: INK, fontSize: 10, fontWeight: "800" },
  metaBullet: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#98A2B3", marginHorizontal: 8 },
  dateText: { color: MUTED, fontSize: 10, fontWeight: "600" },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  skillChip: { backgroundColor: "#F5F7FA", borderWidth: 1, borderColor: "#E9EDF3", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  skillText: { color: "#475467", fontSize: 9, fontWeight: "700" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderTopWidth: 1, borderTopColor: BORDER, marginTop: 13, paddingTop: 12 },
  idBlock: { flex: 1, minWidth: 0 },
  idLabel: { color: MUTED, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  certId: { color: BRAND, fontSize: 10, fontWeight: "800", fontFamily: "monospace", marginTop: 4 },
  viewCertificateButton: { backgroundColor: "#FDECEF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  viewCertificateText: { color: BRAND, fontSize: 10, fontWeight: "900" },
  bottomNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 15, paddingVertical: 18, gap: 8 },
  bottomNoteMark: { color: BRAND, fontSize: 17 },
  bottomNoteText: { color: MUTED, fontSize: 11, lineHeight: 17, textAlign: "center", flexShrink: 1 },
});
