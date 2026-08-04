import api from "./api";


// Fetch all published labs
export const getLabs = async () => {
  const response = await api.get("/labs");

  return response.data;
};


// Fetch single lab
export const getLabById = async (
  labId:string
) => {

  const response =
    await api.get(
      `/labs/${labId}`
    );

  return response.data;
};


// Complete lab
export const completeLab = async (
  labId:string
) => {

  const response =
    await api.post(
      `/labs/${labId}/complete`
    );

  return response.data;
};


// User progress
export const getLabProgress = async () => {

  const response =
    await api.get(
      "/labs/progress"
    );

  return response.data;
};