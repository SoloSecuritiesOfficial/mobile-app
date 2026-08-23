import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList, View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../services/notificationService";
import Colors from "../../theme/colors";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

// ── Icon + colour per notification type ─────────────────────────
const TYPE_META: Record<string, { icon: string; color: string }> = {
  friend_request:    { icon: "👋", color: "#7C3AED" },
  friend_accepted:   { icon: "🤝", color: "#16A34A" },
  chat_message:      { icon: "💬", color: "#2563EB" },
  daily_quiz:        { icon: "📝", color: "#EA580C" },
  cve_alert:         { icon: "🔐", color: "#DC2626" },
  achievement:       { icon: "🏅", color: "#D97706" },
  new_lab:           { icon: "🧪", color: "#7C3AED" },
  new_quiz:          { icon: "📝", color: "#2563EB" },
  new_ctf:           { icon: "🏆", color: "#EA580C" },
  new_learning:      { icon: "📚", color: "#0891B2" },
  new_job:           { icon: "💼", color: "#1D4ED8" },
  new_security_tip:  { icon: "💡", color: "#CA8A04" },
  submission_graded: { icon: "📊", color: "#16A34A" },
  leaderboard:       { icon: "🥇", color: "#D97706" },
  streak_reminder:   { icon: "🔥", color: "#EA580C" },
  admin_broadcast:   { icon: "📣", color: "#DC2626" },
  premium:           { icon: "👑", color: "#D97706" },
  system:            { icon: "⚙️",  color: "#6B7280" },
};

function getMeta(type: string) {
  return TYPE_META[type] ?? { icon: "🔔", color: "#6B7280" };
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationScreen() {
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const handleRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All",
      "Remove all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All", style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/notifications/all");
              setNotifications([]);
            } catch {}
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionPill} onPress={handleReadAll}>
              <Text style={styles.actionPillText}>✓ All Read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={[styles.actionPill, styles.actionPillDanger]} onPress={handleDeleteAll}>
              <Text style={[styles.actionPillText, { color: "#EF4444" }]}>🗑 Delete All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const { icon, color } = getMeta(item.type);
          return (
            <TouchableOpacity
              style={[styles.row, !item.isRead && styles.rowUnread]}
              onPress={() => !item.isRead && handleRead(item._id)}
              activeOpacity={0.75}
            >
              {/* Unread indicator */}
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: color }]} />}

              {/* Type icon */}
              <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              {/* Content */}
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowTitle, !item.isRead && styles.rowTitleBold]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
              </View>

              {/* Delete icon */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item._id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },

  // header
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1, borderBottomColor: "#EDEDED",
  },
  title:       { fontSize: 22, fontWeight: "800", color: "#111" },
  unreadBadge: { fontSize: 12, color: Colors.primary, fontWeight: "600", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 },
  actionPill:  {
    borderWidth: 1, borderColor: "#E0E0E0",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#F9F9F9",
  },
  actionPillDanger: { borderColor: "#FECACA", backgroundColor: "#FFF5F5" },
  actionPillText:   { fontSize: 12, fontWeight: "700", color: Colors.primary },

  // list
  list: { paddingVertical: 8, paddingHorizontal: 12 },
  sep:  { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 4 },

  // row
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 10,
    gap: 10,
  },
  rowUnread:  { backgroundColor: "#FAFEFF" },
  unreadDot:  { width: 6, height: 6, borderRadius: 3, position: "absolute", left: 4, top: 14 },

  iconWrap:   { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  iconText:   { fontSize: 18 },

  rowContent: { flex: 1 },
  rowTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  rowTitle:   { fontSize: 13, color: "#333", flex: 1, marginRight: 6 },
  rowTitleBold: { fontWeight: "700", color: "#111" },
  rowTime:    { fontSize: 11, color: "#AAA" },
  rowMessage: { fontSize: 12, color: "#666", lineHeight: 17 },

  deleteBtn:  { padding: 2 },
  deleteIcon: { fontSize: 16 },

  // empty
  empty:     { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#AAA", fontSize: 15 },
});
