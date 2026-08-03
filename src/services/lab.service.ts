import api from "./api";



export const getLabs = async () => {

  const response =
    await api.get(
      "/labs"
    );


  return response.data;

};





export const getLabById = async (
  labId: string
) => {


  const response =
    await api.get(
      `/labs/${labId}`
    );


  return response.data;

};





export const completeLab = async (
  labId: string
) => {


  const response =
    await api.post(
      `/labs/${labId}/complete`
    );


  return response.data;

};





export const getLabProgress = async () => {


  const response =
    await api.get(
      "/labs/progress"
    );


  return response.data;

};