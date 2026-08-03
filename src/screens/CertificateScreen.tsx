import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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

import {
  getCertificates,
} from "../services/certificateService";

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "Certificates"
  >;

type Certificate = {
  _id: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy: string;
  createdAt: string;
};

export default function CertificateScreen({
  navigation,
}: Props) {

  const [loading, setLoading] =
    useState(true);

  const [certificates, setCertificates] =
    useState<Certificate[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates =
    async () => {
      try {

        const response =
          await getCertificates();

        setCertificates(
          response.data || []
        );

      } catch (error) {
        console.log(
          "Certificates Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        🏆 Certificates
      </Text>

      <FlatList
        data={certificates}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (

          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate(
                "CertificateDetails",
                {
                  id: item._id,
                }
              )
            }
          >

            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text style={styles.category}>
              {item.category}
            </Text>

            <Text style={styles.id}>
              ID: {item.certificateId}
            </Text>

            <Text style={styles.issuer}>
              Issued By:
              {" "}
              {item.issuedBy}
            </Text>

          </TouchableOpacity>
        )}
      />

    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  category: {
    marginTop: 6,
    color: "#2563EB",
    fontWeight: "600",
  },

  id: {
    marginTop: 10,
    color: "#666",
  },

  issuer: {
    marginTop: 5,
    color: "#666",
  },

});