import * as ImagePicker from "expo-image-picker";

import api from "./api";




export const pickProfileImage = async () => {


const permission =
await ImagePicker.requestMediaLibraryPermissionsAsync();



if(!permission.granted){

throw new Error(
"Gallery permission denied"
);

}





const result =
await ImagePicker.launchImageLibraryAsync({

mediaTypes:
ImagePicker.MediaTypeOptions.Images,

allowsEditing:true,

aspect:[
1,
1
],

quality:0.8,

});






if(result.canceled){

return null;

}





return result.assets[0];

};









export const uploadProfileImage = async (
image:ImagePicker.ImagePickerAsset
)=>{



try{



const formData =
new FormData();





formData.append(

"image",

{

uri:image.uri,

name:
image.fileName ||
"profile.jpg",

type:
image.mimeType ||
"image/jpeg",

} as any

);







const response =
await api.post(

"/user/upload-profile",

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

error

);



throw error;



}



};









export const updateProfile = async(
data:{
firstName?:string;
lastName?:string;
bio?:string;
country?:string;
github?:string;
linkedin?:string;
website?:string;
}
)=>{


try{


const response =
await api.put(

"/user/profile",

data

);



return response.data;



}
catch(error:any){


console.log(
"Update Profile Error:",
error
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
error
);


throw error;


}


};