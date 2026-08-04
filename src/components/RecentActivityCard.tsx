import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";


interface Props {

  securityScore?: number;

  reports?: number;

  certificateCount?: number;

  learningCompleted?: number;

  learningTotal?: number;

  labCompleted?: number;

  labTotal?: number;

}



export default function RecentActivityCard({

  securityScore = 0,

  reports = 0,

  certificateCount = 0,

  learningCompleted = 0,

  learningTotal = 0,

  labCompleted = 0,

  labTotal = 0,


}: Props) {


  return (

    <View style={styles.container}>


      <Text style={styles.title}>

        Dashboard Overview

      </Text>



      <Text style={styles.description}>


        Security Score :

        {" "}

        {securityScore}%



        {"\n\n"}


        Reports Submitted :

        {" "}

        {reports}



        {"\n\n"}


        Certificates Earned :

        {" "}

        {certificateCount}



        {"\n\n"}


        Learning Progress :

        {" "}

        {learningCompleted}

        /

        {learningTotal}



        {"\n\n"}


        Labs Completed :

        {" "}

        {labCompleted}

        /

        {labTotal}



      </Text>


    </View>

  );

}



const styles = StyleSheet.create({


  container: {

    backgroundColor:
      Colors.surface,


    borderRadius:
      Spacing.radiusLarge,


    padding:
      Spacing.cardPadding,


    marginBottom:
      Spacing.xxl,


    elevation: 2,


    shadowColor: "#000",

    shadowOpacity: 0.05,

    shadowRadius: 5,


    shadowOffset: {

      width: 0,

      height: 2,

    },

  },



  title: {

    ...Typography.labelLarge,

    color:
      Colors.text,

  },



  description: {

    ...Typography.bodySmall,


    color:
      Colors.textSecondary,


    marginTop:
      Spacing.sm,


    lineHeight: 20,


  },


});