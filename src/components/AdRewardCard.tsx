/**
 * AdRewardCard.tsx — SoloSecurities
 *
 * Minimal dashboard chip — shows the backend wallet balance.
 * Balance is fetched from the backend (never a local counter).
 * Tapping navigates to the full AdRewards screen.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../theme/colors";
import { getWalletSummary, formatMicros } from "../services/adRewardService";

interface Props {
  navigation: any;
  onBalanceChange?: (availableMicroValue: number) => void;
}

export default function AdRewardCard({ navigation, onBalanceChange }: Props) {
  const [displayValue,  setDisplayValue]  = useState("...");
  const [currencyCode,  setCurrencyCode]  = useState("USD");
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const refresh = useCallback(async () => {
    try {
      const wallet = await getWalletSummary();
      setDisplayValue(formatMicros(wallet.availableMicroValue, wallet.currencyCode));
      setCurrencyCode(wallet.currencyCode);
      onBalanceChange?.(wallet.availableMicroValue);
    } catch {
      setDisplayValue("—");
    }
  }, [onBalanceChange]);

  useEffect(() => {
    refresh();
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [refresh]);

  return (
    <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={s.inner}
        onPress={() => navigation.navigate("AdRewards")}
        activeOpacity={0.8}
      >
        <View>
          <Text style={s.label}>AD REWARDS</Text>
          <Text style={s.amount}>{displayValue}</Text>
        </View>
        <View style={s.arrowWrap}>
          <Text style={s.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    backgroundColor: "#1B5E20",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  amount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 22,
    color: "#FFF",
    fontWeight: "700",
    lineHeight: 26,
  },
});
