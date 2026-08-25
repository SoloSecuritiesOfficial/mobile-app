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
  Clipboard,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import api from "../../services/api";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

const { width } = Dimensions.get("window");

const UPI_ID = "solosecurities@ybl";
const BUSINESS_NAME = "SoloSecurities";

const TRIAL_DAYS = 7;

type PlanType = "monthly" | "yearly";

interface Subscription {
  plan: string;
  status: string;
  endDate?: string;
  startDate?: string;
  price?: number;
  provider?: string;
  isTrial?: boolean;
  trial?: boolean;
}

interface PlanDetails {
  amount: number;
  amountDisplay: string;
  perMonth: string;
  savings: string | null;
  description: string;
  label: string;
}

interface Plans {
  monthly: PlanDetails;
  yearly: PlanDetails;
}

interface PaymentOrder {
  orderId?: string;
  amount?: number;
  currency?: string;
  description?: string;
  plan?: PlanType;
}

interface RemainingTime {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
}

const FEATURES_FREE = [
  "Daily security quiz",
  "3 learning modules",
  "Basic labs",
  "Basic security scans",
  "Community features",
];

const FEATURES_PREMIUM = [
  "All learning modules",
  "All hands-on labs",
  "All CTF challenges",
  "Unlimited security scans",
  "Exclusive certificates",
  "Premium badges",
  "Priority support",
  "Early access",
  "Ad-free experience",
];

const REWARDS = [
  {
    level: 5,
    reward: "Cybersecurity Foundations",
    badge: "Rising Defender",
  },
  {
    level: 10,
    reward: "Web Security Fundamentals",
    badge: "Security Analyst",
  },
  {
    level: 20,
    reward: "Ethical Hacker",
    badge: "Ethical Hacker",
  },
  {
    level: 30,
    reward: "Advanced Security Engineering",
    badge: "Security Engineer",
  },
  {
    level: 50,
    reward: "Security Architect Master",
    badge: "Architect",
  },
];

function formatDate(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRemainingTime(endDate?: string): RemainingTime {
  if (!endDate) {
    return {
      expired: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: "Expiry unavailable",
    };
  }

  const end = new Date(endDate).getTime();

  if (Number.isNaN(end)) {
    return {
      expired: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: "Expiry unavailable",
    };
  }

  const difference = end - Date.now();

  if (difference <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: "Expired",
    };
  }

  const totalSeconds = Math.floor(difference / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let text = "";

  if (days > 0) {
    text = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    text = `${minutes}m ${seconds}s`;
  }

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    text,
  };
}

function getPlanFallback(plan: PlanType): PlanDetails {
  if (plan === "yearly") {
    return {
      amount: 3499,
      amountDisplay: "₹3,499",
      perMonth: "₹292/month",
      savings: "Save 31%",
      description: "Best value for serious learners",
      label: "Yearly Premium",
    };
  }

  return {
    amount: 419,
    amountDisplay: "₹419",
    perMonth: "₹419/month",
    savings: null,
    description: "Flexible monthly Premium",
    label: "Monthly Premium",
  };
}

function getPlanAmount(plan: PlanType, plans: Plans | null) {
  return plans?.[plan]?.amount ?? getPlanFallback(plan).amount;
}

function getPlanDisplay(plan: PlanType, plans: Plans | null) {
  return plans?.[plan] ?? getPlanFallback(plan);
}

export default function PremiumScreen() {
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [plans, setPlans] = useState<Plans | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selectedPlan, setSelectedPlan] =
    useState<PlanType>("yearly");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentPlan, setPaymentPlan] =
    useState<PlanType>("yearly");

  const [paymentOrder, setPaymentOrder] =
    useState<PaymentOrder | null>(null);

  const [utr, setUtr] = useState("");

  const [remaining, setRemaining] =
    useState<RemainingTime | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const trialAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [subscriptionResponse, plansResponse] =
        await Promise.all([
          api
            .get("/subscription/current")
            .catch(() => null),

          api
            .get("/payment/plans")
            .catch(() => null),
        ]);

      const subscriptionData =
        subscriptionResponse?.data?.data ??
        subscriptionResponse?.data ??
        null;

      const plansData =
        plansResponse?.data?.data ??
        plansResponse?.data ??
        null;

      setSubscription(subscriptionData);
      setPlans(plansData);
    } catch (error) {
      console.log("PremiumScreen loadData error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      Animated.spring(heroAnim, {
        toValue: 1,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),

      Animated.spring(trialAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, heroAnim, trialAnim]);

  /*
   * Update countdown every second.
   */
  useEffect(() => {
    if (!subscription?.endDate) {
      setRemaining(null);
      return;
    }

    const update = () => {
      setRemaining(getRemainingTime(subscription.endDate));
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [subscription?.endDate]);

  const isSubscriptionActive = useMemo(() => {
    if (!subscription) return false;

    const activeStatuses = [
      "active",
      "trial",
      "trialing",
    ];

    if (!activeStatuses.includes(
      String(subscription.status).toLowerCase()
    )) {
      return false;
    }

    if (!subscription.endDate) {
      return true;
    }

    return !getRemainingTime(subscription.endDate).expired;
  }, [subscription]);

  const isTrial = useMemo(() => {
    if (!subscription) return false;

    return (
      subscription.isTrial === true ||
      subscription.trial === true ||
      String(subscription.status).toLowerCase() === "trial" ||
      String(subscription.status).toLowerCase() === "trialing"
    );
  }, [subscription]);

  const openPlanModal = (plan: PlanType) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  /*
   * 7-day trial.
   *
   * The backend must create the actual startDate/endDate.
   * The mobile app never assumes that "7 days" means 7 days
   * remaining after the button is pressed.
   */
  const handleFreeTrial = async () => {
    if (processing) return;

    if (isSubscriptionActive) {
      Alert.alert(
        "Premium Already Active",
        "You already have Premium access."
      );
      return;
    }

    Alert.alert(
      "🎁 Start 7-Day Free Trial",
      "Get full Premium access for 7 days. No payment is required.",
      [
        {
          text: "Not Now",
          style: "cancel",
        },
        {
          text: "Start Trial",
          onPress: async () => {
            try {
              setProcessing(true);

              const response = await api.post(
                "/subscription/free-trial"
              );

              const newSubscription =
                response.data?.data ??
                response.data?.subscription ??
                null;

              if (newSubscription) {
                setSubscription(newSubscription);
              }

              await loadData();

              Alert.alert(
                "🎉 Trial Activated",
                "Your 7-day Premium trial is now active."
              );
            } catch (error: any) {
              Alert.alert(
                "Unable to Start Trial",
                error?.response?.data?.message ??
                  "You may have already used your free trial."
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  /*
   * Opens the subscription payment screen.
   */
  const handleChoosePlan = () => {
    setShowPlanModal(false);

    setPaymentPlan(selectedPlan);

    setPaymentOrder({
      plan: selectedPlan,
      amount: getPlanAmount(selectedPlan, plans),
      currency: "INR",
      description: `SoloSecurities ${
        selectedPlan === "yearly"
          ? "Yearly"
          : "Monthly"
      } Premium`,
    });

    setUtr("");
    setShowPaymentModal(true);
  };

  /*
   * Direct UPI intent.
   *
   * No Razorpay required.
   */
  const openUPI = async (
    application?: "gpay" | "phonepe" | "paytm"
  ) => {
    const amount =
      getPlanAmount(paymentPlan, plans);

    const transactionNote =
      `SoloSecurities ${
        paymentPlan === "yearly"
          ? "Yearly"
          : "Monthly"
      } Premium`;

    const encodedNote =
      encodeURIComponent(transactionNote);

    const baseUrl =
      `upi://pay?pa=${UPI_ID}` +
      `&pn=${encodeURIComponent(BUSINESS_NAME)}` +
      `&am=${amount.toFixed(2)}` +
      `&cu=INR` +
      `&tn=${encodedNote}`;

    let url = baseUrl;

    if (application === "gpay") {
      url =
        `tez://upi/pay?pa=${UPI_ID}` +
        `&pn=${encodeURIComponent(BUSINESS_NAME)}` +
        `&am=${amount.toFixed(2)}` +
        `&cu=INR` +
        `&tn=${encodedNote}`;
    }

    if (application === "phonepe") {
      url =
        `phonepe://pay?pa=${UPI_ID}` +
        `&pn=${encodeURIComponent(BUSINESS_NAME)}` +
        `&am=${amount.toFixed(2)}` +
        `&cu=INR` +
        `&tn=${encodedNote}`;
    }

    if (application === "paytm") {
      url =
        `paytmmp://pay?pa=${UPI_ID}` +
        `&pn=${encodeURIComponent(BUSINESS_NAME)}` +
        `&am=${amount.toFixed(2)}` +
        `&cu=INR` +
        `&tn=${encodedNote}`;
    }

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (!supported && application) {
        const genericSupported =
          await Linking.canOpenURL(baseUrl);

        if (genericSupported) {
          await Linking.openURL(baseUrl);
          return;
        }
      }

      if (!supported) {
        Alert.alert(
          "UPI App Not Available",
          "No compatible UPI application was found on this device."
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.log("UPI open error:", error);

      Alert.alert(
        "Unable to Open UPI",
        "Please open your UPI app manually and pay to:\n\n" +
          UPI_ID
      );
    }
  };

  const copyUPI = async () => {
    try {
      Clipboard.setString(UPI_ID);

      Alert.alert(
        "Copied",
        `${UPI_ID} copied to clipboard.`
      );
    } catch {
      Alert.alert(
        "UPI ID",
        UPI_ID
      );
    }
  };

  const shareUPI = async () => {
    try {
      await Share.share({
        message:
          `SoloSecurities Premium payment\n\n` +
          `UPI ID: ${UPI_ID}\n` +
          `Plan: ${
            paymentPlan === "yearly"
              ? "Yearly"
              : "Monthly"
          }\n` +
          `Amount: ₹${getPlanAmount(
            paymentPlan,
            plans
          )}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  /*
   * Payment submission.
   *
   * IMPORTANT:
   * This does NOT blindly activate Premium.
   *
   * Backend should verify the UTR/payment before
   * changing the user's subscription.
   */
  const submitPaymentProof = async () => {
    const cleanUtr = utr.trim();

    if (!cleanUtr) {
      Alert.alert(
        "Transaction ID Required",
        "Enter the UTR / transaction ID after completing the UPI payment."
      );
      return;
    }

    if (cleanUtr.length < 6) {
      Alert.alert(
        "Invalid Transaction ID",
        "Please enter the UTR / transaction ID provided by your bank."
      );
      return;
    }

    try {
      setProcessing(true);

      /*
       * Your backend should implement this endpoint.
       *
       * Expected behavior:
       * 1. Store payment as pending.
       * 2. Verify payment.
       * 3. Activate subscription only after verification.
       */
      const response = await api.post(
        "/payment/submit-proof",
        {
          plan: paymentPlan,
          amount: getPlanAmount(
            paymentPlan,
            plans
          ),
          upiId: UPI_ID,
          transactionId: cleanUtr,
        }
      );

      setShowPaymentModal(false);
      setUtr("");
      setPaymentOrder(null);

      await loadData();

      Alert.alert(
        "Payment Submitted",
        response.data?.message ??
          "Your payment has been submitted for verification. Premium will activate after the payment is verified."
      );
    } catch (error: any) {
      console.log(
        "Payment proof error:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Verification Pending",
        error?.response?.data?.message ??
          "We could not verify the payment yet. Please keep your transaction ID safe and try again later."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;

    Alert.alert(
      "Cancel Premium?",
      "Your Premium access will remain available until the current expiry date.",
      [
        {
          text: "Keep Premium",
          style: "cancel",
        },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessing(true);

              await api.post(
                "/subscription/cancel",
                {
                  reason:
                    "User requested cancellation",
                }
              );

              await loadData();

              Alert.alert(
                "Subscription Cancelled",
                "Your Premium access will remain active until the expiry date."
              );
            } catch (error: any) {
              Alert.alert(
                "Unable to Cancel",
                error?.response?.data?.message ??
                  "Please try again."
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />

        <View style={styles.loadingOrb}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>

        <Text style={styles.loadingTitle}>
          Preparing Premium
        </Text>

        <Text style={styles.loadingSubtitle}>
          Checking your subscription...
        </Text>
      </SafeAreaView>
    );
  }

  const activePlanName =
    subscription?.plan
      ? String(subscription.plan)
          .charAt(0)
          .toUpperCase() +
        String(subscription.plan).slice(1)
      : "Premium";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroGlow} />

          <View style={styles.crownCircle}>
            <Text style={styles.crown}>👑</Text>
          </View>

          <Text style={styles.heroEyebrow}>
            SOLOSECURITIES PREMIUM
          </Text>

          <Text style={styles.heroTitle}>
            Your complete
            {"\n"}
            security journey.
          </Text>

          <Text style={styles.heroSubtitle}>
            Learn deeper. Practice harder.
            Build real cybersecurity skills.
          </Text>
        </Animated.View>

        {isSubscriptionActive && subscription && (
          <Animated.View
            style={[
              styles.activeCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.activeTop}>
              <View style={styles.activeIcon}>
                <Text>✓</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>
                  {isTrial
                    ? "7-Day Free Trial"
                    : "Premium Active"}
                </Text>

                <Text style={styles.activePlan}>
                  {isTrial
                    ? "Full Premium access"
                    : `${activePlanName} Plan`}
                </Text>
              </View>

              <View style={styles.activeStatus}>
                <Text style={styles.activeStatusText}>
                  ACTIVE
                </Text>
              </View>
            </View>

            <View style={styles.expiryDivider} />

            <View style={styles.expiryRow}>
              <View>
                <Text style={styles.expiryLabel}>
                  EXPIRES
                </Text>

                <Text style={styles.expiryDate}>
                  {formatDate(
                    subscription.endDate
                  )}
                </Text>
              </View>

              <View style={styles.remainingBox}>
                <Text style={styles.remainingLabel}>
                  TIME LEFT
                </Text>

                <Text style={styles.remainingValue}>
                  {remaining?.expired
                    ? "Expired"
                    : remaining?.text ??
                      "Calculating..."}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.cancelSubscription}
              onPress={handleCancelSubscription}
              disabled={processing}
            >
              <Text style={styles.cancelSubscriptionText}>
                Cancel subscription
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {!isSubscriptionActive && (
          <>
            <Animated.View
              style={[
                styles.trialCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: trialAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [25, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.trialIcon}>
                <Text>🎁</Text>
              </View>

              <View style={styles.trialInfo}>
                <Text style={styles.trialEyebrow}>
                  LIMITED OFFER
                </Text>

                <Text style={styles.trialTitle}>
                  Try Premium free
                </Text>

                <Text style={styles.trialText}>
                  Get 7 full days of Premium.
                  No payment required.
                </Text>
              </View>

              <Pressable
                style={styles.trialButton}
                onPress={handleFreeTrial}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFF"
                  />
                ) : (
                  <Text style={styles.trialButtonText}>
                    START
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            <Text style={styles.sectionTitle}>
              Choose your plan
            </Text>

            <Text style={styles.sectionSubtitle}>
              One minute to upgrade. Cancel anytime.
            </Text>

            <View style={styles.planContainer}>
              {(["monthly", "yearly"] as PlanType[]).map(
                (plan) => {
                  const details =
                    getPlanDisplay(plan, plans);

                  const active =
                    selectedPlan === plan;

                  return (
                    <Pressable
                      key={plan}
                      onPress={() =>
                        setSelectedPlan(plan)
                      }
                      style={[
                        styles.planCard,
                        active &&
                          styles.planCardSelected,
                      ]}
                    >
                      {plan === "yearly" && (
                        <View
                          style={styles.bestBadge}
                        >
                          <Text
                            style={
                              styles.bestBadgeText
                            }
                          >
                            BEST VALUE
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.planRadio,
                          active &&
                            styles.planRadioSelected,
                        ]}
                      >
                        {active && (
                          <View
                            style={
                              styles.planRadioDot
                            }
                          />
                        )}
                      </View>

                      <Text style={styles.planName}>
                        {plan === "yearly"
                          ? "Yearly"
                          : "Monthly"}
                      </Text>

                      <Text style={styles.planPrice}>
                        {details.amountDisplay}
                      </Text>

                      <Text style={styles.planPerMonth}>
                        {details.perMonth}
                      </Text>

                      {details.savings && (
                        <View
                          style={
                            styles.savingsBadge
                          }
                        >
                          <Text
                            style={
                              styles.savingsText
                            }
                          >
                            {details.savings}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.planDescription}>
                        {details.description}
                      </Text>

                      <Pressable
                        style={[
                          styles.planSelectButton,
                          active &&
                            styles.planSelectButtonActive,
                        ]}
                        onPress={() =>
                          openPlanModal(plan)
                        }
                      >
                        <Text
                          style={[
                            styles.planSelectText,
                            active &&
                              styles.planSelectTextActive,
                          ]}
                        >
                          {active
                            ? "Continue"
                            : "Choose plan"}
                        </Text>
                      </Pressable>
                    </Pressable>
                  );
                }
              )}
            </View>
          </>
        )}

        <View style={styles.securityStrip}>
          <Text style={styles.securityStripIcon}>
            🔒
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.securityStripTitle}>
              Secure Premium Access
            </Text>

            <Text style={styles.securityStripText}>
              Your subscription is managed by
              SoloSecurities backend services.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Everything you need
        </Text>

        <Text style={styles.sectionSubtitle}>
          Compare Free and Premium access.
        </Text>

        <View style={styles.comparison}>
          <View style={styles.freeColumn}>
            <Text style={styles.columnTitle}>
              FREE
            </Text>

            {FEATURES_FREE.map((feature) => (
              <View
                key={feature}
                style={styles.featureRow}
              >
                <Text style={styles.freeIcon}>
                  •
                </Text>

                <Text style={styles.freeFeature}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.premiumColumn}>
            <Text style={styles.premiumColumnTitle}>
              👑 PREMIUM
            </Text>

            {FEATURES_PREMIUM.map((feature) => (
              <View
                key={feature}
                style={styles.featureRow}
              >
                <Text style={styles.premiumIcon}>
                  ✓
                </Text>

                <Text
                  style={styles.premiumFeature}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Level-based rewards
        </Text>

        <Text style={styles.sectionSubtitle}>
          Learn, level up and earn recognition.
        </Text>

        <View style={styles.rewardsCard}>
          {REWARDS.map((item, index) => (
            <View
              key={item.level}
              style={[
                styles.rewardRow,
                index === REWARDS.length - 1 &&
                  styles.rewardRowLast,
              ]}
            >
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  {item.level}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>
                  {item.reward}
                </Text>

                <Text style={styles.rewardBadge}>
                  🛡️ {item.badge}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.referralCard}>
          <View style={styles.referralIcon}>
            <Text>🎯</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.referralTitle}>
              Refer friends
            </Text>

            <Text style={styles.referralText}>
              Invite friends and unlock
              Premium rewards.
            </Text>
          </View>
        </View>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            SoloSecurities Premium • Learn • Practice
            • Protect
          </Text>
        </View>
      </ScrollView>

      {/* PLAN MODAL */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPlanModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planModal}>
            <View style={styles.modalHandle} />

            <Pressable
              style={styles.modalClose}
              onPress={() =>
                setShowPlanModal(false)
              }
            >
              <Text style={styles.modalCloseText}>
                ×
              </Text>
            </Pressable>

            <Text style={styles.modalEyebrow}>
              PREMIUM UPGRADE
            </Text>

            <Text style={styles.modalTitle}>
              {selectedPlan === "yearly"
                ? "Go yearly. Save more."
                : "Premium, month by month."}
            </Text>

            <Text style={styles.modalSubtitle}>
              {getPlanDisplay(
                selectedPlan,
                plans
              ).description}
            </Text>

            <View style={styles.modalPlanSummary}>
              <View>
                <Text
                  style={styles.modalPlanName}
                >
                  {selectedPlan === "yearly"
                    ? "Yearly Premium"
                    : "Monthly Premium"}
                </Text>

                <Text
                  style={styles.modalPlanPer}
                >
                  {getPlanDisplay(
                    selectedPlan,
                    plans
                  ).perMonth}
                </Text>
              </View>

              <Text style={styles.modalPlanPrice}>
                {
                  getPlanDisplay(
                    selectedPlan,
                    plans
                  ).amountDisplay
                }
              </Text>
            </View>

            <Text style={styles.modalIncludedTitle}>
              Included with Premium
            </Text>

            {FEATURES_PREMIUM.slice(0, 6).map(
              (feature) => (
                <View
                  key={feature}
                  style={styles.modalFeature}
                >
                  <Text style={styles.modalFeatureIcon}>
                    ✓
                  </Text>

                  <Text style={styles.modalFeatureText}>
                    {feature}
                  </Text>
                </View>
              )
            )}

            <Pressable
              style={styles.modalPrimaryButton}
              onPress={handleChoosePlan}
            >
              <Text
                style={styles.modalPrimaryText}
              >
                Continue to Payment
              </Text>
            </Pressable>

            <Text style={styles.modalSecureText}>
              🔒 Secure payment • UPI supported
            </Text>
          </View>
        </View>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPaymentModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                style={styles.modalClose}
                onPress={() =>
                  setShowPaymentModal(false)
                }
              >
                <Text style={styles.modalCloseText}>
                  ×
                </Text>
              </Pressable>

              <Text style={styles.modalEyebrow}>
                PAYMENT
              </Text>

              <Text style={styles.modalTitle}>
                Pay with UPI
              </Text>

              <Text style={styles.modalSubtitle}>
                Complete your payment and submit
                the transaction ID for verification.
              </Text>

              <View style={styles.paymentAmountCard}>
                <Text style={styles.paymentAmountLabel}>
                  AMOUNT
                </Text>

                <Text style={styles.paymentAmount}>
                  ₹
                  {getPlanAmount(
                    paymentPlan,
                    plans
                  ).toLocaleString("en-IN")}
                </Text>

                <Text style={styles.paymentPlanName}>
                  {paymentPlan === "yearly"
                    ? "Yearly Premium"
                    : "Monthly Premium"}
                </Text>
              </View>

              <Text style={styles.paymentSectionTitle}>
                1. Pay using your UPI app
              </Text>

              <View style={styles.upiButtons}>
                <Pressable
                  style={styles.upiButton}
                  onPress={() =>
                    openUPI("gpay")
                  }
                >
                  <Text style={styles.upiEmoji}>
                    🟢
                  </Text>

                  <Text style={styles.upiName}>
                    Google Pay
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.upiButton}
                  onPress={() =>
                    openUPI("phonepe")
                  }
                >
                  <Text style={styles.upiEmoji}>
                    🟣
                  </Text>

                  <Text style={styles.upiName}>
                    PhonePe
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.upiButton}
                  onPress={() =>
                    openUPI("paytm")
                  }
                >
                  <Text style={styles.upiEmoji}>
                    🔵
                  </Text>

                  <Text style={styles.upiName}>
                    Paytm
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.upiButton}
                  onPress={() =>
                    openUPI()
                  }
                >
                  <Text style={styles.upiEmoji}>
                    💳
                  </Text>

                  <Text style={styles.upiName}>
                    Other UPI
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.paymentSectionTitle}>
                Or pay manually
              </Text>

              <View style={styles.upiIdCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiIdLabel}>
                    SOLOSECURITIES UPI ID
                  </Text>

                  <Text style={styles.upiIdValue}>
                    {UPI_ID}
                  </Text>
                </View>

                <Pressable
                  style={styles.copyButton}
                  onPress={copyUPI}
                >
                  <Text style={styles.copyText}>
                    COPY
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.shareButton}
                onPress={shareUPI}
              >
                <Text style={styles.shareButtonText}>
                  ↗ Share UPI Details
                </Text>
              </Pressable>

              <Text style={styles.paymentSectionTitle}>
                2. Enter transaction ID
              </Text>

              <Text style={styles.inputDescription}>
                After successful payment, enter the
                UTR / transaction ID provided by
                your bank.
              </Text>

              <TextInput
                value={utr}
                onChangeText={setUtr}
                placeholder="Enter UTR / Transaction ID"
                placeholderTextColor={
                  Colors.textMuted
                }
                style={styles.utrInput}
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType={
                  Platform.OS === "ios"
                    ? "default"
                    : "numeric"
                }
                maxLength={30}
              />

              <Pressable
                style={[
                  styles.verifyButton,
                  (!utr.trim() ||
                    processing) &&
                    styles.verifyButtonDisabled,
                ]}
                onPress={submitPaymentProof}
                disabled={
                  !utr.trim() || processing
                }
              >
                {processing ? (
                  <ActivityIndicator
                    color="#FFF"
                  />
                ) : (
                  <Text
                    style={styles.verifyButtonText}
                  >
                    Submit Payment for Verification
                  </Text>
                )}
              </Pressable>

              <Text style={styles.paymentWarning}>
                ⚠️ Premium access is activated only
                after payment verification. Do not
                submit a fake transaction ID.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: Math.min(
      Spacing.screen,
      20
    ),
    paddingTop: 16,
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  loadingOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  loadingTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },

  loadingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 28,
    position: "relative",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FFE8E8",
    top: -100,
    opacity: 0.7,
  },

  crownCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FFD5D5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#D32F2F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },

  crown: {
    fontSize: 38,
  },

  heroEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 9,
  },

  heroTitle: {
    color: Colors.text,
    fontSize: width < 380 ? 29 : 34,
    lineHeight: width < 380 ? 35 : 40,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
  },

  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 330,
    marginTop: 12,
  },

  activeCard: {
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
  },

  activeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  activeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },

  activeIconText: {
    color: "#FFF",
    fontWeight: "900",
  },

  activeTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },

  activePlan: {
    color: "#A3A3A3",
    fontSize: 12,
    marginTop: 3,
  },

  activeStatus: {
    backgroundColor: "#183B25",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  activeStatusText: {
    color: "#4ADE80",
    fontSize: 9,
    fontWeight: "900",
  },

  expiryDivider: {
    height: 1,
    backgroundColor: "#292929",
    marginVertical: 16,
  },

  expiryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  expiryLabel: {
    color: "#777",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  expiryDate: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },

  remainingBox: {
    alignItems: "flex-end",
  },

  remainingLabel: {
    color: "#777",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  remainingValue: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5,
  },

  cancelSubscription: {
    alignSelf: "flex-end",
    marginTop: 15,
    paddingVertical: 5,
  },

  cancelSubscriptionText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "700",
  },

  trialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 15,
    marginBottom: 26,
    gap: 12,
  },

  trialIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  trialInfo: {
    flex: 1,
  },

  trialEyebrow: {
    color: "#EA580C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  trialTitle: {
    color: "#7C2D12",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  trialText: {
    color: "#9A3412",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  trialButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  trialButtonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 20,
  },

  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 15,
  },

  planContainer: {
    flexDirection:
      width < 500 ? "column" : "row",
    gap: 12,
  },

  planCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: "relative",
    overflow: "hidden",
  },

  planCardSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.13,
    shadowRadius: 15,
    elevation: 4,
  },

  bestBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  bestBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },

  planRadioSelected: {
    borderColor: Colors.primary,
  },

  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  planName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },

  planPrice: {
    color: Colors.primary,
    fontSize: 29,
    fontWeight: "900",
    marginTop: 8,
  },

  planPerMonth: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },

  savingsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 8,
  },

  savingsText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "900",
  },

  planDescription: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    minHeight: 34,
  },

  planSelectButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  planSelectButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  planSelectText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  planSelectTextActive: {
    color: "#FFF",
  },

  securityStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
  },

  securityStripIcon: {
    fontSize: 23,
  },

  securityStripTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  securityStripText: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },

  comparison: {
    flexDirection:
      width < 430 ? "column" : "row",
    gap: 10,
  },

  freeColumn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },

  premiumColumn: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
  },

  columnTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 13,
  },

  premiumColumnTitle: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 13,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginBottom: 9,
  },

  freeIcon: {
    color: Colors.textMuted,
    fontWeight: "900",
  },

  freeFeature: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  premiumIcon: {
    color: "#4ADE80",
    fontWeight: "900",
  },

  premiumFeature: {
    flex: 1,
    color: "#D4D4D4",
    fontSize: 11,
    lineHeight: 16,
  },

  rewardsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },

  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  rewardRowLast: {
    borderBottomWidth: 0,
  },

  levelBadge: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },

  levelText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  rewardTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  rewardBadge: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFDCDC",
    padding: 16,
    marginTop: 18,
  },

  referralIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  referralTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  referralText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  bottomNote: {
    alignItems: "center",
    marginTop: 28,
  },

  bottomNoteText: {
    color: Colors.textMuted,
    fontSize: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },

  planModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: "92%",
  },

  paymentModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: "94%",
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4D4D4",
    alignSelf: "center",
    marginBottom: 15,
  },

  modalClose: {
    position: "absolute",
    right: 17,
    top: 17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },

  modalCloseText: {
    color: Colors.text,
    fontSize: 25,
    lineHeight: 28,
  },

  modalEyebrow: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 8,
  },

  modalTitle: {
    color: Colors.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: 5,
    paddingRight: 40,
  },

  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },

  modalPlanSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFDADA",
  },

  modalPlanName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  modalPlanPer: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  modalPlanPrice: {
    color: Colors.primary,
    fontSize: 25,
    fontWeight: "900",
  },

  modalIncludedTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 19,
    marginBottom: 10,
  },

  modalFeature: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },

  modalFeatureIcon: {
    color: "#16A34A",
    fontWeight: "900",
  },

  modalFeatureText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
  },

  modalPrimaryButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 17,
  },

  modalPrimaryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },

  modalSecureText: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },

  paymentAmountCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginBottom: 18,
  },

  paymentAmountLabel: {
    color: "#737373",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  paymentAmount: {
    color: "#FFF",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 2,
  },

  paymentPlanName: {
    color: "#A3A3A3",
    fontSize: 11,
    marginTop: 2,
  },

  paymentSectionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 10,
  },

  upiButtons: {
    flexDirection: "row",
    gap: 8,
  },

  upiButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  upiEmoji: {
    fontSize: 21,
    marginBottom: 5,
  },

  upiName: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  upiIdCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  upiIdLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  upiIdValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  copyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  copyText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },

  shareButton: {
    alignItems: "center",
    paddingVertical: 11,
  },

  shareButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  inputDescription: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 9,
  },

  utrInput: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  verifyButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 12,
  },

  verifyButtonDisabled: {
    opacity: 0.45,
  },

  verifyButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },

  paymentWarning: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 12,
  },
});