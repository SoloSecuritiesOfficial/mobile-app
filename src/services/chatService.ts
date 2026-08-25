import api from "./api";

export const sendMessage = async (
  receiverId: string,
  content: string,
  replyToId?: string,
) => {
  const res = await api.post("/chat/send", { receiverId, content, replyToId });
  return res.data;
};

export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data;
};

export const getChatHistory = async (userId: string, before?: string) => {
  const res = await api.get(`/chat/messages/${userId}`, {
    params: { before, limit: 50 },
  });
  return res.data;
};

export const markAsRead = async (userId: string) => {
  const res = await api.put(`/chat/mark-read/${userId}`);
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await api.get("/chat/unread-count");
  return res.data;
};

export const deleteMessage = async (messageId: string) => {
  const res = await api.delete(`/chat/messages/${messageId}`);
  return res.data;
};

export const deleteConversation = async (userId: string) => {
  const res = await api.delete(`/chat/conversation/${userId}`);
  return res.data;
};

export const reactToMessage = async (messageId: string, emoji: string) => {
  const res = await api.post(`/chat/messages/${messageId}/react`, { emoji });
  return res.data;
};

export const setTyping = async (receiverId: string, isTyping: boolean) => {
  try {
    await api.post("/chat/typing", { receiverId, isTyping });
  } catch {
    // typing is fire-and-forget — never throw
  }
};

export const getTypingStatus = async (userId: string): Promise<boolean> => {
  try {
    const res = await api.get(`/chat/typing/${userId}`);
    return res.data?.isTyping ?? false;
  } catch {
    return false;
  }
};
