import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";
import { BASE_URL } from "../config/api";

import {
  fetchCurrentUser,
  getCurrentUser,
  changePassword,
  updateProfile,
  logout,
} from "../services/authService";

import {
  pickProfileImage,
  uploadProfileImage,
} from "../services/profileImageService";

import { getSecurityDashboard } from "../services/securityService";

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Profile modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await fetchCurrentUser() || await getCurrentUser();
      if (user) {
        setProfile(user);
        setUsername(user.username || "");
        setPhone(user.phone || "");
        setBio(user.bio || "");
      }

      const dashRes = await getSecurityDashboard();
      if (dashRes) {
        setDashboard(dashRes.data || dashRes);
      }
    } catch (error) {
      console.log("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePickAndUploadImage = async () => {
    try {
      const asset = await pickProfileImage();
      if (!asset) return;

      setUploadingImage(true);
      const res = await uploadProfileImage(asset);
      if (res.success || res.profileImage) {
        Alert.alert("Success", "Profile photo uploaded successfully!");
        const updatedImg = res.profileImage || res.user?.profileImage;
        setProfile({ ...profile, profileImage: updatedImg });
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
      const res = await updateProfile({ username, phone, bio });
      if (res.success || res.user) {
        Alert.alert("Success", "Profile updated successfully!");
        setProfile(res.user || { ...profile, username, phone, bio });
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
    if (!oldPassword || !newPassword) {
      Alert.alert("Input Required", "Please enter current and new passwords.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }

    try {
      setChangingPass(true);
      await changePassword({ oldPassword, newPassword });
      Alert.alert("Success", "Password changed successfully!");
      setPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const initials = (profile?.username || "U").substring(0, 2).toUpperCase();
  const avatarUrl = profile?.profileImage
    ? profile.profileImage.startsWith("http")
      ? profile.profileImage
      : `${BASE_URL}${profile.profileImage}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Avatar & Info */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={handlePickAndUploadImage} disabled={uploadingImage} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {uploadingImage ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.cameraIconBadge}>
                <Text style={{ fontSize: 10 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{profile?.username || "Security Specialist"}</Text>
          <Text style={styles.email}>{profile?.email || "user@solosecurities.com"}</Text>

          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>🛡️ {profile?.rank || dashboard?.rank || "Level 1 Security Operative"}</Text>
          </View>

          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        </View>


        {/* User Security Metrics */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeader}>Security Metrics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.securityScore ?? dashboard?.securityScore ?? 85}%</Text>
              <Text style={styles.statLabel}>Security Rating</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statVal}>{dashboard?.learningCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Modules Done</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statVal}>{dashboard?.labCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Labs Passed</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionHeader}>Account Actions</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.actionBtnText}>✏️ Edit Profile Info</Text>
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

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput style={styles.modalInput} value={username} onChangeText={setUsername} placeholderTextColor={Colors.textMuted} />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} />

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

      {/* Change Password Modal */}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content: { paddingTop: 40, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },

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
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surface,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },

  username: { ...Typography.h2, color: Colors.text, marginBottom: 2 },
  email: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 10 },
  rankBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Spacing.radiusCircle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadgeText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  bioText: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 10, textAlign: "center" },

  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: { ...Typography.labelLarge, color: Colors.text, marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { flex: 1, alignItems: "center", backgroundColor: Colors.background, paddingVertical: 12, marginHorizontal: 4, borderRadius: Spacing.radiusMedium },
  statVal: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtnText: { ...Typography.bodyMedium, color: Colors.text, fontWeight: "600" },
  arrow: { color: Colors.textMuted, fontSize: 20, fontWeight: "700" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { ...Typography.h2, color: Colors.text, marginBottom: 16 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4, marginTop: 8 },
  modalInput: { backgroundColor: Colors.background, color: Colors.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Spacing.radiusMedium, borderWidth: 1, borderColor: Colors.border },
  modalBtnRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Spacing.radiusMedium, marginRight: 8 },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: "600" },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Spacing.radiusMedium },
  saveBtnText: { color: "#FFF", fontWeight: "700" },
});