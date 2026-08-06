import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { useFocusEffect } from "@react-navigation/native";

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";


import Colors from "../theme/colors";
import Spacing from "../theme/spacing";
import Typography from "../theme/typography";


import {
  getLabs,
  completeLab,
  getLabProgress,
} from "../services/lab.service";



interface Lab {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  level: string;
  estimatedTime: string;
  points: number;
  objectives?: string[];
  steps?: {
    title:string;
    description:string;
  }[];
  tags?: string[];
  completed?: boolean;
}

interface Progress {
  completed:number;
  total:number;
  percentage:number;
  points:number;
  dailyStreak:number;
  completedLabIds?: string[];
}

export default function LabsScreen(){
  const [labs,setLabs] = useState<Lab[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "available">("all");
  const [progress,setProgress] = useState<Progress | null>(null);
  const [selectedLab,setSelectedLab] = useState<Lab | null>(null);
  const [loading,setLoading] = useState(true);
  const [completing,setCompleting] = useState(false);



  const loadLabs = useCallback(async () => {
    try {
      setLoading(true);
      const labsResponse = await getLabs();
      const progressResponse = await getLabProgress();

      const progressData = progressResponse.data ?? progressResponse;
      const completedIds = Array.isArray(progressData?.completedLabIds)
        ? progressData.completedLabIds
        : Array.isArray(progressData?.completedLabs)
        ? progressData.completedLabs
        : [];
      const rawLabs = Array.isArray(labsResponse.data) ? labsResponse.data : Array.isArray(labsResponse) ? labsResponse : [];

      const updatedLabs = rawLabs.map((l: Lab) => ({
        ...l,
        completed: completedIds.includes(l._id),
      }));

      setLabs(updatedLabs);
      setProgress(progressData);
    } catch (error) {
      console.log("Labs Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLabs();
    }, [loadLabs])
  );




const handleCompleteLab = async()=>{


if(!selectedLab)
return;


try{


setCompleting(true);



await completeLab(
selectedLab._id
);



await loadLabs();



setSelectedLab(null);



}
catch(error){

console.log(
"Complete Lab Error:",
error
);

}
finally{

setCompleting(false);

}


};




if(loading){

return (

<View style={styles.loader}>

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

showsVerticalScrollIndicator={false}

>



<Text style={styles.headerTitle}>
Interactive Security Labs 🎯
</Text>



<Text style={styles.headerSubtitle}>
Hands-on cybersecurity labs and learning progress
</Text>





<View style={styles.scoreCard}>


<Text style={styles.xpLabel}>
Total XP
</Text>


<Text style={styles.xpValue}>
{progress?.points || 0} XP
</Text>


<Text style={styles.completedText}>
Completed Labs:

{progress?.completed || 0}

 /

{progress?.total || labs.length}

</Text>



<Text style={styles.completedText}>
🔥 Streak:

{progress?.dailyStreak || 0}

days
</Text>


</View>

{!selectedLab && (
  <View style={styles.tabsRow}>
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
      onPress={() => setActiveTab("all")}
    >
      <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
        All ({labs.length})
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tabBtn, activeTab === "completed" && styles.tabBtnActive]}
      onPress={() => setActiveTab("completed")}
    >
      <Text style={[styles.tabBtnText, activeTab === "completed" && styles.tabBtnTextActive]}>
        Completed ({labs.filter(l => l.completed).length})
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.tabBtn, activeTab === "available" && styles.tabBtnActive]}
      onPress={() => setActiveTab("available")}
    >
      <Text style={[styles.tabBtnText, activeTab === "available" && styles.tabBtnTextActive]}>
        Available ({labs.filter(l => !l.completed).length})
      </Text>
    </TouchableOpacity>
  </View>
)}

{selectedLab ? (
<View style={styles.labCard}>
<TouchableOpacity
onPress={()=>setSelectedLab(null)}
>
<Text style={styles.backText}>
← Back To Labs
</Text>
</TouchableOpacity>

<Text style={styles.labTitle}>
{selectedLab.title}
</Text>

<View style={styles.badge}>
<Text style={styles.badgeText}>
{selectedLab.category}
</Text>
</View>

<Text style={styles.description}>
{selectedLab.description}
</Text>

<Text style={styles.section}>
Details
</Text>

<Text style={styles.info}>
Difficulty: {selectedLab.difficulty}
</Text>

<Text style={styles.info}>
Level: {selectedLab.level}
</Text>

<Text style={styles.info}>
Time: {selectedLab.estimatedTime}
</Text>

<Text style={styles.info}>
Reward: {selectedLab.points} XP
</Text>

{selectedLab.objectives?.map((item,index)=>(
<Text key={index} style={styles.list}>
• {item}
</Text>
))}

<Text style={styles.section}>
Steps
</Text>

{selectedLab.steps?.map((step,index)=>(
<View key={index} style={styles.step}>
<Text style={styles.stepTitle}>
{step.title}
</Text>
<Text style={styles.stepText}>
{step.description}
</Text>
</View>
))}

<TouchableOpacity
style={[styles.completeBtn, selectedLab.completed && { backgroundColor: Colors.scoreExcellent }]}
onPress={handleCompleteLab}
disabled={completing || selectedLab.completed}
>
<Text style={styles.completeText}>
{completing ? "Completing..." : selectedLab.completed ? "✓ Lab Completed (+XP Earned)" : "Complete Lab + XP"}
</Text>
</TouchableOpacity>
</View>
) : (
  labs
    .filter(lab => {
      if (activeTab === "completed") return lab.completed;
      if (activeTab === "available") return !lab.completed;
      return true;
    })
    .map((lab) => (
      <TouchableOpacity
        key={lab._id}
        style={styles.card}
        onPress={() => setSelectedLab(lab)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.category}>
            {lab.category}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {lab.completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓ Completed</Text>
              </View>
            )}
            <Text style={styles.points}>
              +{lab.points} XP
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          {lab.title}
        </Text>

        <Text style={styles.description}>
          {lab.description}
        </Text>

        <Text style={styles.small}>
          {lab.difficulty} • {lab.estimatedTime}
        </Text>
      </TouchableOpacity>
    ))
)}
</ScrollView>


);

}






const styles =
StyleSheet.create({

container:{
flex:1,
backgroundColor:Colors.background,
},


content:{
padding:Spacing.screen,
paddingBottom:Spacing.xxl,
},


loader:{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:Colors.background,
},


headerTitle:{
...Typography.h1,
color:Colors.text,
},


headerSubtitle:{
...Typography.bodySmall,
color:Colors.textSecondary,
marginBottom:Spacing.lg,
},


scoreCard:{
backgroundColor:Colors.surface,
padding:Spacing.cardPadding,
borderRadius:Spacing.radiusLarge,
marginBottom:Spacing.lg,
},


xpLabel:{
color:Colors.textSecondary,
},


xpValue:{
fontSize:28,
fontWeight:"800",
color:Colors.primary,
},


completedText:{
marginTop:8,
color:Colors.textMuted,
},


card:{
backgroundColor:Colors.surface,
padding:Spacing.cardPadding,
borderRadius:Spacing.radiusLarge,
marginBottom:Spacing.md,
},


cardHeader:{
flexDirection:"row",
justifyContent:"space-between",
},


category:{
color:Colors.primary,
fontWeight:"700",
},


points:{
color:"#10B981",
fontWeight:"700",
},


title:{
...Typography.h3,
color:Colors.text,
marginTop:8,
},


description:{
...Typography.bodySmall,
color:Colors.textSecondary,
marginTop:8,
lineHeight:20,
},


small:{
marginTop:8,
color:Colors.textMuted,
},


labCard:{
backgroundColor:Colors.surface,
padding:Spacing.cardPadding,
borderRadius:Spacing.radiusLarge,
},


backText:{
color:Colors.primary,
fontWeight:"700",
},


labTitle:{
...Typography.h2,
color:Colors.text,
marginTop:15,
},


badge:{
marginTop:10,
backgroundColor:Colors.primary,
padding:8,
borderRadius:8,
alignSelf:"flex-start",
},


badgeText:{
color:"#fff",
fontWeight:"700",
},


section:{
marginTop:20,
fontWeight:"800",
fontSize:18,
color:Colors.text,
},


info:{
color:Colors.textSecondary,
marginTop:6,
},


list:{
color:Colors.text,
marginTop:6,
},


step:{
marginTop:12,
},


stepTitle:{
fontWeight:"700",
color:Colors.text,
},


stepText:{
color:Colors.textSecondary,
},


completeBtn:{
backgroundColor:Colors.primary,
padding:15,
borderRadius:12,
marginTop:25,
alignItems:"center",
},


completeText:{
color:"#fff",
fontWeight:"700",
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

  completedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  completedBadgeText: {
    color: "#2E7D32",
    fontSize: 11,
    fontWeight: "700",
  },

});

