import api from "./api";


import {
  saveToken,
  saveUser,
  getUser,
  getToken,
  removeToken,
} from "../utils/storage";




export const registerUser = async(
data:{
  username:string;
  email:string;
  password:string;
}
)=>{


try{


const response =
await api.post(
"/auth/register",
data
);



if(
response.data.token
){

await saveToken(
response.data.token
);

}



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
"Register Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const loginUser = async(
data:{
email:string;
password:string;
}
)=>{


try{


const response =
await api.post(
"/auth/login",
data
);



if(
response.data.token
){

await saveToken(
response.data.token
);

}



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
"Login Error:",
error.response?.data ||
error.message
);


throw error;


}


};








export const getProfile = async()=>{


try{


const response =
await api.get(
"/user/profile"
);



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
data:any
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
"/user/change-password",
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








export const fetchCurrentUser = async()=>{


try{


const response =
await api.get(
"/user/profile"
);



if(
response.data.success &&
response.data.user
){

await saveUser(
response.data.user
);



return response.data.user;


}



return null;



}
catch(error){


console.log(
"Fetch Current User Error:",
error
);


return null;


}


};








export const getCurrentUser = async()=>{


return await getUser();


};








export const logout = async()=>{


await removeToken();


};








export const dailyCheckIn = async () => {
  try {
    const response = await api.post("/user/daily-checkin", {});
    return response.data;
  } catch (error: any) {
    console.log("Daily Check-in Error:", error.response?.data || error.message);
    throw error;
  }
};

export const isLoggedIn = async()=>{


const token =
await getToken();



return !!token;


};


// ─────────────────────────────────────────────────────────────────
// DELETE ACCOUNT — soft-delete via DELETE /user/account
// ─────────────────────────────────────────────────────────────────
export const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await api.delete("/user/account");
    if (response.data.success) {
      // Wipe local credentials immediately
      await removeToken();
    }
    return response.data;
  } catch (error: any) {
    console.log("Delete Account Error:", error.response?.data || error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────
// GET SUBSCRIPTION STATUS — returns tier + expiry for badge display
// ─────────────────────────────────────────────────────────────────
export const getSubscriptionStatus = async (): Promise<{
  tier: "free" | "trial" | "paid";
  isPremium: boolean;
  premiumExpiresAt?: string;
  provider?: string;
} | null> => {
  try {
    const response = await api.get("/subscription/status");
    return response.data?.data ?? null;
  } catch {
    // Non-critical — return null on failure
    return null;
  }
};
