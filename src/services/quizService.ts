import api from "./api";

export const getQuizzes = async () => {
  const response = await api.get("/quiz");

  return response.data.data;
};

export const getQuizById = async (id: string) => {
  const response = await api.get(`/quiz/${id}`);

  return response.data.data;
};

export const startQuiz = async (
  userId: string,
  quizId: string
) => {
  const response = await api.post("/quiz/start", {
    userId,
    quizId,
  });

  return response.data.data;
};

export const submitQuiz = async (payload: any) => {
  const response = await api.post(
    "/quiz/submit",
    payload
  );

  return response.data;
};

export default {
  getQuizzes,
  getQuizById,
  startQuiz,
  submitQuiz,
};