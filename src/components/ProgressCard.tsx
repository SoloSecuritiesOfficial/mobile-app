import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";


interface ProgressCardProps {

  title: string;

  completed: number;

  total: number;

  color: string;

}



export default function ProgressCard({

  title,

  completed,

  total,

  color,

}: ProgressCardProps) {


  const percentage =
    total > 0
      ? (completed / total) * 100
      : 0;



  return (

    <View style={styles.card}>


      <View style={styles.header}>


        <Text style={styles.title}>
          {title}
        </Text>



        <Text style={styles.count}>
          {completed}/{total}
        </Text>


      </View>





      <View style={styles.progressBackground}>


        <View

          style={[
            styles.progressFill,

            {
              width: `${Math.min(
                percentage,
                100
              )}%`,

              backgroundColor: color,

            },

          ]}

        />


      </View>





      <Text style={styles.percent}>

        {percentage.toFixed(0)}% Completed

      </Text>


    </View>

  );

}



const styles = StyleSheet.create({


  card: {

    backgroundColor: "#FFFFFF",

    padding: 20,

    borderRadius: 18,

    marginBottom: 18,

    elevation: 3,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 8,

    shadowOffset: {

      width: 0,

      height: 3,

    },

  },



  header: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 15,

  },



  title: {

    fontSize: 17,

    fontWeight: "700",

    color: "#222222",

  },



  count: {

    fontSize: 16,

    fontWeight: "700",

    color: "#C62828",

  },



  progressBackground: {

    height: 12,

    backgroundColor: "#ECECEC",

    borderRadius: 10,

    overflow: "hidden",

  },



  progressFill: {

    height: "100%",

    borderRadius: 10,

  },



  percent: {

    marginTop: 10,

    fontSize: 14,

    color: "#666666",

    fontWeight: "600",

  },


});