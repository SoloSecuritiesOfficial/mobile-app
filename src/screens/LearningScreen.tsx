import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import {
  getLearningModules,
  getLearningProgress,
} from "../services/securityService";

import LearningProgressCard from "../components/LearningProgressCard";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";


type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "Learning"
  >;


interface LearningModule {

  _id: string;

  title: string;

  summary: string;

  content?: string;

  category: string;

  level: string;

  readTime: string;

  completed?: boolean;

}



interface LearningProgress {

  progress: number;

  completed: number;

  total: number;

}



export default function LearningScreen({
  navigation,
}: Props) {


  const [modules, setModules] =
    useState<LearningModule[]>([]);

  const [activeTab, setActiveTab] =
    useState<"all" | "completed" | "remaining">("all");

  const [progress, setProgress] =
    useState<LearningProgress>({
      progress: 0,
      completed: 0,
      total: 0,
    });



  const [loading, setLoading] =
    useState(true);



  const [refreshing, setRefreshing] =
    useState(false);



  const loadLearningData =
    useCallback(async()=>{


      try {


       const [
  modulesResponse,
  progressResponse,
] =
await Promise.all([
  getLearningModules(),
  getLearningProgress(),
]);



        const moduleData =
          modulesResponse.data ??
          modulesResponse.modules ??
          [];



        const progressData =
          progressResponse.data ??
          progressResponse;



        const completedIds = Array.isArray(progressData.completedLessonIds)
          ? progressData.completedLessonIds
          : Array.isArray(progressData.completedLessons)
          ? progressData.completedLessons
          : [];

        const updatedModules =
          moduleData.map(
            (item: LearningModule)=>({
              ...item,
              completed: completedIds.includes(item._id),
            })
          );



        setModules(
          updatedModules
        );



        setProgress({

          progress:
            progressData.learning
              ?.percentage || 0,


          completed:
            progressData.learning
              ?.completed || 0,


          total:
            progressData.learning
              ?.total || moduleData.length,

        });



      }
      catch(error){


        console.log(
          "Learning Error:",
          error
        );


      }
      finally{


        setLoading(false);

        setRefreshing(false);


      }


    },[]);




  useFocusEffect(
    useCallback(() => {
      loadLearningData();
    }, [loadLearningData])
  );




  const onRefresh = ()=>{

    setRefreshing(true);

    loadLearningData();

  };




  if(loading){

    return (

      <View
        style={styles.loader}
      >

        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

      </View>

    );

  }





  return (

    <ScrollView

      style={styles.container}

      contentContainerStyle={
        styles.content
      }


      refreshControl={

        <RefreshControl

          refreshing={
            refreshing
          }

          onRefresh={
            onRefresh
          }

        />

      }


      showsVerticalScrollIndicator={
        false
      }

    >


      <Text
        style={styles.headerTitle}
      >
        Cybersecurity Academy 📚
      </Text>



      <Text
        style={styles.headerSubtitle}
      >
        Master security skills through
        structured learning modules.
      </Text>





      <LearningProgressCard
        completed={
          progress.completed
        }
        total={
          progress.total
        }
      />





      <View style={styles.section}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
              All ({modules.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "completed" && styles.tabBtnActive]}
            onPress={() => setActiveTab("completed")}
          >
            <Text style={[styles.tabBtnText, activeTab === "completed" && styles.tabBtnTextActive]}>
              Completed ({modules.filter(m => m.completed).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "remaining" && styles.tabBtnActive]}
            onPress={() => setActiveTab("remaining")}
          >
            <Text style={[styles.tabBtnText, activeTab === "remaining" && styles.tabBtnTextActive]}>
              Remaining ({modules.filter(m => !m.completed).length})
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {activeTab === "all" ? "Available Modules" : activeTab === "completed" ? "Completed Modules" : "Remaining Modules"}
        </Text>

        {
          modules.filter(m => {
            if (activeTab === "completed") return m.completed;
            if (activeTab === "remaining") return !m.completed;
            return true;
          }).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {activeTab === "completed" ? "No Completed Modules Yet" : activeTab === "remaining" ? "All Modules Completed! 🎉" : "No Learning Modules"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "completed" ? "Select a module and tap 'Mark as Completed' to track your progress." : "Check back later for newly added security lessons."}
              </Text>
            </View>
          ) : (
            modules
              .filter(m => {
                if (activeTab === "completed") return m.completed;
                if (activeTab === "remaining") return !m.completed;
                return true;
              })
              .map((item) => (


              <TouchableOpacity

                key={
                  item._id
                }


                style={
                  styles.card
                }


                activeOpacity={
                  0.85
                }


                onPress={()=>


                  navigation.navigate(
                    "LearningDetails",
                    {
                      id:item._id
                    }
                  )


                }


              >


                <View
                  style={styles.cardHeader}
                >

                  <Text
                    style={styles.category}
                  >
                    {item.category}
                  </Text>



                  <Text
                    style={styles.level}
                  >
                    {item.level}
                  </Text>


                </View>





                <Text
                  style={styles.cardTitle}
                >
                  {item.title}
                </Text>




                <Text
                  style={styles.summary}
                >
                  {item.summary}
                </Text>





                <View
                  style={styles.bottomRow}
                >


                  <Text
                    style={styles.readTime}
                  >
                    ⏱ {item.readTime}
                  </Text>



                  {
                    item.completed &&

                    <View
                      style={
                        styles.completedBadge
                      }
                    >

                      <Text
                        style={
                          styles.completedText
                        }
                      >
                        ✓ Completed
                      </Text>


                    </View>

                  }



                </View>
              </TouchableOpacity>
            ))
          )
        }
      </View>




    </ScrollView>

  );

}




const styles =
StyleSheet.create({


container:{

  flex:1,

  backgroundColor:
    Colors.background,

},



loader:{

  flex:1,

  justifyContent:
    "center",

  alignItems:
    "center",

  backgroundColor:
    Colors.background,

},



content:{

  paddingTop:50,

  paddingHorizontal:
    Spacing.screen,

  paddingBottom:
    Spacing.xxl,

},



headerTitle:{

  ...Typography.h1,

  color:
    Colors.text,

  marginBottom:
    8,

},



headerSubtitle:{

  ...Typography.bodySmall,

  color:
    Colors.textSecondary,

  marginBottom:
    Spacing.xl,

  lineHeight:
    22,

},



section:{

  marginTop:
    Spacing.xl,

},



sectionTitle:{

  ...Typography.h2,

  color:
    Colors.text,

  marginBottom:
    Spacing.lg,

},



emptyCard:{

  backgroundColor:
    Colors.surface,

  borderRadius:
    Spacing.radiusLarge,

  padding:
    Spacing.cardPadding,

  alignItems:
    "center",

},



emptyTitle:{

  ...Typography.h3,

  color:
    Colors.text,

  marginBottom:
    8,

},



emptyText:{

  ...Typography.bodySmall,

  color:
    Colors.textSecondary,

  textAlign:
    "center",

},



card:{

  backgroundColor:
    Colors.surface,

  borderRadius:
    Spacing.radiusLarge,

  padding:
    Spacing.cardPadding,

  marginBottom:
    Spacing.md,

  elevation:
    2,

},



cardHeader:{

  flexDirection:
    "row",

  justifyContent:
    "space-between",

  marginBottom:
    8,

},



category:{

  color:
    Colors.primary,

  fontSize:
    12,

  fontWeight:
    "700",

},



level:{

  color:
    Colors.textMuted,

  fontSize:
    12,

},



cardTitle:{

  ...Typography.h3,

  color:
    Colors.text,

  marginBottom:
    8,

},



summary:{

  ...Typography.bodySmall,

  color:
    Colors.textSecondary,

  marginBottom:
    14,

},



bottomRow:{

  flexDirection:
    "row",

  justifyContent:
    "space-between",

  alignItems:
    "center",

},



readTime:{

  ...Typography.bodySmall,

  color:
    Colors.textMuted,

},



completedBadge:{

  backgroundColor:
    "#E8F5E9",

  paddingHorizontal:
    10,

  paddingVertical:
    4,

  borderRadius:
    20,

},



completedText:{

  color:
    "#2E7D32",

  fontSize:
    12,

  fontWeight:
    "700",

},

  tabsRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: 8,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Spacing.radiusMedium,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  tabBtnText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },


});