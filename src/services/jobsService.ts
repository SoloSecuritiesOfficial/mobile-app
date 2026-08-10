import api from "./api";

export const getJobs = async (params?: {
  search?: string;
  locationType?: string;
  jobType?: string;
  experienceLevel?: string;
  skill?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.search)          qs.set("search",          params.search);
  if (params?.locationType)    qs.set("locationType",    params.locationType);
  if (params?.jobType)         qs.set("jobType",         params.jobType);
  if (params?.experienceLevel) qs.set("experienceLevel", params.experienceLevel);
  if (params?.skill)           qs.set("skill",           params.skill);
  if (params?.page)            qs.set("page",            String(params.page));
  if (params?.limit)           qs.set("limit",           String(params.limit));
  const q = qs.toString();
  const response = await api.get(`/jobs${q ? "?" + q : ""}`);
  return response.data;
};

export const getJobById = async (id: string) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const trackApply = async (id: string) => {
  try {
    await api.post(`/jobs/${id}/apply`);
  } catch {
    // Non-critical — tracking failure should not block the user
  }
};
