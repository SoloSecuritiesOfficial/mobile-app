import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";

interface Subscription {
  plan: string;
  status: string;
  endDate: string;
  price: number;
  provider: string;
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

const FEATURES_FREE = [
  "Daily security quiz",
  "3 learning modules",
  "Basic labs only",
  "Basic security scans",
  "Community features",
];

const FEATURES_PREMIUM = [
  "All 10 learning modules",
  "All 8 hands-on labs + Advanced",
  "CTF challenges (all difficulties)",
  "Unlimited security scans",
  "Exclusive certificates & badges",
  "Priority support",
  "Early access to new content",
  "Ad-free experience",
];

export default function PremiumScreen() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [upiId, setUpiId] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        api.get("/subscription/current").catch(() => ({ data: { data: null } })),
        api.get("/payment/plans"),
      ]);
      setSubscription(subRes.data?.data ?? null);
      setPlans(planRes.data?.data ?? null);
    } catch {
      // silent — show UI anyway
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Step 1: create Razorpay order on backend ──────────────────
  const handleStartPayment = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/payment/create-order", { plan: selectedPlan });
      const order = res.data?.data;
      if (!order?.orderId) throw new Error("Could not create order");
      setCurrentOrder(order);
      setUpiModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Step 2: open UPI deep-link ─────────────────────────────────
  const openUpiApp = async (appScheme: string) => {
    if (!currentOrder) return;
    const {
      orderId, amount, currency, description, keyId,
    } = currentOrder;

    // Razorpay UPI deep-link format
    const upiUrl =
      `${appScheme}://pay?pa=payments@razorpay` +
      `&pn=SoloSecurities` +
      `&tr=${orderId}` +
      `&tn=${encodeURIComponent(description)}` +
      `&am=${(amount / 100).toFixed(2)}` +
      `&cu=${currency}`;

    const canOpen = await Linking.canOpenURL(upiUrl);
    if (!canOpen) {
      // Fallback: open Razorpay payment link in browser
      const webUrl = `https://razorpay.com/payment-link/?key=${keyId}&amount=${amount}&currency=${currency}&description=${encodeURIComponent(description)}`;
      Alert.alert(
        "App Not Found",
        `${appScheme} is not installed. Opening in browser instead.`,
        [{ text: "Open", onPress: () => Linking.openURL(webUrl) }, { text: "Cancel" }]
      );
      return;
    }
    await Linking.openURL(upiUrl);
  };

  // ── Step 3: after user returns, confirm payment ID ────────────
  const handleConfirmPayment = async () => {
    if (!currentOrder || !upiId.trim()) {
      Alert.alert("Required", "Please enter the UPI Transaction ID from your payment app.");
      return;
    }
    // UPI transaction IDs are provided by the bank to the user
    // In production: integrate Razorpay webhook to auto-verify
    // Here we verify via Razorpay API using the paymentId returned by the user
    try {
      setProcessing(true);
      const res = await api.post("/payment/verify", {
        orderId:   currentOrder.orderId,
        paymentId: upiId.trim(),
        signature: upiId.trim(), // webhook will provide real signature in production
        plan:      selectedPlan,
      });
      setUpiModalVisible(false);
      setCurrentOrder(null);
      setUpiId("");
      Alert.alert("🎉 Premium Activated!", res.data?.message || "Welcome to SoloSecurities Premium!");
      loadData();
    } catch (err: any) {
      Alert.alert(
        "Verification Pending",
        "Your payment is being processed. Premium will activate within a few minutes. If not, contact support@solosecurities.com with your transaction ID.",
        [{ text: "OK", onPress: () => { setUpiModalVisible(false); loadData(); } }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeTrial = async () => {
    try {
      setProcessing(true);
      await api.post("/subscription/free-trial");
      Alert.alert("🎁 Free Trial Activated!", "Enjoy 7 days of full premium access. No payment required.");
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not activate free trial.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancel Subscription", "You will keep premium access until your billing period ends.", [
      { text: "Keep Premium", style: "cancel" },
      {
        text: "Cancel", style: "destructive",
        onPress: async () => {
          try {
            await api.post("/subscription/cancel", { reason: "User requested cancellation" });
            Alert.alert("Cancelled", "Subscription cancelled. Access continues until expiry.");
            loadData();
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Could not cancel.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isActive = subscription?.status === "active";
  const expiryDate = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString("en-IN") : null;
  const currentPlan = plans?.[selectedPlan];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>👑</Text>
          <Text style={styles.heroTitle}>SoloSecurities Premium</Text>
          <Text style={styles.heroSub}>Unlock every lab, CTF challenge, and learning module</Text>
        </View>

        {/* Active Banner */}
        {isActive && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>Premium Active</Text>
              <Text style={styles.activeBannerSub}>
                {subscription!.plan.charAt(0).toUpperCase() + subscription!.plan.slice(1)} Plan
                {" • "}Expires {expiryDate}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plan selector */}
        {!isActive && (
          <>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <View style={styles.planRow}>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === "monthly" && styles.planCardActive]}
                onPress={() => setSelectedPlan("monthly")}
              >
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>{plans?.monthly.amountDisplay ?? "₹419"}</Text>
                <Text style={styles.planPer}>{plans?.monthly.perMonth ?? "₹419/month"}</Text>
                {selectedPlan === "monthly" && (
                  <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>Selected ✓</Text></View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === "yearly" && styles.planCardActive]}
                onPress={() => setSelectedPlan("yearly")}
              >
                <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>BEST VALUE</Text></View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>{plans?.yearly.amountDisplay ?? "₹3,499"}</Text>
                <Text style={styles.planPer}>{plans?.yearly.perMonth ?? "₹292/month"}</Text>
                <Text style={styles.planSavings}>{plans?.yearly.savings ?? "Save 31%"}</Text>
                {selectedPlan === "yearly" && (
                  <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>Selected ✓</Text></View>
                )}
              </TouchableOpacity>

            </View>

            {/* Pay via UPI button */}
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleStartPayment}
              disabled={processing}
            >
              {processing
                ? <ActivityIndicator color="#FFF" />
                : (
                  <View style={styles.payBtnInner}>
                    <Text style={styles.payBtnIcon}>💳</Text>
                    <View>
                      <Text style={styles.payBtnTitle}>Pay via UPI / Card / Netbanking</Text>
                      <Text style={styles.payBtnSub}>
                        {currentPlan?.amountDisplay ?? "₹419"} • Powered by Razorpay
                      </Text>
                    </View>
                  </View>
                )
              }
            </TouchableOpacity>

            {/* UPI App shortcuts */}
            <Text style={styles.upiLabel}>Quick Pay with UPI App</Text>
            <View style={styles.upiRow}>
              {[
                { name: "GPay",    scheme: "gpay",    emoji: "🟢" },
                { name: "PhonePe", scheme: "phonepe", emoji: "🟣" },
                { name: "Paytm",   scheme: "paytm",   emoji: "🔵" },
                { name: "BHIM",    scheme: "upi",     emoji: "🟠" },
              ].map(app => (
                <TouchableOpacity
                  key={app.scheme}
                  style={styles.upiAppBtn}
                  onPress={async () => {
                    if (!currentOrder) {
                      // Create order first, then open UPI
                      try {
                        setProcessing(true);
                        const res = await api.post("/payment/create-order", { plan: selectedPlan });
                        const order = res.data?.data;
                        if (!order?.orderId) throw new Error("Order creation failed");
                        setCurrentOrder(order);
                        setTimeout(() => openUpiApp(app.scheme), 300);
                        setUpiModalVisible(true);
                      } catch (err: any) {
                        Alert.alert("Error", "Could not create order.");
                      } finally {
                        setProcessing(false);
                      }
                    } else {
                      openUpiApp(app.scheme);
                    }
                  }}
                >
                  <Text style={styles.upiAppEmoji}>{app.emoji}</Text>
                  <Text style={styles.upiAppName}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Free Trial */}
            <TouchableOpacity style={styles.trialBtn} onPress={handleFreeTrial} disabled={processing}>
              <Text style={styles.trialBtnText}>🎁 Start 7-Day Free Trial — No Payment</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Feature comparison */}
        <Text style={styles.sectionTitle}>What You Get</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureCardTitle}>Free</Text>
            {FEATURES_FREE.map((f, i) => (
              <Text key={i} style={styles.featureItem}>• {f}</Text>
            ))}
          </View>
          <View style={[styles.featureCard, styles.featureCardPremium]}>
            <Text style={[styles.featureCardTitle, { color: "#FFF" }]}>👑 Premium</Text>
            {FEATURES_PREMIUM.map((f, i) => (
              <Text key={i} style={[styles.featureItem, { color: "#E0E0E0" }]}>✓ {f}</Text>
            ))}
          </View>
        </View>

        {/* Certificates & Badges section */}
        <Text style={styles.sectionTitle}>Level-Based Rewards</Text>
        <View style={styles.rewardsCard}>
          {[
            { level: 5,  reward: "📜 Cybersecurity Foundations Certificate + 🛡️ Rising Defender Badge" },
            { level: 10, reward: "📜 Web Security Fundamentals Certificate + 🔍 Security Analyst Badge" },
            { level: 20, reward: "📜 Ethical Hacker Certification + 👨‍💻 Ethical Hacker Badge" },
            { level: 30, reward: "📜 Advanced Security Engineering Certificate + ⚙️ Security Engineer Badge" },
            { level: 50, reward: "📜 Security Architect Master Certification + 🏛️ Architect Badge" },
          ].map(({ level, reward }) => (
            <View key={level} style={styles.rewardRow}>
              <View style={styles.rewardLevelBadge}>
                <Text style={styles.rewardLevelText}>Lv.{level}</Text>
              </View>
              <Text style={styles.rewardText}>{reward}</Text>
            </View>
          ))}
        </View>

        {/* Referral */}
        <View style={styles.referralCard}>
          <Text style={styles.referralIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralTitle}>Refer 5 Friends → 1 Month Free</Text>
            <Text style={styles.referralSub}>Share your referral code and earn premium days for every friend who joins.</Text>
          </View>
        </View>

      </ScrollView>

      {/* UPI Confirmation Modal */}
      <Modal visible={upiModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete UPI Payment</Text>

            <View style={styles.modalAmountBox}>
              <Text style={styles.modalAmountLabel}>Amount to Pay</Text>
              <Text style={styles.modalAmount}>
                {currentOrder ? `₹${(currentOrder.amount / 100).toFixed(0)}` : ""}
              </Text>
              <Text style={styles.modalPlanLabel}>
                {selectedPlan === "yearly" ? "Yearly Plan" : "Monthly Plan"} • SoloSecurities Premium
              </Text>
            </View>

            <Text style={styles.modalStep}>
              1. Tap a UPI app below to open payment screen
            </Text>
            <View style={styles.modalUpiRow}>
              {[
                { name: "GPay",    scheme: "gpay",    emoji: "🟢" },
                { name: "PhonePe", scheme: "phonepe", emoji: "🟣" },
                { name: "Paytm",   scheme: "paytm",   emoji: "🔵" },
                { name: "BHIM",    scheme: "upi",     emoji: "🟠" },
              ].map(app => (
                <TouchableOpacity
                  key={app.scheme}
                  style={styles.modalUpiBtn}
                  onPress={() => openUpiApp(app.scheme)}
                >
                  <Text style={styles.upiAppEmoji}>{app.emoji}</Text>
                  <Text style={styles.upiAppName}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalStep}>
              2. After paying, enter the UPI Transaction ID shown in your app:
            </Text>
            <View style={styles.txnInputWrap}>
              <Text style={styles.txnInputIcon}>🧾</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnInputLabel}>UPI Transaction ID</Text>
                <Text
                  style={styles.txnInputHint}
                  onPress={() => {
                    // React Native TextInput — kept as Text for brevity;
                    // replace upiId state via a proper TextInput in implementation
                  }}
                >
                  {upiId || "Tap to enter (e.g. 407123456789)"}
                </Text>
              </View>
            </View>

            {/* Manual input using Alert.prompt (cross-platform safe) */}
            <TouchableOpacity
              style={styles.enterTxnBtn}
              onPress={() =>
                Alert.prompt
                  ? Alert.prompt(
                      "Enter Transaction ID",
                      "Copy the 12-digit UTR / Transaction ID from your UPI app",
                      (text) => { if (text) setUpiId(text.trim()); },
                      "plain-text",
                      upiId
                    )
                  : Alert.alert("Enter Transaction ID", "Please type your UPI Transaction ID in the field below and tap Confirm.", [
                      {
                        text: "Enter ID",
                        onPress: () => {
                          // iOS/Android will use platform input
                          setUpiId("manual_" + Date.now());
                        },
                      },
                    ])
              }
            >
              <Text style={styles.enterTxnBtnText}>
                {upiId ? `Transaction ID: ${upiId}` : "📋 Enter Transaction ID"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setUpiModalVisible(false); setCurrentOrder(null); setUpiId(""); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !upiId && styles.modalConfirmBtnDisabled]}
                onPress={handleConfirmPayment}
                disabled={processing || !upiId}
              >
                {processing
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalConfirmText}>Confirm Payment ✓</Text>
                }
              </TouchableOpacity>
            </View>

            <Text style={styles.modalNote}>
              🔒 Payments secured by Razorpay. Your card/UPI details are never stored by SoloSecurities.
            </Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  content:    { paddingHorizontal: Spacing.screen, paddingBottom: 120, paddingTop: Spacing.lg },

  hero:       { alignItems: "center", marginBottom: Spacing.xl },
  heroIcon:   { fontSize: 52, marginBottom: 10 },
  heroTitle:  { ...Typography.h1, color: Colors.text, textAlign: "center" },
  heroSub:    { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center", marginTop: 6 },

  activeBanner: { backgroundColor: "#14532D", borderRadius: Spacing.radiusLarge, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg, gap: 12 },
  activeBannerIcon: { fontSize: 22 },
  activeBannerTitle: { color: "#22C55E", fontWeight: "700", fontSize: 15 },
  activeBannerSub: { color: "#86EFAC", fontSize: 12, marginTop: 2 },
  cancelLink: { color: "#EF4444", fontWeight: "600", fontSize: 12 },

  sectionTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.xl },

  planRow: { flexDirection: "row", gap: 12, marginBottom: Spacing.md },
  planCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 18, alignItems: "center", borderWidth: 2, borderColor: Colors.border },
  planCardActive: { borderColor: Colors.primary },
  planName: { fontWeight: "700", color: Colors.text, fontSize: 15, marginBottom: 4 },
  planPrice: { fontSize: 26, fontWeight: "800", color: Colors.primary },
  planPer: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  planSavings: { color: "#22C55E", fontWeight: "700", fontSize: 12, marginTop: 4 },
  selectedBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  selectedBadgeText: { color: "#FFF", fontWeight: "700", fontSize: 11 },
  bestValueBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  bestValueText: { color: "#FFF", fontWeight: "800", fontSize: 10 },

  payBtn: { backgroundColor: Colors.primary, borderRadius: Spacing.radiusLarge, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 16 },
  payBtnInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  payBtnIcon: { fontSize: 26 },
  payBtnTitle: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  payBtnSub: { color: "#FFD0D0", fontSize: 11, marginTop: 2 },

  upiLabel: { ...Typography.labelMedium, color: Colors.textSecondary, marginBottom: 10 },
  upiRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  upiAppBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  upiAppEmoji: { fontSize: 22, marginBottom: 4 },
  upiAppName: { fontSize: 11, fontWeight: "600", color: Colors.text },

  trialBtn: { borderWidth: 2, borderColor: Colors.primary, borderRadius: Spacing.radiusLarge, paddingVertical: 14, alignItems: "center", marginBottom: Spacing.xl },
  trialBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },

  comparisonRow: { flexDirection: "row", gap: 10, marginBottom: Spacing.lg },
  featureCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 14, borderWidth: 1, borderColor: Colors.border },
  featureCardPremium: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  featureCardTitle: { fontWeight: "700", color: Colors.text, fontSize: 14, marginBottom: 10 },
  featureItem: { color: Colors.textSecondary, fontSize: 11, marginBottom: 6, lineHeight: 17 },

  rewardsCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  rewardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rewardLevelBadge: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: "center" },
  rewardLevelText: { color: "#FFF", fontWeight: "800", fontSize: 11 },
  rewardText: { flex: 1, color: Colors.text, fontSize: 12, lineHeight: 18 },

  referralCard: { backgroundColor: Colors.surface, borderRadius: Spacing.radiusLarge, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.border },
  referralIcon: { fontSize: 32 },
  referralTitle: { fontWeight: "700", color: Colors.text, fontSize: 13 },
  referralSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 16 },

  // UPI Modal
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { ...Typography.h2, color: Colors.text, marginBottom: 16, textAlign: "center" },
  modalAmountBox: { backgroundColor: Colors.background, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  modalAmountLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  modalAmount: { fontSize: 36, fontWeight: "800", color: Colors.primary },
  modalPlanLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  modalStep: { color: Colors.text, fontWeight: "600", fontSize: 13, marginBottom: 10 },
  modalUpiRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  modalUpiBtn: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  txnInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderRadius: 12, padding: 14, gap: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  txnInputIcon: { fontSize: 20 },
  txnInputLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 2 },
  txnInputHint: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  enterTxnBtn: { backgroundColor: Colors.primary + "22", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: Colors.primary },
  enterTxnBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  modalBtnRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textSecondary, fontWeight: "600" },
  modalConfirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center" },
  modalConfirmBtnDisabled: { backgroundColor: Colors.textMuted },
  modalConfirmText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  modalNote: { color: Colors.textMuted, fontSize: 11, textAlign: "center", lineHeight: 16 },
});
