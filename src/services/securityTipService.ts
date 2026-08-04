import api from "./api";

export const getTodaySecurityTip = async () => {
  try {
    const response = await api.get("/tips/today");

    return response.data;
  } catch (error) {
    console.log("Security Tip Error:", error);
    return null;
  }
};