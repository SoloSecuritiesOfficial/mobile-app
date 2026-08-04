import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import Colors from "../theme/colors";
import Spacing from "../theme/spacing";

import LogoutButton from "../components/LogoutButton";
import DashboardHeader from "../components/DashboardHeader";
import SecurityTipCard from "../components/SecurityTipCard";
import SecurityScoreCard from "../components/SecurityScoreCard";
import QuickActions from "../components/QuickAction";
import RecentActivityCard from "../components/RecentActivityCard";
import ProgressCard from "../components/ProgressCard";
import StatisticsCard from "../components/StatisticsCard";
import LearningProgressCard from "../components/LearningProgressCard";
import LabsProgressCard from "../components/LabsProgressCard";
import NotificationCard from "../components/NotificationCard";

import {
  fetchCurrentUser,
  getCurrentUser,
} from "../services/authService";

import {
  getSecurityDashboard,
} from "../services/securityService";

import {
  getCertificates,
} from "../services/certificateService";

import {
  getUnreadNotificationCount,
} from "../services/notificationService";


type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "Dashboard"
  >;


interface User {
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}


interface DashboardData {
  securityScore?: number;
  reports?: number;
  rank?: string;
  streak?: number;

  learningCompleted?: number;
  learningTotal?: number;

  labCompleted?: number;
  labTotal?: number;
}


export default function DashboardScreen({
  navigation,
}: Props) {


  const [loading, setLoading] =
    useState(true);


  const [user, setUser] =
    useState<User | null>(null);


  const [dashboard, setDashboard] =
    useState<DashboardData>({});


  const [certificateCount, setCertificateCount] =
    useState(0);


  const [notificationCount, setNotificationCount] =
    useState(0);



  const loadDashboard =
    useCallback(async () => {

      try {

        const latestUser =
          await fetchCurrentUser();


        if (latestUser) {

          setUser(latestUser);

        } else {

          const cachedUser =
            await getCurrentUser();

          setUser(cachedUser);

        }



        const dashboardResponse =
          await getSecurityDashboard();


        setDashboard(
          dashboardResponse.data ??
          dashboardResponse ??
          {}
        );



        const certificates =
          await getCertificates();


        setCertificateCount(
          certificates.data?.length ??
          certificates.length ??
          0
        );



        const notification =
          await getUnreadNotificationCount();


        setNotificationCount(
          notification.data?.count ??
          notification.count ??
          0
        );



      } catch (error) {

        console.log(
          "Dashboard Error:",
          error
        );


      } finally {

        setLoading(false);

      }


    }, []);



  useEffect(() => {

    loadDashboard();

  }, [loadDashboard]);




  if (loading) {

    return (

      <SafeAreaView
        style={styles.loader}
      >

        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

      </SafeAreaView>

    );

  }




  return (

    <ScrollView

      contentContainerStyle={
        styles.content
      }

      showsVerticalScrollIndicator={false}

    >


      <DashboardHeader

        user={user}

        navigation={navigation}

      />



      <SecurityScoreCard

        securityScore={
          dashboard.securityScore ?? 0
        }

      />



      <QuickActions

        navigation={navigation}

      />



      <RecentActivityCard

        securityScore={
          dashboard.securityScore ?? 0
        }

        reports={
          dashboard.reports ?? 0
        }

        certificateCount={
          certificateCount
        }

        learningCompleted={
          dashboard.learningCompleted ?? 0
        }

        learningTotal={
          dashboard.learningTotal ?? 0
        }

        labCompleted={
          dashboard.labCompleted ?? 0
        }

        labTotal={
          dashboard.labTotal ?? 0
        }

      />



      <SecurityTipCard />



      <ProgressCard

        learningCompleted={
          dashboard.learningCompleted ?? 0
        }

        learningTotal={
          dashboard.learningTotal ?? 0
        }

        labCompleted={
          dashboard.labCompleted ?? 0
        }

        labTotal={
          dashboard.labTotal ?? 0
        }

      />



      <StatisticsCard

        reports={
          dashboard.reports ?? 0
        }

        certificates={
          certificateCount
        }

        rank={
          dashboard.rank ?? "#0"
        }

        streak={
          dashboard.streak ?? 0
        }

      />



      <LearningProgressCard

        completed={
          dashboard.learningCompleted ?? 0
        }

        total={
          dashboard.learningTotal ?? 0
        }

      />



      <LabsProgressCard

        completed={
          dashboard.labCompleted ?? 0
        }

        total={
          dashboard.labTotal ?? 0
        }

      />



      <NotificationCard

        notificationCount={
          notificationCount
        }

      />



      <LogoutButton />


    </ScrollView>

  );

}



const styles = StyleSheet.create({


  loader: {

    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:
      Colors.background,

  },


  content: {

    padding:
      Spacing.screen,

    paddingBottom:
      Spacing.xxl,

  },


});