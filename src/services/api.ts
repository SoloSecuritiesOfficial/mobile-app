import axios from "axios";

import {
  API_URL,
} from "../config/api";

import {
  getToken,
} from "../utils/storage";



const api = axios.create({

  baseURL: API_URL,

  timeout: 10000,

  headers: {

    "Content-Type":
      "application/json",

  },

});



// ===============================
// REQUEST INTERCEPTOR
// ===============================

api.interceptors.request.use(

async(config)=>{

  try{

    const token =
      await getToken();



    if(token){

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

    }



    // Debug API Request



    return config;


  }
  catch(error){

    console.log(
      "Request Interceptor Error:",
      error
    );


    return config;

  }

},


(error)=>{

  return Promise.reject(error);

}

);





// ===============================
// RESPONSE INTERCEPTOR
// ===============================


api.interceptors.response.use(

(response)=>{


  console.log(

    "API SUCCESS:",
    response.status,
    response.config.url

  );


  return response;


},


(error)=>{


  if(error.response){


    console.log(
      "===================="
    );


    console.log(
      "API FAILED:"
    );


    console.log(
      "URL:",
      error.config?.url
    );


    console.log(
      "METHOD:",
      error.config?.method
    );


    console.log(
      "STATUS:",
      error.response.status
    );


    console.log(
      "DATA:",
      error.response.data
    );


    console.log(
      "===================="
    );


  }

  else if(error.request){


    console.log(

      "NETWORK ERROR:",
      error.message

    );


  }

  else{


    console.log(

      "AXIOS ERROR:",
      error.message

    );


  }



  return Promise.reject(error);

}

);





// ===============================
// API HELPERS
// ===============================


export const apiGet = async(

endpoint:string

)=>{


  const response =
    await api.get(endpoint);


  return response.data;

};





export const apiPost = async(

endpoint:string,

data?:any

)=>{


  const response =
    await api.post(

      endpoint,

      data

    );


  return response.data;

};





export const apiPut = async(

endpoint:string,

data?:any

)=>{


  const response =
    await api.put(

      endpoint,

      data

    );


  return response.data;

};





export const apiDelete = async(

endpoint:string

)=>{


  const response =
    await api.delete(endpoint);


  return response.data;

};





export default api;