import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import {
  getCertificateById,
} from "../../services/certificateService";

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "CertificateDetails"
  >;

type Certificate = {
  _id: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy: string;
  issuedTo: string;
  description?: string;
  createdAt: string;
  verified?: boolean;
};

export default function CertificateDetailsScreen({
  route,
}: Props) {

  const { id } = route.params;

  const [loading, setLoading] =
    useState(true);

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  useEffect(() => {
    loadCertificate();
  }, []);

  const loadCertificate =
    async () => {

      try {

        const response =
          await getCertificateById(id);

        setCertificate(
          response.data || response
        );

      } catch (error) {

        console.log(
          "Certificate Error:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

  const shareCertificate =
    async () => {

      if (!certificate) return;

      try {

        await Share.share({
          message:
            `🏆 ${certificate.title}\n\nCertificate ID: ${certificate.certificateId}`,
        });

      } catch (error) {

        console.log(error);

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

  if (!certificate) {

    return (
      <SafeAreaView style={styles.loader}>
        <Text>
          Certificate not found
        </Text>
      </SafeAreaView>
    );

  }

  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.title}>
          {certificate.title}
        </Text>

        <Text style={styles.category}>
          {certificate.category}
        </Text>

        <View style={styles.separator} />

        <Text style={styles.label}>
          Certificate ID
        </Text>

        <Text style={styles.value}>
          {certificate.certificateId}
        </Text>

        <Text style={styles.label}>
          Issued To
        </Text>

        <Text style={styles.value}>
          {certificate.issuedTo}
        </Text>

        <Text style={styles.label}>
          Issued By
        </Text>

        <Text style={styles.value}>
          {certificate.issuedBy}
        </Text>

        <Text style={styles.label}>
          Date
        </Text>

        <Text style={styles.value}>
          {new Date(
            certificate.createdAt
          ).toLocaleDateString()}
        </Text>

        <Text style={styles.label}>
          Status
        </Text>

        <Text
          style={[
            styles.status,
            {
              color:
                certificate.verified
                  ? "#4CAF50"
                  : "#F57C00",
            },
          ]}
        >
          {certificate.verified
            ? "Verified"
            : "Pending"}
        </Text>

        {certificate.description ? (
          <>
            <Text style={styles.label}>
              Description
            </Text>

            <Text style={styles.description}>
              {certificate.description}
            </Text>
          </>
        ) : null}

      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={shareCertificate}
      >
        <Text style={styles.shareText}>
          Share Certificate
        </Text>
      </TouchableOpacity>

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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    elevation: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },

  category: {
    fontSize: 16,
    color: "#2563EB",
    marginTop: 6,
    marginBottom: 15,
  },

  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },

  label: {
    marginTop: 15,
    color: "#777",
    fontSize: 14,
  },

  value: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },

  status: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
  },

  description: {
    marginTop: 8,
    color: "#555",
    lineHeight: 22,
  },

  shareButton: {
    backgroundColor: "#2563EB",
    marginTop: 25,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  shareText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

});