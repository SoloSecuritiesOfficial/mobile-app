import api from "./api";
import { logError, createAppError } from "../utils/errorHandling";


/* -------------------------------------------------------------------------- */
/* Helper wrappers so the rest of the file doesn't change                     */
/* -------------------------------------------------------------------------- */

const apiGet    = (url: string)              => api.get(url).then(r => r.data);
const apiPost   = (url: string, data: any)   => api.post(url, data).then(r => r.data);
const apiPut    = (url: string, data: any)   => api.put(url, data).then(r => r.data);
const apiDelete = (url: string)              => api.delete(url).then(r => r.data);


/* -------------------------------------------------------------------------- */
/* Dashboard */
/* -------------------------------------------------------------------------- */

export const getSecurityDashboard = async () => {

  try {

    return await apiGet(
      "/security/dashboard"
    );

  } catch (error) {

    logError(error, { function: "getSecurityDashboard", endpoint: "/security/dashboard" });
    throw createAppError(error, { function: "getSecurityDashboard", endpoint: "/security/dashboard" });

  }

};


/* -------------------------------------------------------------------------- */
/* CVE Updates */
/* -------------------------------------------------------------------------- */

export const getCVEUpdates = async () => {

  try {

    return await apiGet(
      "/security/cves"
    );

  } catch (error) {

    logError(error, { function: "getCVEUpdates", endpoint: "/security/cves" });
    throw createAppError(error, { function: "getCVEUpdates", endpoint: "/security/cves" });

  }

};


/* -------------------------------------------------------------------------- */
/* Learning */
/* -------------------------------------------------------------------------- */

export const getLearningModules = async () => {

  try {

    return await apiGet(
      "/security/learning"
    );

  } catch(error){

    logError(error, { function: "getLearningModules", endpoint: "/security/learning" });
    throw createAppError(error, { function: "getLearningModules", endpoint: "/security/learning" });

  }

};


export const getLearningModuleById = async (
  id:string
) => {

  try {

    return await apiGet(
      `/security/learning/${id}`
    );

  } catch(error){

    logError(error, { function: "getLearningModuleById", endpoint: `/security/learning/${id}`, id });
    throw createAppError(error, { function: "getLearningModuleById", endpoint: `/security/learning/${id}`, id });

  }

};


export const completeLearningModule = async (
  id:string
) => {

  try {

    return await apiPost(
      `/security/learning/${id}/complete`,
      {}
    );

  } catch(error){

    logError(error, { function: "completeLearningModule", endpoint: `/security/learning/${id}/complete`, id });
    throw createAppError(error, { function: "completeLearningModule", endpoint: `/security/learning/${id}/complete`, id });

  }

};


export const getLearningProgress = async () => {

  try {

    return await apiGet(
      "/security/learning/progress"
    );

  } catch(error){

    logError(error, { function: "getLearningProgress", endpoint: "/security/learning/progress" });
    throw createAppError(error, { function: "getLearningProgress", endpoint: "/security/learning/progress" });

  }

};


/* -------------------------------------------------------------------------- */
/* Labs */
/* -------------------------------------------------------------------------- */

export const getLabs = async () => {

  try {

    return await apiGet(
      "/security/labs"
    );

  } catch(error){

    logError(error, { function: "getLabs", endpoint: "/security/labs" });
    throw createAppError(error, { function: "getLabs", endpoint: "/security/labs" });

  }

};


export const getLabById = async (
  id:string
) => {

  try {

    return await apiGet(
      `/security/labs/${id}`
    );

  } catch(error){

    logError(error, { function: "getLabById", endpoint: `/security/labs/${id}`, id });
    throw createAppError(error, { function: "getLabById", endpoint: `/security/labs/${id}`, id });

  }

};


export const completeLab = async (
  id:string
) => {

  try {

    return await apiPost(
      `/security/labs/${id}/complete`,
      {}
    );

  } catch(error){

    logError(error, { function: "completeLab", endpoint: `/security/labs/${id}/complete`, id });
    throw createAppError(error, { function: "completeLab", endpoint: `/security/labs/${id}/complete`, id });

  }

};


export const getLabProgress = async () => {

  try {

    return await apiGet(
      "/security/labs/progress"
    );

  } catch(error){

    logError(error, { function: "getLabProgress", endpoint: "/security/labs/progress" });
    throw createAppError(error, { function: "getLabProgress", endpoint: "/security/labs/progress" });

  }

};


/* -------------------------------------------------------------------------- */
/* Bug Reports */
/* -------------------------------------------------------------------------- */

export const getBugReports = async () => {

  try {

    return await apiGet(
      "/security/bugs"
    );

  } catch(error){

    logError(error, { function: "getBugReports", endpoint: "/security/bugs" });
    throw createAppError(error, { function: "getBugReports", endpoint: "/security/bugs" });

  }

};


export const getBugReportById = async (
  id:string
) => {

  try {

    return await apiGet(
      `/security/bugs/${id}`
    );

  } catch(error){

    logError(error, { function: "getBugReportById", endpoint: `/security/bugs/${id}`, id });
    throw createAppError(error, { function: "getBugReportById", endpoint: `/security/bugs/${id}`, id });

  }

};


export const submitBugReport = async (
  data:{
    title:string;
    description:string;
    severity?:string;
    targetSystem?:string;
    platform?:string;
  }
) => {

  try {

    return await apiPost(
      "/security/bugs/report",
      data
    );

  } catch(error){

    logError(error, { function: "submitBugReport", endpoint: "/security/bugs/report" });
    throw createAppError(error, { function: "submitBugReport", endpoint: "/security/bugs/report" });

  }

};

export const acknowledgeBugReport = async (id: string) => {
  try {
    const apiPatch = (url: string) => api.patch(url).then(r => r.data);
    return await apiPatch(`/security/bugs/${id}/acknowledge`);
  } catch (error) {
    logError(error, { function: "acknowledgeBugReport", endpoint: `/security/bugs/${id}/acknowledge`, id });
    throw createAppError(error, { function: "acknowledgeBugReport", endpoint: `/security/bugs/${id}/acknowledge`, id });
  }
};


/* -------------------------------------------------------------------------- */
/* Security Scan */
/* -------------------------------------------------------------------------- */

export const startSecurityScan = async (
  target:string
) => {

  try {

    return await apiPost(
      "/security/scan",
      {
        target,
      }
    );

  } catch(error){

    logError(error, { function: "startSecurityScan", endpoint: "/security/scan", target });
    throw createAppError(error, { function: "startSecurityScan", endpoint: "/security/scan", target });

  }

};


export const getScanHistory = async () => {

  try {

    return await apiGet(
      "/security/scans"
    );

  } catch(error){

    logError(error, { function: "getScanHistory", endpoint: "/security/scans" });
    throw createAppError(error, { function: "getScanHistory", endpoint: "/security/scans" });

  }

};


/* -------------------------------------------------------------------------- */
/* Certificates */
/* -------------------------------------------------------------------------- */

export const getCertificates = async () => {

  try {

    return await apiGet(
      "/security/certificates"
    );

  } catch(error){

    logError(error, { function: "getCertificates", endpoint: "/security/certificates" });
    throw createAppError(error, { function: "getCertificates", endpoint: "/security/certificates" });

  }

};


export const getCertificateById = async (
  id:string
) => {

  try {

    return await apiGet(
      `/security/certificates/${id}`
    );

  } catch(error){

    logError(error, { function: "getCertificateById", endpoint: `/security/certificates/${id}`, id });
    throw createAppError(error, { function: "getCertificateById", endpoint: `/security/certificates/${id}`, id });

  }

};


export const verifyCertificate = async (
  certificateId:string
) => {

  try {

    return await apiGet(
      `/security/certificates/verify/${certificateId}`
    );

  } catch(error){

    logError(error, { function: "verifyCertificate", endpoint: `/security/certificates/verify/${certificateId}`, certificateId });
    throw createAppError(error, { function: "verifyCertificate", endpoint: `/security/certificates/verify/${certificateId}`, certificateId });

  }

};


export const issueCertificate = async (
  data:{
    title: string;
    category: string;
    description?: string;
    skills?: string[];
  }
) => {

  try {

    return await apiPost(
      "/security/certificates/issue",
      data
    );

  } catch(error){

    logError(error, { function: "issueCertificate", endpoint: "/security/certificates/issue" });
    throw createAppError(error, { function: "issueCertificate", endpoint: "/security/certificates/issue" });

  }

};


/* -------------------------------------------------------------------------- */
/* Notifications */
/* -------------------------------------------------------------------------- */

export const getNotifications = async () => {

  try {
    return await apiGet("/notifications");
  } catch (error) {
    logError(error, { function: "getNotifications", endpoint: "/notifications" });
    throw createAppError(error, { function: "getNotifications", endpoint: "/notifications" });
  }

};


export const getUnreadNotifications = async () => {

  try {
    return await apiGet("/notifications/unread");
  } catch (error) {
    logError(error, { function: "getUnreadNotifications", endpoint: "/notifications/unread" });
    throw createAppError(error, { function: "getUnreadNotifications", endpoint: "/notifications/unread" });
  }

};


export const markNotificationRead = async (
  id:string
) => {

  try {
    return await apiPut(`/notifications/${id}/read`, {});
  } catch (error) {
    logError(error, { function: "markNotificationRead", endpoint: `/notifications/${id}/read`, id });
    throw createAppError(error, { function: "markNotificationRead", endpoint: `/notifications/${id}/read`, id });
  }

};


export const markAllNotificationsRead = async () => {

  try {
    return await apiPut("/notifications/read-all", {});
  } catch (error) {
    logError(error, { function: "markAllNotificationsRead", endpoint: "/notifications/read-all" });
    throw createAppError(error, { function: "markAllNotificationsRead", endpoint: "/notifications/read-all" });
  }

};


export const deleteNotification = async (
  id:string
) => {

  try {
    return await apiDelete(`/notifications/${id}`);
  } catch (error) {
    logError(error, { function: "deleteNotification", endpoint: `/notifications/${id}`, id });
    throw createAppError(error, { function: "deleteNotification", endpoint: `/notifications/${id}`, id });
  }

};


/* -------------------------------------------------------------------------- */
/* Profile */
/* -------------------------------------------------------------------------- */

export const getProfile = async () => {

  try {
    return await apiGet("/user/profile");
  } catch (error) {
    logError(error, { function: "getProfile", endpoint: "/user/profile" });
    throw createAppError(error, { function: "getProfile", endpoint: "/user/profile" });
  }

};


export const updateProfile = async (
  data:{
    firstName?: string;
    lastName?: string;
    bio?: string;
    country?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  }
) => {

  try {
    return await apiPut("/user/profile", data);
  } catch (error) {
    logError(error, { function: "updateProfile", endpoint: "/user/profile" });
    throw createAppError(error, { function: "updateProfile", endpoint: "/user/profile" });
  }

};