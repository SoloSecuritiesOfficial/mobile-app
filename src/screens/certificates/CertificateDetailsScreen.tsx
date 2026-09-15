import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// Lazy-require react-native-webview so Metro doesn't crash before npm install runs.
// The same pattern used for expo-print / expo-sharing.
let WebView: any = null;
try { WebView = require("react-native-webview").WebView; } catch { /* not installed yet */ }
import { RootStackParamList } from "../../navigation/AppNavigator";
import { getCertificateById } from "../../services/certificateService";
import { generateCertificateHtml } from "../../utils/certificateHtml";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import AdBanner from "../../components/AdBanner";

type Props = NativeStackScreenProps<RootStackParamList, "CertificateDetails">;

interface Certificate {
  _id: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy: string;
  issuedTo: string;
  description?: string;
  skills?: string[];
  issueDate?: string;
  createdAt: string;
  verified?: boolean;
  verificationUrl?: string;
}

const { width: SCREEN_W } = Dimensions.get("window");

// Scale factor — the certificate is A4 landscape (297mm × 210mm ≈ 1122 × 794 px at 96dpi)
// We scale it to fit the screen width with some padding.
const CERT_ASPECT = 297 / 210;   // ≈ 1.414
const CERT_DISPLAY_W = SCREEN_W - 32;
const CERT_DISPLAY_H = CERT_DISPLAY_W / CERT_ASPECT;

const CATEGORY_COLORS: Record<string, string> = {
  "Web Security":      "#1565C0",
  "Network Security":  "#6A1B9A",
  "Cloud Security":    "#00838F",
  "Bug Bounty":        "#C62828",
  "CTF":               "#E65100",
  "Learning":          "#2E7D32",
  "Other":             "#455A64",
};

export default function CertificateDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [webReady,    setWebReady]    = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const load = useCallback(async () => {
    try {
      const res = await getCertificateById(id);
      setCertificate(res.data ?? res);
    } catch {
      Alert.alert("Error", "Could not load certificate.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && certificate) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1,    duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 130, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, certificate]);

  // ── Generate PDF and share / save ────────────────────────────────
  const handleDownloadOrShare = async (action: "share" | "download") => {
    if (!certificate) return;
    setGenerating(true);
    try {
      const Print   = require("expo-print");
      const Sharing = require("expo-sharing");

      const html = buildHtml(certificate);
      const { uri } = await Print.printToFileAsync({ html, width: 1122, height: 794 });

      if (action === "share") {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${certificate.title} — Certificate`,
          UTI: ".pdf",
        });
      } else {
        // Save to device
        const MediaLibrary = require("expo-media-library");
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Allow media library access to save the certificate.");
          return;
        }
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert("✅ Saved!", "Certificate saved to your photo library.");
      }
    } catch (err: any) {
      if (err?.message?.includes("Cannot find module")) {
        Alert.alert(
          "Setup required",
          "Run: npx expo install expo-print expo-sharing expo-media-library\nthen rebuild the app.",
        );
      } else {
        Alert.alert("Error", err?.message ?? "Could not generate certificate.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleShareText = async () => {
    if (!certificate) return;
    await Share.share({
      message:
        `🏆 I earned a certificate from SoloSecurities!\n\n` +
        `📜 ${certificate.title}\n` +
        `🏷️ ${certificate.category}\n` +
        `🆔 Certificate ID: ${certificate.certificateId}\n\n` +
        `Download SoloSecurities to start your cybersecurity journey!`,
    });
  };

  // ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!certificate) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.errorText}>Certificate not found.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const catColor = CATEGORY_COLORS[certificate.category] ?? "#6B7280";
  const certHtml = buildHtml(certificate);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* ── Nav header ── */}
      <View style={s.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBack} hitSlop={12}>
          <Text style={s.navBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>Certificate</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Certificate preview (WebView rendering full HTML) ── */}
        <Animated.View
          style={[
            s.certWrap,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={s.certShadow}>
            {!webReady && (
              <View style={[s.webPlaceholder, { width: CERT_DISPLAY_W, height: CERT_DISPLAY_H }]}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={s.webPlaceholderText}>Rendering certificate…</Text>
              </View>
            )}
            {WebView ? (
              <WebView
                source={{ html: certHtml }}
                style={{ width: CERT_DISPLAY_W, height: CERT_DISPLAY_H, opacity: webReady ? 1 : 0 }}
                scrollEnabled={false}
                scalesPageToFit
                onLoadEnd={() => setWebReady(true)}
                originWhitelist={["*"]}
              />
            ) : (
              <View style={[s.webPlaceholder, { width: CERT_DISPLAY_W, height: CERT_DISPLAY_H }]}>
                <Text style={s.webPlaceholderText}>
                  Run: npx expo install react-native-webview{"\n"}then rebuild the app to see the certificate preview.
                </Text>
              </View>
            )}
          </View>

          {/* Verified badge over the bottom-right */}
          {certificate.verified && (
            <View style={s.verifiedOverlay}>
              <Text style={s.verifiedOverlayText}>✓ Verified</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Action buttons ── */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnPrimary, generating && s.btnDisabled]}
            onPress={() => handleDownloadOrShare("share")}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={s.actionBtnTextWhite}>📤 Share PDF</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnSecondary, generating && s.btnDisabled]}
            onPress={() => handleDownloadOrShare("download")}
            disabled={generating}
          >
            <Text style={s.actionBtnTextDark}>⬇️ Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnSecondary]}
            onPress={handleShareText}
          >
            <Text style={s.actionBtnTextDark}>🔗 Share Link</Text>
          </TouchableOpacity>
        </View>

        {/* ── Details card ── */}
        <AdBanner isPremium={false} marginVertical={10} />
        <View style={s.detailsCard}>
          <Text style={s.detailsTitle}>{certificate.title}</Text>

          <View style={[s.categoryBadge, { backgroundColor: catColor + "20", borderColor: catColor + "55" }]}>
            <Text style={[s.categoryBadgeText, { color: catColor }]}>{certificate.category}</Text>
          </View>

          <View style={s.divider} />

          {[
            { label: "Certificate ID", value: certificate.certificateId, mono: true },
            { label: "Issued To",      value: certificate.issuedTo },
            { label: "Issued By",      value: certificate.issuedBy || "SoloSecurities" },
            {
              label: "Date Issued",
              value: new Date(certificate.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              }),
            },
            {
              label: "Status",
              value: certificate.verified ? "✅ Verified" : "⏳ Pending",
            },
          ].map(row => (
            <View key={row.label} style={s.detailRow}>
              <Text style={s.detailLabel}>{row.label}</Text>
              <Text style={[s.detailValue, (row as any).mono && s.monoText]}>
                {row.value}
              </Text>
            </View>
          ))}

          {certificate.description ? (
            <View style={s.descCard}>
              <Text style={s.descText}>{certificate.description}</Text>
            </View>
          ) : null}

          {certificate.skills && certificate.skills.length > 0 && (
            <>
              <Text style={s.skillsLabel}>Skills</Text>
              <View style={s.skillsRow}>
                {certificate.skills.map(skill => (
                  <View key={skill} style={[s.skillChip, { backgroundColor: catColor + "18", borderColor: catColor + "44" }]}>
                    <Text style={[s.skillText, { color: catColor }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Info note ── */}
        <View style={s.infoCard}>
          <Text style={s.infoText}>
            💡 Tap "Share PDF" to send your certificate as a PDF file, or "Save" to store it in your photo gallery.
            The certificate includes your name, category, skills, and a unique verification ID.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Build HTML from certificate data ─────────────────────────────
function buildHtml(cert: Certificate): string {
  const issueDate = new Date(cert.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return generateCertificateHtml({
    title:           cert.title,
    category:        cert.category,
    issuedTo:        cert.issuedTo || "Valued Member",
    issuedBy:        cert.issuedBy || "SoloSecurities",
    certificateId:   cert.certificateId,
    description:     cert.description,
    skills:          cert.skills,
    issueDate,
    verificationUrl: cert.verificationUrl || undefined,
  });
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F2F5" },
  errorText: { fontSize: 16, color: "#666", marginBottom: 16 },

  navHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0",
  },
  navBack:     { width: 60 },
  navBackText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  navTitle:    { flex: 1, fontSize: 17, fontWeight: "800", color: "#111", textAlign: "center" },
  backBtn:     { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8 },
  backBtnText: { color: "#FFF", fontWeight: "700" },

  scroll: { padding: 16, paddingBottom: 48 },

  // Certificate preview wrapper
  certWrap:   { alignItems: "center", marginBottom: 16 },
  certShadow: {
    width: CERT_DISPLAY_W, height: CERT_DISPLAY_H,
    borderRadius: 8, overflow: "hidden",
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    backgroundColor: "#FFFDF6",
  },
  webPlaceholder: {
    position: "absolute", zIndex: 1,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#FFFDF6",
    gap: 8,
  },
  webPlaceholderText: { fontSize: 12, color: "#AAA" },

  verifiedOverlay: {
    position: "absolute", bottom: 10, right: 10,
    backgroundColor: "#2E7D32", borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verifiedOverlayText: { color: "#FFF", fontSize: 11, fontWeight: "800" },

  // Action buttons
  actionRow:           { flexDirection: "row", gap: 8, marginBottom: 16 },
  actionBtn:           { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", minHeight: 44 },
  actionBtnPrimary:    { backgroundColor: Colors.primary },
  actionBtnSecondary:  { backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E0E0E0" },
  actionBtnTextWhite:  { color: "#FFF",  fontWeight: "800", fontSize: 13 },
  actionBtnTextDark:   { color: "#333",  fontWeight: "700", fontSize: 13 },
  btnDisabled:         { opacity: 0.55 },

  // Details card
  detailsCard: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 18,
    marginBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  detailsTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 10 },

  categoryBadge:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  categoryBadgeText: { fontSize: 12, fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 10 },

  detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  detailLabel: { fontSize: 12, color: "#888", fontWeight: "600", flex: 1 },
  detailValue: { fontSize: 13, color: "#111", fontWeight: "700", flex: 2, textAlign: "right" },
  monoText:    { fontFamily: "Courier New", fontSize: 11, color: "#1565C0" },

  descCard: { backgroundColor: "#F9F9FB", borderRadius: 10, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  descText: { fontSize: 13, color: "#555", lineHeight: 20, fontStyle: "italic" },

  skillsLabel: { fontSize: 12, fontWeight: "700", color: "#888", marginTop: 14, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  skillsRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  skillText:   { fontSize: 11, fontWeight: "700" },

  // Info note
  infoCard: { backgroundColor: "#E3F2FD", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#1565C0" },
  infoText: { fontSize: 12, color: "#1565C0", lineHeight: 18 },
});
