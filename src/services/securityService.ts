import { apiGet, apiPost } from "./apiClient";



/*
  GET USER SECURITY SCORE
*/
export const getSecurityScore =
  async () => {

    try {

      const response =
        await apiGet(
          "/security/score"
        );


      return response;


    } catch (error) {


      throw error;


    }

  };







/*
  GET LATEST CVE UPDATES
*/
export const getCVEUpdates =
  async () => {


    try {


      const response =
        await apiGet(
          "/security/cves"
        );


      return response;


    } catch (error) {


      throw error;


    }


  };







/*
  GET BUG REPORTS
*/
export const getBugReports =
  async () => {


    try {


      const response =
        await apiGet(
          "/security/bugs"
        );


      return response;


    } catch (error) {


      throw error;


    }


  };








/*
  SUBMIT BUG REPORT
*/
export const submitBugReport =
  async (
    data: {
      title: string;
      description: string;
      severity: string;
    }
  ) => {


    try {


      const response =
        await apiPost(
          "/security/bugs/report",
          data
        );


      return response;



    } catch (error) {


      throw error;


    }


  };








/*
  START SECURITY SCAN
*/
export const startSecurityScan =
  async (
    target: string
  ) => {


    try {


      const response =
        await apiPost(
          "/security/scan",
          {
            target,
          }
        );


      return response;



    } catch (error) {


      throw error;


    }


  };








/*
  GET SCAN HISTORY
*/
export const getScanHistory =
  async () => {


    try {


      const response =
        await apiGet(
          "/security/scans"
        );


      return response;



    } catch (error) {


      throw error;


    }


  };







/*
  GET DASHBOARD DATA
*/
export const getSecurityDashboard = async () => {
  try {
    const response = await apiGet("/security/dashboard");
    return response;
  } catch (error) {
    throw error;
  }
};

/*
  GET LEARNING MODULES
*/
export const getLearningModules = async () => {
  try {
    const response = await apiGet("/security/learning");
    return response;
  } catch (error) {
    throw error;
  }
};

/*
  ADD NEW CVE (ADMIN)
*/
export const addCVE = async (data: {
  cveId: string;
  title: string;
  severity: string;
  score?: number;
  description: string;
  remediation?: string;
}) => {
  try {
    const response = await apiPost("/security/cves", data);
    return response;
  } catch (error) {
    throw error;
  }
};


