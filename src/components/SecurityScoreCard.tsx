import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../theme/colors";

interface Props {
  securityScore?: number;
  xp?: number;
  points?: number;
  level?: number;
  streak?: number;
}

function scoreStatus(s: number): { label: string; color: string; emoji: string } {
  if (s >= 80) return { label: "Excellent",      color: "#22C55E", emoji: "🛡️" };
  if (s >= 60) return { label: "Good",            color: "#3B82F6", emoji: "✅" };
  if (s >= 40) return { label: "Needs Attention", color: "#F59E0B", emoji: "⚠️" };
  return        { label: "At Risk",               color: "#EF4444", emoji: "🚨" };
}

export default function SecurityScoreCard({
  securityScore = 0,
  xp = 0,
  points = 0,
  level = 1,
  streak = 0,
}: Props) {
  const score  = Math.min(Math.max(securityScore, 0), 100);
  const status = scoreStatus(score);

  return (
    <View style={styles.card}>

      {/* ── Single row: score + bar + status ── */}
      <View style={styles.mainRow}>

        {/* Big number */}
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreNum}>{score}</Text>
          <Text style={[styles.scoreSuffix, { color: status.color }]}>%</Text>
        </View>

        {/* Bar + label */}
        <View style={styles.barBlock}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barTitle}>Security Score</Text>
            <View style={[styles.statusPill, { backgroundColor: status.color + "22", borderColor: status.color + "44" }]}>
              <Text style={styles.statusEmoji}>{status.emoji}</Text>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${score}%` as any, backgroundColor: status.color }]}>
              <View style={styles.barShine} />
            </View>
          </View>

          {/* Live indicator */}
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

      </View>

      {/* ── 4 stat chips ── */}
      <View style={styles.chips}>
        <Chip icon="⚔️" label="Level"  value={String(level)} />
        <Chip icon="⭐" label="XP"     value={fmtNum(xp)} />
        <Chip icon="💎" label="Points" value={fmtNum(points)} />
        <Chip icon="🔥" label="Streak" value={`${streak}d`} />
      </View>

    </View>
  );
}

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Chip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    gap: 12,
  },

  // score + bar row
  mainRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreBlock: { flexDirection: "row", alignItems: "flex-start" },
  scoreNum:   { fontSize: 42, fontWeight: "900", color: "#FFF", lineHeight: 46, letterSpacing: -1 },
  scoreSuffix:{ fontSize: 16, fontWeight: "800", marginTop: 6 },

  barBlock:     { flex: 1 },
  barLabelRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  barTitle:     { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  statusPill:   { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1,
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusEmoji:  { fontSize: 11 },
  statusText:   { fontSize: 10, fontWeight: "700" },

  barTrack:  { height: 7, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  barFill:   { height: "100%", borderRadius: 4, minWidth: 4 },
  barShine:  { position: "absolute", right: 0, top: 0, bottom: 0, width: 16,
               backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 },

  liveRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  liveDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  liveText: { fontSize: 8, fontWeight: "800", letterSpacing: 1.2, color: "#22C55E" },

  // chips
  chips:     { flexDirection: "row", gap: 8 },
  chip:      {
    flex: 1, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    gap: 1,
  },
  chipIcon:  { fontSize: 15 },
  chipValue: { fontSize: 13, fontWeight: "800", color: "#FFF" },
  chipLabel: { fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase" },
});
