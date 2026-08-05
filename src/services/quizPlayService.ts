import api from "./api";

export const startQuiz = async (
  userId: string,
  quizId: string
) => {
  const res = await api.post("/quiz/start", {
    userId,
    quizId,
  });

  return res.data;
};