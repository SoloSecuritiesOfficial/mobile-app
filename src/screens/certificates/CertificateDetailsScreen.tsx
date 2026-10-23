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
  Dimensions,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { RootStackParamList } from "../../navigation/types";
import Colors from "../../theme/colors";
import { getCertificateById } from "../../services/certificateService";
import { getCurrentUser } from "../../services/authService";
import AdBanner from "../../components/AdBanner";
import { generateCertificateHtml } from "../../utils/certificateHtml";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "CertificateDetails"
>;

type Certificate = {
  _id: string;
  title: string;
  category: string;
  certificateId: string;
  issuedBy?: string;
  issuedTo?: string;
  description?: string;
  skills?: string[];
  issueDate?: string;
  createdAt?: string;
  verified?: boolean;
  status?: string;
  verificationUrl?: string;
};

type UserProfile = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  username?: string;
  displayName?: string;
  isPremium?: boolean;
  profile?: UserProfile;
  user?: UserProfile;
};

type ExportType = "pdf" | "png" | null;

const BRAND = "#D92D3A";
const INK = "#172033";
const MUTED = "#667085";
const BORDER = "#E7EAF0";
const PAGE = "#F4F6FA";

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * A landscape certificate is approximately 1.414 times as wide as it is high.
 * Keep the preview width responsive to smaller phones.
 */
const PREVIEW_WIDTH = Math.max(
  220,
  Math.min(SCREEN_WIDTH - 36, 560)
);

const PREVIEW_HEIGHT = PREVIEW_WIDTH / 1.4142;

function unwrapResponse(value: any): any {
  let current = value;

  for (let i = 0; i < 3; i += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      current.data !== undefined
    ) {
      current = current.data;
    } else {
      break;
    }
  }

  return current;
}

function getFullName(profileValue: any): string {
  const profile = unwrapResponse(profileValue);

  if (!profile || typeof profile !== "object") {
    return "";
  }

  const candidates = [
    profile,
    profile.profile,
    profile.user,
    profile.data,
  ].filter(
    (candidate): candidate is Record<string, any> =>
      !!candidate && typeof candidate === "object"
  );

  for (const candidate of candidates) {
    const parts = [
      candidate.firstName,
      candidate.middleName,
      candidate.lastName,
    ]
      .filter(
        (part) =>
          typeof part === "string" && part.trim().length > 0
      )
      .map((part: string) => part.trim());

    if (parts.length > 0) {
      return parts.join(" ");
    }

    const directName =
      candidate.fullName ||
      candidate.name ||
      candidate.displayName;

    if (
      typeof directName === "string" &&
      directName.trim().length > 0
    ) {
      return directName.trim();
    }
  }

  return "";
}

function formatDate(value?: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeCertificate(response: any): Certificate | null {
  const result = unwrapResponse(response);

  if (!result || typeof result !== "object") {
    return null;
  }

  const candidate =
    result.certificate ||
    result.item ||
    result;

  if (
    !candidate ||
    typeof candidate !== "object" ||
    !candidate._id
  ) {
    return null;
  }

  return candidate as Certificate;
}

export default function CertificateDetailsScreen({
  navigation,
  route,
}: Props) {
  const { id } = route.params;

  const previewCaptureRef = useRef<View>(null);
  const webViewRef = useRef<WebView>(null);

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [previewReady, setPreviewReady] = useState(false);
  const [exporting, setExporting] = useState<ExportType>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const loadCertificate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreviewReady(false);

    try {
      const [certificateResponse, userResponse] =
        await Promise.all([
          getCertificateById(id),
          getCurrentUser().catch(() => null),
        ]);

      const loadedCertificate =
        normalizeCertificate(certificateResponse);

      if (!loadedCertificate) {
        throw new Error(
          "The certificate could not be found."
        );
      }

      const user = unwrapResponse(userResponse);

      setCertificate(loadedCertificate);
      setCurrentUser(user ?? null);
      setIsPremium(Boolean(user?.isPremium));
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load this certificate. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  /**
   * Prefer the complete name from the profile.
   * Fall back to the name stored on the certificate if the profile
   * does not contain a full name.
   */
  const fullUserName = useMemo(() => {
    const profileName = getFullName(currentUser);

    if (profileName) {
      return profileName;
    }

    const issuedTo = certificate?.issuedTo?.trim();

    if (issuedTo) {
      return issuedTo;
    }

    return "Certificate Holder";
  }, [currentUser, certificate]);

  /**
   * This HTML is shared by the on-screen preview and PDF export
   * to keep the certificate design consistent.
   */
  const certificateHtml = useMemo(() => {
    if (!certificate) return "";

    return generateCertificateHtml(
      {
        ...certificate,
        issuedTo: fullUserName,
      },
      {
        recipientName: fullUserName,
      }
    );
  }, [certificate, fullUserName]);

  const handlePdfExport = useCallback(async () => {
    if (!certificate || !certificateHtml) {
      Alert.alert(
        "Certificate unavailable",
        "Load the certificate before exporting it."
      );
      return;
    }

    setExporting("pdf");

    try {
      await Print.printAsync({
        html: certificateHtml,
      });
    } catch (err: any) {
      Alert.alert(
        "PDF export failed",
        err?.message ||
          "Unable to open the PDF print dialog."
      );
    } finally {
      setExporting(null);
    }
  }, [certificate, certificateHtml]);

  /**
   * PNG sharing does not depend on expo-media-library.
   * It captures the preview and opens the system share sheet.
   */
  const handlePngExport = useCallback(async () => {
    if (!certificate || !previewReady) {
      Alert.alert(
        "Preview not ready",
        "Wait for the certificate preview to finish loading."
      );
      return;
    }

    if (!previewCaptureRef.current) {
      Alert.alert(
        "Preview unavailable",
        "Please wait and try again."
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

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        await Share.share({
          message: `Certificate: ${certificate.title}\nCertificate ID: ${certificate.certificateId}`,
        });

        return;
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: "image/png",
        dialogTitle: "Share certificate PNG",
        UTI: "public.png",
      });
    } catch (err: any) {
      Alert.alert(
        "PNG export failed",
        err?.message ||
          "Unable to capture or share the certificate image."
      );
    } finally {
      setExporting(null);
    }
  }, [certificate, previewReady]);

  const handleShareDetails = useCallback(async () => {
    if (!certificate) return;

    try {
      await Share.share({
        title: certificate.title,
        message: [
          `Certificate: ${certificate.title}`,
          `Issued to: ${fullUserName}`,
          `Issued by: ${certificate.issuedBy || "SoloSecurities"}`,
          `Certificate ID: ${certificate.certificateId}`,
          `Category: ${certificate.category}`,
          `Issue date: ${formatDate(
            certificate.issueDate || certificate.createdAt
          )}`,
          certificate.verificationUrl
            ? `Verify: ${certificate.verificationUrl}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (err: any) {
      Alert.alert(
        "Share failed",
        err?.message || "Unable to share certificate details."
      );
    }
  }, [certificate, fullUserName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.stateTitle}>
          Loading certificate…
        </Text>
        <Text style={styles.stateSubtitle}>
          Preparing your certificate preview.
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !certificate) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.stateTitle}>
          Unable to load certificate
        </Text>

        <Text style={styles.stateSubtitle}>
          {error || "This certificate is not available."}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadCertificate}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Certificate
          </Text>
          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            Preview and export
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareDetails}
          activeOpacity={0.8}
          accessibilityLabel="Share certificate details"
        >
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdBanner
          isPremium={isPremium}
          marginVertical={6}
        />

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Text style={styles.introIconText}>✦</Text>
          </View>

          <View style={styles.introText}>
            <Text style={styles.introTitle}>
              Your achievement
            </Text>
            <Text style={styles.introDescription}>
              Review your certificate and export a copy.
            </Text>
          </View>
        </View>

        <View style={styles.certificateInfoCard}>
          <Text style={styles.infoEyebrow}>
            CERTIFICATE TITLE
          </Text>

          <Text style={styles.certificateTitle}>
            {certificate.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {certificate.category || "Certification"}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                certificate.verified
                  ? styles.verifiedPill
                  : styles.pendingPill,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  certificate.verified
                    ? styles.verifiedText
                    : styles.pendingText,
                ]}
              >
                {certificate.verified
                  ? "✓ Verified"
                  : "Pending verification"}
              </Text>
            </View>
          </View>

          <View style={styles.recipientRow}>
            <View style={styles.recipientIcon}>
              <Text style={styles.recipientIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.recipientText}>
              <Text style={styles.recipientLabel}>
                ISSUED TO
              </Text>
              <Text style={styles.recipientName}>
                {fullUserName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.previewHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Certificate preview
            </Text>
            <Text style={styles.sectionSubtitle}>
              Complete certificate · no inner scrolling
            </Text>
          </View>

          {previewReady && (
            <View style={styles.readyPill}>
              <View style={styles.readyDot} />
              <Text style={styles.readyText}>Ready</Text>
            </View>
          )}
        </View>

        <View style={styles.previewOuter}>
          <View
            ref={previewCaptureRef}
            collapsable={false}
            style={[
              styles.previewCapture,
              {
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
              },
            ]}
          >
            {!previewReady && (
              <View style={styles.previewLoading}>
                <ActivityIndicator
                  size="large"
                  color={BRAND}
                />
                <Text style={styles.previewLoadingText}>
                  Preparing certificate…
                </Text>
              </View>
            )}

            <WebView
              ref={webViewRef}
              source={{ html: certificateHtml }}
              style={[
                styles.webView,
                !previewReady && styles.webViewLoading,
              ]}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled={false}
              scrollEnabled={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
              scalesPageToFit={false}
              onLoadEnd={() => setPreviewReady(true)}
              onError={() => {
                setPreviewReady(false);
              }}
            />
          </View>
        </View>

        <Text style={styles.previewFootnote}>
          The certificate is scaled to fit the preview. The PDF
          uses the same certificate design.
        </Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>
            Certificate details
          </Text>

          <DetailRow
            label="Certificate ID"
            value={certificate.certificateId || "Not available"}
          />

          <DetailRow
            label="Issued to"
            value={fullUserName}
          />

          <DetailRow
            label="Issued by"
            value={certificate.issuedBy || "SoloSecurities"}
          />

          <DetailRow
            label="Category"
            value={certificate.category || "Certification"}
          />

          <DetailRow
            label="Issue date"
            value={formatDate(
              certificate.issueDate || certificate.createdAt
            )}
          />

          {!!certificate.description && (
            <View style={styles.descriptionBlock}>
              <Text style={styles.detailLabel}>
                Description
              </Text>
              <Text style={styles.descriptionText}>
                {certificate.description}
              </Text>
            </View>
          )}

          {!!certificate.skills?.length && (
            <View style={styles.skillsBlock}>
              <Text style={styles.detailLabel}>Skills</Text>
              <View style={styles.skillsRow}>
                {certificate.skills.map((skill, index) => (
                  <View
                    key={`${skill}-${index}`}
                    style={styles.skillChip}
                  >
                    <Text style={styles.skillChipText}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!certificate.verificationUrl && (
            <View style={styles.descriptionBlock}>
              <Text style={styles.detailLabel}>
                Verification URL
              </Text>
              <Text style={styles.verificationUrl}>
                {certificate.verificationUrl}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.exportCard}>
          <Text style={styles.exportTitle}>
            Export certificate
          </Text>
          <Text style={styles.exportSubtitle}>
            Choose a format to print or share your achievement.
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!previewReady || exporting !== null) &&
                styles.disabledButton,
            ]}
            onPress={handlePdfExport}
            disabled={exporting !== null}
            activeOpacity={0.85}
          >
            {exporting === "pdf" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonIcon}>▤</Text>
            )}
            <Text style={styles.primaryButtonText}>
              {exporting === "pdf"
                ? "Preparing PDF…"
                : "Save / Print as PDF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pngButton,
              (!previewReady || exporting !== null) &&
                styles.disabledPngButton,
            ]}
            onPress={handlePngExport}
            disabled={!previewReady || exporting !== null}
            activeOpacity={0.85}
          >
            {exporting === "png" ? (
              <ActivityIndicator color={BRAND} />
            ) : (
              <Text style={styles.pngButtonIcon}>▧</Text>
            )}
            <Text style={styles.pngButtonText}>
              {exporting === "png"
                ? "Preparing PNG…"
                : "Share as PNG"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.exportNote}>
            PDF opens the device print dialog, where available you
            can choose Save as PDF. PNG opens the system share menu.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F5F8",
  },

  backIcon: {
    fontSize: 32,
    color: INK,
    lineHeight: 35,
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: INK,
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },

  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  shareIcon: {
    color: BRAND,
    fontSize: 24,
    fontWeight: "800",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  intro: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },

  introIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },

  introIconText: {
    color: BRAND,
    fontSize: 25,
    fontWeight: "900",
  },

  introText: {
    flex: 1,
    marginLeft: 11,
  },

  introTitle: {
    color: INK,
    fontSize: 18,
    fontWeight: "800",
  },

  introDescription: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },

  certificateInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },

  infoEyebrow: {
    color: MUTED,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
  },

  certificateTitle: {
    color: INK,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 28,
    marginTop: 7,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
  },

  categoryPillText: {
    color: "#5145CD",
    fontSize: 11,
    fontWeight: "700",
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  verifiedPill: {
    backgroundColor: "#E9F8EF",
  },

  pendingPill: {
    backgroundColor: "#FFF4DB",
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  verifiedText: {
    color: "#18794E",
  },

  pendingText: {
    color: "#9A6700",
  },

  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
    marginTop: 15,
  },

  recipientIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#E9F8EF",
    alignItems: "center",
    justifyContent: "center",
  },

  recipientIconText: {
    color: "#18794E",
    fontSize: 17,
    fontWeight: "900",
  },

  recipientText: {
    flex: 1,
    marginLeft: 10,
  },

  recipientLabel: {
    color: MUTED,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "800",
  },

  recipientName: {
    color: INK,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },

  previewHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    color: INK,
    fontSize: 17,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#E9F8EF",
  },

  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#15945A",
    marginRight: 5,
  },

  readyText: {
    color: "#18794E",
    fontSize: 10,
    fontWeight: "800",
  },

  previewOuter: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EDF4",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE3EC",
  },

  previewCapture: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  webViewLoading: {
    opacity: 0.02,
  },

  previewLoading: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  previewLoadingText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 8,
  },

  previewFootnote: {
    color: MUTED,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 9,
    marginBottom: 20,
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  detailsHeading: {
    color: INK,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F6",
    gap: 16,
  },

  detailLabel: {
    flex: 0.8,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  detailValue: {
    flex: 1.2,
    color: INK,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "right",
  },

  descriptionBlock: {
    paddingTop: 13,
  },

  descriptionText: {
    color: INK,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  verificationUrl: {
    color: "#2764D8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  skillsBlock: {
    paddingTop: 13,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },

  skillChip: {
    backgroundColor: "#F1F4F9",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  skillChipText: {
    color: "#344054",
    fontSize: 11,
    fontWeight: "600",
  },

  exportCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
  },

  exportTitle: {
    color: INK,
    fontSize: 17,
    fontWeight: "900",
  },

  exportSubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 14,
  },

  primaryButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 13,
    gap: 9,
    marginTop: 5,
  },

  primaryButtonIcon: {
    color: "#FFFFFF",
    fontSize: 19,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F4F5F8",
  },

  secondaryButtonText: {
    color: INK,
    fontSize: 14,
    fontWeight: "700",
  },

  pngButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F1",
    borderWidth: 1,
    borderColor: "#F6C9CD",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 13,
    gap: 9,
    marginTop: 10,
  },

  pngButtonIcon: {
    color: BRAND,
    fontSize: 19,
  },

  pngButtonText: {
    color: BRAND,
    fontSize: 13,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  disabledPngButton: {
    opacity: 0.55,
  },

  exportNote: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 12,
  },

  bottomSpace: {
    height: 18,
  },

  stateContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  stateTitle: {
    color: INK,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },

  stateSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 14,
  },

  errorIcon: {
    width: 48,
    height: 48,
    lineHeight: 48,
    textAlign: "center",
    overflow: "hidden",
    borderRadius: 24,
    color: BRAND,
    backgroundColor: "#FFF0F1",
    fontSize: 30,
    fontWeight: "900",
  },
});