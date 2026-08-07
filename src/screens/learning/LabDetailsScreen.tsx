import React, {
  useEffect,
  useState,
} from "react";


import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";


import {
  getLabById,
  completeLab,
} from "../../services/lab.service";




interface LabDetailsProps {

  route: any;

  navigation: any;

}





const LabDetailsScreen =
({
  route,
  navigation,
}: LabDetailsProps) => {



const targetLabId = route.params?.id || route.params?.labId;





const [lab,setLab] =
useState<any>(null);



const [loading,setLoading] =
useState(true);



const [completing,setCompleting] =
useState(false);






const loadLab =
async()=>{


try{


const response =
await getLabById(
  targetLabId
);



setLab(
  response.data || response
);



}
catch(error){


console.log(
  "Lab details error:",
  error
);


}
finally{


setLoading(false);


}


};







const handleCompleteLab =
async()=>{


try{


setCompleting(true);



const response =
await completeLab(
  targetLabId
);





Alert.alert(
  "Success",
  response.message ||
  "Lab completed successfully"
);



navigation.goBack();



}
catch(error:any){


console.log(
  "Complete lab error:",
  error
);



Alert.alert(
  "Error",
  error?.response?.data?.message ||
  "Failed to complete lab"
);



}
finally{


setCompleting(false);


}


};






useEffect(()=>{


loadLab();


},[]);







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
style={styles.loading}
>

Loading Lab Details...

</Text>


</View>


);


}







if(!lab){


return (

<View
style={styles.center}
>


<Text
style={styles.loading}
>

Lab not found

</Text>


</View>


);


}







return (

<ScrollView
style={styles.container}
>



<Text
style={styles.title}
>

{lab.title}

</Text>





<Text
style={styles.description}
>

{lab.description}

</Text>







<View
style={styles.card}
>


<Text
style={styles.heading}
>

Lab Information

</Text>



<Text
style={styles.text}
>

Difficulty:
{lab.difficulty}

</Text>



<Text
style={styles.text}
>

Category:
{lab.category}

</Text>



<Text
style={styles.text}
>

Duration:
{lab.estimatedTime}

</Text>



<Text
style={styles.text}
>

Points:
{lab.points}

</Text>



</View>








<View
style={styles.card}
>


<Text
style={styles.heading}
>

Learning Objectives

</Text>



{
lab.objectives?.map(
(
item:string,
index:number
)=>(


<Text
key={index}
style={styles.text}
>

• {item}

</Text>


)

)

}



</View>








<TouchableOpacity

style={styles.button}

disabled={
completing
}

onPress={
handleCompleteLab
}

>


<Text
style={styles.buttonText}
>


{
completing
?
"Completing..."
:
"Complete Lab ✅"
}


</Text>



</TouchableOpacity>






</ScrollView>

);


};





export default LabDetailsScreen;






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

marginBottom:12,

},



description:{

color:"#bbb",

fontSize:16,

lineHeight:24,

},



card:{

backgroundColor:"#111",

padding:16,

borderRadius:12,

marginTop:20,

borderWidth:1,

borderColor:"#333",

},



heading:{

color:"#e50914",

fontSize:18,

fontWeight:"700",

marginBottom:10,

},



text:{

color:"#fff",

marginTop:8,

fontSize:15,

},



button:{

backgroundColor:"#e50914",

padding:15,

borderRadius:10,

marginTop:25,

alignItems:"center",

},



buttonText:{

color:"#fff",

fontWeight:"700",

fontSize:16,

},



center:{

flex:1,

justifyContent:"center",

alignItems:"center",

backgroundColor:"#000",

},



loading:{

color:"#fff",

marginTop:10,

},


});