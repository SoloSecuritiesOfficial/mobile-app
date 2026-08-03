import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";




const ProfileScreen = () => {


  const [profile,setProfile] =
    useState<any>(null);


  const [loading,setLoading] =
    useState(true);



 



  if(loading){

    return (

      <View style={styles.center}>

        <ActivityIndicator
          size="large"
        />

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Profile
      </Text>


      <Text style={styles.text}>
        {profile?.username || "User"}
      </Text>


      <Text style={styles.text}>
        {profile?.email}
      </Text>


    </View>

  );

};


export default ProfileScreen;



const styles =
StyleSheet.create({

container:{
 flex:1,
 backgroundColor:"#000",
 padding:20,
},


center:{
 flex:1,
 justifyContent:"center",
 alignItems:"center",
},


title:{
 color:"#fff",
 fontSize:28,
 fontWeight:"700",
},


text:{
 color:"#fff",
 marginTop:10,
},

});