import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import { getConversations } from "../../services/chatService";
import { BASE_URL } from "../../config/api";

export default function ChatListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.log("Load conversations error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      
      // ✅ AUTO-REFRESH: Poll for new conversations every 5 seconds
      const pollInterval = setInterval(() => {
        loadConversations();
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const renderConversation = ({ item }: any) => {
    const { partner, lastMessage, unreadCount } = item;
    const avatarUri = partner.profileImage?.startsWith("http")
      ? partner.profileImage
      : partner.profileImage
      ? `${BASE_URL}${partner.profileImage}`
      : null;

    const timeAgo = getTimeAgo(new Date(lastMessage.createdAt));

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate("Chat", {
            userId: partner._id,
            username: partner.username,
            profileImage: partner.profileImage,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {partner.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.username} numberOfLines={1}>
              {partner.username}
            </Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={2}
          >
            {lastMessage.content}
          </Text>
        </View>
      </TouchableOpacity>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptyText}>
            Start chatting with your friends!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.partner._id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  headerBar: {
    paddingHorizontal: Spacing.screen,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { ...Typography.h1, color: Colors.text },
  list: { padding: Spacing.screen },
  conversationCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLarge,
    padding: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  content: { flex: 1, justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  time: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  lastMessage: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  lastMessageUnread: { fontWeight: "600", color: Colors.text },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
