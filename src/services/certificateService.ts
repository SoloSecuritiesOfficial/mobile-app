import api from "./api";





export const getCertificates = async()=>{


try{


const response =
await api.get(
"/security/certificates"
);



return response.data;



}
catch(error:any){


console.log(
"Get Certificates Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const getCertificateById = async(
id:string
)=>{


try{


const response =
await api.get(
`/security/certificates/${id}`
);



return response.data;



}
catch(error:any){


console.log(
"Certificate Details Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const verifyCertificate = async(
certificateId:string
)=>{


try{


const response =
await api.get(
`/security/certificates/verify/${certificateId}`
);



return response.data;



}
catch(error:any){


console.log(
"Certificate Verify Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const issueCertificate = async(
data:{
title:string;
category:
"Bug Bounty"
|
"Web Security"
|
"Network Security"
|
"Cloud Security"
|
"CTF"
|
"Learning"
|
"Other";
description?:string;
skills?:string;
}
)=>{


try{


const response =
await api.post(
"/security/certificates/issue",
data
);



return response.data;



}
catch(error:any){


console.log(
"Issue Certificate Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const revokeCertificate = async(
certificateId:string
)=>{


try{


const response =
await api.put(
`/security/certificates/${certificateId}/revoke`
);



return response.data;



}
catch(error:any){


console.log(
"Revoke Certificate Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const getCertificateCount = async()=>{


try{


const response =
await api.get(
"/security/certificates/count"
);



return response.data;



}
catch(error:any){


console.log(
"Certificate Count Error:",
error.response?.data ||
error.message
);



throw error;


}


};