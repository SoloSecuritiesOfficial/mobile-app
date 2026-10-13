import api from "./api";
import { logError, createAppError } from "../utils/errorHandling";

export const getQuizzes = async () => {
  try {
    const response = await api.get("/quiz");
    return response.data.data;
  } catch (error) {
    logError(error, { function: "getQuizzes", endpoint: "/quiz" });
    throw createAppError(error, { function: "getQuizzes", endpoint: "/quiz" });
  }
};

export const getQuizById = async (id: string) => {
  try {
    const response = await api.get(`/quiz/${id}`);
    return response.data.data;
  } catch (error) {
    logError(error, { function: "getQuizById", endpoint: `/quiz/${id}`, id });
    throw createAppError(error, { function: "getQuizById", endpoint: `/quiz/${id}`, id });
  }
};

export const startQuiz = async (
  userId: string,
  quizId: string
) => {
  try {
    const response = await api.post("/quiz/start", {
      userId,
      quizId,
    });
    return response.data.data;
  } catch (error) {
    logError(error, { function: "startQuiz", endpoint: "/quiz/start", userId, quizId });
    throw createAppError(error, { function: "startQuiz", endpoint: "/quiz/start", userId, quizId });
  }
};

export const submitQuiz = async (payload: any) => {
  try {
    const response = await api.post(
      "/quiz/submit",
      payload
    );
    return response.data;
  } catch (error) {
    logError(error, { function: "submitQuiz", endpoint: "/quiz/submit" });
    throw createAppError(error, { function: "submitQuiz", endpoint: "/quiz/submit" });
  }
};

export const getUserQuizHistory = async (userId: string) => {
  try {
    const response = await api.get(`/quiz/history/${userId}`);
    return response.data;
  } catch (err) {
    logError(err, { function: "getUserQuizHistory", endpoint: `/quiz/history/${userId}`, userId });
    return [];
  }
};

export default {
  getQuizzes,
  getQuizById,
  startQuiz,
  submitQuiz,
  getUserQuizHistory,
};