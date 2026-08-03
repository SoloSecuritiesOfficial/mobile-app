import api from "./api";

import {
  saveUser,
} from "../utils/storage";




export const getProfile = async()=>{


try{


const response =
await api.get(
"/user/profile"
);



if(
response.data.user
){

await saveUser(
response.data.user
);

}



return response.data;



}
catch(error:any){


console.log(
"Get Profile Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const updateProfile = async(
data:{
username?:string;
firstName?:string;
lastName?:string;
bio?:string;
country?:string;
github?:string;
linkedin?:string;
website?:string;
profileImage?:string;
}
)=>{


try{


const response =
await api.put(
"/user/profile",
data
);



if(
response.data.user
){

await saveUser(
response.data.user
);

}



return response.data;



}
catch(error:any){


console.log(
"Update Profile Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const changePassword = async(
data:{
oldPassword:string;
newPassword:string;
}
)=>{


try{


const response =
await api.put(
"/user/password",
data
);



return response.data;



}
catch(error:any){


console.log(
"Change Password Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const getUserStats = async()=>{


try{


const response =
await api.get(
"/user/stats"
);



return response.data;



}
catch(error:any){


console.log(
"User Stats Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const uploadProfileImage = async(
image:any
)=>{


try{


const formData =
new FormData();



formData.append(
"image",
image
);



const response =
await api.post(
"/user/profile/image",
formData,
{
headers:{
"Content-Type":
"multipart/form-data",
},
}
);



return response.data;



}
catch(error:any){


console.log(
"Profile Image Upload Error:",
error.response?.data ||
error.message
);



throw error;


}


};







export const deleteAccount = async()=>{


try{


const response =
await api.delete(
"/user/profile"
);



return response.data;



}
catch(error:any){


console.log(
"Delete Account Error:",
error.response?.data ||
error.message
);



throw error;


}


};