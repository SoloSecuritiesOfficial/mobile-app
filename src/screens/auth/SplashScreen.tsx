/**
 * SplashScreen.tsx — SoloSecurities
 *
 * Premium cybersecurity launch animation.
 * Startup progress is supplied by useStartup(), not simulated by a timer.
 *
 * Preserves:
 * - Existing startup coordinator and API calls
 * - StartupContext data handoff
 * - Existing AuthContext sign-in flow
 * - Existing Login navigation
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "../../context/AuthContext";
import { useStartupData } from "../../context/StartupContext";
import { useStartup } from "../../hooks/useStartup";
import type { StartupData } from "../../hooks/useStartup";
import type { RootStackParamList } from "../../navigation/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const COLORS = {
  white: "#FFFFFF",
  red: "#D7193F",
  redDark: "#A90F2D",
  redLight: "#FFE8ED",
  redGlow: "rgba(215, 25, 63, 0.12)",
  ink: "#15151B",
  muted: "#747681",
  faint: "#A6A8B1",
  line: "#ECECF1",
  track: "#F0F0F4",
  success: "#15866D",
};

const LOGO = require("../../../assets/images/logo.png");

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/* -------------------------------------------------------------------------- */
/* Small animated network nodes                                               */
/* -------------------------------------------------------------------------- */

type NetworkPoint = {
  x: number;
  y: number;
  size: number;
  delay: number;
};

const NETWORK_POINTS: NetworkPoint[] = [
  { x: 12, y: 22, size: 4, delay: 0 },
  { x: 25, y: 10, size: 3, delay: 180 },
  { x: 42, y: 18, size: 5, delay: 340 },
  { x: 63, y: 9, size: 3, delay: 500 },
  { x: 83, y: 24, size: 4, delay: 220 },
  { x: 91, y: 45, size: 3, delay: 420 },
  { x: 76, y: 58, size: 5, delay: 120 },
  { x: 57, y: 48, size: 3, delay: 560 },
  { x: 37, y: 60, size: 4, delay: 280 },
  { x: 18, y: 49, size: 3, delay: 460 },
  { x: 29, y: 83, size: 4, delay: 100 },
  { x: 49, y: 76, size: 3, delay: 380 },
  { x: 70, y: 87, size: 4, delay: 600 },
  { x: 88, y: 76, size: 3, delay: 300 },
];

function NetworkNode({
  point,
}: {
  point: NetworkPoint;
}) {
  const opacity = useRef(new Animated.Value(0.18)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.95,
            duration: 850,
            delay: point.delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.45,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.7,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [opacity, scale, point.delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.networkNode,
        {
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: point.size,
          height: point.size,
          borderRadius: point.size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Animated cybersecurity visual                                              */
/* -------------------------------------------------------------------------- */

function SecurityVisual() {
  const ringRotation = useRef(new Animated.Value(0)).current;
  const outerRotation = useRef(new Animated.Value(0)).current;
  const scanProgress = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const visualOpacity = useRef(new Animated.Value(0)).current;
  const visualScale = useRef(new Animated.Value(0.92)).current;

  const ringSpin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const outerSpin = outerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const scanY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-105, 105],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.75],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(visualOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(visualScale, {
        toValue: 1,
        damping: 17,
        stiffness: 85,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]);

    const rotateInner = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const rotateOuter = Animated.loop(
      Animated.timing(outerRotation, {
        toValue: 1,
        duration: 21000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 1750,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    entrance.start();
    rotateInner.start();
    rotateOuter.start();
    scanLoop.start();
    glowLoop.start();

    return () => {
      entrance.stop();
      rotateInner.stop();
      rotateOuter.stop();
      scanLoop.stop();
      glowLoop.stop();
    };
  }, [
    visualOpacity,
    visualScale,
    ringRotation,
    outerRotation,
    scanProgress,
    glowPulse,
  ]);

  return (
    <Animated.View
      style={[
        styles.visual,
        {
          opacity: visualOpacity,
          transform: [{ scale: visualScale }],
        },
      ]}
      accessible
      accessibilityLabel="SoloSecurities security system animation"
    >
      {/* Network points and connections */}
      <View pointerEvents="none" style={styles.networkLayer}>
        {NETWORK_POINTS.map((point, index) => (
          <NetworkNode key={`node-${index}`} point={point} />
        ))}

        <View style={[styles.connection, styles.connectionOne]} />
        <View style={[styles.connection, styles.connectionTwo]} />
        <View style={[styles.connection, styles.connectionThree]} />
        <View style={[styles.connection, styles.connectionFour]} />
        <View style={[styles.connection, styles.connectionFive]} />
        <View style={[styles.connection, styles.connectionSix]} />
      </View>

      {/* Large, soft red illumination */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Two independently rotating radar rings */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.outerOrbit,
          { transform: [{ rotate: outerSpin }] },
        ]}
      >
        <View style={styles.outerOrbitMarker} />
        <View style={styles.outerOrbitMarkerSecondary} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.innerOrbit,
          { transform: [{ rotate: ringSpin }] },
        ]}
      >
        <View style={styles.innerOrbitMarker} />
        <View style={styles.innerOrbitMarkerSecondary} />
      </Animated.View>

      {/* Shield is decorative; logo itself remains unframed */}
      <View pointerEvents="none" style={styles.shield}>
        <View style={styles.shieldTop} />
        <View style={styles.shieldLeft} />
        <View style={styles.shieldRight} />
        <View style={styles.shieldBottomLeft} />
        <View style={styles.shieldBottomRight} />
      </View>

      {/* Scanner moves through the center */}
      <View pointerEvents="none" style={styles.scanClip}>
        <Animated.View
          style={[
            styles.scanBeam,
            { transform: [{ translateY: scanY }] },
          ]}
        />
      </View>

      {/* The logo is directly on the white background: no card or frame */}
      <View style={styles.logoArea}>
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="SoloSecurities logo"
        />
      </View>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Real startup progress                                                      */
/* -------------------------------------------------------------------------- */

function StartupProgress({
  progress,
  label,
}: {
  progress: number;
  label: string;
}) {
  const fill = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const statusPulse = useRef(new Animated.Value(0)).current;

  const safeProgress = clamp(progress);

  useEffect(() => {
    const animation = Animated.timing(fill, {
      toValue: safeProgress,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [fill, safeProgress]);

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    shimmerLoop.start();
    pulseLoop.start();

    return () => {
      shimmerLoop.stop();
      pulseLoop.stop();
    };
  }, [shimmer, statusPulse]);

  const fillWidth = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 24],
  });

  const dotScale = statusPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.2],
  });

  const dotOpacity = statusPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>SECURE INITIALIZATION</Text>
        <Text style={styles.progressPercent}>
          {Math.round(safeProgress)}%
        </Text>
      </View>

      <View
        style={styles.progressTrack}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Startup progress"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(safeProgress),
        }}
      >
        <Animated.View
          style={[styles.progressFill, { width: fillWidth }]}
        >
          <View style={styles.progressFillBase} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.progressShimmer,
              { transform: [{ translateX: shimmerX }] },
            ]}
          />
        </Animated.View>
      </View>

      <View style={styles.statusRow}>
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
        <Text style={styles.statusLabel} numberOfLines={2}>
          {label || "Preparing your secure experience"}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main screen                                                                */
/* -------------------------------------------------------------------------- */

export default function SplashScreen({ navigation }: Props) {
  const { signIn, markStartupDone } = useAuth();
  const { setStartupData } = useStartupData();

  const entranceCompleteRef = useRef(false);
  const startupDataRef = useRef<StartupData | null>(null);
  const navigationCompleteRef = useRef(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  const finishStartup = useCallback(
    (data: StartupData) => {
      if (!entranceCompleteRef.current) return;
      if (navigationCompleteRef.current) return;

      navigationCompleteRef.current = true;

      setStartupData(data);
      markStartupDone();

      if (data.isAuthenticated) {
        signIn();
      } else {
        navigation.replace("Login");
      }
    },
    [setStartupData, markStartupDone, signIn, navigation]
  );

  const handleComplete = useCallback(
    (data: StartupData) => {
      startupDataRef.current = data;

      // If APIs finish before the entrance animation, wait for the
      // entrance to finish. If APIs are slower, keep the animation alive.
      if (entranceCompleteRef.current) {
        finishStartup(data);
      }
    },
    [finishStartup]
  );

  const {
    progress,
    currentLabel,
    hasFatalError,
    fatalMessage,
    retry,
  } = useStartup(handleComplete);

  useEffect(() => {
    const entrance = Animated.sequence([
      Animated.delay(180),

      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 16,
          stiffness: 90,
          mass: 0.85,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]);

    entrance.start(({ finished }) => {
      if (!finished) return;

      entranceCompleteRef.current = true;

      const data = startupDataRef.current;
      if (data) {
        finishStartup(data);
      }
    });

    return () => entrance.stop();
  }, [
    logoOpacity,
    logoScale,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    progressOpacity,
    footerOpacity,
    finishStartup,
  ]);

  const safeProgress = useMemo(
    () => clamp(progress),
    [progress]
  );

  if (hasFatalError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />

        <View style={styles.errorContent}>
          <Image
            source={LOGO}
            style={styles.errorLogo}
            resizeMode="contain"
            accessibilityLabel="SoloSecurities logo"
          />

          <Text style={styles.errorTitle}>
            Secure startup needs attention
          </Text>

          <Text style={styles.errorMessage}>
            {fatalMessage ||
              "We couldn't finish preparing your session. Check your connection and try again."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.82}
            accessibilityRole="button"
            onPress={() => {
              startupDataRef.current = null;
              navigationCompleteRef.current = false;
              retry();
            }}
          >
            <Text style={styles.retryButtonText}>Retry securely</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.errorFooter}>SOLOSECURITIES</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Background effects */}
      <View pointerEvents="none" style={styles.backgroundGrid} />
      <View pointerEvents="none" style={styles.topGlow} />
      <View pointerEvents="none" style={styles.bottomGlow} />

      {/* Main cybersecurity animation */}
      <View style={styles.mainContent}>
        <SecurityVisual />

        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={LOGO}
            style={styles.mainLogo}
            resizeMode="contain"
            accessibilityLabel="SoloSecurities logo"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>SoloSecurities</Text>

          <View style={styles.titleAccent} />
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleBlock,
            { opacity: subtitleOpacity },
          ]}
        >
          <Text style={styles.tagline}>
            Secure your digital world.
          </Text>

          <Text style={styles.supportingText}>
            Intelligence. Protection. Confidence.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.progressBlock,
            { opacity: progressOpacity },
          ]}
        >
          <StartupProgress
            progress={safeProgress}
            label={currentLabel}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          { opacity: footerOpacity },
        ]}
      >
        <View style={styles.footerRule} />

        <Text style={styles.footerLabel}>
          PROTECTING WHAT MATTERS
        </Text>

        <Text style={styles.footerSubLabel}>
          Secure initialization in progress
        </Text>
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  backgroundGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
    backgroundColor: COLORS.white,
  },

  topGlow: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.92,
    borderRadius: SCREEN_WIDTH,
    top: -SCREEN_WIDTH * 0.6,
    right: -SCREEN_WIDTH * 0.3,
    backgroundColor: "#FFF0F3",
  },

  bottomGlow: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH,
    bottom: -SCREEN_WIDTH * 0.62,
    left: -SCREEN_WIDTH * 0.3,
    backgroundColor: "#FFF4F6",
  },

  mainContent: {
    width: Math.min(SCREEN_WIDTH - 44, 390),
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
  },

  visual: {
    width: Math.min(SCREEN_WIDTH - 42, 330),
    height: Math.min(SCREEN_WIDTH - 42, 330),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -18,
  },

  networkLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  networkNode: {
    position: "absolute",
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },

  connection: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(215, 25, 63, 0.14)",
    transformOrigin: "left center",
  },

  connectionOne: {
    left: "12%",
    top: "22%",
    width: "33%",
    transform: [{ rotate: "-24deg" }],
  },

  connectionTwo: {
    left: "42%",
    top: "18%",
    width: "36%",
    transform: [{ rotate: "-10deg" }],
  },

  connectionThree: {
    left: "18%",
    top: "49%",
    width: "39%",
    transform: [{ rotate: "8deg" }],
  },

  connectionFour: {
    left: "57%",
    top: "48%",
    width: "34%",
    transform: [{ rotate: "-8deg" }],
  },

  connectionFive: {
    left: "29%",
    top: "83%",
    width: "43%",
    transform: [{ rotate: "6deg" }],
  },

  connectionSix: {
    left: "37%",
    top: "60%",
    width: "31%",
    transform: [{ rotate: "43deg" }],
  },

  glow: {
    position: "absolute",
    width: "55%",
    height: "55%",
    borderRadius: 200,
    backgroundColor: COLORS.redGlow,
  },

  outerOrbit: {
    position: "absolute",
    width: "94%",
    height: "94%",
    borderRadius: 300,
    borderWidth: 1,
    borderColor: "rgba(215, 25, 63, 0.15)",
    borderStyle: "dashed",
  },

  outerOrbitMarker: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    top: "13%",
    right: "19%",
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },

  outerOrbitMarkerSecondary: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    bottom: "18%",
    left: "12%",
    backgroundColor: "#F28A9E",
  },

  innerOrbit: {
    position: "absolute",
    width: "76%",
    height: "76%",
    borderRadius: 300,
    borderWidth: 1.5,
    borderColor: "rgba(215, 25, 63, 0.23)",
    borderStyle: "dashed",
  },

  innerOrbitMarker: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    top: "12%",
    left: "24%",
    backgroundColor: COLORS.red,
  },

  innerOrbitMarkerSecondary: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    right: "9%",
    bottom: "23%",
    backgroundColor: "#F28A9E",
  },

  shield: {
    position: "absolute",
    width: "49%",
    height: "57%",
    alignItems: "center",
    justifyContent: "center",
  },

  shieldTop: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    height: 1.5,
    backgroundColor: "rgba(215, 25, 63, 0.42)",
  },

  shieldLeft: {
    position: "absolute",
    top: 0,
    bottom: "22%",
    left: "10%",
    width: 1.5,
    backgroundColor: "rgba(215, 25, 63, 0.42)",
    transform: [{ rotate: "10deg" }],
  },

  shieldRight: {
    position: "absolute",
    top: 0,
    bottom: "22%",
    right: "10%",
    width: 1.5,
    backgroundColor: "rgba(215, 25, 63, 0.42)",
    transform: [{ rotate: "-10deg" }],
  },

  shieldBottomLeft: {
    position: "absolute",
    bottom: "10%",
    left: "12%",
    width: "43%",
    height: 1.5,
    backgroundColor: "rgba(215, 25, 63, 0.42)",
    transform: [{ rotate: "37deg" }],
  },

  shieldBottomRight: {
    position: "absolute",
    bottom: "10%",
    right: "12%",
    width: "43%",
    height: 1.5,
    backgroundColor: "rgba(215, 25, 63, 0.42)",
    transform: [{ rotate: "-37deg" }],
  },

  scanClip: {
    position: "absolute",
    width: "72%",
    height: "62%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  scanBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(215, 25, 63, 0.5)",
    shadowColor: COLORS.red,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 3,
  },

  logoArea: {
    position: "absolute",
    width: "52%",
    height: "52%",
    alignItems: "center",
    justifyContent: "center",
  },

  brandBlock: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  mainLogo: {
    width: Math.min(SCREEN_WIDTH * 0.49, 178),
    height: Math.min(SCREEN_WIDTH * 0.49, 178),
  },

  titleBlock: {
    alignItems: "center",
    marginTop: 3,
  },

  appName: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },

  titleAccent: {
    width: 42,
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.red,
    marginTop: 11,
  },

  subtitleBlock: {
    alignItems: "center",
    marginTop: 17,
    marginBottom: 30,
    paddingHorizontal: 10,
  },

  tagline: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  supportingText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 0.7,
    textAlign: "center",
  },

  progressBlock: {
    width: "100%",
  },

  progressContainer: {
    width: "100%",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  progressTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.25,
  },

  progressPercent: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  progressTrack: {
    height: 5,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.track,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.red,
  },

  progressFillBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.red,
  },

  progressShimmer: {
    position: "absolute",
    top: -4,
    bottom: -4,
    right: 2,
    width: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.65)",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    minHeight: 19,
  },

  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.red,
    marginRight: 9,
  },

  statusLabel: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 36 : 25,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  footerRule: {
    width: 28,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.red,
    opacity: 0.35,
    marginBottom: 12,
  },

  footerLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerSubLabel: {
    marginTop: 5,
    color: COLORS.faint,
    fontSize: 10,
  },

  errorContent: {
    width: Math.min(SCREEN_WIDTH - 52, 340),
    alignItems: "center",
  },

  errorLogo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },

  errorTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 24,
    minWidth: 175,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.red,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  errorFooter: {
    position: "absolute",
    bottom: 28,
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
});