import api from "./api";



export const getNotifications = async()=>{

try{


const response =
await api.get(
"/notifications"
);


return response.data;


}
catch(error:any){


console.log(
"Get Notifications Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getUnreadNotifications = async()=>{

try{


const response =
await api.get(
"/notifications/unread"
);


return response.data;


}
catch(error:any){


console.log(
"Get Unread Notifications Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getNotificationById = async(
id:string
)=>{

try{


const response =
await api.get(
`/notifications/${id}`
);


return response.data;


}
catch(error:any){


console.log(
"Notification Details Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const markNotificationAsRead = async(
id:string
)=>{

try{


const response =
await api.put(
`/notifications/${id}/read`
);


return response.data;


}
catch(error:any){


console.log(
"Mark Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const markAllNotificationsAsRead = async()=>{

try{


const response =
await api.put(
"/notifications/read-all"
);


return response.data;


}
catch(error:any){


console.log(
"Mark All Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const deleteNotification = async(
id:string
)=>{

try{


const response =
await api.delete(
`/notifications/${id}`
);


return response.data;


}
catch(error:any){


console.log(
"Delete Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const deleteAllNotifications = async()=>{

try{


const response =
await api.delete(
"/notifications"
);


return response.data;


}
catch(error:any){


console.log(
"Delete All Notification Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const getUnreadNotificationCount = async()=>{

try{


const response =
await api.get(
"/notifications/count"
);


return response.data;


}
catch(error:any){


console.log(
"Notification Count Error:",
error.response?.data ||
error.message
);


throw error;


}


};







export const triggerAppNotification = (
title:string,
body:string
)=>{


console.log(
"Local Notification:",
title,
body
);


};







export const requestNotificationPermissions = async()=>{


return true;


};