/**
 * AdRewardScreen.tsx — SoloSecurities
 *
 * Real earnings hub. All data comes from the backend — never from a
 * local counter or a fixed-amount calculation.
 *
 * Tabs:
 *  EARN   — how revenue is generated, live wallet state
 *  WALLET — balance (pending vs available), transaction history, withdrawal
 *
 * Revenue disclaimer shown prominently: AdMob reports are estimated.
 * The final payout depends on AdMob reconciliation.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import {
  WalletSummary,
  WalletTransaction,
  RevenueShareConfig,
  getWalletSummary,
  getWalletTransactions,
  getRevenueShareConfig,
  requestWithdrawal,
  formatMicros,
} from "../../services/adRewardService";
import AdBanner from "../../components/AdBanner";
import WatchVideoAdButton from "../../components/WatchVideoAdButton";
import Colors from "../../theme/colors";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const TX_META: Record<string, { icon: string; label: string; color: string }> = {
  AD_REVENUE:           { icon: "💰", label: "Ad revenue",          color: "#1565C0" },
  SETTLEMENT:           { icon: "✅", label: "Settlement",          color: "#2E7D32" },
  WITHDRAWAL_REQUEST:   { icon: "📤", label: "Withdrawal request",  color: "#E65100" },
  WITHDRAWAL_COMPLETED: { icon: "🏦", label: "Withdrawal paid",     color: "#2E7D32" },
  WITHDRAWAL_REJECTED:  { icon: "❌", label: "Withdrawal rejected", color: "#C62828" },
  ADJUSTMENT:           { icon: "🔧", label: "Adjustment",          color: "#6A1B9A" },
  REVERSAL:             { icon: "↩️", label: "Reversal",            color: "#C62828" },
  default:              { icon: "💸", label: "Transaction",         color: "#37474F" },
};

function txMeta(type: string) {
  return TX_META[type] ?? TX_META.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function BalanceBar({ wallet }: { wallet: WalletSummary }) {
  const pending   = formatMicros(wallet.pendingMicroValue,   wallet.currencyCode);
  const available = formatMicros(wallet.availableMicroValue, wallet.currencyCode);
  return (
    <View style={bal.row}>
      <View style={bal.item}>
        <Text style={bal.label}>PENDING</Text>
        <Text style={bal.amount}>{pending}</Text>
        <Text style={bal.note}>Not yet settled</Text>
      </View>
      <View style={bal.divider} />
      <View style={bal.item}>
        <Text style={[bal.label, { color: "#A5D6A7" }]}>AVAILABLE</Text>
        <Text style={[bal.amount, { fontSize: 28 }]}>{available}</Text>
        <Text style={bal.note}>Ready to withdraw</Text>
      </View>
    </View>
  );
}

const bal = StyleSheet.create({
  row:     { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.primary },
  item:    { flex: 1, alignItems: "center" },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  label:   { fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  amount:  { fontSize: 22, fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  note:    { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 3 },
});

function TxRow({ tx, index }: { tx: WalletTransaction; index: number }) {
  const meta = txMeta(tx.type);
  const isCredit = ["AD_REVENUE", "SETTLEMENT", "ADJUSTMENT"].includes(tx.type);
  return (
    <View style={[tr.row, index === 0 && { borderTopWidth: 0 }]}>
      <View style={[tr.icon, { backgroundColor: meta.color + "18" }]}>
        <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tr.title}>{meta.label}</Text>
        <Text style={tr.sub}>{fmtDate(tx.createdAt)}</Text>
        {tx.description ? <Text style={tr.desc}>{tx.description}</Text> : null}
      </View>
      <Text style={[tr.amount, { color: isCredit ? "#2E7D32" : "#C62828" }]}>
        {isCredit ? "+" : "−"}{formatMicros(tx.microValue, tx.currencyCode)}
      </Text>
    </View>
  );
}

const tr = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F5F5F5" },
  icon:   { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  title:  { fontSize: 13, fontWeight: "700", color: "#111" },
  sub:    { fontSize: 11, color: "#999", marginTop: 1 },
  desc:   { fontSize: 11, color: "#BBB", marginTop: 1 },
  amount: { fontSize: 13, fontWeight: "800" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "earn" | "wallet";

const EMPTY_WALLET: WalletSummary = {
  currencyCode: "USD",
  pendingMicroValue: 0, availableMicroValue: 0,
  lifetimeEarnedMicroValue: 0, lifetimeWithdrawnMicroValue: 0,
  pendingValue: 0, availableValue: 0,
  lifetimeEarnedValue: 0, lifetimeWithdrawnValue: 0,
};

export default function AdRewardScreen({ navigation }: any) {
  const [tab,        setTab]        = useState<Tab>("earn");
  const [wallet,     setWallet]     = useState<WalletSummary>(EMPTY_WALLET);
  const [config,     setConfig]     = useState<RevenueShareConfig>({ unavailable: true, userSharePercent: 0, platformSharePercent: 0 });
  const [txs,        setTxs]        = useState<WalletTransaction[]>([]);
  const [txTotal,    setTxTotal]    = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upiId,      setUpiId]      = useState("");
  const [amount,     setAmount]     = useState("");
  const [withdrawing,setWithdrawing]= useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [w, cfg, txResult] = await Promise.all([
        getWalletSummary(),
        getRevenueShareConfig(),
        getWalletTransactions(50, 0),
      ]);
      setWallet(w);
      setConfig(cfg);
      setTxs(txResult.transactions);
      setTxTotal(txResult.total);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Enter a positive withdrawal amount."); return;
    }
    if (!upiId.trim().includes("@")) {
      Alert.alert("Invalid UPI ID", "Enter a valid UPI ID, e.g. name@upi"); return;
    }
    Alert.alert(
      "Confirm Withdrawal",
      `Withdraw ${formatMicros(Math.round(amt * 1_000_000), wallet.currencyCode)} to\n${upiId.trim()}\n\nProcessed within 48 hours.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: async () => {
          setWithdrawing(true);
          const r = await requestWithdrawal({
            amount: amt,
            currencyCode: wallet.currencyCode === "UNKNOWN" ? "USD" : wallet.currencyCode,
            paymentMethod: "UPI",
            paymentDetailsReference: upiId.trim(),
          });
          setWithdrawing(false);
          if (r.success) {
            setAmount(""); load(true);
            Alert.alert("✅ Submitted", r.message);
          } else {
            Alert.alert("❌ Failed", r.message);
          }
        }},
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const lifetimeEarned    = formatMicros(wallet.lifetimeEarnedMicroValue,    wallet.currencyCode);
  const lifetimeWithdrawn = formatMicros(wallet.lifetimeWithdrawnMicroValue, wallet.currencyCode);

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.headerTitle}>Ad Rewards</Text>
          <Text style={s.headerSub}>Your share: {config.unavailable ? "—" : `${config.userSharePercent}%`} of ad revenue</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Live balance strip */}
      <BalanceBar wallet={wallet} />

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          ⚠️ AdMob revenue is estimated. Final amounts depend on reporting & settlement.
        </Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(["earn", "wallet"] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "earn" ? "📺 Earn" : "👛 Wallet"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[Colors.primary]} />
          }
        >
          {/* ══════════════════════ EARN TAB ══════════════════════ */}
          {tab === "earn" && (
            <>
              <AdBanner marginVertical={6} placement="ad_reward_earn_tab" />

              {/* Revenue share info */}
              <View style={s.card}>
                <Text style={s.cardTitle}>💹 How Revenue Works</Text>
                <Text style={s.cardBody}>
                  Every ad impression that generates revenue fires a paid event from the Google Mobile Ads SDK.
                  The app captures the real AdMob value and submits it to the backend.
                  You receive <Text style={s.bold}>{config.unavailable ? "your configured share" : `${config.userSharePercent}%`}</Text> of each impression's revenue.
                  {"\n\n"}
                  Revenue amounts vary with every impression — they depend on the AdMob auction at that moment.
                  There is no fixed amount per view.
                </Text>
              </View>

              {/* Formats */}
              <View style={s.card}>
                <Text style={s.cardTitle}>📊 Ad Formats That Generate Revenue</Text>
                {[
                  { icon: "🖼️", label: "Banner",              note: "Auto-loads as you browse screens" },
                  { icon: "📺", label: "Rewarded Video",       note: "Watch a video below" },
                  { icon: "🔲", label: "Interstitial",         note: "Shown between screen transitions" },
                  { icon: "📱", label: "App Open",             note: "Shown when app is brought to foreground" },
                ].map(f => (
                  <View key={f.label} style={s.fmtRow}>
                    <Text style={s.fmtIcon}>{f.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fmtLabel}>{f.label}</Text>
                      <Text style={s.fmtNote}>{f.note}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Watch video */}
              <View style={s.card}>
                <Text style={s.cardTitle}>📺 Watch a Video Ad</Text>
                <Text style={s.cardBody}>
                  Voluntarily watch a rewarded video ad. The revenue from this impression is credited at your share rate.
                </Text>
                <WatchVideoAdButton
                  onRewarded={() => {
                    Alert.alert("Video completed", "Revenue from this impression will appear in your Wallet once it is recorded by AdMob and settled by the backend.");
                    load(true);
                  }}
                  style={{ marginTop: 12 }}
                />
              </View>

              <AdBanner marginVertical={6} placement="ad_reward_earn_tab_2" />
            </>
          )}

          {/* ══════════════════════ WALLET TAB ══════════════════════ */}
          {tab === "wallet" && (
            <>
              <AdBanner marginVertical={6} placement="ad_reward_wallet_tab" />

              {/* Lifetime stats */}
              <View style={s.statsRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{txTotal}</Text>
                  <Text style={s.statLabel}>Transactions</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum} numberOfLines={1} adjustsFontSizeToFit>{lifetimeEarned}</Text>
                  <Text style={s.statLabel}>Lifetime earned</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum} numberOfLines={1} adjustsFontSizeToFit>{lifetimeWithdrawn}</Text>
                  <Text style={s.statLabel}>Withdrawn</Text>
                </View>
              </View>

              {/* Withdrawal form */}
              <View style={s.card}>
                <Text style={s.cardTitle}>💸 Request Withdrawal</Text>
                <Text style={s.withdrawNote}>
                  Only <Text style={s.bold}>available</Text> balance can be withdrawn.
                  Minimum: $0.01 (10,000 micros). Processed within 48 hours.
                </Text>
                <Text style={s.inputLabel}>UPI ID</Text>
                <TextInput
                  style={s.input}
                  placeholder="yourname@upi"
                  placeholderTextColor="#BDBDBD"
                  value={upiId}
                  onChangeText={setUpiId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={s.inputLabel}>Amount ({wallet.currencyCode})</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 0.01"
                  placeholderTextColor="#BDBDBD"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[s.withdrawBtn, (wallet.availableMicroValue === 0 || withdrawing) && s.withdrawDisabled]}
                  onPress={handleWithdraw}
                  disabled={wallet.availableMicroValue === 0 || withdrawing}
                  activeOpacity={0.85}
                >
                  {withdrawing
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={s.withdrawBtnText}>
                        {wallet.availableMicroValue === 0
                          ? "No available balance yet"
                          : "Request Withdrawal →"}
                      </Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Transaction history */}
              <View style={s.card}>
                <Text style={s.cardTitle}>📜 Transaction History</Text>
                {txs.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyIcon}>📭</Text>
                    <Text style={s.emptyTitle}>No transactions yet</Text>
                    <Text style={s.emptyText}>
                      Transactions appear here once the backend records your first ad impression.
                    </Text>
                  </View>
                ) : (
                  txs.map((tx, i) => <TxRow key={tx._id} tx={tx} index={i} />)
                )}
              </View>

              <AdBanner marginVertical={6} placement="ad_reward_wallet_tab_2" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F9" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll:    { padding: 16, paddingBottom: 48 },

  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  backBtn:     { width: 36 },
  backArrow:   { fontSize: 22, color: Colors.primary, fontWeight: "700" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111" },
  headerSub:   { fontSize: 11, color: "#888", marginTop: 1 },

  disclaimer: { backgroundColor: "#FFF8E1", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#FFE082" },
  disclaimerText: { fontSize: 11, color: "#795548", lineHeight: 16 },

  tabBar:       { flexDirection: "row", backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText:      { fontSize: 14, fontWeight: "600", color: "#999" },
  tabTextActive:{ color: Colors.primary, fontWeight: "800" },

  card: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111", marginBottom: 10 },
  cardBody:  { fontSize: 13, color: "#555", lineHeight: 20 },
  bold:      { fontWeight: "800", color: "#111" },

  fmtRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F5F5F5" },
  fmtIcon:  { fontSize: 22, width: 30, textAlign: "center" },
  fmtLabel: { fontSize: 13, fontWeight: "700", color: "#111" },
  fmtNote:  { fontSize: 11, color: "#888", marginTop: 2 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 12, paddingVertical: 14, alignItems: "center",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statNum:   { fontSize: 16, fontWeight: "900", color: Colors.primary },
  statLabel: { fontSize: 10, color: "#888", marginTop: 3, fontWeight: "600", textAlign: "center" },

  withdrawNote: { fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 18 },
  inputLabel:   { fontSize: 11, fontWeight: "700", color: "#777", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: "#F8F9FA", borderWidth: 1.5, borderColor: "#E0E0E0",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#111", marginBottom: 14,
  },
  withdrawBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", elevation: 2,
    shadowColor: Colors.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  withdrawDisabled: { backgroundColor: "#BDBDBD", elevation: 0, shadowOpacity: 0 },
  withdrawBtnText:  { color: "#FFF", fontWeight: "800", fontSize: 15 },

  emptyBox:   { alignItems: "center", paddingVertical: 24 },
  emptyIcon:  { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 4 },
  emptyText:  { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19 },
});
