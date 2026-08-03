import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";


import {
  getScanHistory,
} from "../../services/securityService";



interface Scan {

  _id: string;

  target: string;

  status: string;

  vulnerabilities?: number;

  createdAt: string;

  completedAt?: string;

}



const ScanHistoryScreen =
()=> {


  const [scans,setScans] =
    useState<Scan[]>([]);


  const [loading,setLoading] =
    useState(true);


  const [refreshing,setRefreshing] =
    useState(false);





  const loadScans =
  async()=>{

    try{

      const response =
        await getScanHistory();


      setScans(
        response.data || []
      );


    }
    catch(error){

      console.log(
        "Scan History Error:",
        error
      );

    }
    finally{

      setLoading(false);

    }

  };





  const refresh =
  async()=>{

    setRefreshing(true);

    await loadScans();

    setRefreshing(false);

  };





  useEffect(()=>{

    loadScans();

  },[]);






  const renderScan =
  ({
    item,
  }:{
    item:Scan
  })=>{


    return (

      <View
        style={styles.card}
      >

        <Text
          style={styles.target}
        >
          🎯 {item.target}
        </Text>


        <View
          style={styles.row}
        >

          <Text
            style={styles.label}
          >
            Status
          </Text>


          <Text
            style={[
              styles.status,
              item.status === "completed"
              &&
              styles.success
            ]}
          >
            {item.status}
          </Text>


        </View>



        <View
          style={styles.row}
        >

          <Text
            style={styles.label}
          >
            Vulnerabilities
          </Text>


          <Text
            style={styles.value}
          >
            {item.vulnerabilities ?? 0}
          </Text>


        </View>



        <Text
          style={styles.date}
        >

          {new Date(
            item.createdAt
          ).toLocaleString()}

        </Text>


      </View>

    );

  };






  if(loading){

    return (

      <View
        style={styles.center}
      >

        <ActivityIndicator
          size="large"
          color="#e50914"
        />

        <Text
          style={styles.loadingText}
        >
          Loading Scan History...
        </Text>

      </View>

    );

  }







  return (

    <View
      style={styles.container}
    >

      <Text
        style={styles.title}
      >
        Scan History
      </Text>


      <FlatList

        data={scans}

        keyExtractor={
          item=>item._id
        }


        renderItem={
          renderScan
        }


        refreshControl={

          <RefreshControl

            refreshing={
              refreshing
            }

            onRefresh={
              refresh
            }

          />

        }


        ListEmptyComponent={

          <Text
            style={styles.empty}
          >
            No scans found
          </Text>

        }

      />


    </View>

  );

};





export default ScanHistoryScreen;






const styles =
StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#000",
    padding:16,
  },


  title:{
    color:"#fff",
    fontSize:26,
    fontWeight:"700",
    marginBottom:20,
  },


  card:{
    backgroundColor:"#111",
    borderRadius:12,
    padding:16,
    marginBottom:12,
    borderWidth:1,
    borderColor:"#333",
  },


  target:{
    color:"#fff",
    fontSize:18,
    fontWeight:"700",
    marginBottom:12,
  },


  row:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginTop:8,
  },


  label:{
    color:"#aaa",
  },


  value:{
    color:"#fff",
  },


  status:{
    color:"#ffcc00",
    fontWeight:"600",
  },


  success:{
    color:"#00ff88",
  },


  date:{
    color:"#777",
    marginTop:12,
    fontSize:12,
  },


  center:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#000",
  },


  loadingText:{
    color:"#fff",
    marginTop:10,
  },


  empty:{
    color:"#777",
    textAlign:"center",
    marginTop:40,
  },


});