import React, {
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

}



interface Progress {

  completed:number;

  total:number;

  percentage:number;

  points:number;

  dailyStreak:number;

}



export default function LabsScreen(){

const [labs,setLabs] =
useState<Lab[]>([]);


const [progress,setProgress] =
useState<Progress | null>(null);


const [selectedLab,setSelectedLab] =
useState<Lab | null>(null);


const [loading,setLoading] =
useState(true);


const [completing,setCompleting] =
useState(false);



useEffect(()=>{

loadLabs();

},[]);



const loadLabs = async()=>{

try{


setLoading(true);



const labsResponse =
await getLabs();


const progressResponse =
await getLabProgress();



setLabs(
labsResponse.data ??
labsResponse ??
[]
);



setProgress(
progressResponse.data ??
progressResponse
);



}
catch(error){

console.log(
"Labs Fetch Error:",
error
);


}
finally{

setLoading(false);

}

};




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





{
selectedLab ? (



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
Difficulty:

{selectedLab.difficulty}

</Text>


<Text style={styles.info}>
Level:

{selectedLab.level}

</Text>


<Text style={styles.info}>
Time:

{selectedLab.estimatedTime}

</Text>


<Text style={styles.info}>
Reward:

{selectedLab.points} XP

</Text>





{
selectedLab.objectives?.map(
(item,index)=>(

<Text
key={index}
style={styles.list}
>
• {item}
</Text>

)

)

}





<Text style={styles.section}>
Steps
</Text>



{
selectedLab.steps?.map(
(step,index)=>(

<View
key={index}
style={styles.step}
>

<Text style={styles.stepTitle}>
{step.title}
</Text>


<Text style={styles.stepText}>
{step.description}
</Text>


</View>

)

)

}





<TouchableOpacity

style={styles.completeBtn}

onPress={
handleCompleteLab
}

disabled={completing}

>


<Text style={styles.completeText}>

{
completing
?
"Completing..."
:
"Complete Lab + XP"
}

</Text>


</TouchableOpacity>



</View>



)

:

(



labs.map((lab)=>(


<TouchableOpacity

key={lab._id}

style={styles.card}

onPress={()=>setSelectedLab(lab)}

>



<View style={styles.cardHeader}>


<Text style={styles.category}>
{lab.category}
</Text>


<Text style={styles.points}>
+{lab.points} XP
</Text>



</View>



<Text style={styles.title}>
{lab.title}
</Text>



<Text style={styles.description}>
{lab.description}
</Text>



<Text style={styles.small}>
{lab.difficulty}
 • 
{lab.estimatedTime}
</Text>



</TouchableOpacity>



))

)

}



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


});

