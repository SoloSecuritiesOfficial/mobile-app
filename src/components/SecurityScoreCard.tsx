import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import Colors from "../theme/colors";

export interface ScoreBreakdown {
  totalLessons:     number;
  completedLessons: number;
  totalLabs:        number;
  completedLabs:    number;
  totalQuizzes:     number;
  completedQuizzes: number;
  totalCTF:         number;
  completedCTF:     number;
  learningPct:      number;
  labPct:           number;
  quizPct:          number;
  ctfPct:           number;
  learningPoints:   number;
  labPoints:        number;
  quizPoints:       number;
  ctfPoints:        number;
  learningWeight:   number;
  labWeight:        number;
  quizWeight:       number;
  ctfWeight:        number;
}

interface Props {
  securityScore?:  number;
  xp?:             number;
  points?:         number;
  level?:          number;
  streak?:         number;
  scoreBreakdown?: ScoreBreakdown | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function scoreStatus(s: number): { label: string; color: string; emoji: string } {
  if (s >= 80) return { label: "Excellent",      color: "#22C55E", emoji: "🛡️" };
  if (s >= 60) return { label: "Good",            color: "#3B82F6", emoji: "✅" };
  if (s >= 40) return { label: "Needs Attention", color: "#F59E0B", emoji: "⚠️" };
  return        { label: "At Risk",               color: "#EF4444", emoji: "🚨" };
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const XP_PER_LEVEL = 1000;

function xpToNextLevel(xp: number) {
  const current = xp % XP_PER_LEVEL;
  const needed  = XP_PER_LEVEL - current;
  const pct     = Math.round((current / XP_PER_LEVEL) * 100);
  return { current, needed, pct };
}

const LEVEL_TITLES = [
  { min: 50, title: "Security Architect" },
  { min: 40, title: "Penetration Tester" },
  { min: 30, title: "Security Engineer" },
  { min: 20, title: "Ethical Hacker" },
  { min: 10, title: "Security Analyst" },
  { min: 5,  title: "Cybersecurity Enthusiast" },
  { min: 1,  title: "Security Novice" },
];
function levelTitle(level: number) {
  return LEVEL_TITLES.find(t => level >= t.min)?.title ?? "Security Novice";
}

// ─── mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={mb.track}>
      <View style={[mb.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const mb = StyleSheet.create({
  track: { height: 5, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", flex: 1 },
  fill:  { height: "100%", borderRadius: 4, minWidth: 2 },
});

// ─── Score Breakdown Modal ────────────────────────────────────────────────────
function ScoreBreakdownModal({
  visible,
  score,
  status,
  breakdown,
  onClose,
}: {
  visible:   boolean;
  score:     number;
  status:    { label: string; color: string; emoji: string };
  breakdown: ScoreBreakdown | null;
  onClose:   () => void;
}) {
  if (!visible) return null;

  // When no breakdown is available yet, show a simple info sheet
  if (!breakdown) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
        <Pressable style={sm.overlay} onPress={onClose}>
          <Pressable style={sm.sheet} onPress={e => e.stopPropagation()}>
            <View style={sm.handle} />
            <View style={[sm.header, { borderBottomColor: status.color + "33" }]}>
              <View style={[sm.iconWrap, { backgroundColor: status.color + "22" }]}>
                <Text style={sm.headerEmoji}>🔐</Text>
              </View>
              <Text style={sm.headerTitle}>Security Score</Text>
              <TouchableOpacity style={sm.closeBtn} onPress={onClose} hitSlop={12}>
                <Text style={sm.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={[sm.bigScore, { color: status.color }]}>{score}%</Text>
              <Text style={sm.loadingNote}>Complete some learning modules, labs, quizzes, or CTF challenges to see your detailed breakdown.</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  const bd = breakdown;
  const categories = [
    {
      emoji: "📚", label: "Learning Modules",
      completed: bd.completedLessons, total: bd.totalLessons,
      pct: bd.learningPct, pts: bd.learningPoints, weight: bd.learningWeight,
      color: "#3B82F6",
    },
    {
      emoji: "🎯", label: "Hands-on Labs",
      completed: bd.completedLabs, total: bd.totalLabs,
      pct: bd.labPct, pts: bd.labPoints, weight: bd.labWeight,
      color: "#22C55E",
    },
    {
      emoji: "📝", label: "Quizzes Passed",
      completed: bd.completedQuizzes, total: bd.totalQuizzes,
      pct: bd.quizPct, pts: bd.quizPoints, weight: bd.quizWeight,
      color: "#F59E0B",
    },
    {
      emoji: "🚩", label: "CTF Challenges",
      completed: bd.completedCTF, total: bd.totalCTF,
      pct: bd.ctfPct, pts: bd.ctfPoints, weight: bd.ctfWeight,
      color: "#EF4444",
    },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={sm.overlay} onPress={onClose}>
        <Pressable style={sm.sheet} onPress={e => e.stopPropagation()}>
          <View style={sm.handle} />

          {/* Header */}
          <View style={[sm.header, { borderBottomColor: status.color + "33" }]}>
            <View style={[sm.iconWrap, { backgroundColor: status.color + "22" }]}>
              <Text style={sm.headerEmoji}>🔐</Text>
            </View>
            <Text style={sm.headerTitle}>How is this calculated?</Text>
            <TouchableOpacity style={sm.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={sm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={sm.scroll}
            contentContainerStyle={sm.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Big score display */}
            <View style={sm.scoreRow}>
              <Text style={[sm.bigScore, { color: status.color }]}>{score}</Text>
              <Text style={[sm.bigScoreSuffix, { color: status.color }]}>%</Text>
              <View style={[sm.statusPill, { backgroundColor: status.color + "22", borderColor: status.color + "55" }]}>
                <Text style={sm.statusEmoji}>{status.emoji}</Text>
                <Text style={[sm.statusLabel, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            {/* Formula explanation */}
            <View style={sm.formulaCard}>
              <Text style={sm.formulaTitle}>📐 Formula</Text>
              <Text style={sm.formulaText}>
                Score is based purely on your completion across the four content
                categories. Complete everything in all four and you reach 100%.
              </Text>
              <View style={sm.formulaRow}>
                <Text style={sm.formulaItem}>📚 Learning Modules</Text>
                <Text style={sm.formulaVal}>25 pts max</Text>
              </View>
              <View style={sm.formulaRow}>
                <Text style={sm.formulaItem}>🎯 Hands-on Labs</Text>
                <Text style={sm.formulaVal}>25 pts max</Text>
              </View>
              <View style={sm.formulaRow}>
                <Text style={sm.formulaItem}>📝 Quizzes</Text>
                <Text style={sm.formulaVal}>25 pts max</Text>
              </View>
              <View style={sm.formulaRow}>
                <Text style={sm.formulaItem}>🚩 CTF Challenges</Text>
                <Text style={sm.formulaVal}>25 pts max</Text>
              </View>
              <View style={[sm.formulaRow, { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", marginTop: 6, paddingTop: 6 }]}>
                <Text style={[sm.formulaItem, { color: Colors.text ?? "#FFF", fontWeight: "700" }]}>Total</Text>
                <Text style={[sm.formulaVal, { color: Colors.primary ?? "#C62828" }]}>100 pts</Text>
              </View>
            </View>

            {/* Category breakdown */}
            <Text style={sm.sectionLabel}>BREAKDOWN BY CATEGORY</Text>
            {categories.map((cat) => (
              <View key={cat.label} style={sm.catCard}>
                {/* Cat header */}
                <View style={sm.catHeader}>
                  <View style={[sm.catIconWrap, { backgroundColor: cat.color + "22" }]}>
                    <Text style={sm.catEmoji}>{cat.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sm.catLabel}>{cat.label}</Text>
                    <Text style={sm.catSub}>
                      {cat.total > 0
                        ? `${cat.completed} of ${cat.total} completed`
                        : "No content yet"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[sm.catPts, { color: cat.color }]}>+{cat.pts.toFixed(1)}</Text>
                    <Text style={sm.catPtsSub}>/ {cat.weight} pts</Text>
                  </View>
                </View>

                {/* Mini progress bar */}
                <View style={sm.catBarRow}>
                  <MiniBar pct={cat.pct} color={cat.color} />
                  <Text style={[sm.catPct, { color: cat.color }]}>{cat.pct}%</Text>
                </View>
              </View>
            ))}

            {/* Score summary */}
            <View style={[sm.summaryCard, { borderColor: status.color + "44" }]}>
              {categories.map((cat) => (
                <View key={cat.label} style={sm.summaryRow}>
                  <Text style={sm.summaryLabel}>{cat.emoji} {cat.label}</Text>
                  <Text style={sm.summaryVal}>{cat.pts.toFixed(1)} / {cat.weight} pts</Text>
                </View>
              ))}
              <View style={[sm.summaryRow, sm.summaryTotal]}>
                <Text style={[sm.summaryLabel, { color: status.color, fontWeight: "800" }]}>Final Score</Text>
                <Text style={[sm.summaryVal, { color: status.color, fontSize: 18 }]}>{score}%</Text>
              </View>
            </View>

            {/* Tip */}
            <View style={[sm.tipCard, { borderLeftColor: status.color }]}>
              <Text style={sm.tipLabel}>💡 HOW TO IMPROVE</Text>
              <Text style={sm.tipText}>
                {bd.learningPct < 100 && `📚 Complete ${bd.totalLessons - bd.completedLessons} more learning module${bd.totalLessons - bd.completedLessons !== 1 ? "s" : ""}. `}
                {bd.labPct < 100 && `🎯 Finish ${bd.totalLabs - bd.completedLabs} more lab${bd.totalLabs - bd.completedLabs !== 1 ? "s" : ""}. `}
                {bd.quizPct < 100 && `📝 Pass ${bd.totalQuizzes - bd.completedQuizzes} more quiz${bd.totalQuizzes - bd.completedQuizzes !== 1 ? "zes" : ""}. `}
                {bd.ctfPct < 100 && `🚩 Solve ${bd.totalCTF - bd.completedCTF} more CTF challenge${bd.totalCTF - bd.completedCTF !== 1 ? "s" : ""}. `}
                {bd.learningPct === 100 && bd.labPct === 100 && bd.quizPct === 100 && bd.ctfPct === 100
                  ? "🎉 Perfect score! You've completed everything."
                  : "Focus on the categories with the lowest completion percentage first."}
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chip modal types ─────────────────────────────────────────────────────────
type ChipType = "level" | "xp" | "points" | "streak";

interface ChipModalConfig {
  title: string;
  emoji: string;
  color: string;
  rows:  { label: string; value: string; sub?: string }[];
  tip:   string;
}

function buildChipModal(
  type: ChipType,
  { xp, points, level, streak }: { xp: number; points: number; level: number; streak: number },
): ChipModalConfig {
  switch (type) {
    case "level": {
      const { current, needed, pct } = xpToNextLevel(xp);
      return {
        title: "Level Progress", emoji: "⚔️", color: "#A78BFA",
        rows: [
          { label: "Current Level",    value: `Level ${level}`,     sub: levelTitle(level) },
          { label: "Next Level",       value: `Level ${level + 1}`, sub: levelTitle(level + 1) },
          { label: "XP This Level",    value: `${current} / ${XP_PER_LEVEL} XP` },
          { label: "XP to Next Level", value: `${needed} XP remaining` },
          { label: "Level Progress",   value: `${pct}%` },
          { label: "Total XP Earned",  value: fmtNum(xp) + " XP" },
        ],
        tip: `Earn ${needed} more XP to reach Level ${level + 1} and unlock the "${levelTitle(level + 1)}" title.`,
      };
    }
    case "xp": {
      const { current, needed, pct } = xpToNextLevel(xp);
      return {
        title: "Experience Points", emoji: "⭐", color: "#FBBF24",
        rows: [
          { label: "Total XP",        value: fmtNum(xp) + " XP" },
          { label: "Current Level",   value: `Level ${level}`, sub: levelTitle(level) },
          { label: "XP This Level",   value: `${current} / ${XP_PER_LEVEL}` },
          { label: "Progress",        value: `${pct}%` },
          { label: "XP Remaining",    value: `${needed} XP` },
        ],
        tip: "Earn XP by completing learning modules (+50), labs (+100), quizzes (+75), and CTF challenges (+200).",
      };
    }
    case "points": {
      const tier = points >= 5000 ? "Elite" : points >= 2000 ? "Advanced" : points >= 500 ? "Intermediate" : "Beginner";
      return {
        title: "Points", emoji: "💎", color: "#38BDF8",
        rows: [
          { label: "Total Points",    value: fmtNum(points) + " pts" },
          { label: "Current Tier",    value: tier },
          { label: "Points to Elite", value: points >= 5000 ? "Reached! 🎉" : `${5000 - points} pts` },
        ],
        tip: "Points are awarded for completing challenges, reporting bugs, and daily check-ins. Unlike XP they never reset.",
      };
    }
    case "streak": {
      return {
        title: "Daily Streak", emoji: "🔥", color: "#FB923C",
        rows: [
          { label: "Current Streak",      value: `${streak} day${streak !== 1 ? "s" : ""}` },
          { label: "Daily XP Bonus",      value: streak >= 30 ? "+60 XP" : streak >= 14 ? "+40 XP" : streak >= 7 ? "+30 XP" : "+20 XP" },
          { label: "Milestone",           value: streak >= 30 ? "🏆 30-day Master" : streak >= 14 ? "🥈 14-day Veteran" : streak >= 7 ? "🥉 7-day Consistent" : "Keep going!" },
          { label: "Next Milestone In",   value: streak >= 30 ? "All done!" : `${streak < 7 ? 7 - streak : streak < 14 ? 14 - streak : 30 - streak} days` },
        ],
        tip: "Check in every day to maintain your streak. Use a Streak Freeze from Settings if you need to skip a day.",
      };
    }
  }
}

// ─── Generic chip detail modal ────────────────────────────────────────────────
function ChipModal({ config, onClose }: { config: ChipModalConfig | null; onClose: () => void }) {
  if (!config) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={sm.overlay} onPress={onClose}>
        <Pressable style={sm.sheet} onPress={e => e.stopPropagation()}>
          <View style={sm.handle} />
          <View style={[sm.header, { borderBottomColor: config.color + "33" }]}>
            <View style={[sm.iconWrap, { backgroundColor: config.color + "22" }]}>
              <Text style={sm.headerEmoji}>{config.emoji}</Text>
            </View>
            <Text style={sm.headerTitle}>{config.title}</Text>
            <TouchableOpacity style={sm.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={sm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={sm.scroll} contentContainerStyle={sm.scrollContent} showsVerticalScrollIndicator={false}>
            {config.rows.map((row, i) => (
              <View key={i} style={[sm.row, i === config.rows.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={sm.rowLabel}>{row.label}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[sm.rowValue, { color: config.color }]}>{row.value}</Text>
                  {row.sub && <Text style={sm.rowSub}>{row.sub}</Text>}
                </View>
              </View>
            ))}
            <View style={[sm.tipCard, { borderLeftColor: config.color }]}>
              <Text style={sm.tipLabel}>💡 TIP</Text>
              <Text style={sm.tipText}>{config.tip}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipTap}>tap</Text>
    </TouchableOpacity>
  );
}

// ─── SecurityScoreCard ────────────────────────────────────────────────────────
export default function SecurityScoreCard({
  securityScore = 0,
  xp = 0,
  points = 0,
  level = 1,
  streak = 0,
  scoreBreakdown = null,
}: Props) {
  const [activeChip,      setActiveChip]      = useState<ChipType | null>(null);
  const [showBreakdown,   setShowBreakdown]   = useState(false);

  const score  = Math.min(Math.max(securityScore, 0), 100);
  const status = scoreStatus(score);

  return (
    <>
      <View style={styles.card}>

        {/* ── score + bar row ── score number is tappable ── */}
        <View style={styles.mainRow}>

          {/* Tapping the score number opens the breakdown modal */}
          <TouchableOpacity
            style={styles.scoreBlock}
            onPress={() => setShowBreakdown(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.scoreNum}>{score}</Text>
            <Text style={[styles.scoreSuffix, { color: status.color }]}>%</Text>
            {/* Small "tap" hint under the number */}
            <Text style={styles.scoreTapHint}>how?</Text>
          </TouchableOpacity>

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

            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* ── 4 clickable stat chips ── */}
        <View style={styles.chips}>
          <Chip icon="⚔️" label="Level"  value={String(level)}   onPress={() => setActiveChip("level")}  />
          <Chip icon="⭐" label="XP"     value={fmtNum(xp)}      onPress={() => setActiveChip("xp")}     />
          <Chip icon="💎" label="Points" value={fmtNum(points)}  onPress={() => setActiveChip("points")} />
          <Chip icon="🔥" label="Streak" value={`${streak}d`}    onPress={() => setActiveChip("streak")} />
        </View>

      </View>

      {/* Score breakdown modal — opens when user taps the score number */}
      <ScoreBreakdownModal
        visible={showBreakdown}
        score={score}
        status={status}
        breakdown={scoreBreakdown}
        onClose={() => setShowBreakdown(false)}
      />

      {/* Chip detail modal */}
      <ChipModal
        config={activeChip ? buildChipModal(activeChip, { xp, points, level, streak }) : null}
        onClose={() => setActiveChip(null)}
      />
    </>
  );
}

// ─── card styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dashboardHeader,
    borderRadius: 16, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    elevation: 5, shadowColor: "#000", shadowOpacity: 0.18,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, gap: 12,
  },
  mainRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreBlock: { alignItems: "center" },
  scoreNum:   { fontSize: 42, fontWeight: "900", color: "#FFF", lineHeight: 46, letterSpacing: -1 },
  scoreSuffix:{ fontSize: 16, fontWeight: "800", marginTop: 2 },
  scoreTapHint: { fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: 0.5, marginTop: 2 },

  barBlock:    { flex: 1 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  barTitle:    { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  statusPill:  { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusEmoji: { fontSize: 11 },
  statusText:  { fontSize: 10, fontWeight: "700" },

  barTrack: { height: 7, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: 4, minWidth: 4 },
  barShine: { position: "absolute", right: 0, top: 0, bottom: 0, width: 16, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 },

  liveRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  liveDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  liveText: { fontSize: 8, fontWeight: "800", letterSpacing: 1.2, color: "#22C55E" },

  chips:     { flexDirection: "row", gap: 8 },
  chip:      { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 1 },
  chipIcon:  { fontSize: 15 },
  chipValue: { fontSize: 13, fontWeight: "800", color: "#FFF" },
  chipLabel: { fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase" },
  chipTap:   { fontSize: 7, color: "rgba(255,255,255,0.2)", fontWeight: "500", marginTop: 1 },
});

// ─── shared modal styles ──────────────────────────────────────────────────────
const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface ?? "#1A1A2E",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40, maxHeight: "88%",
  },
  handle: { width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerEmoji: { fontSize: 20 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: Colors.text ?? "#FFF" },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 14, color: Colors.textSecondary ?? "#AAA", fontWeight: "700" },
  scroll: { flexShrink: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },

  // score display
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  bigScore: { fontSize: 56, fontWeight: "900", lineHeight: 62 },
  bigScoreSuffix: { fontSize: 22, fontWeight: "900", alignSelf: "flex-end", marginBottom: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 4 },
  statusEmoji: { fontSize: 14 },
  statusLabel: { fontSize: 12, fontWeight: "800" },

  loadingNote: { fontSize: 14, color: Colors.textSecondary ?? "#AAA", textAlign: "center", lineHeight: 22, marginTop: 8 },

  // formula card
  formulaCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, marginBottom: 16 },
  formulaTitle: { fontSize: 12, fontWeight: "800", color: "#A78BFA", letterSpacing: 0.6, marginBottom: 8 },
  formulaText: { fontSize: 13, color: Colors.textSecondary ?? "#AAA", lineHeight: 20, marginBottom: 10 },
  formulaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  formulaItem: { fontSize: 12, color: Colors.textSecondary ?? "#AAA" },
  formulaVal: { fontSize: 12, fontWeight: "700", color: Colors.text ?? "#FFF" },

  // section label
  sectionLabel: { fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },

  // category card
  catCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, marginBottom: 8 },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  catIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: "700", color: Colors.text ?? "#FFF" },
  catSub: { fontSize: 11, color: Colors.textSecondary ?? "#AAA", marginTop: 1 },
  catPts: { fontSize: 16, fontWeight: "900" },
  catPtsSub: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "600" },
  catBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catPct: { fontSize: 11, fontWeight: "800", minWidth: 34, textAlign: "right" },

  // bonus card
  bonusCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 12 },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  bonusEmoji: { fontSize: 16 },
  bonusLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary ?? "#AAA", fontWeight: "500" },
  bonusPts: { fontSize: 14, fontWeight: "800" },

  // summary card
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary ?? "#AAA", fontWeight: "600" },
  summaryVal: { fontSize: 14, fontWeight: "800", color: Colors.text ?? "#FFF" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 10 },

  // generic rows (for chip modal)
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  rowLabel: { fontSize: 13, color: Colors.textSecondary ?? "#AAA", fontWeight: "500", flex: 1 },
  rowValue: { fontSize: 14, fontWeight: "800" },
  rowSub: { fontSize: 11, color: Colors.textSecondary ?? "#888", marginTop: 2 },

  // tip
  tipCard: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, borderLeftWidth: 3 },
  tipLabel: { fontSize: 10, fontWeight: "800", color: "#FBBF24", letterSpacing: 0.8, marginBottom: 6 },
  tipText: { fontSize: 13, color: Colors.textSecondary ?? "#AAA", lineHeight: 20 },
});
