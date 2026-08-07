import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "./api";


/* -------------------------------------------------------------------------- */
/* Dashboard */
/* -------------------------------------------------------------------------- */

export const getSecurityDashboard = async () => {

  try {

    return await apiGet(
      "/security/dashboard"
    );

  } catch (error) {

    console.error(
      "Dashboard Error:",
      error
    );

    throw error;

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

    console.error(
      "CVE Fetch Error:",
      error
    );

    throw error;

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

    console.error(
      "Learning Modules Error:",
      error
    );

    throw error;

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

    console.error(
      "Learning Details Error:",
      error
    );

    throw error;

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

    console.error(
      "Complete Learning Error:",
      error
    );

    throw error;

  }

};



export const getLearningProgress = async () => {

  try {

    return await apiGet(
      "/security/learning/progress"
    );

  } catch(error){

    console.error(
      "Learning Progress Error:",
      error
    );

    throw error;

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

    console.error(
      "Labs Error:",
      error
    );

    throw error;

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

    console.error(
      "Lab Details Error:",
      error
    );

    throw error;

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

    console.error(
      "Complete Lab Error:",
      error
    );

    throw error;

  }

};



export const getLabProgress = async () => {

  try {

    return await apiGet(
      "/security/labs/progress"
    );

  } catch(error){

    console.error(
      "Lab Progress Error:",
      error
    );

    throw error;

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

    console.error(
      "Bug Reports Error:",
      error
    );

    throw error;

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

    console.error(
      "Bug Details Error:",
      error
    );

    throw error;

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

    console.error(
      "Submit Bug Error:",
      error
    );

    throw error;

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

    console.error(
      "Security Scan Error:",
      error
    );

    throw error;

  }

};



export const getScanHistory = async () => {

  try {

    return await apiGet(
      "/security/scans"
    );

  } catch(error){

    console.error(
      "Scan History Error:",
      error
    );

    throw error;

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

    console.error(
      "Certificates Error:",
      error
    );

    throw error;

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

    console.error(
      "Certificate Details Error:",
      error
    );

    throw error;

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

    console.error(
      "Certificate Verify Error:",
      error
    );

    throw error;

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

    console.error(
      "Issue Certificate Error:",
      error
    );

    throw error;

  }

};



/* -------------------------------------------------------------------------- */
/* Notifications */
/* -------------------------------------------------------------------------- */

export const getNotifications = async () => {

  return await apiGet(
    "/notifications"
  );

};



export const getUnreadNotifications = async () => {

  return await apiGet(
    "/notifications/unread"
  );

};



export const markNotificationRead = async (
  id:string
) => {

  return await apiPut(
    `/notifications/${id}/read`,
    {}
  );

};



export const markAllNotificationsRead = async () => {

  return await apiPut(
    "/notifications/read-all",
    {}
  );

};



export const deleteNotification = async (
  id:string
) => {

  return await apiDelete(
    `/notifications/${id}`
  );

};



/* -------------------------------------------------------------------------- */
/* Profile */
/* -------------------------------------------------------------------------- */

export const getProfile = async () => {

  return await apiGet(
    "/user/profile"
  );

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

  return await apiPut(
    "/user/profile",
    data
  );

};