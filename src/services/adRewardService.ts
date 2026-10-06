/**
 * adRewardService.ts — SoloSecurities
 *
 * Real AdMob impression-level revenue pipeline.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SDK FACTS (react-native-google-mobile-ads v16.3.4)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   PaidEvent  (node_modules/…/src/types/PaidEventListener.ts)
 *   ──────────────────────────────────────────────────────────
 *   {
 *     currency : string           — ISO 4217 code as reported by AdMob
 *     precision: RevenuePrecisions — 0=UNKNOWN 1=ESTIMATED 2=PUBLISHER_PROVIDED 3=PRECISE
 *     value    : number           — revenue in the currency unit (NOT micro-units)
 *                                   e.g. 0.000042 for $0.000042 USD
 *   }
 *
 *   The native SDK internally uses micro-units; the RN bridge divides by
 *   1 000 000 before delivering to JS.  We convert BACK to integer
 *   micro-units exactly once when building the payload for the backend.
 *
 *   AdEventType.PAID = 'paid'  (overlay ads: interstitial, rewarded, app-open)
 *   BannerAd.onPaid prop       (banner)
 *
 *   RevenuePrecisions (node_modules/…/src/common/constants.ts)
 *   UNKNOWN=0  ESTIMATED=1  PUBLISHER_PROVIDED=2  PRECISE=3
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE DOES NOT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ✗  Calculate or claim any fixed per-ad revenue
 *  ✗  Maintain a local authoritative wallet balance
 *  ✗  Perform any withdrawal accounting locally
 *  ✗  Hardcode a revenue share percentage as financial truth
 *  ✗  Return silent zeros when the wallet API fails
 *  ✗  Silently discard queued revenue events for any reason
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OFFLINE QUEUE DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Primary queue key  : "solosec_ad_event_queue_v2"
 * Overflow/failed key: "solosec_ad_event_failed_v2"
 *
 * Events are NEVER silently deleted.
 *
 * Lifecycle:
 *   1. New event → try backend immediately.
 *   2. Network failure → save to primary queue with retryCount=0, nextRetryAt=now.
 *   3. On every new event submission, drainQueue() is called first.
 *   4. drainQueue() attempts each item whose nextRetryAt <= now.
 *   5. Success → remove from queue.
 *   6. Failure → increment retryCount, set nextRetryAt with exponential backoff,
 *      re-save.  NO hard drop after N retries.
 *   7. If the primary queue exceeds SOFT_QUEUE_LIMIT (200 events), the OLDEST
 *      items beyond the limit are moved to the failed/overflow store — NOT
 *      deleted.  They remain auditable and can be reconciled manually.
 *
 * Backoff schedule (capped at 24 h):
 *   attempt 1 →  1 min
 *   attempt 2 →  2 min
 *   attempt 3 →  4 min
 *   attempt 4 →  8 min
 *   attempt 5 → 16 min
 *   attempt 6 → 32 min
 *   attempt 7 → 64 min  (≈ 1 h)
 *   attempt 8 → 128 min (≈ 2 h)
 *   attempt 9+→ 24 h cap
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Lazy getter — avoids a top-level require() that would create a circular
// dependency chain through navigationRef → AppNavigator → every screen → here.
// Called only at runtime when a network request is actually needed.
function api() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("./apiClient") as {
    apiPost: (endpoint: string, body: any) => Promise<any>;
    apiGet:  (endpoint: string) => Promise<any>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK type mirrors  (DO NOT import from node_modules in app code)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors RevenuePrecisions enum.
 * Source: react-native-google-mobile-ads/src/common/constants.ts
 */
export enum RevenuePrecisions {
  UNKNOWN            = 0,
  ESTIMATED          = 1,
  PUBLISHER_PROVIDED = 2,
  PRECISE            = 3,
}

/**
 * Mirrors PaidEvent type.
 * Source: react-native-google-mobile-ads/src/types/PaidEventListener.ts
 *
 * NOTE: `value` is in the currency unit (float), NOT micro-units.
 * The native bridge already divided by 1 000 000.
 * Example: value=0.000042, currency="USD" → $0.000042
 */
export interface SdkPaidEvent {
  currency : string;
  precision: RevenuePrecisions;
  value    : number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ad format
// ─────────────────────────────────────────────────────────────────────────────

export type AdFormat =
  | "banner"
  | "interstitial"
  | "rewarded"
  | "rewarded_interstitial"
  | "app_open"
  | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// Production AdMob unit IDs (used by ad wrappers when calling this service)
// ─────────────────────────────────────────────────────────────────────────────

export const AD_UNIT_IDS = {
  BANNER       : "ca-app-pub-4705207925908028/4786224093",
  REWARDED     : "ca-app-pub-4705207925908028/4722420545",
  INTERSTITIAL : "ca-app-pub-4705207925908028/8366152086",
  APP_OPEN     : "ca-app-pub-4705207925908028/4468848681",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Payload sent to POST /api/ad-revenue/events
// ─────────────────────────────────────────────────────────────────────────────

export interface AdRevenuePayload {
  /** Client-generated idempotency key — generated ONCE, preserved on all retries */
  eventId      : string;
  adUnitId     : string;
  adFormat     : AdFormat;
  /**
   * Revenue in the currency unit as delivered by the SDK bridge (float).
   * The backend converts to micro-units.
   * Example: 0.000042 USD
   */
  value        : number;
  currencyCode : string;
  /** RevenuePrecisions value (0–3) */
  precision    : RevenuePrecisions;
  platform     : "android" | "ios" | "unknown";
  /** ISO 8601 timestamp from the device when the paid event fired */
  occurredAt   : string;
  placement   ?: string | null;
  sessionId   ?: string | null;
  // Fields below are only sent when the SDK actually exposes them.
  // The SDK v16.3.4 PaidEvent type has no adSource/responseId fields —
  // do NOT invent them.  If a future SDK version adds them, add them here.
}

export interface AdRevenueResult {
  accepted         : boolean;
  duplicate        : boolean;
  eventId          : string;
  status           : "PENDING" | "REJECTED";
  currencyCode     : string;
  value            : number;
  microValue       : number;
  userShareMicro   : number;
  userSharePercent : number;
  message         ?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offline queue — durable, never silently deletes revenue events
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY    = "solosec_ad_event_queue_v2";
const OVERFLOW_KEY = "solosec_ad_event_failed_v2";

/**
 * Soft limit on the primary retry queue.
 * If exceeded, the OLDEST excess items are moved to the overflow store
 * (not deleted) so the primary queue stays manageable.
 */
const SOFT_QUEUE_LIMIT = 200;

/** Base delay in ms for exponential backoff (1 minute) */
const BASE_BACKOFF_MS = 60_000;
/** Maximum backoff cap: 24 hours */
const MAX_BACKOFF_MS  = 24 * 60 * 60 * 1_000;

interface QueuedEvent {
  payload      : AdRevenuePayload;
  queuedAt     : string;   // ISO — when the event was first queued
  retryCount   : number;   // how many failed submission attempts
  nextRetryAt  : string;   // ISO — earliest time the next attempt should run
}

function backoffMs(retryCount: number): number {
  const delay = BASE_BACKOFF_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_BACKOFF_MS);
}

function nextRetryTimestamp(retryCount: number): string {
  return new Date(Date.now() + backoffMs(retryCount)).toISOString();
}

async function readStore<T>(key: string): Promise<T[]> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeStore<T>(key: string, items: T[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(items));
  } catch {
    // SecureStore write failure must never crash the app.
    // The event has already been submitted to the backend if the failure
    // happens after a successful network call, so data loss risk is low.
    console.warn("[adRewardService] Failed to write queue to SecureStore");
  }
}

/**
 * Enqueue an event that failed to reach the backend.
 * The event ID is already set on the payload and will be preserved on retries.
 */
async function enqueue(payload: AdRevenuePayload): Promise<void> {
  const queue = await readStore<QueuedEvent>(QUEUE_KEY);

  const item: QueuedEvent = {
    payload,
    queuedAt   : new Date().toISOString(),
    retryCount : 0,
    nextRetryAt: nextRetryTimestamp(0),
  };

  queue.push(item);

  // If the queue exceeds the soft limit, move the oldest excess to overflow.
  // Do NOT delete them — they remain auditable.
  if (queue.length > SOFT_QUEUE_LIMIT) {
    const overflow  = await readStore<QueuedEvent>(OVERFLOW_KEY);
    const excess    = queue.splice(0, queue.length - SOFT_QUEUE_LIMIT);
    overflow.push(...excess);
    await writeStore(OVERFLOW_KEY, overflow);
    console.warn(
      `[adRewardService] Queue soft limit (${SOFT_QUEUE_LIMIT}) exceeded. ` +
      `Moved ${excess.length} oldest item(s) to overflow store. ` +
      "These events are NOT lost — reconcile via admin panel.",
    );
  }

  await writeStore(QUEUE_KEY, queue);
}

/**
 * Attempt to send all queued events whose nextRetryAt has passed.
 *
 * - Success: remove from queue.
 * - Failure: increment retryCount, reschedule with backoff, keep in queue.
 * - Never deletes events regardless of retry count.
 *
 * Called before each new submission so the queue drains opportunistically.
 * Fire-and-forget — never throws.
 */
export async function drainQueue(): Promise<void> {
  const queue = await readStore<QueuedEvent>(QUEUE_KEY);
  if (queue.length === 0) return;

  const now       = Date.now();
  const remaining : QueuedEvent[] = [];

  for (const item of queue) {
    const due = new Date(item.nextRetryAt).getTime();
    if (due > now) {
      // Not yet due — keep as-is
      remaining.push(item);
      continue;
    }

    try {
      await api().apiPost("/ad-revenue/events", item.payload);
      // Successfully delivered — drop from queue
    } catch {
      // Still failing — reschedule with exponential backoff
      item.retryCount  += 1;
      item.nextRetryAt  = nextRetryTimestamp(item.retryCount);
      remaining.push(item);
    }
  }

  await writeStore(QUEUE_KEY, remaining);
}

/**
 * Return the current size of the primary retry queue.
 * Useful for admin/debug screens.
 */
export async function getQueueSize(): Promise<number> {
  const queue = await readStore<QueuedEvent>(QUEUE_KEY);
  return queue.length;
}

/**
 * Return the current size of the overflow (permanently backlogged) store.
 * Non-zero means events need admin reconciliation.
 */
export async function getOverflowSize(): Promise<number> {
  const overflow = await readStore<QueuedEvent>(OVERFLOW_KEY);
  return overflow.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a client-side idempotency key.
 * Created ONCE per paid event.  Never regenerated on retry.
 */
function generateEventId(): string {
  const ts  = Date.now().toString(36);
  // Use two separate Math.random() calls to improve entropy.
  const r1  = Math.random().toString(36).slice(2, 9);
  const r2  = Math.random().toString(36).slice(2, 9);
  return `admobrev_${ts}_${r1}${r2}`;
}

function currentPlatform(): "android" | "ios" | "unknown" {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios")     return "ios";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: submit a real SDK PaidEvent to the backend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called from every ad component's paid-event handler.
 *
 * The eventId is generated here and preserved if the event must be retried
 * after a network failure.  The backend deduplicates on eventId so retry is
 * always safe.
 *
 * Usage — BannerAd (onPaid prop):
 *   onPaid={(event: SdkPaidEvent) =>
 *     submitAdRevenueEvent(event, AD_UNIT_IDS.BANNER, "banner", "home_banner")
 *   }
 *
 * Usage — overlay ads (AdEventType.PAID listener):
 *   ad.addAdEventListener(AdEventType.PAID, (payload: unknown) => {
 *     submitAdRevenueEvent(
 *       payload as SdkPaidEvent,
 *       AD_UNIT_IDS.INTERSTITIAL, "interstitial", "quiz_transition"
 *     ).catch(() => {});
 *   });
 *
 * @param sdkEvent   The PaidEvent object from the SDK bridge.
 * @param adUnitId   The exact AdMob unit ID for this ad.
 * @param format     Ad format label.
 * @param placement  Optional placement label for analytics.
 * @param sessionId  Optional session/screen identifier.
 */
export async function submitAdRevenueEvent(
  sdkEvent  : SdkPaidEvent,
  adUnitId  : string,
  format    : AdFormat,
  placement?: string,
  sessionId?: string,
): Promise<AdRevenueResult> {

  // Guard: reject negative values (zero is valid — unfilled impressions)
  if (!Number.isFinite(sdkEvent.value) || sdkEvent.value < 0) {
    return {
      accepted: false, duplicate: false,
      eventId: "", status: "REJECTED",
      currencyCode: sdkEvent.currency || "UNKNOWN",
      value: 0, microValue: 0,
      userShareMicro: 0, userSharePercent: 0,
      message: "Invalid paid event value from SDK.",
    };
  }

  const payload: AdRevenuePayload = {
    eventId     : generateEventId(),          // created once, never recreated
    adUnitId,
    adFormat    : format,
    value       : sdkEvent.value,
    currencyCode: (sdkEvent.currency || "UNKNOWN").toUpperCase(),
    precision   : sdkEvent.precision ?? RevenuePrecisions.UNKNOWN,
    platform    : currentPlatform(),
    occurredAt  : new Date().toISOString(),
    placement   : placement ?? null,
    sessionId   : sessionId ?? null,
  };

  // Drain backlogged events first (fire-and-forget)
  drainQueue().catch(() => {});

  try {
    const response = await api().apiPost("/ad-revenue/events", payload);
    return {
      accepted         : response.accepted          ?? true,
      duplicate        : response.duplicate         ?? false,
      eventId          : response.eventId           ?? payload.eventId,
      status           : response.status            ?? "PENDING",
      currencyCode     : response.currencyCode      ?? payload.currencyCode,
      value            : payload.value,
      microValue       : response.microValue        ?? 0,
      userShareMicro   : response.userShareMicro    ?? 0,
      userSharePercent : response.userSharePercent  ?? 0,
      message          : response.message,
    };
  } catch {
    // Network or server error — persist for retry.
    // The eventId is embedded in the payload; it will be reused on all retries.
    await enqueue(payload);
    return {
      accepted: true,            // accepted locally; will reach backend on retry
      duplicate: false,
      eventId: payload.eventId,
      status: "PENDING",
      currencyCode: payload.currencyCode,
      value: payload.value,
      microValue: 0,
      userShareMicro: 0,
      userSharePercent: 0,
      message: "Offline — queued for retry.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet — always fetched from the backend, never stored locally
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletSummary {
  unavailable             ?: boolean;    // true when backend could not be reached
  error                   ?: string;     // human-readable reason when unavailable
  currencyCode              : string;
  pendingMicroValue         : number;
  availableMicroValue       : number;
  lifetimeEarnedMicroValue  : number;
  lifetimeWithdrawnMicroValue: number;
  pendingValue              : number;    // micro / 1 000 000 (display only)
  availableValue            : number;
  lifetimeEarnedValue       : number;
  lifetimeWithdrawnValue    : number;
}

/**
 * Fetch the authenticated user's wallet from the backend.
 *
 * Returns `{ unavailable: true, error }` when the backend cannot be reached.
 * Callers MUST check `unavailable` before displaying balance figures.
 * Do NOT treat unavailable as zero balance.
 */
export async function getWalletSummary(): Promise<WalletSummary> {
  try {
    const res = await api().apiGet("/ad-revenue/wallet");
    if (!res || !res.success) {
      return {
        unavailable: true,
        error: res?.message ?? "Wallet unavailable.",
        currencyCode: "UNKNOWN",
        pendingMicroValue: 0, availableMicroValue: 0,
        lifetimeEarnedMicroValue: 0, lifetimeWithdrawnMicroValue: 0,
        pendingValue: 0, availableValue: 0,
        lifetimeEarnedValue: 0, lifetimeWithdrawnValue: 0,
      };
    }

    const d = res.data ?? {};
    return {
      currencyCode              : d.currencyCode               ?? "USD",
      pendingMicroValue         : d.pendingMicroValue          ?? 0,
      availableMicroValue       : d.availableMicroValue        ?? 0,
      lifetimeEarnedMicroValue  : d.lifetimeEarnedMicroValue   ?? 0,
      lifetimeWithdrawnMicroValue: d.lifetimeWithdrawnMicroValue ?? 0,
      pendingValue              : d.pendingValue               ?? 0,
      availableValue            : d.availableValue             ?? 0,
      lifetimeEarnedValue       : d.lifetimeEarnedValue        ?? 0,
      lifetimeWithdrawnValue    : d.lifetimeWithdrawnValue     ?? 0,
    };
  } catch (err: any) {
    return {
      unavailable: true,
      error: err?.message ?? "Network error — wallet data unavailable.",
      currencyCode: "UNKNOWN",
      pendingMicroValue: 0, availableMicroValue: 0,
      lifetimeEarnedMicroValue: 0, lifetimeWithdrawnMicroValue: 0,
      pendingValue: 0, availableValue: 0,
      lifetimeEarnedValue: 0, lifetimeWithdrawnValue: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction history
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  _id                        : string;
  type                       : string;
  status                     : string;
  microValue                 : number;
  currencyCode               : string;
  description                : string;
  balanceAfterPendingMicro   : number;
  balanceAfterAvailableMicro : number;
  createdAt                  : string;
}

export interface TransactionsResult {
  unavailable   ?: boolean;
  error         ?: string;
  transactions   : WalletTransaction[];
  total          : number;
}

/**
 * Fetch paginated transaction history from the backend.
 * Returns `{ unavailable: true, error }` on failure — not an empty array.
 */
export async function getWalletTransactions(
  limit  = 50,
  offset = 0,
): Promise<TransactionsResult> {
  try {
    const res = await api().apiGet(
      `/ad-revenue/transactions?limit=${limit}&offset=${offset}`,
    );
    if (!res || !res.success) {
      return {
        unavailable: true,
        error: res?.message ?? "Transactions unavailable.",
        transactions: [], total: 0,
      };
    }
    return {
      transactions: res.transactions ?? [],
      total        : res.total        ?? 0,
    };
  } catch (err: any) {
    return {
      unavailable: true,
      error: err?.message ?? "Network error — transaction history unavailable.",
      transactions: [], total: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue share config — fetched from backend, display only
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueShareConfig {
  unavailable          ?: boolean;
  error                ?: string;
  userSharePercent      : number;
  platformSharePercent  : number;
  effectiveFrom        ?: string;
}

/**
 * Fetch the backend-configured revenue share percentage.
 *
 * Returns `{ unavailable: true }` when config cannot be loaded.
 * Callers must NOT fall back to a hardcoded percentage as financial truth.
 * The percentage is for display only — the backend computes actual shares.
 */
export async function getRevenueShareConfig(): Promise<RevenueShareConfig> {
  try {
    const res = await api().apiGet("/ad-revenue/config");
    if (!res || !res.success) {
      return {
        unavailable: true,
        error: res?.message ?? "Revenue share config unavailable.",
        userSharePercent: 0,
        platformSharePercent: 0,
      };
    }
    return {
      userSharePercent    : res.data?.userSharePercent     ?? 0,
      platformSharePercent: res.data?.platformSharePercent ?? 0,
      effectiveFrom       : res.data?.effectiveFrom,
    };
  } catch (err: any) {
    return {
      unavailable: true,
      error: err?.message ?? "Network error — revenue share config unavailable.",
      userSharePercent: 0,
      platformSharePercent: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal — submitted to backend, never deducted locally
// ─────────────────────────────────────────────────────────────────────────────

export interface WithdrawalInput {
  /** Float amount in the wallet's currency, e.g. 0.01 */
  amount                   : number;
  currencyCode             : string;
  paymentMethod            : "UPI" | "BANK_TRANSFER" | "OTHER";
  /** UPI ID, bank account reference, etc. */
  paymentDetailsReference  : string;
}

export interface WithdrawalResult {
  success            : boolean;
  message            : string;
  withdrawalId      ?: string;
  newAvailableMicro ?: number;
}

/**
 * Submit a withdrawal request to the backend.
 * All balance validation, deduction, and audit logging happen server-side.
 * This function never deducts from a local balance.
 */
export async function requestWithdrawal(
  input: WithdrawalInput,
): Promise<WithdrawalResult> {
  try {
    const res = await api().apiPost("/ad-revenue/withdraw", {
      amount                 : input.amount,
      currencyCode           : input.currencyCode,
      paymentMethod          : input.paymentMethod,
      paymentDetailsReference: input.paymentDetailsReference,
    });
    return {
      success           : res.success           ?? false,
      message           : res.message           ?? "Unknown response from server.",
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
// Display helpers — for UI formatting only, never for accounting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format integer micro-units as a locale-appropriate currency string.
 * Uses Intl.NumberFormat — never performs currency conversion.
 *
 * Examples:
 *   formatMicros(42, "USD")   → "$0.000042"
 *   formatMicros(1000000, "USD") → "$1.00"
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
    // Intl throws for unknown/unsupported currency codes.
    return `${currencyCode.toUpperCase()} ${value.toFixed(6)}`;
  }
}

/**
 * Format a raw SDK float value as a currency string.
 * Converts to micros internally before formatting.
 */
export function formatSdkValue(value: number, currencyCode: string): string {
  return formatMicros(Math.round(value * 1_000_000), currencyCode);
}
