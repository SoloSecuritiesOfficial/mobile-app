/**
 * AccountSettingsScreen
 * ──────────────────────
 * • Change password
 * • Delete account (with double-confirm animated bottom-sheet)
 * • Sign out
 * • All destructive actions use animated bottom-sheet confirmations
 *   (no native Alert.alert)
 */

import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Animated, Modal,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { changePassword, deleteAccount, logout } from "../../services/authService";

// ─────────────────────────────────────────────────────────────────
// Animated bottom-sheet confirm dialog
// ─────────────────────────────────────────────────────────────────
interface SheetConfig {
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  onConfirm: () => void;
}

function ConfirmSheet({
  config, visible, onClose,
}: {
  config: SheetConfig | null;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      translateY.setValue(400);
      opacity.setValue(0);
      iconScale.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 200, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, damping: 10, stiffness: 180, delay: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!config) return null;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[sheet.overlay, { opacity }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[sheet.container, { transform: [{ translateY }] }]}>
        <View style={sheet.handle} />

        <Animated.View style={[sheet.iconWrap, { transform: [{ scale: iconScale }] }]}>
          <View style={[sheet.iconBadge, { backgroundColor: config.iconColor + "18", borderColor: config.iconColor + "33" }]}>
            <Text style={sheet.iconText}>{config.icon}</Text>
          </View>
        </Animated.View>

        <Text style={sheet.title}>{config.title}</Text>
        <Text style={sheet.message}>{config.message}</Text>

        <View style={sheet.btnRow}>
          <TouchableOpacity style={[sheet.btn, sheet.cancelBtn]} onPress={onClose} activeOpacity={0.75}>
            <Text style={sheet.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sheet.btn, { backgroundColor: config.confirmColor }]}
            onPress={() => { onClose(); setTimeout(config.onConfirm, 260); }}
            activeOpacity={0.75}
          >
            <Text style={sheet.confirmBtnText}>{config.confirmText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.55)" },
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 44, paddingTop: 12,
    alignItems: "center",
    elevation: 24, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
  handle:    { width: 44, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, marginBottom: 24 },
  iconWrap:  { marginBottom: 16 },
  iconBadge: { width: 66, height: 66, borderRadius: 33, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  iconText:  { fontSize: 28 },
  title:     { fontSize: 20, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
  message:   { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 21, marginBottom: 28 },
  btnRow:    { flexDirection: "row", gap: 10, width: "100%" },
  btn:       { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  cancelBtn: { backgroundColor: "#F5F5F5" },
  cancelBtnText:  { fontSize: 15, fontWeight: "700", color: "#888" },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});

// ─────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const slideY  = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    slideY.setValue(-80); opacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideY,  { toValue: 0, damping: 14, stiffness: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideY,  { toValue: -80, duration: 260, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 260, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2600);
    });
  }, [slideY, opacity]);

  const component = toast ? (
    <Animated.View
      style={[toast_.bar, { transform: [{ translateY: slideY }], opacity, backgroundColor: toast.ok ? "#2E7D32" : "#C62828" }]}
      pointerEvents="none"
    >
      <Text style={toast_.text}>{toast.ok ? "✓  " : "⚠  "}{toast.msg}</Text>
    </Animated.View>
  ) : null;

  return { show, component };
}

const toast_ = StyleSheet.create({
  bar:  { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 14, zIndex: 100 },
  text: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────
// Labelled password input
// ─────────────────────────────────────────────────────────────────
function PwField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={Colors.textMuted}
        placeholder="••••••••"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────
export default function AccountSettingsScreen({ navigation }: any) {
  const { show: showToast, component: toastComponent } = useToast();

  const [oldPw,     setOldPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Bottom-sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetConfig,  setSheetConfig]  = useState<SheetConfig | null>(null);

  const openSheet = (cfg: SheetConfig) => {
    setSheetConfig(cfg);
    setSheetVisible(true);
  };

  // ── Change password ────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!oldPw || !newPw) { showToast("Fill in all password fields.", false); return; }
    if (newPw.length < 8)  { showToast("New password must be at least 8 characters.", false); return; }
    if (newPw !== confirmPw) { showToast("New passwords don't match.", false); return; }

    setChangingPw(true);
    try {
      await changePassword({ oldPassword: oldPw, newPassword: newPw });
      showToast("Password changed successfully! ✓");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || "Failed to change password.", false);
    } finally {
      setChangingPw(false);
    }
  };

  // ── Sign out ───────────────────────────────────────────────────
  const handleSignOut = () => {
    openSheet({
      icon: "🚪", iconColor: "#D32F2F",
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      confirmText: "Sign Out",
      confirmColor: "#D32F2F",
      onConfirm: async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      },
    });
  };

  // ── Delete account — step 1 ────────────────────────────────────
  const handleDeleteAccount = () => {
    openSheet({
      icon: "⚠️", iconColor: "#C62828",
      title: "Delete Account",
      message: "This will permanently deactivate your account. All your progress, XP, and certificates will be lost.\n\nThis action cannot be undone.",
      confirmText: "Yes, Delete",
      confirmColor: "#C62828",
      onConfirm: handleDeleteAccountFinal,
    });
  };

  // ── Delete account — step 2 (second confirmation) ──────────────
  const handleDeleteAccountFinal = () => {
    // Show a second confirm after a short delay so the first sheet has closed
    setTimeout(() => {
      openSheet({
        icon: "🗑️", iconColor: "#B71C1C",
        title: "Last Chance",
        message: "Are you absolutely sure? Type your email to confirm — your account will be gone permanently.",
        confirmText: "Delete My Account",
        confirmColor: "#B71C1C",
        onConfirm: async () => {
          try {
            const res = await deleteAccount();
            if (res.success) {
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            } else {
              showToast(res.message || "Failed to delete account.", false);
            }
          } catch (err: any) {
            showToast(err?.response?.data?.message || err.message || "Error deleting account.", false);
          }
        },
      });
    }, 350);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {toastComponent}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Change Password ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 Change Password</Text>
            <PwField label="Current Password"     value={oldPw}     onChangeText={setOldPw} />
            <PwField label="New Password"          value={newPw}     onChangeText={setNewPw} />
            <PwField label="Confirm New Password"  value={confirmPw} onChangeText={setConfirmPw} />

            <TouchableOpacity
              style={[styles.actionPrimaryBtn, changingPw && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={changingPw}
              activeOpacity={0.8}
            >
              {changingPw
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.actionPrimaryText}>Update Password</Text>}
            </TouchableOpacity>
          </View>

          {/* ── Danger Zone ── */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={[styles.sectionTitle, { color: "#C62828" }]}>⚠️ Danger Zone</Text>

            <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut} activeOpacity={0.75}>
              <View>
                <Text style={styles.dangerRowTitle}>Sign Out</Text>
                <Text style={styles.dangerRowDesc}>You will be logged out of this device.</Text>
              </View>
              <Text style={styles.dangerChevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount} activeOpacity={0.75}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dangerRowTitle, { color: "#C62828" }]}>Delete Account</Text>
                <Text style={styles.dangerRowDesc}>
                  Permanently deactivate your account and erase all data. This cannot be reversed.
                </Text>
              </View>
              <Text style={[styles.dangerChevron, { color: "#C62828" }]}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmSheet
        config={sheetConfig}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { padding: 4, marginRight: 8 },
  backArrow:   { fontSize: 22, color: Colors.primary, fontWeight: "700" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: Colors.text },

  scroll: { paddingHorizontal: Spacing.screen, paddingBottom: 40, paddingTop: 20 },

  section: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  dangerSection: { borderColor: "#FFCDD2", backgroundColor: "#FFF9F9" },
  sectionTitle: { ...Typography.labelLarge, color: Colors.text, marginBottom: 16 },

  inputLabel: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.background, color: Colors.text,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, fontSize: 15,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: "#FFF" },

  actionPrimaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 6,
    elevation: 2, shadowColor: Colors.primary, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  actionPrimaryText: { color: "#FFF", fontSize: 15, fontWeight: "800" },

  dangerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  dangerRowTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 3 },
  dangerRowDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, paddingRight: 16 },
  dangerChevron: { fontSize: 22, color: Colors.textMuted, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#FFCDD2", marginVertical: 10 },
});
