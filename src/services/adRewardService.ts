/**
 * adRewardService.ts — SoloSecurities
 *
 * Real AdMob impression-level revenue reporting.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW ADMOB REVENUE WORKS IN THIS SDK (v16.3.4)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The react-native-google-mobile-ads native bridge fires a paid event for
 * every ad impression that generates revenue. The JS payload is:
 *
 *   PaidEvent {
 *     currency : string          — ISO 4217, e.g. "USD"
 *     precision: RevenuePrecisions — 0=UNKNOWN 1=ESTIMATED 2=PUBLISHER_PROVIDED 3=PRECISE
 *     value    : number          — revenue in the currency unit (NOT micros)
 *                                  e.g. 0.000042 for $0.000042 USD
 *   }
 *
 * The native SDK reports in micro-units; the RN bridge divides by 1_000_000
 * before delivering the JS event. We convert back to integer micro-units here
 * for safe integer arithmetic on the backend.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DOES NOT DO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ✗  No fixed ₹0.10 per video
 *  ✗  No fixed ₹0.01 per app open
 *  ✗  No fixed ₹1 per 100 banners
 *  ✗  No streak bonus
 *  ✗  No local balance
 *  ✗  No local withdrawal
 *
 * The backend (adRevenue.service.ts) is the sole source of truth for all
 * balances. This file only:
 *
 *  1. Normalises the SDK PaidEvent into a typed request payload
 *  2. Generates a client-side idempotency key (eventId)
 *  3. Submits the event to POST /api/ad-revenue/events using the existing
 *     authenticated API client (JWT attached automatically)
 *  4. Queues events locally when offline and retries when connectivity returns
 *  5. Exposes getWalletSummary() / getWalletTransactions() so screens can
 *     fetch live data from the backend instead of reading a local balance
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE QUEUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * If the network request fails, the event is saved to SecureStore under the
 * key "solosec_ad_event_queue". A drain attempt is made on the next event
 * submission. The user cannot edit queued events; they are stored as-is.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SDK TYPE REFERENCE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   node_modules/react-native-google-mobile-ads/src/types/PaidEventListener.ts
 *   node_modules/react-native-google-mobile-ads/src/common/constants.ts
 *   node_modules/react-native-google-mobile-ads/src/AdEventType.ts
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiPost, apiGet } from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// SDK types (mirrored here so we don't import from node_modules in app code)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors RevenuePrecisions from the SDK.
 * react-native-google-mobile-ads/src/common/constants.ts
 */
export enum RevenuePrecisions {
  UNKNOWN            = 0,
  ESTIMATED          = 1,
  PUBLISHER_PROVIDED = 2,
  PRECISE            = 3,
}

/**
 * Mirrors PaidEvent from the SDK.
 * react-native-google-mobile-ads/src/types/PaidEventListener.ts
 *
 * IMPORTANT: `value` is in the currency unit (float), NOT in micro-units.
 * The native bridge already divides by 1_000_000.
 * Example: value=0.000042, currency="USD" → $0.000042
 */
export interface SdkPaidEvent {
  currency : string;
  precision: RevenuePrecisions;
  value    : number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ad format labels
// ─────────────────────────────────────────────────────────────────────────────

export type AdFormat =
  | "banner"
  | "interstitial"
  | "rewarded"
  | "rewarded_interstitial"
  | "app_open"
  | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// Known production AdMob unit IDs
// ─────────────────────────────────────────────────────────────────────────────

export const AD_UNIT_IDS = {
  BANNER       : "ca-app-pub-4705207925908028/4786224093",
  REWARDED     : "ca-app-pub-4705207925908028/4722420545",
  INTERSTITIAL : "ca-app-pub-4705207925908028/8366152086",
  APP_OPEN     : "ca-app-pub-4705207925908028/4468848681",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Offline queue
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY = "solosec_ad_event_queue";
const MAX_QUEUE_SIZE   = 100;  // never store more than 100 unsent events
const MAX_RETRY_COUNT  = 5;

interface QueuedEvent {
  payload    : AdRevenuePayload;
  queuedAt   : string;  // ISO
  retryCount : number;
}

async function readQueue(): Promise<QueuedEvent[]> {
  try {
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedEvent[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedEvent[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore — storage failure must never crash the app */ }
}

async function enqueue(payload: AdRevenuePayload): Promise<void> {
  const queue = await readQueue();
  if (queue.length >= MAX_QUEUE_SIZE) {
    // Drop the oldest entry to make room
    queue.shift();
  }
  queue.push({ payload, queuedAt: new Date().toISOString(), retryCount: 0 });
  await writeQueue(queue);
}

/**
 * Try to send all queued events.
 * Called automatically before each new submission so events drain over time.
 * Silent — never throws, never blocks the caller.
 */
async function drainQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedEvent[] = [];

  for (const item of queue) {
    if (item.retryCount >= MAX_RETRY_COUNT) {
      // Give up — drop silently
      continue;
    }
    try {
      await apiPost("/ad-revenue/events", item.payload);
      // Successfully sent — do not re-add to remaining
    } catch {
      item.retryCount += 1;
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload type sent to POST /api/ad-revenue/events
// ─────────────────────────────────────────────────────────────────────────────

export interface AdRevenuePayload {
  /** Client-generated idempotency key */
  eventId    : string;
  adUnitId   : string;
  adFormat   : AdFormat;
  /**
   * Revenue in currency unit as delivered by the SDK bridge.
   * Backend converts to micro-units for storage.
   * Example: 0.000042 (USD)
   */
  value      : number;
  currencyCode: string;
  /** RevenuePrecisions enum value (0–3) */
  precision  : RevenuePrecisions;
  adSource  ?: string | null;
  adSourceId?: string | null;
  adSourceInstanceName?: string | null;
  responseId?: string | null;
  platform   : "android" | "ios" | "unknown";
  appVersion?: string | null;
  /** ISO 8601 timestamp from the device when the paid event fired */
  occurredAt : string;
  placement ?: string | null;
  sessionId ?: string | null;
}

export interface AdRevenueResult {
  accepted      : boolean;
  duplicate     : boolean;
  eventId       : string;
  status        : "PENDING" | "REJECTED";
  currencyCode  : string;
  value         : number;    // original SDK float value
  microValue    : number;    // micro-units as stored by backend
  userShareMicro: number;
  userSharePercent: number;
  message?      : string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event ID generation
// ─────────────────────────────────────────────────────────────────────────────

function generateEventId(): string {
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `admobrev_${ts}_${rnd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform detection — uses Platform.OS, never navigator.product
// ─────────────────────────────────────────────────────────────────────────────

function currentPlatform(): "android" | "ios" | "unknown" {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios")     return "ios";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: submit a paid event from the SDK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called from every ad component's paid-event handler.
 *
 * Usage — BannerAd (prop-based):
 *
 *   <BannerAd
 *     unitId={AD_UNIT_IDS.BANNER}
 *     size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
 *     onPaid={(event) =>
 *       submitAdRevenueEvent(event, AD_UNIT_IDS.BANNER, "banner", "home_screen_banner")
 *     }
 *   />
 *
 * Usage — InterstitialAd / RewardedAd / AppOpenAd (event-listener):
 *
 *   ad.addAdEventListener(AdEventType.PAID, (payload) => {
 *     const paidEvent = payload as unknown as SdkPaidEvent;
 *     submitAdRevenueEvent(paidEvent, AD_UNIT_IDS.INTERSTITIAL, "interstitial", "quiz_transition");
 *   });
 *
 * @param sdkEvent  The PaidEvent object delivered by the SDK bridge
 * @param adUnitId  The AdMob unit ID for this ad
 * @param format    Human-readable ad format label
 * @param placement Optional label identifying where in the app the ad appeared
 * @param sessionId Optional session/screen identifier
 */
export async function submitAdRevenueEvent(
  sdkEvent  : SdkPaidEvent,
  adUnitId  : string,
  format    : AdFormat,
  placement?: string,
  sessionId?: string,
): Promise<AdRevenueResult> {

  // Basic guard — zero-value events are valid (e.g. unfilled impressions)
  // but negative values indicate a problem.
  if (!Number.isFinite(sdkEvent.value) || sdkEvent.value < 0) {
    return {
      accepted: false, duplicate: false,
      eventId: "", status: "REJECTED",
      currencyCode: sdkEvent.currency ?? "USD",
      value: 0, microValue: 0,
      userShareMicro: 0, userSharePercent: 0,
      message: "Invalid paid event value.",
    };
  }

  const payload: AdRevenuePayload = {
    eventId    : generateEventId(),
    adUnitId,
    adFormat   : format,
    value      : sdkEvent.value,
    currencyCode: (sdkEvent.currency ?? "USD").toUpperCase(),
    precision  : sdkEvent.precision ?? RevenuePrecisions.UNKNOWN,
    platform   : currentPlatform(),
    occurredAt : new Date().toISOString(),
    placement  : placement ?? null,
    sessionId  : sessionId ?? null,
  };

  // Drain any previously queued events first (fire-and-forget)
  drainQueue().catch(() => {});

  try {
    const response = await apiPost("/ad-revenue/events", payload);

    return {
      accepted         : response.accepted  ?? true,
      duplicate        : response.duplicate ?? false,
      eventId          : response.eventId   ?? payload.eventId,
      status           : response.status    ?? "PENDING",
      currencyCode     : response.currencyCode ?? payload.currencyCode,
      value            : payload.value,
      microValue       : response.microValue    ?? 0,
      userShareMicro   : response.userShareMicro ?? 0,
      userSharePercent : response.userSharePercent ?? 0,
      message          : response.message,
    };
  } catch {
    // Network failure — queue for retry
    await enqueue(payload);

    return {
      accepted: true,  // accepted locally for retry
      duplicate: false,
      eventId: payload.eventId,
      status: "PENDING",
      currencyCode: payload.currencyCode,
      value: payload.value,
      microValue: 0,
      userShareMicro: 0,
      userSharePercent: 0,
      message: "Queued offline. Will submit when connectivity returns.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet — always fetched from the backend, never from local state
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletSummary {
  currencyCode             : string;
  /** Revenue recorded by backend, not yet settled */
  pendingMicroValue        : number;
  /** Settled revenue available for withdrawal */
  availableMicroValue      : number;
  lifetimeEarnedMicroValue : number;
  lifetimeWithdrawnMicroValue: number;
  /** Convenience floats (micro / 1_000_000) */
  pendingValue             : number;
  availableValue           : number;
  lifetimeEarnedValue      : number;
  lifetimeWithdrawnValue   : number;
  /** Revenue share % the user receives */
  userSharePercent         : number;
}

export interface WalletTransaction {
  _id              : string;
  type             : string;
  status           : string;
  microValue       : number;
  currencyCode     : string;
  description      : string;
  balanceAfterPendingMicro   : number;
  balanceAfterAvailableMicro : number;
  createdAt        : string;
}

const EMPTY_WALLET: WalletSummary = {
  currencyCode: "USD",
  pendingMicroValue: 0,
  availableMicroValue: 0,
  lifetimeEarnedMicroValue: 0,
  lifetimeWithdrawnMicroValue: 0,
  pendingValue: 0,
  availableValue: 0,
  lifetimeEarnedValue: 0,
  lifetimeWithdrawnValue: 0,
  userSharePercent: 30,
};

/**
 * Fetch the user's wallet from the backend.
 * Returns an empty wallet on failure so the UI never crashes.
 */
export async function getWalletSummary(): Promise<WalletSummary> {
  try {
    const res = await apiGet("/ad-revenue/wallet");
    const d   = res.data ?? {};

    // Also fetch the current revenue share % for display
    let userSharePercent = 30;
    try {
      const cfg = await apiGet("/ad-revenue/config");
      userSharePercent = cfg.data?.userSharePercent ?? 30;
    } catch { /* use default */ }

    return {
      currencyCode             : d.currencyCode              ?? "USD",
      pendingMicroValue        : d.pendingMicroValue         ?? 0,
      availableMicroValue      : d.availableMicroValue       ?? 0,
      lifetimeEarnedMicroValue : d.lifetimeEarnedMicroValue  ?? 0,
      lifetimeWithdrawnMicroValue: d.lifetimeWithdrawnMicroValue ?? 0,
      pendingValue             : d.pendingValue              ?? 0,
      availableValue           : d.availableValue            ?? 0,
      lifetimeEarnedValue      : d.lifetimeEarnedValue       ?? 0,
      lifetimeWithdrawnValue   : d.lifetimeWithdrawnValue    ?? 0,
      userSharePercent,
    };
  } catch {
    return { ...EMPTY_WALLET };
  }
}

/**
 * Fetch paginated transaction history from the backend.
 */
export async function getWalletTransactions(
  limit  = 50,
  offset = 0,
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  try {
    const res = await apiGet(
      `/ad-revenue/transactions?limit=${limit}&offset=${offset}`,
    );
    return {
      transactions: res.transactions ?? [],
      total        : res.total        ?? 0,
    };
  } catch {
    return { transactions: [], total: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal — submitted to backend, never deducted locally
// ─────────────────────────────────────────────────────────────────────────────

export interface WithdrawalInput {
  /** Float amount in the wallet's currency */
  amount                  : number;
  currencyCode            : string;
  paymentMethod           : "UPI" | "BANK_TRANSFER" | "OTHER";
  /** UPI ID, bank reference, etc. */
  paymentDetailsReference : string;
}

export interface WithdrawalResult {
  success        : boolean;
  message        : string;
  withdrawalId  ?: string;
  newAvailableMicro?: number;
}

/**
 * Request a withdrawal from the backend.
 * The backend validates balance, deducts from available, and records the request.
 */
export async function requestWithdrawal(
  input: WithdrawalInput,
): Promise<WithdrawalResult> {
  try {
    const res = await apiPost("/ad-revenue/withdraw", {
      amount                  : input.amount,
      currencyCode            : input.currencyCode,
      paymentMethod           : input.paymentMethod,
      paymentDetailsReference : input.paymentDetailsReference,
    });
    return {
      success           : res.success ?? false,
      message           : res.message ?? "Unknown response from server.",
      withdrawalId      : res.withdrawalId,
      newAvailableMicro : res.newAvailableMicro,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message ?? "Network error. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue share config — for UI display only
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueShareConfig {
  userSharePercent     : number;
  platformSharePercent : number;
  effectiveFrom       ?: string;
}

export async function getRevenueShareConfig(): Promise<RevenueShareConfig> {
  try {
    const res = await apiGet("/ad-revenue/config");
    return {
      userSharePercent    : res.data?.userSharePercent     ?? 30,
      platformSharePercent: res.data?.platformSharePercent ?? 70,
      effectiveFrom       : res.data?.effectiveFrom,
    };
  } catch {
    return { userSharePercent: 30, platformSharePercent: 70 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Format helpers — display only, never for accounting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format micro-units as a human-readable currency string.
 * Uses Intl.NumberFormat — never performs a USD→INR conversion.
 *
 * Example: formatMicros(42, "USD") → "$0.000042"
 */
export function formatMicros(microValue: number, currencyCode: string): string {
  const value = microValue / 1_000_000;
  try {
    return new Intl.NumberFormat(undefined, {
      style                : "currency",
      currency             : currencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  } catch {
    return `${currencyCode.toUpperCase()} ${value.toFixed(6)}`;
  }
}

/**
 * Format a raw SDK float value as currency.
 *
 * Example: formatSdkValue(0.000042, "USD") → "$0.000042"
 */
export function formatSdkValue(value: number, currencyCode: string): string {
  return formatMicros(Math.round(value * 1_000_000), currencyCode);
}
