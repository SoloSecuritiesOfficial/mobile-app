/**
 * ProfileSettingsScreen
 * ─────────────────────
 * • Edit username, first name, last name, bio, country, GitHub, LinkedIn, website
 * • Upload profile photo
 * • Shows subscription tier badge (Free / Trial / Paid / Admin)
 * • All actions use animated bottom-sheet alerts (no native Alert)
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Image, Animated,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { BASE_URL } from "../../config/api";

import {
  fetchCurrentUser, getCurrentUser,
  updateProfile, getSubscriptionStatus,
} from "../../services/authService";
import { pickProfileImage, uploadProfileImage } from "../../services/profileImageService";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type Tier = "free" | "trial" | "paid" | "admin";

interface TierConfig {
  label: string;
  icon: string;
  bg: string;
  fg: string;
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  free:  { label: "Free Plan",         icon: "🆓", bg: "#E8F5E9", fg: "#2E7D32" },
  trial: { label: "Free Trial",        icon: "🔑", bg: "#E3F2FD", fg: "#1565C0" },
  paid:  { label: "Premium — Active",  icon: "👑", bg: "#FFF8E1", fg: "#E65100" },
  admin: { label: "Administrator",     icon: "🛡️", bg: "#E8EAF6", fg: "#1A237E" },
};

function resolveAvatar(profileImage?: string): string | null {
  if (!profileImage) return null;
  if (profileImage.startsWith("http")) return profileImage;
  return `${BASE_URL}${profileImage}`;
}

function TierBadge({ tier, expiresAt }: { tier: Tier; expiresAt?: string | null }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <View style={[tierStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[tierStyles.icon]}>{cfg.icon}</Text>
      <View>
        <Text style={[tierStyles.label, { color: cfg.fg }]}>{cfg.label}</Text>
        {expiresAt && tier !== "free" && tier !== "admin" && (
          <Text style={[tierStyles.expiry, { color: cfg.fg + "AA" }]}>
            Expires {new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Toast notification (replaces Alert.alert for success/error)
// ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const slideY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    slideY.setValue(-80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideY, { toValue: -80, duration: 260, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2400);
    });
  }, [slideY, opacity]);

  const component = toast ? (
    <Animated.View
      style={[
        toastStyles.bar,
        { transform: [{ translateY: slideY }], opacity },
        { backgroundColor: toast.ok ? "#2E7D32" : "#C62828" },
      ]}
      pointerEvents="none"
    >
      <Text style={toastStyles.text}>{toast.ok ? "✓ " : "⚠ "}{toast.msg}</Text>
    </Animated.View>
  ) : null;

  return { show, component };
}

const toastStyles = StyleSheet.create({
  bar: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 14, zIndex: 100,
  },
  text: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────
// Reusable labelled input
// ─────────────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: "default" | "url" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, focused && fieldStyles.inputFocused, multiline && { height: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap:         { marginBottom: 14 },
  label:        { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:        { backgroundColor: Colors.surface, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, fontSize: 15 },
  inputFocused: { borderColor: Colors.primary, backgroundColor: "#FFF" },
});

// ─────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────
export default function ProfileSettingsScreen({ navigation }: any) {
  const { show: showToast, component: toastComponent } = useToast();

  const [profile,  setProfile]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [tier,     setTier]     = useState<Tier>("free");
  const [expiresAt,setExpiresAt]= useState<string | null>(null);

  // Form state — mirrors every editable profile field
  const [form, setForm] = useState({
    username: "", firstName: "", lastName: "", bio: "",
    country: "", github: "", linkedin: "", website: "",
  });
  const setField = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── Load ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [user, subStatus] = await Promise.all([
        fetchCurrentUser() || getCurrentUser(),
        getSubscriptionStatus().catch(() => null),
      ]);

      if (user) {
        setProfile(user);
        setForm({
          username:  user.username  || "",
          firstName: user.firstName || "",
          lastName:  user.lastName  || "",
          bio:       user.bio       || "",
          country:   user.country   || "",
          github:    user.github    || "",
          linkedin:  user.linkedin  || "",
          website:   user.website   || "",
        });
      }

      if (user?.role === "admin") {
        setTier("admin");
      } else if (subStatus?.tier) {
        setTier(subStatus.tier as Tier);
        setExpiresAt(subStatus.premiumExpiresAt ?? null);
      } else {
        setTier(user?.isPremium ? "paid" : "free");
        setExpiresAt(user?.premiumExpiresAt ?? null);
      }
    } catch (e) {
      console.log("ProfileSettings load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Save profile ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.username.trim()) {
      showToast("Username cannot be empty.", false);
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile(form);
      if (res.success || res.user) {
        setProfile(res.user || { ...profile, ...form });
        showToast("Profile saved successfully!");
      } else {
        showToast(res.message || "Failed to update profile.", false);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || "Error saving profile.", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload photo ───────────────────────────────────────────────
  const handlePhoto = async () => {
    try {
      const asset = await pickProfileImage();
      if (!asset) return;
      setUploading(true);
      const res = await uploadProfileImage(asset);
      if (res.success || res.profileImage) {
        const newImg = res.profileImage || res.user?.profileImage;
        setProfile((p: any) => ({ ...p, profileImage: newImg }));
        showToast("Profile photo updated!");
      } else {
        showToast(res.message || "Upload failed.", false);
      }
    } catch (err: any) {
      showToast(err.message || "Could not upload photo.", false);
    } finally {
      setUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const avatarUri = resolveAvatar(profile?.profileImage);
  const initials  = (form.firstName || form.username || "U").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {toastComponent}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveHeaderBtn, saving && { opacity: 0.5 }]}
            activeOpacity={0.75}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={styles.saveHeaderText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar section ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePhoto} disabled={uploading} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                {uploading ? (
                  <ActivityIndicator color="#FFF" size="large" />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
                <View style={styles.cameraBtn}>
                  <Text style={{ fontSize: 12 }}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>

            {/* Subscription tier badge */}
            <TierBadge tier={tier} expiresAt={expiresAt} />
          </View>

          {/* ── Basic info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <Field label="Username" value={form.username} onChangeText={setField("username")} placeholder="your_username" autoCapitalize="none" />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field label="First Name" value={form.firstName} onChangeText={setField("firstName")} placeholder="First" autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Last Name" value={form.lastName} onChangeText={setField("lastName")} placeholder="Last" autoCapitalize="words" />
              </View>
            </View>
            <Field label="Bio" value={form.bio} onChangeText={setField("bio")} placeholder="A short bio about yourself…" multiline />
            <Field label="Country" value={form.country} onChangeText={setField("country")} placeholder="India" autoCapitalize="words" />
          </View>

          {/* ── Social links ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            <Field label="GitHub" value={form.github} onChangeText={setField("github")} placeholder="https://github.com/username" keyboardType="url" autoCapitalize="none" />
            <Field label="LinkedIn" value={form.linkedin} onChangeText={setField("linkedin")} placeholder="https://linkedin.com/in/username" keyboardType="url" autoCapitalize="none" />
            <Field label="Website" value={form.website} onChangeText={setField("website")} placeholder="https://yourwebsite.com" keyboardType="url" autoCapitalize="none" />
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn:        { padding: 4, marginRight: 8 },
  backArrow:      { fontSize: 22, color: Colors.primary, fontWeight: "700" },
  headerTitle:    { flex: 1, fontSize: 18, fontWeight: "800", color: Colors.text },
  saveHeaderBtn:  { paddingHorizontal: 14, paddingVertical: 6 },
  saveHeaderText: { fontSize: 15, fontWeight: "700", color: Colors.primary },

  scroll: { paddingHorizontal: Spacing.screen, paddingBottom: 40 },

  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
    borderWidth: 3, borderColor: Colors.primary + "55",
    elevation: 4,
    shadowColor: Colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  avatarImg:      { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 38, fontWeight: "800", color: "#FFF" },
  cameraBtn: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "#FFF", width: 28, height: 28,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border, elevation: 2,
  },
  avatarHint: { marginTop: 8, fontSize: 12, color: Colors.textMuted },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 18,
    marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { ...Typography.labelLarge, color: Colors.text, marginBottom: 14 },
  row: { flexDirection: "row" },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 32,
    elevation: 3,
    shadowColor: Colors.primary, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});

const tierStyles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginTop: 12, gap: 8,
  },
  icon:   { fontSize: 16 },
  label:  { fontSize: 13, fontWeight: "700" },
  expiry: { fontSize: 10, marginTop: 1 },
});
