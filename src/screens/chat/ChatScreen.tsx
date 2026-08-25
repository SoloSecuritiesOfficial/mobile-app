import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import UserAvatar from "../../components/UserAvatar";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import { getCurrentUser } from "../../services/authService";
import {
  deleteConversation,
  deleteMessage,
  getChatHistory,
  getTypingStatus,
  markAsRead,
  reactToMessage,
  sendMessage,
  setTyping,
} from "../../services/chatService";

// ─── types ────────────────────────────────────────────────────────────────────

interface ReplyTo {
  _id:      string;
  content:  string;
  senderName: string;
}

interface Message {
  _id:       string;
  content:   string;
  sender:    { _id: string; username: string; profileImage?: string };
  receiver:  { _id: string; username: string };
  isRead:    boolean;
  readAt?:   string;
  isDeleted: boolean;
  createdAt: string;
  reactions?: Record<string, string>;   // { userId: emoji }
  replyTo?: {
    _id:     string;
    content: string;
    sender:  { username: string };
  } | null;
}

// ─── emoji picker options ─────────────────────────────────────────────────────
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// ─── helper ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ─── ReactionBar ──────────────────────────────────────────────────────────────
function ReactionBar({
  messageId,
  reactions,
  currentUserId,
  onReact,
}: {
  messageId:     string;
  reactions:     Record<string, string>;
  currentUserId: string;
  onReact:       (messageId: string, emoji: string) => void;
}) {
  // Aggregate: emoji → count
  const counts: Record<string, number> = {};
  Object.values(reactions).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
  if (Object.keys(counts).length === 0) return null;

  const myEmoji = reactions[currentUserId];

  return (
    <View style={rb.row}>
      {Object.entries(counts).map(([emoji, count]) => (
        <TouchableOpacity
          key={emoji}
          style={[rb.pill, myEmoji === emoji && rb.pillActive]}
          onPress={() => onReact(messageId, emoji)}
        >
          <Text style={rb.emoji}>{emoji}</Text>
          {count > 1 && <Text style={rb.count}>{count}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}
const rb = StyleSheet.create({
  row:       { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  pill:      { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
  pillActive:{ backgroundColor: Colors.primary + "22", borderWidth: 1, borderColor: Colors.primary },
  emoji:     { fontSize: 13 },
  count:     { fontSize: 11, fontWeight: "700", color: Colors.text },
});

// ─── EmojiPicker modal ────────────────────────────────────────────────────────
function EmojiPickerModal({
  visible,
  onSelect,
  onClose,
}: {
  visible:  boolean;
  onSelect: (emoji: string) => void;
  onClose:  () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ep.overlay} onPress={onClose}>
        <View style={ep.box}>
          <Text style={ep.title}>React</Text>
          <View style={ep.grid}>
            {QUICK_REACTIONS.map(e => (
              <TouchableOpacity key={e} style={ep.btn} onPress={() => { onSelect(e); onClose(); }}>
                <Text style={ep.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
const ep = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  box:     { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, width: 280 },
  title:   { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginBottom: 12, textAlign: "center" },
  grid:    { flexDirection: "row", justifyContent: "space-around" },
  btn:     { padding: 8 },
  emoji:   { fontSize: 30 },
});

// ─── Context menu modal (long-press) ─────────────────────────────────────────
interface MenuItem { label: string; icon: string; danger?: boolean; action: () => void }

function ContextMenu({
  visible,
  items,
  onClose,
}: {
  visible:  boolean;
  items:    MenuItem[];
  onClose:  () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={onClose}>
        <View style={cm.box}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[cm.item, i < items.length - 1 && cm.itemBorder]}
              onPress={() => { onClose(); item.action(); }}
            >
              <Text style={cm.icon}>{item.icon}</Text>
              <Text style={[cm.label, item.danger && cm.danger]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  box:        { backgroundColor: Colors.surface, borderRadius: 16, width: 240, overflow: "hidden" },
  item:       { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon:       { fontSize: 20 },
  label:      { fontSize: 15, fontWeight: "600", color: Colors.text },
  danger:     { color: "#EF4444" },
});

// ─── MessageBubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isMe,
  currentUserId,
  showDateSeparator,
  dateLabel,
  onLongPress,
  onReact,
}: {
  msg:              Message;
  isMe:             boolean;
  currentUserId:    string;
  showDateSeparator:boolean;
  dateLabel:        string;
  onLongPress:      (msg: Message) => void;
  onReact:          (messageId: string, emoji: string) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const reactions = msg.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <>
      {/* Date separator */}
      {showDateSeparator && (
        <View style={mb.dateSep}>
          <View style={mb.dateLine} />
          <Text style={mb.dateText}>{dateLabel}</Text>
          <View style={mb.dateLine} />
        </View>
      )}

      <Animated.View
        style={[
          mb.row,
          isMe ? mb.rowMe : mb.rowThem,
          { opacity: fadeAnim },
        ]}
      >
        {/* Avatar for other person */}
        {!isMe && (
          <UserAvatar
            username={msg.sender.username}
            profileImage={msg.sender.profileImage}
            size={28}
          />
        )}

        <View style={[mb.col, isMe ? mb.colMe : mb.colThem]}>
          {/* Reply-to preview */}
          {msg.replyTo && (
            <View style={[mb.replyPreview, isMe ? mb.replyPreviewMe : mb.replyPreviewThem]}>
              <Text style={mb.replyName}>{msg.replyTo.sender.username}</Text>
              <Text style={mb.replyContent} numberOfLines={1}>
                {msg.replyTo.content}
              </Text>
            </View>
          )}

          {/* Bubble */}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => onLongPress(msg)}
            style={[
              mb.bubble,
              isMe ? mb.bubbleMe : mb.bubbleThem,
              msg.isDeleted && mb.bubbleDeleted,
            ]}
          >
            <Text
              style={[
                mb.content,
                isMe ? mb.contentMe : mb.contentThem,
                msg.isDeleted && mb.contentDeleted,
              ]}
            >
              {msg.content}
            </Text>
          </TouchableOpacity>

          {/* Reactions */}
          {hasReactions && (
            <ReactionBar
              messageId={msg._id}
              reactions={reactions}
              currentUserId={currentUserId}
              onReact={onReact}
            />
          )}

          {/* Timestamp + read receipt */}
          <View style={[mb.meta, isMe && { alignSelf: "flex-end" }]}>
            <Text style={mb.time}>{formatTime(msg.createdAt)}</Text>
            {isMe && (
              <Text style={[mb.tick, msg.isRead && mb.tickRead]}>
                {msg.isRead ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const mb = StyleSheet.create({
  dateSep:  { flexDirection: "row", alignItems: "center", marginVertical: 12, paddingHorizontal: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateText: { fontSize: 11, color: Colors.textMuted, marginHorizontal: 10, fontWeight: "600" },

  row:      { flexDirection: "row", alignItems: "flex-end", marginBottom: 4, paddingHorizontal: 8 },
  rowMe:    { justifyContent: "flex-end" },
  rowThem:  { justifyContent: "flex-start", gap: 6 },

  col:      { maxWidth: "78%", flexShrink: 1 },
  colMe:    { alignItems: "flex-end" },
  colThem:  { alignItems: "flex-start" },

  replyPreview:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 2, borderLeftWidth: 3, maxWidth: "100%" },
  replyPreviewMe:   { backgroundColor: "rgba(255,255,255,0.15)", borderLeftColor: "#FFFFFFAA" },
  replyPreviewThem: { backgroundColor: Colors.border, borderLeftColor: Colors.primary },
  replyName:        { fontSize: 11, fontWeight: "800", color: Colors.primary, marginBottom: 1 },
  replyContent:     { fontSize: 12, color: Colors.textSecondary },

  bubble:        { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  bubbleMe:      { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem:    { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleDeleted: { opacity: 0.5 },

  content:        { fontSize: 15, lineHeight: 22 },
  contentMe:      { color: "#FFF" },
  contentThem:    { color: Colors.text },
  contentDeleted: { fontStyle: "italic" },

  meta:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  time:     { fontSize: 10, color: Colors.textMuted },
  tick:     { fontSize: 11, color: Colors.textMuted },
  tickRead: { color: Colors.secondary },
});

// ─── TypingDots ───────────────────────────────────────────────────────────────
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();
    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);
  }, []);

  const dotStyle = (val: Animated.Value) => ({
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={td.row}>
      {[dot1, dot2, dot3].map((v, i) => (
        <Animated.View key={i} style={[td.dot, dotStyle(v)]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textMuted },
});

// ─── ReplyBanner ──────────────────────────────────────────────────────────────
function ReplyBanner({ replyTo, onCancel }: { replyTo: ReplyTo; onCancel: () => void }) {
  return (
    <View style={rbn.wrap}>
      <View style={rbn.bar} />
      <View style={{ flex: 1 }}>
        <Text style={rbn.name}>{replyTo.senderName}</Text>
        <Text style={rbn.content} numberOfLines={1}>{replyTo.content}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} hitSlop={10}>
        <Text style={rbn.close}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
const rbn = StyleSheet.create({
  wrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  bar:     { width: 3, height: "100%", backgroundColor: Colors.primary, borderRadius: 2, alignSelf: "stretch" },
  name:    { fontSize: 12, fontWeight: "800", color: Colors.primary, marginBottom: 2 },
  content: { fontSize: 12, color: Colors.textSecondary },
  close:   { fontSize: 18, color: Colors.textMuted, fontWeight: "700" },
});

// ─── ChatScreen ───────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }: any) {
  const { userId, username, profileImage } = route.params;

  const [messages,      setMessages]      = useState<Message[]>([]);
  const [inputText,     setInputText]     = useState("");
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [replyTo,       setReplyTo]       = useState<ReplyTo | null>(null);
  const [isTyping,      setIsTyping]      = useState(false);         // other person typing
  const [iAmTyping,     setIAmTyping]     = useState(false);         // I am typing
  const [onlineStatus,  setOnlineStatus]  = useState<"online"|"recently"|"offline">("offline");

  // Context menu
  const [menuMsg,   setMenuMsg]   = useState<Message | null>(null);
  const [menuOpen,  setMenuOpen]  = useState(false);

  // Emoji picker
  const [emojiMsg,  setEmojiMsg]  = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const flatListRef  = useRef<FlatList>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── setup ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setCurrentUserId(user?._id ?? user?.id ?? "");
    })();
    loadChat();
    markAsRead(userId).catch(() => {});

    // Poll messages every 3 s, typing every 2 s
    const msgPoll     = setInterval(loadChatSilent, 3000);
    const typingPoll  = setInterval(checkTyping,    2000);

    return () => {
      clearInterval(msgPoll);
      clearInterval(typingPoll);
      markAsRead(userId).catch(() => {});
      if (typingTimer.current) clearTimeout(typingTimer.current);
      setTyping(userId, false);
    };
  }, [userId]);

  const loadChat = async () => {
    try {
      const res = await getChatHistory(userId);
      setMessages(res.data ?? []);
    } catch (e) {
      console.log("loadChat error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadChatSilent = async () => {
    try {
      const res = await getChatHistory(userId);
      setMessages(res.data ?? []);
      await markAsRead(userId);
    } catch { /* silent */ }
  };

  const checkTyping = async () => {
    const t = await getTypingStatus(userId);
    setIsTyping(t);
  };

  // ── typing broadcast ─────────────────────────────────────────────────────────
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!iAmTyping) {
      setIAmTyping(true);
      setTyping(userId, true);
    }
    // Reset timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIAmTyping(false);
      setTyping(userId, false);
    }, 2500);
  };

  // ── send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText("");
    setReplyTo(null);
    setSending(true);

    // Stop typing indicator immediately
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIAmTyping(false);
    setTyping(userId, false);

    // Optimistic UI
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      _id:      tempId,
      content:  text,
      sender:   { _id: currentUserId, username: "Me" },
      receiver: { _id: userId, username },
      isRead:   false,
      isDeleted:false,
      createdAt:new Date().toISOString(),
      replyTo: replyTo
        ? { _id: replyTo._id, content: replyTo.content, sender: { username: replyTo.senderName } }
        : null,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res = await sendMessage(userId, text, replyTo?._id);
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m._id === tempId ? res.data : m));
    } catch (e) {
      // Rollback
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setInputText(text);
      Alert.alert("Send failed", "Could not deliver message. Try again.");
    } finally {
      setSending(false);
    }
  };

  // ── long-press context menu ───────────────────────────────────────────────────
  const openMenu = (msg: Message) => {
    setMenuMsg(msg);
    setMenuOpen(true);
  };

  const buildMenuItems = (): MenuItem[] => {
    if (!menuMsg) return [];
    const isMe = menuMsg.sender._id === currentUserId;
    const items: MenuItem[] = [];

    if (!menuMsg.isDeleted) {
      items.push({
        label: "Reply",
        icon: "↩️",
        action: () => setReplyTo({
          _id: menuMsg._id,
          content: menuMsg.content,
          senderName: isMe ? "You" : menuMsg.sender.username,
        }),
      });
      items.push({
        label: "React",
        icon: "😊",
        action: () => { setEmojiMsg(menuMsg._id); setEmojiOpen(true); },
      });
      items.push({
        label: "Copy text",
        icon: "📋",
        action: async () => {
          try {
            const Clipboard = require("@react-native-clipboard/clipboard").default;
            Clipboard.setString(menuMsg.content);
            Alert.alert("Copied", "Message copied to clipboard.");
          } catch {
            Alert.alert("Copied", menuMsg.content);
          }
        },
      });
    }

    if (isMe && !menuMsg.isDeleted) {
      items.push({
        label:  "Delete message",
        icon:   "🗑️",
        danger: true,
        action: () => confirmDeleteMessage(menuMsg._id),
      });
    }

    return items;
  };

  const confirmDeleteMessage = (msgId: string) => {
    Alert.alert("Delete Message", "This will remove the message for everyone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMessage(msgId);
            setMessages(prev =>
              prev.map(m =>
                m._id === msgId
                  ? { ...m, content: "This message was deleted", isDeleted: true }
                  : m
              )
            );
          } catch {
            Alert.alert("Error", "Could not delete message.");
          }
        },
      },
    ]);
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      "Clear Conversation",
      "Delete all messages in this chat? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(userId);
              setMessages([]);
            } catch {
              Alert.alert("Error", "Could not clear conversation.");
            }
          },
        },
      ]
    );
  };

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const res = await reactToMessage(msgId, emoji);
      // Update local reactions
      setMessages(prev =>
        prev.map(m =>
          m._id === msgId ? { ...m, reactions: res.data?.reactions ?? m.reactions } : m
        )
      );
    } catch { /* silent */ }
  };

  // ── render helpers ───────────────────────────────────────────────────────────
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe    = item.sender._id === currentUserId;
      const prev    = messages[index - 1];
      const showSep = !prev || formatDate(item.createdAt) !== formatDate(prev.createdAt);
      return (
        <MessageBubble
          msg={item}
          isMe={isMe}
          currentUserId={currentUserId}
          showDateSeparator={showSep}
          dateLabel={formatDate(item.createdAt)}
          onLongPress={openMenu}
          onReact={handleReact}
        />
      );
    },
    [messages, currentUserId]
  );

  // ── loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={10}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.headerProfile}
          activeOpacity={0.75}
          onPress={() => navigation.navigate("FriendProfile", { userId, username, profileImage })}
        >
          <View>
            <UserAvatar username={username} profileImage={profileImage} size={40} />
            {/* Online dot — placeholder; can be driven by a real presence API */}
            <View style={[s.onlineDot, { backgroundColor: "#22C55E" }]} />
          </View>
          <View style={s.headerTextCol}>
            <Text style={s.headerTitle}>{username}</Text>
            <Text style={[s.headerSub, isTyping && { color: Colors.primary }]}>
              {isTyping ? "typing..." : "tap to view profile"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Header actions */}
        <TouchableOpacity
          style={s.headerAction}
          onPress={handleDeleteConversation}
          hitSlop={10}
        >
          <Text style={s.headerActionText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
        keyboardVerticalOffset={90}
      >
        {/* ── Message list ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderMessage}
          contentContainerStyle={s.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>💬</Text>
              <Text style={s.emptyText}>No messages yet. Say hi!</Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={s.typingRow}>
                <UserAvatar username={username} profileImage={profileImage} size={24} />
                <View style={s.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* ── Reply banner ── */}
        {replyTo && (
          <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        {/* ── Input bar ── */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[s.sendBtn, (!inputText.trim() || sending) && s.sendBtnOff]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={s.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Long-press context menu ── */}
      <ContextMenu
        visible={menuOpen}
        items={buildMenuItems()}
        onClose={() => { setMenuOpen(false); setMenuMsg(null); }}
      />

      {/* ── Emoji picker ── */}
      <EmojiPickerModal
        visible={emojiOpen}
        onSelect={emoji => emojiMsg && handleReact(emojiMsg, emoji)}
        onClose={() => { setEmojiOpen(false); setEmojiMsg(null); }}
      />
    </SafeAreaView>
  );
}

// ─── screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  flex:      { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn:       { paddingRight: 4 },
  backText:      { fontSize: 34, color: Colors.primary, fontWeight: "300", lineHeight: 38 },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerTextCol: { flex: 1 },
  headerTitle:   { fontSize: 16, fontWeight: "800", color: Colors.text },
  headerSub:     { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  headerAction:  { padding: 6 },
  headerActionText: { fontSize: 20 },

  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.background },

  listContent: { paddingVertical: 8, paddingBottom: 16 },

  typingRow:    { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 14, paddingBottom: 4 },
  typingBubble: { backgroundColor: Colors.surface, borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 6 },

  empty:      { paddingTop: 80, alignItems: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText:  { fontSize: 14, color: Colors.textSecondary },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    padding: 10, paddingBottom: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  sendBtnOff: { opacity: 0.35 },
  sendIcon:   { color: "#FFF", fontSize: 20, fontWeight: "700" },
});
