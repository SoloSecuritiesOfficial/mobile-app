import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Image, Animated, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../../theme/colors";
import { useResponsive, useStyles } from "../../hooks";
import { BASE_URL } from "../../config/api";

import {
  fetchCurrentUser, getCurrentUser,
  logout, getSubscriptionStatus,
} from "../../services/authService";
import { pickProfileImage, uploadProfileImage } from "../../services/profileImageService";
import { getSecurityDashboard } from "../../services/securityService";
import AdBanner from "../../components/AdBanner";
import { showInterstitialAd } from "../../components/InterstitialAd";

// ─────────────────────────────────────────────────────────────────
// Subscription tier badge
// ─────────────────────────────────────────────────────────────────
type Tier = "free" | "trial" | "paid" | "admin";

const TIER: Record<Tier, { label: string; icon: string; bg: string; fg: string }> = {
  free:  { label: "Free Plan",        icon: "🆓", bg: "#E8F5E9", fg: "#2E7D32" },
  trial: { label: "Free Trial",       icon: "🔑", bg: "#E3F2FD", fg: "#1565C0" },
  paid:  { label: "Premium",          icon: "👑", bg: "#FFF8E1", fg: "#E65100" },
  admin: { label: "Administrator",    icon: "🛡️", bg: "#E8EAF6", fg: "#1A237E" },
};

// Safely resolve tier — any unexpected value falls back to "free"
function safeTier(raw: string | undefined | null): Tier {
  if (raw === "trial" || raw === "paid" || raw === "admin") return raw;
  return "free";
}

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER[tier] ?? TIER.free;
  const scale = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 160, useNativeDriver: true }).start();
  }, [tier]);
  return (
    <Animated.View style={[badge.pill, { backgroundColor: cfg.bg, transform: [{ scale }] }]}>
      <Text style={badge.icon}>{cfg.icon}</Text>
      <Text style={[badge.label, { color: cfg.fg }]}>{cfg.label}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helper — resolve avatar URL (prepend BASE_URL for relative paths)
// ─────────────────────────────────────────────────────────────────
function resolveAvatar(img?: string): string | null {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${BASE_URL}${img}`;
}

const styleFactory = (spacing: any, typography: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content:   { paddingTop: 24, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },

  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: spacing.radiusLarge,
    padding: spacing.cardPadding,
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarCircle: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, position: "relative",
    elevation: 4,
    shadowColor: Colors.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  avatarImage:     { width: 86, height: 86, borderRadius: 43 },
  cameraIconBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: Colors.surface, width: 26, height: 26,
    borderRadius: 13, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { color: "#FFF", fontSize: 32, fontWeight: "800" },
  username:   { ...typography.h2, color: Colors.text, marginBottom: 2 },
  email:      { ...typography.bodySmall, color: Colors.textSecondary, marginBottom: 6 },
  chipRow:    { flexDirection: "row", gap: 8, marginTop: 4 },
  levelChip:  { backgroundColor: Colors.primary + "22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  levelChipText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  rankBadge:  { backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  rankBadgeText: { color: Colors.text, fontWeight: "600", fontSize: 12 },
  bioText:    { ...typography.bodySmall, color: Colors.textMuted, marginTop: 10, textAlign: "center" },

  statsCard:     { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.cardPadding, marginBottom: spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { ...typography.labelLarge, color: Colors.text, marginBottom: 12 },
  statsRow:      { flexDirection: "row", justifyContent: "space-between" },
  statBox:       { flex: 1, alignItems: "center", backgroundColor: Colors.background, paddingVertical: 10, marginHorizontal: 3, borderRadius: spacing.radiusMedium },
  statVal:       { fontSize: 17, fontWeight: "800", color: Colors.primary },
  statLabel:     { fontSize: 10, color: Colors.textSecondary, marginTop: 3 },

  badgesCard:  { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.cardPadding, marginBottom: spacing.md, borderWidth: 1, borderColor: Colors.border },
  badgesGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip:   { backgroundColor: Colors.primary + "18", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + "33" },
  badgeChipText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  badgeDate:   { color: Colors.textMuted, fontSize: 10, marginTop: 2 },

  noBadgesCard: { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: 20, marginBottom: spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  noBadgesIcon: { fontSize: 40, marginBottom: 8 },
  noBadgesTitle:{ fontWeight: "700", color: Colors.text, fontSize: 15, marginBottom: 6 },
  noBadgesText: { color: Colors.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 12 },
  noBadgesBtn:  { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  noBadgesBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  actionsCard: { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.cardPadding, borderWidth: 1, borderColor: Colors.border },
  actionBtn:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionBtnText: { ...typography.bodyMedium, color: Colors.text, fontWeight: "600" },
  arrow:       { color: Colors.textMuted, fontSize: 20, fontWeight: "700" },

  // error state
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.screen },
  errorCard: { backgroundColor: Colors.surface, borderRadius: spacing.radiusLarge, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  errorIcon: { fontSize: spacing.iconXL, marginBottom: spacing.md },
  errorTitle: { ...typography.h3, color: Colors.text, marginBottom: spacing.sm, textAlign: "center" },
  errorMessage: { ...typography.bodyMedium, color: Colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  errorButton: { backgroundColor: Colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: spacing.radiusMedium },
  errorButtonText: { color: "#FFF", ...typography.button },
});

const badge = StyleSheet.create({
  pill:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8, gap: 5 },
  icon:  { fontSize: 13 },
  label: { fontSize: 11, fontWeight: "700" },
});

export default function ProfileScreen({ navigation }: any) {
  const styles = useStyles(styleFactory);

  const [profile,   setProfile]   = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [badges,    setBadges]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tier, setTier] = useState<Tier>("free");
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // ── Load ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setImageError(false); // Reset on reload

      // Each call is wrapped individually so one failure never
      // crashes the whole profile screen.
      const user = await fetchCurrentUser().catch(() => null)
                ?? await getCurrentUser().catch(() => null);

      const dashRes = await getSecurityDashboard().catch(() => null);

      const subStatus = await getSubscriptionStatus().catch(() => null);

      if (user) {
        setProfile(user);
        setBadges((user as any).badges || []);
      }

      if (dashRes) {
        setDashboard((dashRes as any).data || dashRes);
      }

      // Resolve subscription tier — always a valid Tier key
      if ((user as any)?.role === "admin") {
        setTier("admin");
      } else if (subStatus?.tier) {
        setTier(safeTier(subStatus.tier));
      } else {
        setTier((user as any)?.isPremium ? "paid" : "free");
      }

      // Animate header in
      Animated.spring(headerAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }).start();

    } catch (err) {
      // Last-resort catch — should not normally be reached
      console.log("Profile load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [headerAnim]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Avatar upload ───────────────────────────────────────────────
  const handlePickAndUploadImage = async () => {
    try {
      const asset = await pickProfileImage();
      if (!asset) return;
      setUploadingImage(true);
      const res = await uploadProfileImage(asset);
      if (res.success || res.profileImage) {
        const newImg = res.profileImage || res.user?.profileImage;
        // Update local state immediately so the image shows right away
        setProfile((p: any) => ({ ...p, profileImage: newImg }));
        setImageError(false); // Reset error state since new image uploaded
        // Persist to SecureStore so it survives app restarts
        if (res.user) {
          const { saveUser } = await import("../../utils/storage");
          await saveUser(res.user).catch(() => {});
        }
      }
    } catch (err: any) {
      console.log("Upload error:", err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          },
        },
      ],
    );
  };

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (error && !profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={loadData}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials  = (profile?.username || "U").substring(0, 2).toUpperCase();
  const avatarUrl = resolveAvatar(profile?.profileImage);
  const headerScale = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar & info card ── */}
        <Animated.View
          style={[
            styles.headerCard,
            { opacity: headerAnim, transform: [{ scale: headerScale }] },
          ]}
        >
          <TouchableOpacity
            onPress={handlePickAndUploadImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              {uploadingImage ? (
                <ActivityIndicator color="#FFF" size="large" />
              ) : avatarUrl && !imageError ? (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.cameraIconBadge}>
                <Text style={{ fontSize: 10 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{profile?.username || "Security Specialist"}</Text>
          <Text style={styles.email}>{profile?.email || ""}</Text>

          {/* Level + title + tier */}
          <View style={styles.chipRow}>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>⚔️ Level {profile?.level ?? 1}</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{profile?.title || "Security Novice"}</Text>
            </View>
          </View>

          {/* Subscription tier badge */}
          <TierBadge tier={tier} />

          {profile?.bio ? (
            <Text style={styles.bioText}>{profile.bio}</Text>
          ) : null}
        </Animated.View>

        {/* ── Security Metrics ── */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeader}>Security Metrics</Text>
          <View style={styles.statsRow}>
            {[
              { val: `${profile?.securityScore ?? dashboard?.securityScore ?? 85}%`, lbl: "Rating" },
              { val: profile?.level ?? 1,      lbl: "Level"   },
              { val: profile?.xp ?? 0,         lbl: "XP"      },
              { val: `${profile?.dailyStreak ?? 0}🔥`, lbl: "Streak" },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={styles.statBox}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLabel}>{lbl}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            {[
              { val: dashboard?.learningCompleted ?? 0, lbl: "Modules" },
              { val: dashboard?.labCompleted ?? 0,      lbl: "Labs"    },
              { val: profile?.points ?? 0,              lbl: "Points"  },
              { val: profile?.certificates?.length ?? 0, lbl: "Certs" },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={styles.statBox}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLabel}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Badges ── */}
        {badges.length > 0 ? (
          <View style={styles.badgesCard}>
            <Text style={styles.sectionHeader}>🏅 Earned Badges ({badges.length})</Text>
            <View style={styles.badgesGrid}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badgeChip}>
                  <Text style={styles.badgeChipText}>{b.name}</Text>
                  <Text style={styles.badgeDate}>
                    {b.earnedAt
                      ? new Date(b.earnedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noBadgesCard}>
            <Text style={styles.noBadgesIcon}>🔒</Text>
            <Text style={styles.noBadgesTitle}>No Badges Yet</Text>
            <Text style={styles.noBadgesText}>
              Earn badges by reaching levels 5, 10, 15, 20, 25, 30, 40 and 50.{"\n"}
              Complete quizzes and labs to gain XP!
            </Text>
            <TouchableOpacity style={styles.noBadgesBtn} onPress={() => navigation.navigate("Achievements")}>
              <Text style={styles.noBadgesBtnText}>View How to Earn →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Explore ── */}
        <AdBanner isPremium={tier === "paid" || tier === "admin"} marginVertical={12} />
        <View style={styles.actionsCard}>
          <Text style={styles.sectionHeader}>Explore</Text>
          {[
            { icon: "👥", label: "Friends",            screen: "Friends" },
            { icon: "👑", label: "Premium Membership", screen: "Premium" },
            { icon: "💰", label: "Ad Rewards",         screen: "AdRewards" },
            { icon: "🏅", label: "Achievements",       screen: "Achievements" },
            { icon: "🏆", label: "Leaderboard",        screen: "Leaderboard" },
            { icon: "🚩", label: "CTF Challenges",     screen: "CTF" },
            { icon: "📜", label: "My Certificates",    screen: "Certificates" },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.actionBtn}
              onPress={async () => {
                await showInterstitialAd(tier === "paid" || tier === "admin");
                navigation.navigate(screen);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBtnText}>{icon}  {label}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account ── */}
        <AdBanner isPremium={tier === "paid" || tier === "admin"} marginVertical={8} />
        <View style={[styles.actionsCard, { marginTop: 16 }]}>
          <Text style={styles.sectionHeader}>Account</Text>

          {/* Profile Settings → new screen */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("ProfileSettings")}
            activeOpacity={0.75}
          >
            <Text style={styles.actionBtnText}>✏️  Edit Profile</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {/* Account Settings → new screen (change pw + delete account) */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AccountSettings")}
            activeOpacity={0.75}
          >
            <Text style={styles.actionBtnText}>⚙️  Account Settings</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>🚪  Sign Out</Text>
            <Text style={[styles.arrow, { color: "#EF4444" }]}>›</Text>
          </TouchableOpacity>
        </View>

        <AdBanner isPremium={tier === "paid" || tier === "admin"} marginVertical={10} />
      </ScrollView>
    </SafeAreaView>
  );
}