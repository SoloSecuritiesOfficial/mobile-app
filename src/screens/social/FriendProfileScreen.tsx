import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import api from "../../services/api";
import UserAvatar from "../../components/UserAvatar";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "FriendProfile">;

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "loading";

export default function FriendProfileScreen({ route, navigation }: Props) {
  const { userId, username, profileImage } = route.params;

  const [profile,        setProfile]        = useState<any>(null);
  const [friendStatus,   setFriendStatus]   = useState<FriendStatus>("loading");
  const [friendshipId,   setFriendshipId]   = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);

  // ── Load profile + friendship state in parallel ─────────────────
  const load = useCallback(async () => {
    try {
      const [profileRes, friendsRes, requestsRes] = await Promise.all([
        api.get(`/users/${userId}/profile`),
        api.get("/friends/list"),
        api.get("/friends/requests"),
      ]);

      setProfile(profileRes.data?.user ?? null);

      // Check if already friends
      const friends: any[] = friendsRes.data?.data ?? [];
      const isFriend = friends.some((f: any) => f._id === userId);
      if (isFriend) {
        setFriendStatus("accepted");
        return;
      }

      // Check pending received (they sent us a request)
      const received: any[] = requestsRes.data?.data ?? [];
      const receivedReq = received.find((r: any) => r.user1?._id === userId);
      if (receivedReq) {
        setFriendStatus("pending_received");
        setFriendshipId(receivedReq._id);
        return;
      }

      // Check if we sent them a request — search results carry friendshipStatus
      const searchRes = await api.get(`/friends/search?query=${username}`).catch(() => null);
      const searchUsers: any[] = searchRes?.data?.data ?? [];
      const match = searchUsers.find((u: any) => u._id === userId);
      if (match?.friendshipStatus === "pending") {
        setFriendStatus("pending_sent");
        return;
      }

      setFriendStatus("none");
    } catch {
      setFriendStatus("none");
    } finally {
      setLoading(false);
    }
  }, [userId, username]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await api.post("/friends/request", { targetUserId: userId });
      setFriendStatus("pending_sent");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      await api.post(`/friends/accept/${friendshipId}`);
      setFriendStatus("accepted");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not accept");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      await api.post(`/friends/reject/${friendshipId}`);
      setFriendStatus("none");
      setFriendshipId(null);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      "Remove Friend",
      `Remove ${profile?.username ?? username} from friends?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/friends/remove/${userId}`);
              setFriendStatus("none");
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.message || "Could not remove");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const p = profile ?? { username, profileImage };
  const joinDate = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  // ── Action button ────────────────────────────────────────────────
  function FriendActionButton() {
    if (actionLoading) {
      return (
        <View style={styles.actionBtn}>
          <ActivityIndicator color="#FFF" size="small" />
        </View>
      );
    }
    switch (friendStatus) {
      case "none":
        return (
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddFriend}>
            <Text style={styles.actionBtnText}>➕ Add Friend</Text>
          </TouchableOpacity>
        );
      case "pending_sent":
        return (
          <View style={[styles.actionBtn, styles.actionBtnMuted]}>
            <Text style={styles.actionBtnTextMuted}>⏳ Request Sent</Text>
          </View>
        );
      case "pending_received":
        return (
          <View style={styles.dualBtns}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={handleAccept}>
              <Text style={styles.actionBtnText}>✓ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger, { flex: 1 }]} onPress={handleReject}>
              <Text style={styles.actionBtnText}>✕ Decline</Text>
            </TouchableOpacity>
          </View>
        );
      case "accepted":
        return (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleRemove}>
            <Text style={styles.actionBtnText}>👤 Remove Friend</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{p.username}</Text>
        {friendStatus === "accepted" && (
          <TouchableOpacity
            style={styles.chatHeaderBtn}
            onPress={() => navigation.navigate("Chat", {
              userId,
              username: p.username,
              profileImage: p.profileImage,
            })}
          >
            <Text style={styles.chatHeaderBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <UserAvatar username={p.username} profileImage={p.profileImage} size={90} />

          <Text style={styles.heroName}>{p.username}</Text>

          <View style={styles.chipRow}>
            {p.level != null && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>⚔️ Level {p.level}</Text>
              </View>
            )}
            {(p.title || p.rank) && (
              <View style={[styles.chip, styles.chipAlt]}>
                <Text style={styles.chipText}>{p.title || p.rank}</Text>
              </View>
            )}
            {p.isPremium && (
              <View style={[styles.chip, { backgroundColor: "#FFF8E1" }]}>
                <Text style={[styles.chipText, { color: "#E65100" }]}>👑 Premium</Text>
              </View>
            )}
          </View>

          {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}

          <View style={styles.metaRow}>
            {joinDate && <Text style={styles.metaText}>📅 Joined {joinDate}</Text>}
            {p.country && <Text style={styles.metaText}>📍 {p.country}</Text>}
          </View>

          {/* Friend action button */}
          <View style={styles.actionWrap}>
            <FriendActionButton />
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Stats</Text>
          <View style={styles.statsGrid}>
            <StatBox icon="⭐" value={p.xp ?? 0}              label="XP"      color="#F9A825" />
            <StatBox icon="💎" value={p.points ?? 0}          label="Points"  color="#7B1FA2" />
            <StatBox icon="🔥" value={p.dailyStreak ?? 0}     label="Streak"  color="#E65100" />
            <StatBox icon="📚" value={p.completedLessonsCount ?? 0} label="Modules" color="#0288D1" />
            <StatBox icon="🧪" value={p.completedLabsCount ?? 0}    label="Labs"    color="#6A1B9A" />
            <StatBox icon="📜" value={(p.badges ?? []).length}       label="Badges"  color="#2E7D32" />
          </View>
        </View>

        {/* ── Progress bars ── */}
        {(p.completedLessonsCount > 0 || p.completedLabsCount > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📈 Progress</Text>
            <ProgressRow
              label="Learning Modules"
              completed={p.completedLessonsCount ?? 0}
              total={p.totalLessons ?? (p.completedLessonsCount ?? 0)}
              color="#0288D1"
            />
            <ProgressRow
              label="Labs"
              completed={p.completedLabsCount ?? 0}
              total={p.totalLabs ?? (p.completedLabsCount ?? 0)}
              color="#6A1B9A"
            />
          </View>
        )}

        {/* ── Badges ── */}
        {(p.badges ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🏅 Badges ({p.badges.length})</Text>
            <View style={styles.badgesWrap}>
              {p.badges.map((b: any, i: number) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeName}>{b.name ?? b}</Text>
                  {b.earnedAt && (
                    <Text style={styles.badgeDate}>
                      {new Date(b.earnedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function StatBox({ icon, value, label, color }: {
  icon: string; value: number; label: string; color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, completed, total, color }: {
  label: string; completed: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.min(completed / total, 1) : 1;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressCount}>{completed}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn:          { paddingRight: 4 },
  backText:         { fontSize: 32, color: Colors.primary, fontWeight: "300", lineHeight: 36 },
  headerTitle:      { flex: 1, fontSize: 18, fontWeight: "700", color: Colors.text },
  chatHeaderBtn:    { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  chatHeaderBtnText:{ color: "#FFF", fontWeight: "700", fontSize: 13 },

  scroll: { padding: Spacing.screen, paddingBottom: 60 },

  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: 24, alignItems: "center",
    marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  heroName:  { ...Typography.h2, color: Colors.text, marginTop: 8 },
  chipRow:   { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  chip:      { backgroundColor: Colors.primary + "22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  chipAlt:   { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipText:  { color: Colors.text, fontWeight: "700", fontSize: 12 },
  bio:       { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  metaRow:   { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  metaText:  { fontSize: 12, color: Colors.textMuted },

  actionWrap: { width: "100%", marginTop: 4 },
  dualBtns:   { flexDirection: "row", gap: 10, width: "100%" },
  actionBtn:  {
    backgroundColor: Colors.primary,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  actionBtnMuted:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  actionBtnDanger:  { backgroundColor: "#EF4444" },
  actionBtnText:    { color: "#FFF", fontWeight: "700", fontSize: 14 },
  actionBtnTextMuted: { color: Colors.textSecondary, fontWeight: "700", fontSize: 14 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: Spacing.cardPadding,
    marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { ...Typography.labelLarge, color: Colors.text, marginBottom: 14 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: {
    flex: 1, minWidth: "28%",
    backgroundColor: Colors.background,
    borderRadius: 12, padding: 12,
    alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: "600" },

  progressRow:     { marginBottom: 12 },
  progressLabelRow:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel:   { fontSize: 13, color: Colors.text, fontWeight: "600" },
  progressCount:   { fontSize: 13, color: Colors.textSecondary },
  progressTrack:   { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: "hidden" },
  progressFill:    { height: 8, borderRadius: 4 },

  badgesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    backgroundColor: Colors.primary + "18",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.primary + "33",
  },
  badgeName: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
  badgeDate: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
});
