import React, {
useState,
} from "react";


import {
SafeAreaView,
View,
Text,
StyleSheet,
KeyboardAvoidingView,
Platform,
ScrollView,
TouchableOpacity,
Image,
Alert,
} from "react-native";


import {
NativeStackScreenProps,
} from "@react-navigation/native-stack";


import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";


import {
RootStackParamList,
} from "../navigation/AppNavigator";


import {
loginUser,
} from "../services/authService";



type Props =
NativeStackScreenProps<
RootStackParamList,
"Login"
>;





export default function LoginScreen({
navigation,
}:Props){



const [email,setEmail] =
useState("");

const [password,setPassword] =
useState("");


const [loading,setLoading] =
useState(false);



const [errors,setErrors] =
useState({

email:"",

password:"",

});






const validate = ()=>{


let valid=true;


const newErrors={

email:"",

password:"",

};





if(!email.trim()){


newErrors.email =
"Email is required";

valid=false;


}
else if(
!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
email.trim()
)
){


newErrors.email =
"Enter valid email";

valid=false;


}






if(!password.trim()){


newErrors.password =
"Password is required";

valid=false;


}
else if(password.length<6){


newErrors.password =
"Password must contain 6 characters";

valid=false;


}



setErrors(newErrors);


return valid;


};







const handleLogin = async()=>{


if(!validate())
return;



if(loading)
return;



try{


setLoading(true);



const response =
await loginUser({

email:
email.trim(),

password,

});





if(response?.success){


navigation.replace(
"Dashboard"
);


return;


}






Alert.alert(

"Login Failed",

response?.message ||
"Invalid credentials"

);



}
catch(error:any){



console.log(
"Login Error:",
error
);



const message =
error?.response?.data?.message ||
"Unable to login";



Alert.alert(
"Login Failed",
message
);



}
finally{


setLoading(false);


}


};







return(

<SafeAreaView style={styles.container}>


<KeyboardAvoidingView

style={styles.keyboardView}

behavior={
Platform.OS==="ios"
?
"padding"
:
undefined
}

>


<ScrollView

contentContainerStyle={
styles.scroll
}

keyboardShouldPersistTaps="handled"

showsVerticalScrollIndicator={false}

>





<Image

source={
require("../../assets/logo.png")
}

style={styles.logo}

resizeMode="contain"

/>





<Text style={styles.title}>

Welcome Back

</Text>




<Text style={styles.subtitle}>

Login to your
SoloSecurities account

</Text>







<View style={styles.form}>


<InputField

label="Email Address"

icon="email-outline"

placeholder="Enter email"

keyboardType="email-address"

autoCapitalize="none"

value={email}

onChangeText={(value)=>{


setEmail(value);


if(errors.email){

setErrors({

...errors,

email:""

});

}


}}

error={errors.email}

/>







<InputField

label="Password"

icon="lock-outline"

placeholder="Enter password"

password

value={password}

onChangeText={(value)=>{


setPassword(value);


if(errors.password){

setErrors({

...errors,

password:""

});

}


}}

error={errors.password}

/>









<TouchableOpacity

style={styles.forgotContainer}

disabled={loading}

onPress={()=>


navigation.navigate(
"ForgotPassword"
)

}

>


<Text style={styles.forgotText}>

Forgot Password?

</Text>


</TouchableOpacity>









<View style={styles.button}>


<PrimaryButton

title="LOGIN"

loading={loading}

onPress={handleLogin}

/>


</View>









<View style={styles.bottomRow}>


<Text style={styles.bottomText}>

Don't have an account?

</Text>




<TouchableOpacity

disabled={loading}

onPress={()=>


navigation.navigate(
"Register"
)

}

>


<Text style={styles.registerText}>

Create Account

</Text>


</TouchableOpacity>



</View>





</View>




</ScrollView>



</KeyboardAvoidingView>



</SafeAreaView>


);


}









const styles =
StyleSheet.create({



container:{


flex:1,

backgroundColor:"#FFFFFF",


},



keyboardView:{


flex:1,


},



scroll:{


flexGrow:1,

justifyContent:"center",

paddingHorizontal:24,

paddingVertical:40,


},



logo:{


width:120,

height:120,

alignSelf:"center",

marginBottom:20,


},



title:{


fontSize:30,

fontWeight:"700",

textAlign:"center",

color:"#111",


},



subtitle:{


marginTop:10,

marginBottom:35,

fontSize:16,

textAlign:"center",

color:"#666",

lineHeight:24,


},



form:{


width:"100%",


},



forgotContainer:{


alignItems:"flex-end",

marginTop:8,


},



forgotText:{


color:"#C62828",

fontWeight:"600",


},



button:{


marginTop:25,


},



bottomRow:{


marginTop:35,

flexDirection:"row",

justifyContent:"center",

alignItems:"center",


},



bottomText:{


color:"#555",


},



registerText:{


marginLeft:6,

color:"#C62828",

fontWeight:"700",


},



});