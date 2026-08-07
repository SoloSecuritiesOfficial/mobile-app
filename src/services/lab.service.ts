import api from "./api";

// All lab routes live under /security/labs on the backend

// Fetch all published labs
export const getLabs = async () => {
  const response = await api.get("/security/labs");
  return response.data;
};

// Fetch single lab
export const getLabById = async (labId: string) => {
  const response = await api.get(`/security/labs/${labId}`);
  return response.data;
};

// Complete lab
export const completeLab = async (labId: string) => {
  const response = await api.post(`/security/labs/${labId}/complete`);
  return response.data;
};

// User progress
export const getLabProgress = async () => {
  const response = await api.get("/security/labs/progress");
  return response.data;
};
