import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

type Tab = "friends" | "requests" | "search" | "activity";

interface FriendUser {
  _id: string;
  username: string;
  profileImage?: string;
  level?: number;
  xp?: number;
  rank?: string;
  friendshipStatus?: "none" | "pending" | "accepted";
}

interface FriendRequest {
  _id: string;
  user1: FriendUser;
  createdAt: string;
}

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>("friends");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [friendsRes, requestsRes, activityRes] = await Promise.all([
        api.get("/friends/list"),
        api.get("/friends/requests"),
        api.get("/friends/activity"),
      ]);
      setFriends(friendsRes.data?.data ?? []);
      setRequests(requestsRes.data?.data ?? []);
      setActivity(activityRes.data?.data ?? []);
    } catch (err) {
      console.log("Friends load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await api.get(`/friends/search?query=${searchQuery}`);
      setSearchResults(res.data?.data ?? []);
    } catch (err) {
      console.log("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await api.post("/friends/request", { targetUserId });
      Alert.alert("Sent!", "Friend request sent successfully.");
      setSearchResults(prev =>
        prev.map(u => u._id === targetUserId ? { ...u, friendshipStatus: "pending" } : u)
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not send request");
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await api.post(`/friends/accept/${friendshipId}`);
      Alert.alert("Success", "Friend request accepted!");
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not accept request");
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      await api.post(`/friends/reject/${friendshipId}`);
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not reject request");
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert("Remove Friend", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/friends/remove/${friendId}`);
            loadData();
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Could not remove friend");
          }
        },
      },
    ]);
  };

  const Avatar = ({ user }: { user: { username?: string; profileImage?: string } }) => {
    const initials = (user.username || "?").substring(0, 2).toUpperCase();
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends 👥</Text>
        <Text style={styles.headerSub}>Connect with the security community</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["friends", "requests", "search", "activity"] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "friends" ? `Friends (${friends.length})` :
               t === "requests" ? `Requests (${requests.length})` :
               t === "search" ? "Search" : "Activity"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* FRIENDS LIST */}
        {tab === "friends" && (
          friends.length === 0
            ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>👥</Text><Text style={styles.emptyTitle}>No Friends Yet</Text><Text style={styles.emptyText}>Search for users and send friend requests to connect.</Text></View>
            : friends.map((f) => (
              <View key={f._id} style={styles.card}>
                <Avatar user={f} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{f.username}</Text>
                  <Text style={styles.cardSub}>Level {f.level ?? 1} • {f.xp ?? 0} XP</Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFriend(f._id)}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
        )}

        {/* REQUESTS */}
        {tab === "requests" && (
          requests.length === 0
            ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>📬</Text><Text style={styles.emptyTitle}>No Pending Requests</Text><Text style={styles.emptyText}>When someone sends you a friend request, it will appear here.</Text></View>
            : requests.map((r) => (
              <View key={r._id} style={styles.card}>
                <Avatar user={r.user1} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{r.user1?.username}</Text>
                  <Text style={styles.cardSub}>Wants to connect</Text>
                </View>
                <View style={styles.reqBtns}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(r._id)}>
                    <Text style={styles.acceptBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(r._id)}>
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}

        {/* SEARCH */}
        {tab === "search" && (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.searchBtnText}>Search</Text>}
              </TouchableOpacity>
            </View>
            {searchResults.map((u) => (
              <View key={u._id} style={styles.card}>
                <Avatar user={u} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{u.username}</Text>
                  <Text style={styles.cardSub}>Level {u.level ?? 1} • {u.rank ?? "Novice"}</Text>
                </View>
                {u.friendshipStatus === "accepted" ? (
                  <View style={styles.alreadyFriendBadge}><Text style={styles.alreadyFriendText}>Friends</Text></View>
                ) : u.friendshipStatus === "pending" ? (
                  <View style={styles.pendingBadge}><Text style={styles.pendingText}>Pending</Text></View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleSendRequest(u._id)}>
                    <Text style={styles.addBtnText}>Add +</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          activity.length === 0
            ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>📰</Text><Text style={styles.emptyTitle}>No Friend Activity</Text><Text style={styles.emptyText}>Add friends to see their security learning activity here.</Text></View>
            : activity.map((a, i) => (
              <View key={i} style={styles.activityCard}>
                <Avatar user={a.userId ?? {}} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{a.userId?.username ?? "User"}</Text>
                  <Text style={styles.activityTitle}>{a.title}</Text>
                  <Text style={styles.activityTime}>{new Date(a.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.activityPoints}>+{a.points ?? 0} XP</Text>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h1, color: Colors.text },
  headerSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  tabRow: { flexDirection: "row", paddingHorizontal: Spacing.screen, marginBottom: Spacing.md, gap: 6 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: "#FFF", fontWeight: "700" },
  content: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  cardInfo: { flex: 1 },
  cardName: { ...Typography.bodyMedium, color: Colors.text, fontWeight: "700" },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#FEE2E2" },
  removeBtnText: { color: "#EF4444", fontWeight: "700", fontSize: 12 },
  reqBtns: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  acceptBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center" },
  rejectBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  searchRow: { flexDirection: "row", marginBottom: Spacing.md, gap: 8 },
  searchInput: { flex: 1, backgroundColor: Colors.surface, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  searchBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  searchBtnText: { color: "#FFF", fontWeight: "700" },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  alreadyFriendBadge: { backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  alreadyFriendText: { color: "#22C55E", fontWeight: "700", fontSize: 12 },
  pendingBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pendingText: { color: "#D97706", fontWeight: "700", fontSize: 12 },
  activityCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  activityInfo: { flex: 1, marginLeft: 12 },
  activityName: { fontWeight: "700", color: Colors.text, fontSize: 13 },
  activityTitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  activityPoints: { color: "#22C55E", fontWeight: "700", fontSize: 13 },
  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginBottom: 8 },
  emptyText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
});
