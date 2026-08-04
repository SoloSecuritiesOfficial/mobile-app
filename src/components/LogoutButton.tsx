import React from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import {
  useNavigation,
} from "@react-navigation/native";

import {
  logout,
} from "../services/authService";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";


const LogoutButton = () => {


  const navigation =
    useNavigation();



  const handleLogout = () => {


    Alert.alert(

      "Logout",

      "Are you sure you want to logout?",

      [

        {
          text: "Cancel",

          style: "cancel",

        },


        {

          text: "Logout",

          style: "destructive",


          onPress: async () => {


            try {


              await logout();


              navigation.reset({

                index: 0,

                routes: [

                  {
                    name: "Login" as never,
                  },

                ],

              });


            } catch (error) {


              console.log(
                "Logout Error:",
                error
              );


            }


          },

        },


      ]

    );


  };



  return (

    <TouchableOpacity

      style={styles.button}

      activeOpacity={0.8}

      onPress={handleLogout}

    >

      <Text style={styles.text}>

        Logout

      </Text>


    </TouchableOpacity>

  );

};



export default LogoutButton;



const styles = StyleSheet.create({


  button: {


    backgroundColor:
      Colors.primary,


    paddingVertical:
      16,


    borderRadius:
      Spacing.radiusLarge,


    alignItems:
      "center",


    marginVertical:
      Spacing.xl,


  },


  text: {


    color:
      Colors.textWhite,


    fontSize:
      16,


    fontWeight:
      "700",


  },


});