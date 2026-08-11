import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import { sendMessage, getChatHistory, markAsRead } from "../../services/chatService";
import { getCurrentUser } from "../../services/authService";
import UserAvatar from "../../components/UserAvatar";

export default function ChatScreen({ route, navigation }: any) {
  const { userId, username, profileImage } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChat();
    loadCurrentUser();
    
    // ✅ AUTO-REFRESH: Poll for new messages every 3 seconds
    const pollInterval = setInterval(() => {
      loadChat();
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
      markAsRead(userId).catch(() => {});
    };
  }, [userId]);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUserId(user?._id || "");
  };

  const loadChat = async () => {
    try {
      const res = await getChatHistory(userId);
      setMessages(res.data || []);
      await markAsRead(userId);
    } catch (err) {
      console.log("Load chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      const res = await sendMessage(userId, text);
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.log("Send error:", err);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender._id === currentUserId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.75}
          onPress={() => navigation.navigate("FriendProfile", { userId, username, profileImage })}
        >
          <UserAvatar username={username} profileImage={profileImage} size={40} />
          <View style={styles.headerNameCol}>
            <Text style={styles.headerTitle}>{username}</Text>
            <Text style={styles.headerSub}>Tap to view profile</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Start the conversation!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn:     { paddingRight: 4 },
  backText:    { fontSize: 32, color: Colors.primary, fontWeight: "300", lineHeight: 36 },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerNameCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  headerSub:   { fontSize: 11, color: Colors.textMuted },
  messagesList: { padding: Spacing.screen, paddingBottom: Spacing.lg },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: { fontSize: 15, color: Colors.text, marginBottom: 4 },
  myMessageText: { color: "#FFF" },
  timestamp: { fontSize: 11, color: Colors.textMuted, textAlign: "right" },
  myTimestamp: { color: "#FFFFFFAA" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.screen,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
});
