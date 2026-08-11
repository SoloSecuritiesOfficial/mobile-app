import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { registerForPushNotifications } from "../../utils/pushNotifications";
import { markPushAsked } from "../../utils/storage";
import Colors from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "NotificationPermission">;

export default function NotificationPermissionScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  async function proceed(allow: boolean) {
    setLoading(true);
    try {
      await markPushAsked();
      if (allow) {
        await registerForPushNotifications();
      }
    } catch {
      // never block navigation
    } finally {
      setLoading(false);
      navigation.replace("Dashboard");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Stay in the Loop</Text>
        <Text style={styles.subtitle}>
          Get instant alerts for friend requests, messages, new challenges,
          CVE alerts, quiz results and admin announcements.
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {[
            { icon: "💬", text: "Chat messages from friends" },
            { icon: "👋", text: "Friend requests & accepts" },
            { icon: "🔐", text: "Critical CVE security alerts" },
            { icon: "🏆", text: "New labs, quizzes & CTF challenges" },
            { icon: "📜", text: "Certificate issued & achievements" },
            { icon: "⚙️",  text: "Admin announcements" },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.allowBtn} onPress={() => proceed(true)} activeOpacity={0.85}>
              <Text style={styles.allowBtnText}>🔔 Allow Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => proceed(false)} activeOpacity={0.75}>
              <Text style={styles.skipBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.note}>
          You can change this any time in your device settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary + "18",
    justifyContent: "center", alignItems: "center",
    marginBottom: 24,
  },
  icon: { fontSize: 52 },

  title: {
    fontSize: 28, fontWeight: "800", color: "#111",
    textAlign: "center", marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, color: "#555", textAlign: "center",
    lineHeight: 22, marginBottom: 28,
  },

  featureList: { width: "100%", marginBottom: 32, gap: 10 },
  featureRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { fontSize: 22, width: 30, textAlign: "center" },
  featureText: { fontSize: 14, color: "#333", flex: 1 },

  btnGroup: { width: "100%", gap: 12 },
  allowBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  allowBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  skipBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  skipBtnText: { color: "#888", fontSize: 15, fontWeight: "600" },

  note: {
    marginTop: 20, fontSize: 12, color: "#AAA", textAlign: "center",
  },
});
