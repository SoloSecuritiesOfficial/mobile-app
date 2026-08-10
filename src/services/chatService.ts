import api from "./api";

export const sendMessage = async (receiverId: string, content: string) => {
  const res = await api.post("/chat/send", { receiverId, content });
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
