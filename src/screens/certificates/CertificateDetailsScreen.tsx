
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// MediaLibrary is optional — only available in development/custom builds, not Expo Go
let MediaLibrary: any = null;
try {
  MediaLibrary = require("expo-media-library");
} catch {
  console.log("[CertificateDetails] expo-media-library not available");
}

import { RootStackParamList } from "../../navigation/types";
import { getCertificateById } from "../../services/certificateService";
import { getCurrentUser } from "../../services/authService";
import { generateCertificateHtml } from "../../utils/certificateHtml";
import Colors from "../../theme/colors";
import AdBanner from "../../components/AdBanner";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "CertificateDetails"
>;

type Certificate = {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy: string;
  issuedTo: string;
  description?: string;
  skills?: string[];
  issueDate?: string;
  createdAt?: string;
  verified?: boolean;
  status?: string;
  verificationUrl?: string;
};

type ExportMode = "pdf" | "png";

const PRIMARY = Colors.primary || "#C62828";
const INK = "#182230";
const MUTED = "#667085";
const BORDER = "#E6E9EF";
const SURFACE = "#FFFFFF";
const BACKGROUND = "#F5F7FB";
const GOLD = "#C7A24B";
const GREEN = "#178653";
const LANDSCAPE_RATIO = 297 / 210;

const CATEGORY_COLORS: Record<string, string> = {
  "Web Security": "#1565C0",
  "Network Security": "#6A1B9A",
  "Cloud Security": "#00838F",
  "Bug Bounty": "#C62828",
  CTF: "#E65100",
  Learning: "#2E7D32",
  Other: "#455A64",
};

function normalizeCertificate(response: any): Certificate | null {
  const candidates = [
    response?.data?.data,
    response?.data?.certificate,
    response?.data,
    response?.certificate,
    response,
  ];

  for (const item of candidates) {
    if (
      item &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      typeof item.certificateId === "string"
    ) {
      return {
        ...item,
        _id: item._id ? String(item._id) : undefined,
        title: item.title || "Certificate of Achievement",
        category: item.category || "Other",
        certificateId: item.certificateId || "Not available",
        issuedBy: item.issuedBy || "SoloSecurities",
        issuedTo: item.issuedTo || "Valued Member",
        description: item.description || "",
        skills: Array.isArray(item.skills)
          ? item.skills.filter(
              (skill: unknown): skill is string =>
                typeof skill === "string"
            )
          : [],
        issueDate:
          item.issueDate ||
          item.createdAt ||
          new Date().toISOString(),
        createdAt: item.createdAt,
        verified: item.verified === true,
        status: item.status || "active",
        verificationUrl: item.verificationUrl || "",
      } as Certificate;
    }
  }

  return null;
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeFileName(value: string): string {
  const result = value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return result || "SoloSecurities-Certificate";
}

export default function CertificateDetailsScreen({
  navigation,
  route,
}: Props) {
  const { id } = route.params;
  const { width: windowWidth } = useWindowDimensions();

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [exporting, setExporting] = useState<ExportMode | null>(
    null
  );
  const [previewReady, setPreviewReady] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const requestIdRef = useRef(0);
  const previewCaptureRef = useRef<View>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const previewWidth = Math.max(220, windowWidth - 36);
  const previewHeight = previewWidth / LANDSCAPE_RATIO;

  const isRevoked =
    certificate?.status?.toLowerCase() === "revoked";

  const isVerified =
    certificate?.verified === true && !isRevoked;

  const categoryColor =
    CATEGORY_COLORS[certificate?.category || "Other"] ||
    CATEGORY_COLORS.Other;

  const loadCertificate = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");
    setCertificate(null);
    setPreviewReady(false);

    try {
      const response = await getCertificateById(id);

      if (requestId !== requestIdRef.current) return;

      const parsed = normalizeCertificate(response);

      if (!parsed) {
        setError("We couldn't read the certificate information.");
        return;
      }

      setCertificate(parsed);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load the certificate. Check your connection and retry."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    loadCertificate();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadCertificate]);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user: any) => {
        if (active) {
          setIsPremium(Boolean(user?.isPremium));
        }
      })
      .catch(() => {
        if (active) setIsPremium(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || error || !certificate) return;

    fadeAnim.setValue(0);
    slideAnim.setValue(12);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading, error, certificate, fadeAnim, slideAnim]);

  const certificateHtml = useMemo(() => {
    if (!certificate) return "";

    try {
      return generateCertificateHtml({
        title: certificate.title,
        category: certificate.category,
        issuedTo: certificate.issuedTo,
        issuedBy: certificate.issuedBy,
        certificateId: certificate.certificateId,
        description: certificate.description || "",
        skills: certificate.skills || [],
        issueDate: formatDate(
          certificate.issueDate || certificate.createdAt
        ),
        verificationUrl: certificate.verificationUrl || "",
      });
    } catch (err) {
      console.error("Certificate HTML error:", err);
      return "";
    }
  }, [certificate]);

  const shareCertificateDetails = useCallback(async () => {
    if (!certificate) return;

    const message = [
      "SoloSecurities Certificate",
      "",
      `Title: ${certificate.title}`,
      `Category: ${certificate.category}`,
      `Issued to: ${certificate.issuedTo}`,
      `Issued by: ${certificate.issuedBy}`,
      `Certificate ID: ${certificate.certificateId}`,
      `Issue date: ${formatDate(
        certificate.issueDate || certificate.createdAt
      )}`,
      `Status: ${
        isRevoked
          ? "Revoked"
          : isVerified
            ? "Verified"
            : "Unverified"
      }`,
      certificate.verificationUrl
        ? `Verification: ${certificate.verificationUrl}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({ message });
    } catch (err) {
      Alert.alert("Unable to share", "Please try again.");
    }
  }, [certificate, isRevoked, isVerified]);

  const savePdf = useCallback(async () => {
    if (!certificateHtml || !certificate || exporting) return;

    setExporting("pdf");

    try {
      if (Platform.OS === "android") {
        // Use Android's native print interface. The user can
        // select "Save as PDF" and choose a destination.
        await Print.printAsync({
          html: certificateHtml,
        });

        return;
      }

      // On iOS, create the PDF and open the system share sheet.
      const result = await Print.printToFileAsync({
        html: certificateHtml,
        width: 1122,
        height: 794,
        base64: false,
      });

      if (!result?.uri) {
        throw new Error("The PDF could not be generated.");
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Sharing unavailable",
          "PDF sharing is not available on this device."
        );
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save or share certificate",
        UTI: "com.adobe.pdf",
      });
    } catch (err: any) {
      console.error("PDF export error:", err);

      Alert.alert(
        "PDF error",
        err?.message || "Unable to export the certificate."
      );
    } finally {
      setExporting(null);
    }
  }, [certificate, certificateHtml, exporting]);

  const savePng = useCallback(async () => {
    if (!certificate || !certificateHtml || exporting) return;

    if (!WebView) {
      Alert.alert(
        "Preview unavailable",
        "Install react-native-webview to preview and capture the certificate."
      );
      return;
    }

    if (!previewReady) {
      Alert.alert(
        "Preview is loading",
        "Wait until the certificate preview has finished loading, then try again."
      );
      return;
    }

    setExporting("png");

    try {
      const node = previewCaptureRef.current;

      if (!node) {
        throw new Error("The certificate preview is not ready.");
      }

      // Capture the rendered certificate, not the surrounding screen.
      const imageUri = await captureRef(node, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      if (!imageUri) {
        throw new Error("Unable to capture the certificate image.");
      }

      if (Platform.OS === "web") {
        throw new Error(
          "Saving to the photo gallery is supported in the native mobile app."
        );
      }

      if (!MediaLibrary) {
        throw new Error(
          "Media library is not available. Build a development build to use this feature."
        );
      }

      const permission =
        await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow photo-library access to save the certificate PNG."
        );
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(imageUri);

      // Optionally put the image in a dedicated gallery album.
      try {
        const albumName = "SoloSecurities Certificates";
        const album = await MediaLibrary.getAlbumAsync(albumName);

        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync(
            [asset],
            album,
            false
          );
        } else {
          await MediaLibrary.createAlbumAsync(
            albumName,
            asset,
            false
          );
        }
      } catch (albumError) {
        // The image is already saved, even if album creation fails.
        console.warn("Certificate album could not be created:", albumError);
      }

      Alert.alert(
        "PNG saved",
        "The certificate image has been saved to your photo gallery."
      );
    } catch (err: any) {
      console.error("PNG export error:", err);

      Alert.alert(
        "PNG error",
        err?.message ||
          "Unable to save the certificate image. Please try again."
      );
    } finally {
      setExporting(null);
    }
  }, [certificate, certificateHtml, exporting, previewReady]);

  const sharePng = useCallback(async () => {
    if (!certificate || !certificateHtml || exporting) return;

    if (!previewReady || !previewCaptureRef.current) {
      Alert.alert(
        "Preview is loading",
        "Wait for the certificate preview to finish loading."
      );
      return;
    }

    setExporting("png");

    try {
      const imageUri = await captureRef(
        previewCaptureRef.current,
        {
          format: "png",
          quality: 1,
          result: "tmpfile",
        }
      );

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Sharing unavailable",
          "Image sharing is not available on this device."
        );
        return;
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: "image/png",
        dialogTitle: "Share certificate image",
        UTI: "public.png",
      });
    } catch (err: any) {
      console.error("PNG sharing error:", err);

      Alert.alert(
        "Unable to share image",
        err?.message || "Please try again."
      );
    } finally {
      setExporting(null);
    }
  }, [certificate, certificateHtml, exporting, previewReady]);

  const openVerificationUrl = useCallback(async () => {
    if (!certificate?.verificationUrl) {
      Alert.alert(
        "Verification link unavailable",
        "This certificate does not have a verification URL."
      );
      return;
    }

    try {
      await Linking.openURL(certificate.verificationUrl);
    } catch {
      Alert.alert(
        "Unable to open link",
        "Please check the verification URL."
      );
    }
  }, [certificate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Certificate</Text>
            <Text style={styles.headerSubtitle}>
              Your achievements
            </Text>
          </View>
        </View>

        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.stateTitle}>
            Preparing certificate
          </Text>
          <Text style={styles.stateDescription}>
            Loading your certificate details and preview.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !certificate) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Certificate</Text>
            <Text style={styles.headerSubtitle}>
              Your achievements
            </Text>
          </View>
        </View>

        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.stateTitle}>
            Certificate unavailable
          </Text>

          <Text style={styles.stateDescription}>
            {error || "We couldn't find this certificate."}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={loadCertificate}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>My certificate</Text>
          <Text style={styles.headerSubtitle}>
            Preview · Export · Share
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerShare}
          onPress={shareCertificateDetails}
          accessibilityRole="button"
        >
          <Text style={styles.headerShareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconText}>✦</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isRevoked
                    ? styles.revokedBadge
                    : isVerified
                      ? styles.verifiedBadge
                      : styles.pendingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isRevoked
                      ? styles.revokedText
                      : isVerified
                        ? styles.verifiedText
                        : styles.pendingText,
                  ]}
                >
                  {isRevoked
                    ? "Revoked"
                    : isVerified
                      ? "✓ Verified"
                      : "Unverified"}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              Your hard work deserves recognition.
            </Text>

            <Text style={styles.heroDescription}>
              Preview your achievement and save a copy for your
              professional portfolio.
            </Text>

            <View style={styles.heroMetadata}>
              <View style={styles.heroMetadataItem}>
                <Text style={styles.heroMetadataLabel}>CATEGORY</Text>
                <Text style={styles.heroMetadataValue}>
                  {certificate.category}
                </Text>
              </View>

              <View style={styles.heroMetadataDivider} />

              <View style={styles.heroMetadataItem}>
                <Text style={styles.heroMetadataLabel}>ISSUED ON</Text>
                <Text style={styles.heroMetadataValue}>
                  {formatDate(
                    certificate.issueDate || certificate.createdAt
                  )}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <AdBanner
          isPremium={isPremium}
          marginVertical={8}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Certificate preview
            </Text>
            <Text style={styles.sectionSubtitle}>
              A4 landscape format
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowFullPreview((value) => !value)}
            style={styles.previewToggle}
            accessibilityRole="button"
          >
            <Text style={styles.previewToggleText}>
              {showFullPreview ? "Fit screen" : "Preview"}
            </Text>
          </TouchableOpacity>
        </View>

        {showFullPreview ? (
          <View style={styles.fullPreviewContainer}>
            <TouchableOpacity
              style={styles.closePreview}
              onPress={() => setShowFullPreview(false)}
              accessibilityRole="button"
            >
              <Text style={styles.closePreviewText}>
                Close preview ✕
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={styles.fullPreviewScroll}
            >
              <View
                ref={previewCaptureRef}
                collapsable={false}
                style={[
                  styles.previewFrame,
                  {
                    width: Math.max(700, windowWidth - 36),
                    height: Math.max(700, windowWidth - 36) /
                      LANDSCAPE_RATIO,
                  },
                ]}
              >
                {certificateHtml ? (
                  <WebView
                    source={{ html: certificateHtml }}
                    style={styles.webView}
                    originWhitelist={["*"]}
                    javaScriptEnabled={false}
                    scrollEnabled={false}
                    bounces={false}
                    onLoadEnd={() => setPreviewReady(true)}
                    onError={() => setPreviewReady(true)}
                  />
                ) : (
                  <Text style={styles.fallbackTitle}>
                    Certificate HTML is unavailable.
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        ) : (
          <View
            ref={previewCaptureRef}
            collapsable={false}
            style={[
              styles.previewFrame,
              {
                width: previewWidth,
                height: previewHeight,
              },
            ]}
          >
            {certificateHtml ? (
              <WebView
                key={`${certificate.certificateId}-${windowWidth}`}
                source={{ html: certificateHtml }}
                style={styles.webView}
                originWhitelist={["*"]}
                javaScriptEnabled={false}
                scrollEnabled={false}
                bounces={false}
                scalesPageToFit={Platform.OS === "android"}
                setSupportMultipleWindows={false}
                onLoadEnd={() => setPreviewReady(true)}
                onError={() => setPreviewReady(true)}
              />
            ) : (
              <View style={styles.previewFallback}>
                <Text style={styles.fallbackTitle}>
                  Preview unavailable
                </Text>
              </View>
            )}

            {!previewReady && certificateHtml ? (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.previewLoadingText}>
                  Rendering certificate…
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <Text style={styles.previewCaption}>
          The exported files use the same certificate HTML as this
          preview.
        </Text>

        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export certificate</Text>
          <Text style={styles.exportDescription}>
            Choose the format you need.
          </Text>

          <TouchableOpacity
            style={[
              styles.exportCard,
              exporting === "pdf" && styles.exportCardBusy,
            ]}
            onPress={savePdf}
            disabled={exporting !== null}
            accessibilityRole="button"
          >
            <View style={[styles.exportIcon, styles.pdfIcon]}>
              <Text style={styles.exportIconText}>PDF</Text>
            </View>

            <View style={styles.exportCardContent}>
              <Text style={styles.exportCardTitle}>Save as PDF</Text>
              <Text style={styles.exportCardDescription}>
                Print-quality document for applications and records.
              </Text>
            </View>

            {exporting === "pdf" ? (
              <ActivityIndicator color={PRIMARY} />
            ) : (
              <Text style={styles.exportArrow}>›</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportCard,
              exporting === "png" && styles.exportCardBusy,
            ]}
            onPress={savePng}
            disabled={exporting !== null}
            accessibilityRole="button"
          >
            <View style={[styles.exportIcon, styles.pngIcon]}>
              <Text style={styles.exportIconText}>PNG</Text>
            </View>

            <View style={styles.exportCardContent}>
              <Text style={styles.exportCardTitle}>Save as PNG</Text>
              <Text style={styles.exportCardDescription}>
                Certificate image saved to your photo gallery.
              </Text>
            </View>

            {exporting === "png" ? (
              <ActivityIndicator color={PRIMARY} />
            ) : (
              <Text style={styles.exportArrow}>›</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareImageButton}
            onPress={sharePng}
            disabled={exporting !== null}
            accessibilityRole="button"
          >
            <Text style={styles.shareImageText}>
              Share certificate image ↗
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            Achievement details
          </Text>

          <View style={styles.categoryLine}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: categoryColor },
              ]}
            />
            <Text
              style={[
                styles.categoryText,
                { color: categoryColor },
              ]}
            >
              {certificate.category}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Certificate ID</Text>
            <Text selectable style={styles.detailValue}>
              {certificate.certificateId}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issued to</Text>
            <Text style={styles.detailValue}>
              {certificate.issuedTo}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issued by</Text>
            <Text style={styles.detailValue}>
              {certificate.issuedBy}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue date</Text>
            <Text style={styles.detailValue}>
              {formatDate(
                certificate.issueDate || certificate.createdAt
              )}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: isRevoked
                    ? "#B42318"
                    : isVerified
                      ? GREEN
                      : "#A15C00",
                },
              ]}
            >
              {isRevoked
                ? "Revoked"
                : isVerified
                  ? "Verified"
                  : "Unverified"}
            </Text>
          </View>

          {certificate.description ? (
            <>
              <View style={styles.detailDivider} />

              <View style={styles.descriptionSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {certificate.description}
                </Text>
              </View>
            </>
          ) : null}

          {certificate.skills?.length ? (
            <>
              <View style={styles.detailDivider} />

              <View style={styles.skillsSection}>
                <Text style={styles.detailLabel}>Skills covered</Text>
                <View style={styles.skillsWrap}>
                  {certificate.skills.map((skill, index) => (
                    <View
                      key={`${skill}-${index}`}
                      style={styles.skillChip}
                    >
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {certificate.verificationUrl ? (
            <>
              <View style={styles.detailDivider} />

              <TouchableOpacity
                style={styles.verifyLink}
                onPress={openVerificationUrl}
                accessibilityRole="button"
              >
                <Text style={styles.verifyLinkText}>
                  Verify certificate online ↗
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>i</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Keep your achievement safe
            </Text>
            <Text style={styles.infoText}>
              Save a PDF for documents or a PNG for quick sharing.
              Use the verification link, when available, to check
              the certificate's current status.
            </Text>
          </View>
        </View>

        <AdBanner
          isPremium={isPremium}
          marginVertical={12}
        />

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F3F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    color: INK,
    fontSize: 32,
    lineHeight: 36,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: INK,
  },

  headerSubtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 11,
  },

  headerShare: {
    backgroundColor: "#FFF0EF",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
  },

  headerShareText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  heroCard: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 14,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF2D9",
    alignItems: "center",
    justifyContent: "center",
  },

  heroIconText: {
    color: GOLD,
    fontSize: 27,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  verifiedBadge: {
    backgroundColor: "#E7F7EE",
  },

  revokedBadge: {
    backgroundColor: "#FEE4E2",
  },

  pendingBadge: {
    backgroundColor: "#FFF1D6",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  verifiedText: {
    color: "#187447",
  },

  revokedText: {
    color: "#B42318",
  },

  pendingText: {
    color: "#945600",
  },

  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
    color: INK,
    letterSpacing: -0.5,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: MUTED,
    marginTop: 8,
  },

  heroMetadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  heroMetadataItem: {
    flex: 1,
  },

  heroMetadataLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  heroMetadataValue: {
    color: INK,
    fontSize: 12,
    fontWeight: "700",
  },

  heroMetadataDivider: {
    width: 1,
    height: 35,
    backgroundColor: BORDER,
    marginHorizontal: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    color: INK,
    fontWeight: "900",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
  },

  previewToggle: {
    borderRadius: 11,
    backgroundColor: "#FFF0EF",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  previewToggleText: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY,
  },

  fullPreviewContainer: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },

  closePreview: {
    alignSelf: "flex-end",
    padding: 8,
  },

  closePreviewText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: "800",
  },

  fullPreviewScroll: {
    paddingBottom: 6,
  },

  previewFrame: {
    backgroundColor: SURFACE,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9DEE7",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  webView: {
    flex: 1,
    backgroundColor: SURFACE,
  },

  previewLoading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },

  previewLoadingText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 10,
  },

  previewFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  fallbackTitle: {
    color: INK,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "800",
  },

  previewCaption: {
    fontSize: 10,
    lineHeight: 16,
    color: MUTED,
    marginTop: 9,
    marginBottom: 10,
  },

  exportSection: {
    marginTop: 14,
    marginBottom: 10,
  },

  exportTitle: {
    fontSize: 17,
    color: INK,
    fontWeight: "900",
  },

  exportDescription: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 12,
  },

  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
    minHeight: 78,
  },

  exportCardBusy: {
    opacity: 0.65,
  },

  exportIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  pdfIcon: {
    backgroundColor: "#FDEBEA",
  },

  pngIcon: {
    backgroundColor: "#E9F2FF",
  },

  exportIconText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "900",
  },

  exportCardContent: {
    flex: 1,
  },

  exportCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: INK,
  },

  exportCardDescription: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  exportArrow: {
    color: MUTED,
    fontSize: 27,
    paddingLeft: 8,
  },

  shareImageButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },

  shareImageText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },

  detailsCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginTop: 14,
  },

  detailsTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: INK,
  },

  categoryLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 7,
  },

  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "800",
  },

  detailRow: {
    paddingVertical: 13,
    gap: 8,
  },

  detailLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
  },

  detailValue: {
    color: INK,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    flexShrink: 1,
  },

  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },

  descriptionSection: {
    paddingVertical: 14,
    gap: 7,
  },

  descriptionText: {
    color: "#475467",
    fontSize: 12,
    lineHeight: 19,
  },

  skillsSection: {
    paddingTop: 14,
    paddingBottom: 4,
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
  },

  skillChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  skillText: {
    color: "#344054",
    fontSize: 11,
    fontWeight: "600",
  },

  verifyLink: {
    paddingTop: 15,
    paddingBottom: 3,
  },

  verifyLinkText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFF9ED",
    borderWidth: 1,
    borderColor: "#F3E3BF",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },

  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F5E3B9",
    color: "#805B13",
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    fontWeight: "900",
    fontSize: 15,
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#694A0B",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },

  infoText: {
    color: "#80652D",
    fontSize: 11,
    lineHeight: 17,
  },

  bottomSpace: {
    height: 24,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  stateTitle: {
    color: INK,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 18,
  },

  stateDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },

  errorIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
  },

  errorIconText: {
    color: "#B42318",
    fontSize: 26,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: 22,
    backgroundColor: PRIMARY,
    borderRadius: 13,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
