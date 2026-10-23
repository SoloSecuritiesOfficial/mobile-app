/**
 * SplashScreen.tsx — SoloSecurities White Premium Startup Screen
 *
 * White, clean cybersecurity design with a multicolor security orbit,
 * floating ambient shapes, a scanning accent, animated logo reveal,
 * and API-driven startup progress. Keeps the existing app startup flow.
 */

import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "../../context/AuthContext";
import { useStartupData } from "../../context/StartupContext";
import { useStartup } from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import { RootStackParamList } from "../../navigation/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLORS = {
  white: "#FFFFFF",
  ink: "#171923",
  muted: "#7B8190",
  faint: "#A8ADBA",
  line: "#EEF0F5",
  red: "#C62828",       // SoloSecurities brand accent
  coral: "#FF6B6B",
  blue: "#4C7DFF",
  cyan: "#32C5E8",
  violet: "#9270FF",
  green: "#2CCB9B",
  paleRed: "#FFF3F3",
};

/** Soft colored ambient lights drift slowly around the white canvas. */
function AmbientBackdrop() {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const driftC = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeFloat = (value: Animated.Value, duration: number, reverse = false) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const a = makeFloat(driftA, 4400);
    const b = makeFloat(driftB, 5600);
    const c = makeFloat(driftC, 4900);
    const s = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    a.start(); b.start(); c.start(); s.start();
    return () => { a.stop(); b.stop(); c.stop(); s.stop(); };
  }, [driftA, driftB, driftC, scan]);

  const translateA = driftA.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const translateB = driftB.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const translateC = driftC.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_HEIGHT * 0.34, SCREEN_HEIGHT * 0.34] });
  const scanOpacity = scan.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.38, 0.28, 0] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.ambientBlob, styles.blobRed, { transform: [{ translateY: translateA }, { scale: driftA.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }]} />
      <Animated.View style={[styles.ambientBlob, styles.blobBlue, { transform: [{ translateY: translateB }, { translateX: translateB }] }]} />
      <Animated.View style={[styles.ambientBlob, styles.blobViolet, { transform: [{ translateY: translateC }] }]} />
      <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }], opacity: scanOpacity }]} />
      <View style={styles.topColorLine}>
        <View style={[styles.colorSegment, { backgroundColor: COLORS.red, flex: 1.3 }]} />
        <View style={[styles.colorSegment, { backgroundColor: COLORS.coral, flex: 1 }]} />
        <View style={[styles.colorSegment, { backgroundColor: COLORS.violet, flex: 1 }]} />
        <View style={[styles.colorSegment, { backgroundColor: COLORS.blue, flex: 1 }]} />
        <View style={[styles.colorSegment, { backgroundColor: COLORS.cyan, flex: 1 }]} />
        <View style={[styles.colorSegment, { backgroundColor: COLORS.green, flex: 1 }]} />
      </View>
    </View>
  );
}

/** Rotating multicolor orbit gives the logo a subtle security-scanner feel. */
function SecurityOrbit({ opacity }: { opacity: Animated.Value }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const counterRotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const outer = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true }));
    const inner = Animated.loop(Animated.timing(counterRotation, { toValue: 1, duration: 10500, easing: Easing.linear, useNativeDriver: true }));
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(450),
      ])
    );
    outer.start(); inner.start(); pulseLoop.start();
    return () => { outer.stop(); inner.stop(); pulseLoop.stop(); };
  }, [rotation, counterRotation, pulse]);

  const outerRotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const innerRotate = counterRotation.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.42] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.36, 0.16, 0] });

  return (
    <Animated.View pointerEvents="none" style={[styles.orbitStage, { opacity }]}>
      <Animated.View style={[styles.outerOrbit, { transform: [{ rotate: outerRotate }] }]}>
        <View style={[styles.orbitDot, styles.dotRed]} />
        <View style={[styles.orbitDot, styles.dotBlue]} />
        <View style={[styles.orbitDot, styles.dotGreen]} />
        <View style={styles.orbitDash} />
      </Animated.View>
      <Animated.View style={[styles.innerOrbit, { transform: [{ rotate: innerRotate }] }]}>
        <View style={[styles.orbitDotSmall, styles.dotViolet]} />
        <View style={[styles.orbitDotSmall, styles.dotCyan]} />
      </Animated.View>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
    </Animated.View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(100, progress)),
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const fillWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-45, 180] });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: fillWidth }]}>
        <Animated.View style={[styles.progressShimmer, { transform: [{ translateX: shimmerX }] }]} />
      </Animated.View>
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData } = useStartupData();
  const completedRef = useRef(false);

  const orbitOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(18)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.sequence([
      Animated.timing(haloOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(orbitOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 12, stiffness: 100, mass: 0.85, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(panelY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(footerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [haloOpacity, orbitOpacity, logoScale, logoOpacity, titleOpacity, titleY, panelOpacity, panelY, footerOpacity]);

  const handleComplete = useCallback(
    (data: StartupData) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setStartupData(data);
      markStartupDone();
      if (data.isAuthenticated) {
        signIn();
      } else {
        navigation.replace("Login");
      }
    },
    [signIn, markStartupDone, setStartupData, navigation]
  );

  const { progress, currentLabel, hasFatalError, fatalMessage, retry } = useStartup(handleComplete);

  if (hasFatalError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <AmbientBackdrop />
        <View style={styles.errorContent}>
          <View style={styles.errorLogoFrame}>
            <Image source={require("../../../assets/images/logo.png")} style={styles.errorLogo} resizeMode="contain" />
          </View>
          <Text style={styles.errorEyebrow}>SECURE STARTUP</Text>
          <Text style={styles.errorTitle}>We hit a small issue</Text>
          <Text style={styles.errorMessage}>{fatalMessage || "We couldn't finish preparing your security data. Please try again."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.86}>
            <Text style={styles.retryButtonText}>Try Again</Text>
            <Text style={styles.retryArrow}>↗</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.errorFooter}>SoloSecurities · Secure by design</Text>
      </View>
    );
  }

  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AmbientBackdrop />

      <View style={styles.mainContent}>
        <View style={styles.heroArea}>
          <Animated.View style={[styles.logoHalo, { opacity: haloOpacity }]} />
          <SecurityOrbit opacity={orbitOpacity} />
          <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <Image source={require("../../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          </Animated.View>
          <Animated.View style={[styles.securePill, { opacity: titleOpacity }]}>
            <View style={styles.securePillDot} />
            <Text style={styles.securePillText}>YOUR DIGITAL WORLD, SECURED</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.headingBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          <Text style={styles.appName}>Solo<Text style={styles.appNameAccent}>Securities</Text></Text>
          <Text style={styles.tagline}>Security that moves with you.</Text>
          <Text style={styles.subTagline}>Preparing your protection experience</Text>
        </Animated.View>

        <Animated.View style={[styles.progressCard, { opacity: panelOpacity, transform: [{ translateY: panelY }] }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <View style={styles.progressIconWrap}>
                <Text style={styles.progressIcon}>⌁</Text>
              </View>
              <View style={styles.progressTitleTextWrap}>
                <Text style={styles.progressTitle}>Initializing security</Text>
                <Text style={styles.progressSubtitle}>Checking your secure environment</Text>
              </View>
            </View>
            <Text style={styles.percentage}>{Math.round(safeProgress)}%</Text>
          </View>
          <ProgressBar progress={safeProgress} />
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText} numberOfLines={1}>{currentLabel || "Preparing secure services…"}</Text>
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.trustText}>Protected</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: COLORS.blue }]} />
              <Text style={styles.trustText}>Connected</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: COLORS.violet }]} />
              <Text style={styles.trustText}>Up to date</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.footerMark}>
          <View style={[styles.footerMarkSegment, { backgroundColor: COLORS.red }]} />
          <View style={[styles.footerMarkSegment, { backgroundColor: COLORS.violet }]} />
          <View style={[styles.footerMarkSegment, { backgroundColor: COLORS.blue }]} />
          <View style={[styles.footerMarkSegment, { backgroundColor: COLORS.green }]} />
        </View>
        <Text style={styles.footerText}>POWERED BY SOLOSECURITIES</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ambientBlob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobRed: {
    width: 210,
    height: 210,
    top: SCREEN_HEIGHT * 0.08,
    left: -125,
    backgroundColor: "rgba(198,40,40,0.055)",
  },
  blobBlue: {
    width: 230,
    height: 230,
    right: -145,
    top: SCREEN_HEIGHT * 0.30,
    backgroundColor: "rgba(76,125,255,0.055)",
  },
  blobViolet: {
    width: 190,
    height: 190,
    bottom: SCREEN_HEIGHT * 0.04,
    left: SCREEN_WIDTH * 0.18,
    backgroundColor: "rgba(146,112,255,0.045)",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.cyan,
  },
  topColorLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: "row",
  },
  colorSegment: { height: 3 },
  mainContent: {
    width: Math.min(SCREEN_WIDTH - 42, 420),
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 18 : 10,
    paddingBottom: 58,
  },
  heroArea: {
    width: Math.min(SCREEN_WIDTH - 52, 310),
    height: Math.min(SCREEN_WIDTH - 52, 310),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  logoHalo: {
    position: "absolute",
    width: "66%",
    height: "66%",
    borderRadius: 999,
    backgroundColor: "rgba(198,40,40,0.045)",
    borderWidth: 1,
    borderColor: "rgba(198,40,40,0.08)",
  },
  orbitStage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  outerOrbit: {
    position: "absolute",
    width: "94%",
    height: "94%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(198,40,40,0.16)",
    borderStyle: "dashed",
  },
  innerOrbit: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(76,125,255,0.15)",
    borderStyle: "dotted",
  },
  orbitDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.white },
  orbitDotSmall: { position: "absolute", width: 7, height: 7, borderRadius: 4 },
  dotRed: { top: -4, left: "49%", backgroundColor: COLORS.red },
  dotBlue: { right: "4%", top: "67%", backgroundColor: COLORS.blue },
  dotGreen: { left: "10%", bottom: "15%", backgroundColor: COLORS.green },
  dotViolet: { right: "8%", top: "20%", backgroundColor: COLORS.violet },
  dotCyan: { left: "12%", bottom: "20%", backgroundColor: COLORS.cyan },
  orbitDash: {
    position: "absolute",
    width: 28,
    height: 3,
    borderRadius: 3,
    right: 22,
    top: "23%",
    backgroundColor: COLORS.coral,
  },
  pulseRing: {
    position: "absolute",
    width: "56%",
    height: "56%",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(198,40,40,0.28)",
  },
  logoWrap: {
    width: "48%",
    height: "48%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  logo: { width: "90%", height: "90%" },
  securePill: {
    position: "absolute",
    bottom: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F0E5E5",
    shadowColor: "#30364A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  securePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green, marginRight: 7 },
  securePillText: { fontSize: 9, fontWeight: "800", color: COLORS.muted, letterSpacing: 1.05 },
  headingBlock: { alignItems: "center", marginTop: 1, marginBottom: 24 },
  appName: { fontSize: 28, fontWeight: "800", color: COLORS.ink, letterSpacing: -0.9, marginBottom: 7 },
  appNameAccent: { color: COLORS.red },
  tagline: { fontSize: 15, fontWeight: "600", color: "#555B6A", letterSpacing: 0.05 },
  subTagline: { marginTop: 6, fontSize: 12, color: COLORS.faint, fontWeight: "500" },
  progressCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#ECEEF4",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 14,
    shadowColor: "#26304A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.065,
    shadowRadius: 20,
    elevation: 3,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  progressTitleRow: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
  progressIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paleRed,
    marginRight: 11,
  },
  progressIcon: { color: COLORS.red, fontSize: 25, fontWeight: "700", marginTop: -3 },
  progressTitleTextWrap: { flex: 1 },
  progressTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  progressSubtitle: { color: COLORS.muted, fontSize: 10, fontWeight: "500" },
  percentage: { fontSize: 18, color: COLORS.red, fontWeight: "800", fontVariant: ["tabular-nums"] },
  progressTrack: { width: "100%", height: 6, backgroundColor: "#F0F1F5", borderRadius: 20, overflow: "hidden" },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.red,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: COLORS.red, shadowRadius: 5, shadowOpacity: 0.24, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 2 } }),
  },
  progressShimmer: { position: "absolute", width: 48, top: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.58)" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 13, minHeight: 17 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green, marginRight: 8 },
  statusText: { flex: 1, color: COLORS.muted, fontSize: 11, fontWeight: "500" },
  liveLabel: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginLeft: 8 },
  cardDivider: { height: 1, backgroundColor: "#F0F1F5", marginTop: 15, marginBottom: 12 },
  trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trustItem: { flexDirection: "row", alignItems: "center" },
  trustDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  trustText: { color: "#777E8E", fontSize: 10, fontWeight: "600" },
  footer: { position: "absolute", bottom: Platform.OS === "ios" ? 30 : 18, alignItems: "center", justifyContent: "center" },
  footerMark: { flexDirection: "row", width: 26, height: 3, borderRadius: 3, overflow: "hidden", marginBottom: 7 },
  footerMarkSegment: { flex: 1, height: 3 },
  footerText: { fontSize: 9, color: "#A4A9B5", fontWeight: "800", letterSpacing: 1.4 },
  version: { marginTop: 4, color: "#C0C4CE", fontSize: 9, fontWeight: "500" },
  errorContent: { width: Math.min(SCREEN_WIDTH - 48, 360), alignItems: "center", paddingBottom: 25 },
  errorLogoFrame: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: "#F0E3E3", backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 25, shadowColor: COLORS.red, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  errorLogo: { width: 84, height: 84 },
  errorEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 2, color: COLORS.red, marginBottom: 10 },
  errorTitle: { fontSize: 24, fontWeight: "800", color: COLORS.ink, textAlign: "center", marginBottom: 10 },
  errorMessage: { fontSize: 13, lineHeight: 21, color: COLORS.muted, textAlign: "center", marginBottom: 25, paddingHorizontal: 8 },
  retryButton: { minWidth: 175, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.red, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 14, shadowColor: COLORS.red, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  retryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "800", marginRight: 12 },
  retryArrow: { color: COLORS.white, fontSize: 17, fontWeight: "700", marginTop: -2 },
  errorFooter: { position: "absolute", bottom: Platform.OS === "ios" ? 30 : 18, fontSize: 10, color: COLORS.faint, fontWeight: "600" },
});
