import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Easing,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  acknowledgeBugReport,
  getBugReports,
} from "../../services/securityService";

import { getCurrentUser } from "../../services/authService";

import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  event: string;
  date: string;
}

interface BugReport {
  _id: string;

  title?: string;
  description?: string;

  severity?: "Low" | "Medium" | "High" | "Critical" | string;

  targetSystem?: string;
  platform?: string;

  status?: string;

  vulnType?: string;

  cvssScore?: number;
  cvssVector?: string;

  cweId?: string;
  cweTitle?: string;

  stepsToReproduce?: string[];

  proofOfConcept?: string;

  impact?: string;

  remediation?: string;

  timeline?: TimelineEntry[];

  bountyAmount?: string | number;

  references?: string[];

  isAcknowledged?: boolean;

  userId?: {
    _id?: string;
    username?: string;
  } | string;

  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#3B82F6",
};

const PLATFORM_COLOR: Record<string, string> = {
  hackerone: "#3B82F6",
  bugcrowd: "#F97316",
  intigriti: "#10B981",
};

const STATUS_COLOR: Record<string, string> = {
  resolved: "#22C55E",
  fixed: "#22C55E",
  closed: "#22C55E",
  acknowledged: "#22C55E",
  open: "#F59E0B",
  pending: "#F59E0B",
  investigating: "#A78BFA",
  duplicate: "#64748B",
  rejected: "#EF4444",
};

const FILTERS = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Low",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalize(value?: string): string {
  return String(value ?? "").trim().toLowerCase();
}

function severityColor(severity?: string): string {
  return (
    SEVERITY_COLOR[normalize(severity)] ??
    "#64748B"
  );
}

function platformColor(platform?: string): string {
  return (
    PLATFORM_COLOR[normalize(platform)] ??
    "#8B5CF6"
  );
}

function statusColor(status?: string): string {
  const normalized = normalize(status);

  for (const key of Object.keys(STATUS_COLOR)) {
    if (normalized.includes(key)) {
      return STATUS_COLOR[key];
    }
  }

  return "#F59E0B";
}

function cvssRisk(score: number): string {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

function formatDate(value?: string): string {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string): string {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseBounty(value?: string | number): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = value.replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function formatBounty(value?: string | number): string {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return "N/A";
  }

  return String(value);
}

function ownerIdOf(report: BugReport): string {
  if (
    typeof report.userId === "object" &&
    report.userId !== null
  ) {
    return report.userId._id ?? "";
  }

  return String(report.userId ?? "");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  title,
}: {
  emoji: string;
  title: string;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.iconBox}>
        <Text style={sectionStyles.emoji}>{emoji}</Text>
      </View>

      <Text style={sectionStyles.title}>
        {title}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  emoji: {
    fontSize: 15,
  },

  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: Colors.text ?? "#FFFFFF",
    letterSpacing: 0.8,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CODE BLOCK
// ─────────────────────────────────────────────────────────────────────────────

function CodeBlock({
  value,
}: {
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: value,
      });
    } catch {
      // Ignore cancelled share
    }
  };

  return (
    <View style={codeStyles.wrapper}>
      <View style={codeStyles.header}>
        <View style={codeStyles.headerLeft}>
          <View style={codeStyles.dot} />
          <Text style={codeStyles.headerText}>
            Proof of Concept
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShareCode}
          activeOpacity={0.8}
        >
          <Text style={codeStyles.shareText}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={codeStyles.scrollContent}
      >
        <Text selectable style={codeStyles.text}>
          {value}
        </Text>
      </ScrollView>
    </View>
  );
}

const codeStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#080B10",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
    overflow: "hidden",
  },

  header: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0D1117",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  headerText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  shareText: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 11,
    fontWeight: "800",
  },

  scrollContent: {
    padding: 14,
  },

  text: {
    fontFamily: "Courier New",
    fontSize: 11,
    lineHeight: 18,
    color: "#22C55E",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CVSS
// ─────────────────────────────────────────────────────────────────────────────

function CVSSBadge({
  score,
  vector,
}: {
  score: number;
  vector?: string;
}) {
  const risk = cvssRisk(score);
  const color = severityColor(risk);

  return (
    <View
      style={[
        cvssStyles.wrapper,
        {
          borderColor: color + "55",
        },
      ]}
    >
      <View
        style={[
          cvssStyles.score,
          {
            backgroundColor: color,
          },
        ]}
      >
        <Text style={cvssStyles.scoreNumber}>
          {score.toFixed(1)}
        </Text>

        <Text style={cvssStyles.scoreLabel}>
          CVSS
        </Text>
      </View>

      <View style={cvssStyles.details}>
        <Text
          style={[
            cvssStyles.risk,
            {
              color,
            },
          ]}
        >
          {risk} Risk
        </Text>

        {vector ? (
          <Text
            style={cvssStyles.vector}
            numberOfLines={2}
          >
            {vector}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const cvssStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },

  score: {
    width: 58,
    height: 58,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  scoreLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 1,
  },

  details: {
    flex: 1,
    marginLeft: 12,
  },

  risk: {
    fontSize: 13,
    fontWeight: "900",
  },

  vector: {
    marginTop: 4,
    color: Colors.textSecondary ?? "#94A3B8",
    fontSize: 9,
    lineHeight: 14,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG CARD
// ─────────────────────────────────────────────────────────────────────────────

function BugCard({
  item,
  isOwn,
  onAcknowledge,
}: {
  item: BugReport;
  isOwn: boolean;
  onAcknowledge: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const animation = useRef(
    new Animated.Value(0)
  ).current;

  const rotateAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const toggle = () => {
    const next = expanded ? 0 : 1;

    setExpanded(!expanded);

    Animated.parallel([
      Animated.timing(animation, {
        toValue: next,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      Animated.timing(rotateAnimation, {
        toValue: next,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `🐞 SoloSecurities Bug Report\n\n` +
          `Title: ${item.title ?? "Untitled"}\n` +
          `Severity: ${item.severity ?? "Unknown"}\n` +
          `Platform: ${item.platform ?? "Unknown"}\n` +
          `Target: ${item.targetSystem ?? "Unknown"}\n` +
          `Status: ${item.status ?? "Unknown"}\n` +
          `CVSS: ${item.cvssScore ?? "N/A"}\n` +
          `Bounty: ${formatBounty(item.bountyAmount)}\n\n` +
          `${item.description ?? ""}`,
      });
    } catch {
      // Ignore share cancellation
    }
  };

  const openReference = async (url: string) => {
    const value = url.trim();

    if (!value) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(value);

      if (!supported) {
        Alert.alert(
          "Unable to open",
          "This reference cannot be opened on this device."
        );
        return;
      }

      await Linking.openURL(value);
    } catch {
      Alert.alert(
        "Unable to open",
        "Could not open this reference."
      );
    }
  };

  const sevColor = severityColor(item.severity);
  const platColor = platformColor(item.platform);
  const statColor = statusColor(item.status);

  const arrowRotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View
      style={[
        bugCardStyles.wrapper,
        item.isAcknowledged &&
          bugCardStyles.acknowledged,
      ]}
    >
      {/* HEADER */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          bugCardStyles.headerPressable,
          pressed && {
            opacity: 0.86,
          },
        ]}
      >
        {/* Tags */}
        <View style={bugCardStyles.tagRow}>
          <View
            style={[
              bugCardStyles.pill,
              {
                backgroundColor:
                  platColor + "18",
                borderColor:
                  platColor + "55",
              },
            ]}
          >
            <Text
              style={[
                bugCardStyles.pillText,
                {
                  color: platColor,
                },
              ]}
            >
              🌐 {item.platform || "Unknown"}
            </Text>
          </View>

          <View
            style={[
              bugCardStyles.pill,
              {
                backgroundColor:
                  sevColor + "18",
                borderColor:
                  sevColor + "55",
              },
            ]}
          >
            <Text
              style={[
                bugCardStyles.pillText,
                {
                  color: sevColor,
                },
              ]}
            >
              ⚠ {item.severity || "Unknown"}
            </Text>
          </View>

          {item.bountyAmount ? (
            <View
              style={[
                bugCardStyles.pill,
                {
                  backgroundColor:
                    "#22C55E18",
                  borderColor:
                    "#22C55E55",
                },
              ]}
            >
              <Text
                style={[
                  bugCardStyles.pillText,
                  {
                    color: "#22C55E",
                  },
                ]}
              >
                💰 {formatBounty(item.bountyAmount)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title + arrow */}
        <View style={bugCardStyles.titleRow}>
          <Text style={bugCardStyles.title}>
            {item.title || "Untitled Security Report"}
          </Text>

          <Animated.View
            style={{
              transform: [
                {
                  rotate: arrowRotation,
                },
              ],
            }}
          >
            <Text style={bugCardStyles.arrow}>
              ⌄
            </Text>
          </Animated.View>
        </View>

        {/* Vulnerability info */}
        <View style={bugCardStyles.infoRow}>
          {item.vulnType ? (
            <View style={bugCardStyles.vulnTag}>
              <Text style={bugCardStyles.vulnText}>
                {item.vulnType}
              </Text>
            </View>
          ) : null}

          {item.cweId ? (
            <Text style={bugCardStyles.cwe}>
              {item.cweId}
            </Text>
          ) : null}
        </View>

        {/* Target */}
        <Text
          style={bugCardStyles.target}
          numberOfLines={2}
        >
          🎯 {item.targetSystem || "Target not specified"}
        </Text>

        {/* Bottom information */}
        <View style={bugCardStyles.bottomRow}>
          <View style={bugCardStyles.statusContainer}>
            <View
              style={[
                bugCardStyles.statusDot,
                {
                  backgroundColor: statColor,
                },
              ]}
            />

            <Text style={bugCardStyles.statusText}>
              {item.status || "Unknown"}
            </Text>
          </View>

          {item.createdAt ? (
            <Text style={bugCardStyles.date}>
              {formatDate(item.createdAt)}
            </Text>
          ) : null}
        </View>

        <Text style={bugCardStyles.expandText}>
          {expanded
            ? "Hide full report"
            : "View full report"}
        </Text>
      </Pressable>

      {/* EXPANDED */}
      {expanded ? (
        <Animated.View
          style={[
            bugCardStyles.expanded,
            {
              opacity: animation,
            },
          ]}
        >
          <View style={bugCardStyles.divider} />

          {/* OVERVIEW */}
          <SectionHeader
            emoji="📋"
            title="Overview"
          />

          <Text style={bugCardStyles.bodyText}>
            {item.description ||
              "No description provided."}
          </Text>

          {/* REPORT META */}
          <SectionHeader
            emoji="🧾"
            title="Report Information"
          />

          <View style={bugCardStyles.metaGrid}>
            <View style={bugCardStyles.metaBox}>
              <Text style={bugCardStyles.metaLabel}>
                Platform
              </Text>

              <Text style={bugCardStyles.metaValue}>
                {item.platform || "N/A"}
              </Text>
            </View>

            <View style={bugCardStyles.metaBox}>
              <Text style={bugCardStyles.metaLabel}>
                Severity
              </Text>

              <Text
                style={[
                  bugCardStyles.metaValue,
                  {
                    color: sevColor,
                  },
                ]}
              >
                {item.severity || "N/A"}
              </Text>
            </View>

            <View style={bugCardStyles.metaBox}>
              <Text style={bugCardStyles.metaLabel}>
                Status
              </Text>

              <Text
                style={[
                  bugCardStyles.metaValue,
                  {
                    color: statColor,
                  },
                ]}
              >
                {item.status || "N/A"}
              </Text>
            </View>

            <View style={bugCardStyles.metaBox}>
              <Text style={bugCardStyles.metaLabel}>
                Reported
              </Text>

              <Text style={bugCardStyles.metaValue}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          {/* CVSS */}
          {typeof item.cvssScore === "number" &&
          item.cvssScore > 0 ? (
            <>
              <SectionHeader
                emoji="📊"
                title="CVSS Assessment"
              />

              <CVSSBadge
                score={item.cvssScore}
                vector={item.cvssVector}
              />
            </>
          ) : null}

          {/* CWE */}
          {item.cweId ? (
            <>
              <SectionHeader
                emoji="🧩"
                title="CWE Classification"
              />

              <View
                style={bugCardStyles.cweCard}
              >
                <Text
                  style={bugCardStyles.cweId}
                >
                  {item.cweId}
                </Text>

                {item.cweTitle ? (
                  <Text
                    style={bugCardStyles.cweTitle}
                  >
                    {item.cweTitle}
                  </Text>
                ) : null}
              </View>
            </>
          ) : null}

          {/* STEPS */}
          {item.stepsToReproduce &&
          item.stepsToReproduce.length > 0 ? (
            <>
              <SectionHeader
                emoji="🔬"
                title="Steps to Reproduce"
              />

              {item.stepsToReproduce.map(
                (step, index) => (
                  <View
                    key={`${item._id}-step-${index}`}
                    style={bugCardStyles.stepRow}
                  >
                    <View
                      style={[
                        bugCardStyles.stepNumber,
                        {
                          backgroundColor:
                            Colors.primary ??
                            "#C62828",
                        },
                      ]}
                    >
                      <Text
                        style={
                          bugCardStyles.stepNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      style={bugCardStyles.stepText}
                    >
                      {step}
                    </Text>
                  </View>
                )
              )}
            </>
          ) : null}

          {/* POC */}
          {item.proofOfConcept ? (
            <>
              <SectionHeader
                emoji="💻"
                title="Proof of Concept"
              />

              <CodeBlock
                value={item.proofOfConcept}
              />
            </>
          ) : null}

          {/* IMPACT */}
          {item.impact ? (
            <>
              <SectionHeader
                emoji="🔥"
                title="Security Impact"
              />

              <View
                style={bugCardStyles.impactCard}
              >
                <Text
                  style={bugCardStyles.impactText}
                >
                  {item.impact}
                </Text>
              </View>
            </>
          ) : null}

          {/* REMEDIATION */}
          {item.remediation ? (
            <>
              <SectionHeader
                emoji="🛡️"
                title="Remediation"
              />

              <View
                style={bugCardStyles.remediationCard}
              >
                <Text
                  style={
                    bugCardStyles.remediationText
                  }
                >
                  {item.remediation}
                </Text>
              </View>
            </>
          ) : null}

          {/* BOUNTY */}
          {item.bountyAmount ? (
            <>
              <SectionHeader
                emoji="💰"
                title="Bounty"
              />

              <View
                style={bugCardStyles.bountyCard}
              >
                <Text
                  style={bugCardStyles.bountyLabel}
                >
                  Reward
                </Text>

                <Text
                  style={bugCardStyles.bountyValue}
                >
                  {formatBounty(
                    item.bountyAmount
                  )}
                </Text>
              </View>
            </>
          ) : null}

          {/* TIMELINE */}
          {item.timeline &&
          item.timeline.length > 0 ? (
            <>
              <SectionHeader
                emoji="📅"
                title="Disclosure Timeline"
              />

              <View
                style={bugCardStyles.timeline}
              >
                {item.timeline.map(
                  (entry, index) => {
                    const last =
                      index ===
                      item.timeline!.length - 1;

                    return (
                      <View
                        key={`${item._id}-timeline-${index}`}
                        style={
                          bugCardStyles.timelineRow
                        }
                      >
                        <View
                          style={
                            bugCardStyles.timelineRail
                          }
                        >
                          <View
                            style={[
                              bugCardStyles.timelineDot,
                              last && {
                                backgroundColor:
                                  "#22C55E",
                              },
                            ]}
                          />

                          {!last ? (
                            <View
                              style={
                                bugCardStyles.timelineLine
                              }
                            />
                          ) : null}
                        </View>

                        <View
                          style={
                            bugCardStyles.timelineContent
                          }
                        >
                          <Text
                            style={
                              bugCardStyles.timelineDate
                            }
                          >
                            {entry.date}
                          </Text>

                          <Text
                            style={
                              bugCardStyles.timelineEvent
                            }
                          >
                            {entry.event}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* REFERENCES */}
          {item.references &&
          item.references.length > 0 ? (
            <>
              <SectionHeader
                emoji="🔗"
                title="References"
              />

              {item.references.map(
                (reference, index) => (
                  <TouchableOpacity
                    key={`${item._id}-ref-${index}`}
                    onPress={() =>
                      openReference(reference)
                    }
                    activeOpacity={0.7}
                    style={
                      bugCardStyles.referenceRow
                    }
                  >
                    <Text
                      style={
                        bugCardStyles.referenceBullet
                      }
                    >
                      ↗
                    </Text>

                    <Text
                      style={
                        bugCardStyles.referenceText
                      }
                      numberOfLines={2}
                    >
                      {reference}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </>
          ) : null}

          {/* DATES */}
          <SectionHeader
            emoji="🕒"
            title="Report Dates"
          />

          <View style={bugCardStyles.dateCard}>
            <View>
              <Text
                style={bugCardStyles.metaLabel}
              >
                Created
              </Text>

              <Text
                style={bugCardStyles.metaValue}
              >
                {formatDateTime(item.createdAt)}
              </Text>
            </View>

            {item.updatedAt ? (
              <View style={{ marginTop: 10 }}>
                <Text
                  style={bugCardStyles.metaLabel}
                >
                  Last Updated
                </Text>

                <Text
                  style={bugCardStyles.metaValue}
                >
                  {formatDateTime(
                    item.updatedAt
                  )}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ACTIONS */}
          <View style={bugCardStyles.actions}>
            <TouchableOpacity
              style={bugCardStyles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text
                style={
                  bugCardStyles.shareButtonText
                }
              >
                📲 Share Report
              </Text>
            </TouchableOpacity>

            {isOwn &&
            !item.isAcknowledged ? (
              <TouchableOpacity
                style={
                  bugCardStyles.acknowledgeButton
                }
                onPress={() =>
                  onAcknowledge(item._id)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    bugCardStyles.acknowledgeText
                  }
                >
                  ✅ Mark as Read
                </Text>
              </TouchableOpacity>
            ) : null}

            {item.isAcknowledged ? (
              <View
                style={
                  bugCardStyles.acknowledgedButton
                }
              >
                <Text
                  style={
                    bugCardStyles.acknowledgedText
                  }
                >
                  ✓ Acknowledged
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUG CARD STYLES
// ─────────────────────────────────────────────────────────────────────────────

const bugCardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor:
      Colors.surface ?? "#141824",
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      Colors.border ?? "#272B38",
    overflow: "hidden",
  },

  acknowledged: {
    borderColor: "#22C55E55",
  },

  headerPressable: {
    padding: 15,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  pillText: {
    fontSize: 10,
    fontWeight: "800",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  title: {
    flex: 1,
    color: Colors.text ?? "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    paddingRight: 10,
  },

  arrow: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "900",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8,
  },

  vulnTag: {
    backgroundColor: "#A78BFA18",
    borderColor: "#A78BFA55",
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  vulnText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
  },

  cwe: {
    color: Colors.textSecondary ?? "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  target: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 9,
    lineHeight: 18,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  statusText: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  date: {
    color:
      Colors.textSecondary ?? "#64748B",
    fontSize: 10,
  },

  expandText: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 9,
  },

  expanded: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },

  divider: {
    height: 1,
    backgroundColor:
      Colors.border ?? "#272B38",
  },

  bodyText: {
    color:
      Colors.textSecondary ?? "#A1A1AA",
    fontSize: 13,
    lineHeight: 22,
  },

  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metaBox: {
    width: "48%",
    backgroundColor:
      "rgba(255,255,255,0.035)",
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  metaLabel: {
    color:
      Colors.textSecondary ?? "#64748B",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  metaValue: {
    color: Colors.text ?? "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  cweCard: {
    backgroundColor: "#A78BFA10",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#A78BFA",
  },

  cweId: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "900",
  },

  cweTitle: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  stepText: {
    flex: 1,
    color:
      Colors.textSecondary ?? "#A1A1AA",
    fontSize: 13,
    lineHeight: 20,
  },

  impactCard: {
    backgroundColor: "#EF444410",
    borderRadius: 12,
    padding: 13,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },

  impactText: {
    color:
      Colors.textSecondary ?? "#A1A1AA",
    fontSize: 13,
    lineHeight: 21,
  },

  remediationCard: {
    backgroundColor: "#22C55E10",
    borderRadius: 12,
    padding: 13,
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },

  remediationText: {
    color:
      Colors.textSecondary ?? "#A1A1AA",
    fontSize: 13,
    lineHeight: 21,
  },

  bountyCard: {
    backgroundColor: "#22C55E10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#22C55E30",
    alignItems: "center",
  },

  bountyLabel: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  bountyValue: {
    color: "#22C55E",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },

  timeline: {
    paddingLeft: 3,
  },

  timelineRow: {
    flexDirection: "row",
  },

  timelineRail: {
    width: 20,
    alignItems: "center",
  },

  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      Colors.primary ?? "#EF4444",
    marginTop: 3,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor:
      Colors.border ?? "#272B38",
    marginTop: 3,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 5,
    paddingBottom: 15,
  },

  timelineDate: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 10,
    fontWeight: "800",
  },

  timelineEvent: {
    color:
      Colors.textSecondary ?? "#A1A1AA",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 2,
  },

  referenceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor:
      "rgba(255,255,255,0.025)",
    borderRadius: 9,
    marginBottom: 5,
  },

  referenceBullet: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 15,
    fontWeight: "900",
    marginRight: 8,
  },

  referenceText: {
    flex: 1,
    color: "#60A5FA",
    fontSize: 12,
    lineHeight: 18,
  },

  dateCard: {
    backgroundColor:
      "rgba(255,255,255,0.035)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },

  shareButton: {
    flexGrow: 1,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor:
      "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.09)",
  },

  shareButtonText: {
    color: Colors.text ?? "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  acknowledgeButton: {
    flexGrow: 1,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: "#22C55E10",
    borderWidth: 1,
    borderColor: "#22C55E40",
  },

  acknowledgeText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "800",
  },

  acknowledgedButton: {
    flexGrow: 1,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: "#22C55E08",
    borderWidth: 1,
    borderColor: "#22C55E25",
  },

  acknowledgedText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "800",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function BugReportsScreen() {
  const { width } = useWindowDimensions();

  const [reports, setReports] =
    useState<BugReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState("All");

  const [error, setError] =
    useState<string | null>(null);

  const isTablet = width >= 600;

  const loadUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();

      setCurrentUserId(
        user?._id ??
          user?.id ??
          null
      );
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const fetchReports = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response =
          await getBugReports();

        if (
          response?.success &&
          Array.isArray(response.data)
        ) {
          setReports(response.data);
        } else {
          setReports([]);
          setError(
            "No valid report data was returned."
          );
        }
      } catch (err: any) {
        console.log(
          "Bug reports error:",
          err
        );

        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Unable to load bug reports."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadUser();
    fetchReports();
  }, [loadUser, fetchReports]);

  const handleAcknowledge = useCallback(
    (id: string) => {
      Alert.alert(
        "Mark Report as Read",
        "Are you sure you want to acknowledge this report?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Acknowledge",
            onPress: async () => {
              try {
                await acknowledgeBugReport(
                  id
                );

                setReports((previous) =>
                  previous.map((report) =>
                    report._id === id
                      ? {
                          ...report,
                          isAcknowledged: true,
                        }
                      : report
                  )
                );
              } catch (err: any) {
                Alert.alert(
                  "Error",
                  err?.response?.data
                    ?.message ??
                    err?.message ??
                    "Could not acknowledge report."
                );
              }
            },
          },
        ]
      );
    },
    []
  );

  const filteredReports =
    filter === "All"
      ? reports
      : reports.filter(
          (report) =>
            normalize(report.severity) ===
            normalize(filter)
        );

  const criticalCount =
    reports.filter(
      (report) =>
        normalize(report.severity) ===
        "critical"
    ).length;

  const highCount =
    reports.filter(
      (report) =>
        normalize(report.severity) ===
        "high"
    ).length;

  const totalBounty =
    reports.reduce(
      (total, report) =>
        total +
        parseBounty(report.bountyAmount),
      0
    );

  if (loading) {
    return (
      <SafeAreaView
        style={screenStyles.loader}
      >
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text
          style={screenStyles.loadingText}
        >
          Loading security reports...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={screenStyles.container}
    >
      {/* HEADER */}
      <View
        style={[
          screenStyles.header,
          isTablet &&
            screenStyles.headerTablet,
        ]}
      >
        <View style={screenStyles.headerText}>
          <View
            style={screenStyles.titleRow}
          >
            <Text
              style={screenStyles.headerTitle}
            >
              Bug Reports
            </Text>

            <View
              style={screenStyles.liveBadge}
            >
              <View
                style={screenStyles.liveDot}
              />

              <Text
                style={screenStyles.liveText}
              >
                LIVE
              </Text>
            </View>
          </View>

          <Text
            style={screenStyles.headerSub}
          >
            Security research, vulnerability
            disclosures and technical writeups
          </Text>
        </View>

        <View
          style={screenStyles.headerIcon}
        >
          <Text
            style={screenStyles.headerEmoji}
          >
            🐞
          </Text>
        </View>
      </View>

      {/* ERROR */}
      {error ? (
        <View style={screenStyles.errorBox}>
          <Text style={screenStyles.errorIcon}>
            ⚠️
          </Text>

          <View style={{ flex: 1 }}>
            <Text
              style={screenStyles.errorTitle}
            >
              Unable to load reports
            </Text>

            <Text
              style={screenStyles.errorText}
            >
              {error}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => fetchReports()}
          >
            <Text
              style={screenStyles.retryText}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* STATS */}
      <View
        style={[
          screenStyles.stats,
          isTablet &&
            screenStyles.statsTablet,
        ]}
      >
        <View style={screenStyles.stat}>
          <Text
            style={screenStyles.statNumber}
          >
            {reports.length}
          </Text>

          <Text
            style={screenStyles.statLabel}
          >
            Reports
          </Text>
        </View>

        <View
          style={screenStyles.statDivider}
        />

        <View style={screenStyles.stat}>
          <Text
            style={[
              screenStyles.statNumber,
              {
                color: "#EF4444",
              },
            ]}
          >
            {criticalCount}
          </Text>

          <Text
            style={screenStyles.statLabel}
          >
            Critical
          </Text>
        </View>

        <View
          style={screenStyles.statDivider}
        />

        <View style={screenStyles.stat}>
          <Text
            style={[
              screenStyles.statNumber,
              {
                color: "#F97316",
              },
            ]}
          >
            {highCount}
          </Text>

          <Text
            style={screenStyles.statLabel}
          >
            High
          </Text>
        </View>

        <View
          style={screenStyles.statDivider}
        />

        <View style={screenStyles.stat}>
          <Text
            style={[
              screenStyles.statNumber,
              {
                color: "#22C55E",
              },
            ]}
          >
            $
            {totalBounty.toLocaleString(
              "en-US",
              {
                maximumFractionDigits: 2,
              }
            )}
          </Text>

          <Text
            style={screenStyles.statLabel}
          >
            Bounty
          </Text>
        </View>
      </View>

      {/* FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          screenStyles.filterRow
        }
        style={screenStyles.filterScroll}
      >
        {FILTERS.map((item) => {
          const active =
            filter === item;

          const color =
            item === "All"
              ? Colors.primary ?? "#EF4444"
              : severityColor(item);

          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() =>
                setFilter(item)
              }
              style={[
                screenStyles.filterButton,
                active && {
                  backgroundColor:
                    color,
                  borderColor: color,
                },
              ]}
            >
              <Text
                style={[
                  screenStyles.filterText,
                  active && {
                    color: "#FFFFFF",
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LIST */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item, index) =>
          item._id ||
          `report-${index}`
        }
        renderItem={({ item }) => (
          <BugCard
            item={item}
            isOwn={
              ownerIdOf(item) ===
              currentUserId
            }
            onAcknowledge={
              handleAcknowledge
            }
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          screenStyles.list,
          isTablet &&
            screenStyles.listTablet,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              fetchReports(true)
            }
            tintColor={
              Colors.primary
            }
            colors={[
              Colors.primary,
            ]}
          />
        }
        ListEmptyComponent={
          <View
            style={screenStyles.empty}
          >
            <View
              style={screenStyles.emptyIcon}
            >
              <Text
                style={screenStyles.emptyEmoji}
              >
                🔍
              </Text>
            </View>

            <Text
              style={screenStyles.emptyTitle}
            >
              No reports found
            </Text>

            <Text
              style={screenStyles.emptyText}
            >
              {filter === "All"
                ? "There are no bug bounty reports available yet."
                : `There are no ${filter.toLowerCase()} severity reports.`}
            </Text>

            {filter !== "All" ? (
              <TouchableOpacity
                style={
                  screenStyles.clearFilter
                }
                onPress={() =>
                  setFilter("All")
                }
              >
                <Text
                  style={
                    screenStyles.clearFilterText
                  }
                >
                  View All Reports
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN STYLES
// ─────────────────────────────────────────────────────────────────────────────

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      Colors.background,
  },

  loadingText: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 12,
    marginTop: 12,
  },

  header: {
    paddingHorizontal:
      Spacing.screen,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTablet: {
    paddingHorizontal: 28,
  },

  headerText: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  headerTitle: {
    color: Colors.text ?? "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#22C55E12",
    borderWidth: 1,
    borderColor: "#22C55E35",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },

  liveText: {
    color: "#22C55E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  headerSub: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 480,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor:
      (Colors.primary ?? "#EF4444") +
      "15",
    borderWidth: 1,
    borderColor:
      (Colors.primary ?? "#EF4444") +
      "35",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  headerEmoji: {
    fontSize: 24,
  },

  errorBox: {
    marginHorizontal:
      Spacing.screen,
    marginBottom: 10,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#EF444410",
    borderWidth: 1,
    borderColor: "#EF444435",
    flexDirection: "row",
    alignItems: "center",
  },

  errorIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  errorTitle: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
  },

  errorText: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },

  retryText: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 8,
  },

  stats: {
    marginHorizontal:
      Spacing.screen,
    marginBottom: 10,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor:
      Colors.surface ?? "#141824",
    borderWidth: 1,
    borderColor:
      Colors.border ?? "#272B38",
    flexDirection: "row",
    alignItems: "center",
  },

  statsTablet: {
    marginHorizontal: 28,
  },

  stat: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },

  statNumber: {
    color: Colors.text ?? "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  statLabel: {
    color:
      Colors.textSecondary ?? "#64748B",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor:
      Colors.border ?? "#272B38",
  },

  filterScroll: {
    maxHeight: 43,
    marginBottom: 7,
  },

  filterRow: {
    paddingHorizontal:
      Spacing.screen,
    alignItems: "center",
    gap: 7,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor:
      Colors.surface ?? "#141824",
    borderWidth: 1,
    borderColor:
      Colors.border ?? "#272B38",
  },

  filterText: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },

  list: {
    paddingHorizontal:
      Spacing.screen,
    paddingTop: 5,
    paddingBottom: 50,
  },

  listTablet: {
    maxWidth: 850,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  empty: {
    alignItems: "center",
    paddingTop: 65,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.07)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  emptyEmoji: {
    fontSize: 30,
  },

  emptyTitle: {
    color: Colors.text ?? "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    color:
      Colors.textSecondary ?? "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 5,
  },

  clearFilter: {
    marginTop: 15,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor:
      (Colors.primary ?? "#EF4444") +
      "15",
    borderWidth: 1,
    borderColor:
      (Colors.primary ?? "#EF4444") +
      "35",
  },

  clearFilterText: {
    color: Colors.primary ?? "#EF4444",
    fontSize: 11,
    fontWeight: "900",
  },
});