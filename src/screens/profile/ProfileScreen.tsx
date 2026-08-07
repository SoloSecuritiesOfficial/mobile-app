import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, TextInput, Alert, Modal, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { BASE_URL } from "../../config/api";
import api from "../../services/api";

import {
  fetchCurrentUser, getCurrentUser,
  changePassword, updateProfile, logout,
} from "../../services/authService";
import { pickProfileImage, uploadProfileImage } from "../../services/profileImageService";
import { getSecurityDashboard } from "../../services/securityService";

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile]   = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [badges, setBadges]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Profile modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio]           = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword]       = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass]     = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await fetchCurrentUser() || await getCurrentUser();
      if (user) {
        setProfile(user);
        setUsername(user.username || "");
        setBio(user.bio || "");
        setBadges(user.badges || []);
      }
      const dashRes = await getSecurityDashboard();
      if (dashRes) setDashboard(dashRes.data || dashRes);
    } catch (err) {
      console.log("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePickAndUploadImage = async () => {
    try {
      const asset = await pickProfileImage();
      if (!asset) return;
      setUploadingImage(true);
      const res = await uploadProfileImage(asset);
      if (res.success || res.profileImage) {
        Alert.alert("Success", "Profile photo uploaded successfully!");
        setProfile({ ...profile, profileImage: res.profileImage || res.user?.profileImage });
      } else {
        Alert.alert("Upload Failed", res.message || "Failed to upload photo.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not upload profile photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await updateProfile({ username, bio });
      if (res.success || res.user) {
        Alert.alert("Success", "Profile updated successfully!");
        setProfile(res.user || { ...profile, username, bio });
        setEditModalVisible(false);
      } else {
        Alert.alert("Error", res.message || "Failed to update profile");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { Alert.alert("Required", "Enter current and new password."); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Mismatch", "Passwords don't match."); return; }
    try {
      setChangingPass(true);
      await changePassword({ oldPassword, newPassword });
      Alert.alert("Success", "Password changed!");
      setPasswordModalVisible(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed");
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const initials  = (profile?.username || "U").substring(0, 2).toUpperCase();
  const avatarUrl = profile?.profileImage
    ? profile.profileImage.startsWith("http")
      ? profile.profileImage
      : `${BASE_URL}${profile.profileImage}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar & info ── */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={handlePickAndUploadImage} disabled={uploadingImage} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {uploadingImage ? <ActivityIndicator color="#FFF" /> :
               avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> :
               <Text style={styles.avatarText}>{initials}</Text>}
              <View style={styles.cameraIconBadge}><Text style={{ fontSize: 10 }}>📷</Text></View>
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{profile?.username || "Security Specialist"}</Text>
          <Text style={styles.email}>{profile?.email || ""}</Text>

          {/* Level + title badge */}
          <View style={styles.levelRow}>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>⚔️ Level {profile?.level ?? 1}</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{profile?.title || "Security Novice"}</Text>
            </View>
          </View>

          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        </View>

        {/* ── Security Metrics ── */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeader}>Security Metrics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.securityScore ?? dashboard?.securityScore ?? 85}%</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.level ?? 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.xp ?? 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.dailyStreak ?? 0}🔥</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{dashboard?.learningCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{dashboard?.labCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Labs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.points ?? 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{(profile?.certificates?.length ?? 0)}</Text>
              <Text style={styles.statLabel}>Certs</Text>
            </View>
          </View>
        </View>

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <View style={styles.badgesCard}>
            <Text style={styles.sectionHeader}>🏅 Earned Badges ({badges.length})</Text>
            <View style={styles.badgesGrid}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badgeChip}>
                  <Text style={styles.badgeChipText}>{b.name}</Text>
                  <Text style={styles.badgeDate}>
                    {b.earnedAt ? new Date(b.earnedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {badges.length === 0 && (
          <View style={styles.noBadgesCard}>
            <Text style={styles.noBadgesIcon}>🔒</Text>
            <Text style={styles.noBadgesTitle}>No Badges Yet</Text>
            <Text style={styles.noBadgesText}>
              Earn badges by reaching levels 5, 10, 15, 20, 25, 30, 40 and 50.{"\n"}
              Complete quizzes and labs to gain XP and level up!
            </Text>
            <TouchableOpacity
              style={styles.noBadgesBtn}
              onPress={() => navigation.navigate("Achievements")}
            >
              <Text style={styles.noBadgesBtnText}>View How to Earn →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Explore ── */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionHeader}>Explore</Text>
          {[
            { icon: "👥", label: "Friends",          screen: "Friends" },
            { icon: "👑", label: "Premium Membership", screen: "Premium" },
            { icon: "🏅", label: "Achievements",      screen: "Achievements" },
            { icon: "🏆", label: "Leaderboard",       screen: "Leaderboard" },
            { icon: "🚩", label: "CTF Challenges",    screen: "CTF" },
            { icon: "📜", label: "My Certificates",   screen: "Certificates" },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.actionBtn}
              onPress={() => navigation.navigate(screen)}
            >
              <Text style={styles.actionBtnText}>{icon} {label}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account Actions ── */}
        <View style={[styles.actionsCard, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionHeader}>Account</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.actionBtnText}>✏️ Edit Profile</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setPasswordModalVisible(true)}>
            <Text style={styles.actionBtnText}>🔑 Change Password</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>🚪 Sign Out</Text>
            <Text style={[styles.arrow, { color: "#EF4444" }]}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput style={styles.modalInput} value={username} onChangeText={setUsername} placeholderTextColor={Colors.textMuted} />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput style={styles.modalInput} value={bio} onChangeText={setBio} multiline numberOfLines={3} placeholderTextColor={Colors.textMuted} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput style={styles.modalInput} secureTextEntry value={oldPassword} onChangeText={setOldPassword} placeholderTextColor={Colors.textMuted} />
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput style={styles.modalInput} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor={Colors.textMuted} />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput style={styles.modalInput} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholderTextColor={Colors.textMuted} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={changingPass}>
                {changingPass ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content:   { paddingTop: 24, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },

  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, position: "relative",
  },
  avatarImage:    { width: 80, height: 80, borderRadius: 40 },
  cameraIconBadge:{
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: Colors.surface, width: 24, height: 24,
    borderRadius: 12, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarText:  { color: "#FFF", fontSize: 30, fontWeight: "800" },
  username:    { ...Typography.h2, color: Colors.text, marginBottom: 2 },
  email:       { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 10 },
  levelRow:    { flexDirection: "row", gap: 8, marginBottom: 4 },
  levelChip:   { backgroundColor: Colors.primary + "22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  levelChipText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  rankBadge:   { backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  rankBadgeText: { color: Colors.text, fontWeight: "600", fontSize: 12 },
  bioText:     { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 8, textAlign: "center" },

  statsCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { ...Typography.labelLarge, color: Colors.text, marginBottom: 12 },
  statsRow:  { flexDirection: "row", justifyContent: "space-between" },
  statBox:   { flex: 1, alignItems: "center", backgroundColor: Colors.background, paddingVertical: 10, marginHorizontal: 3, borderRadius: Spacing.radiusMedium },
  statVal:   { fontSize: 17, fontWeight: "800", color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 3 },

  // ── Badges ──
  badgesCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip:  { backgroundColor: Colors.primary + "18", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + "33" },
  badgeChipText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  badgeDate:  { color: Colors.textMuted, fontSize: 10, marginTop: 2 },

  noBadgesCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 20, marginBottom: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  noBadgesIcon: { fontSize: 40, marginBottom: 8 },
  noBadgesTitle: { fontWeight: "700", color: Colors.text, fontSize: 15, marginBottom: 6 },
  noBadgesText:  { color: Colors.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 12 },
  noBadgesBtn:   { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  noBadgesBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  actionsCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.border },
  actionBtn:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionBtnText: { ...Typography.bodyMedium, color: Colors.text, fontWeight: "600" },
  arrow:     { color: Colors.textMuted, fontSize: 20, fontWeight: "700" },

  modalBg:      { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalTitle:   { ...Typography.h2, color: Colors.text, marginBottom: 16 },
  inputLabel:   { color: Colors.textSecondary, fontSize: 12, marginBottom: 4, marginTop: 8 },
  modalInput:   { backgroundColor: Colors.background, color: Colors.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Spacing.radiusMedium, borderWidth: 1, borderColor: Colors.border },
  modalBtnRow:  { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  cancelBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Spacing.radiusMedium, marginRight: 8 },
  cancelBtnText:{ color: Colors.textSecondary, fontWeight: "600" },
  saveBtn:      { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Spacing.radiusMedium },
  saveBtnText:  { color: "#FFF", fontWeight: "700" },
});
