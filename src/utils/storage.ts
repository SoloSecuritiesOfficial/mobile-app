import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────────────────────────
// Namespaced keys — avoids collisions with other libraries that
// also store "token" or "user" in SecureStore.
// ─────────────────────────────────────────────────────────────────
const TOKEN_KEY         = "solosec_auth_token";
const REFRESH_TOKEN_KEY = "solosec_refresh_token";
const USER_KEY          = "solosec_auth_user";
const PUSH_ASKED_KEY    = "solosec_push_asked";

// ─────────────────────────────────────────────────────────────────
// Access token (short-lived JWT)
// ─────────────────────────────────────────────────────────────────
export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// ─────────────────────────────────────────────────────────────────
// Refresh token (long-lived — used to obtain new access tokens)
// ─────────────────────────────────────────────────────────────────
export const saveRefreshToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

// ─────────────────────────────────────────────────────────────────
// User profile object
// ─────────────────────────────────────────────────────────────────
export const saveUser = async (user: any): Promise<void> => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const data = await SecureStore.getItemAsync(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    // Corrupted data — clear it
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

// ─────────────────────────────────────────────────────────────────
// Clear all auth data — call on logout or forced sign-out
// ─────────────────────────────────────────────────────────────────
export const clearStorage = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
};

// ─────────────────────────────────────────────────────────────────
// Push notification permission flag
// ─────────────────────────────────────────────────────────────────
export const hasPushBeenAsked = async (): Promise<boolean> => {
  const val = await SecureStore.getItemAsync(PUSH_ASKED_KEY);
  return val === "true";
};

export const markPushAsked = async (): Promise<void> => {
  await SecureStore.setItemAsync(PUSH_ASKED_KEY, "true");
};

// ─────────────────────────────────────────────────────────────────
// Ad Reward Tracking
// Tracks how many banner ads the user has seen and their ₹ earnings.
// Every 100 ads seen = ₹1 reward credited.
// ─────────────────────────────────────────────────────────────────
const AD_WATCH_COUNT_KEY    = "solosec_ad_watch_count";
const AD_REWARD_BALANCE_KEY = "solosec_ad_reward_balance";
const AD_REWARD_HISTORY_KEY = "solosec_ad_reward_history";

export const ADS_PER_RUPEE = 100; // 100 ads = ₹1

export interface AdRewardEntry {
  date: string;        // ISO timestamp
  adsWatched: number;  // ads that triggered this payout
  rupees: number;      // amount credited (always 1)
}

/** Get the current raw ad-view counter (resets after every 100) */
export const getAdWatchCount = async (): Promise<number> => {
  const raw = await SecureStore.getItemAsync(AD_WATCH_COUNT_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
};

/** Increment the counter by 1. Returns the new count AND whether a ₹1 payout was just triggered. */
export const incrementAdWatchCount = async (): Promise<{ count: number; rewarded: boolean; totalBalance: number }> => {
  const prev = await getAdWatchCount();
  const next  = prev + 1;
  const rewarded = next >= ADS_PER_RUPEE;

  if (rewarded) {
    // Reset counter
    await SecureStore.setItemAsync(AD_WATCH_COUNT_KEY, "0");
    // Add ₹1 to balance
    const newBalance = await addAdRewardBalance(1);
    // Record in history
    await addAdRewardHistoryEntry({ date: new Date().toISOString(), adsWatched: ADS_PER_RUPEE, rupees: 1 });
    return { count: 0, rewarded: true, totalBalance: newBalance };
  } else {
    await SecureStore.setItemAsync(AD_WATCH_COUNT_KEY, String(next));
    const balance = await getAdRewardBalance();
    return { count: next, rewarded: false, totalBalance: balance };
  }
};

/** Get total accumulated ₹ balance (not yet withdrawn) */
export const getAdRewardBalance = async (): Promise<number> => {
  const raw = await SecureStore.getItemAsync(AD_REWARD_BALANCE_KEY);
  return raw ? parseFloat(raw) || 0 : 0;
};

/** Add amount to balance and return new total */
export const addAdRewardBalance = async (amount: number): Promise<number> => {
  const current = await getAdRewardBalance();
  const next = Math.round((current + amount) * 100) / 100;
  await SecureStore.setItemAsync(AD_REWARD_BALANCE_KEY, String(next));
  return next;
};

/** Deduct amount from balance (for withdrawal), returns new balance */
export const deductAdRewardBalance = async (amount: number): Promise<number> => {
  const current = await getAdRewardBalance();
  const next = Math.max(0, Math.round((current - amount) * 100) / 100);
  await SecureStore.setItemAsync(AD_REWARD_BALANCE_KEY, String(next));
  return next;
};

/** Get full payout history (latest first, max 50 entries) */
export const getAdRewardHistory = async (): Promise<AdRewardEntry[]> => {
  const raw = await SecureStore.getItemAsync(AD_REWARD_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdRewardEntry[];
  } catch {
    return [];
  }
};

/** Append an entry to payout history */
const addAdRewardHistoryEntry = async (entry: AdRewardEntry): Promise<void> => {
  const history = await getAdRewardHistory();
  const updated = [entry, ...history].slice(0, 50); // keep latest 50
  await SecureStore.setItemAsync(AD_REWARD_HISTORY_KEY, JSON.stringify(updated));
};

/** Reset all ad reward data (for testing or logout) */
export const clearAdRewardData = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(AD_WATCH_COUNT_KEY),
    SecureStore.deleteItemAsync(AD_REWARD_BALANCE_KEY),
    SecureStore.deleteItemAsync(AD_REWARD_HISTORY_KEY),
  ]);
};

// ─────────────────────────────────────────────────────────────────
// Video Ad Reward Tracking
// Each rewarded video ad watched = ₹0.10 (10 paise) credited.
// Max 20 video ads rewarded per day (= ₹2/day max from videos).
// ─────────────────────────────────────────────────────────────────
const VIDEO_AD_DATE_KEY  = "solosec_video_ad_date";   // "YYYY-MM-DD"
const VIDEO_AD_COUNT_KEY = "solosec_video_ad_count";  // daily count

export const VIDEO_AD_REWARD_RUPEES = 0.10;  // ₹0.10 per video ad
export const VIDEO_AD_DAILY_LIMIT   = 20;    // max 20 video ads/day

function todayDateString(): string {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/** Returns today's video ad count (resets at midnight). */
export const getTodayVideoAdCount = async (): Promise<number> => {
  const [storedDate, storedCount] = await Promise.all([
    SecureStore.getItemAsync(VIDEO_AD_DATE_KEY),
    SecureStore.getItemAsync(VIDEO_AD_COUNT_KEY),
  ]);
  if (storedDate !== todayDateString()) return 0;  // new day — reset
  return storedCount ? parseInt(storedCount, 10) || 0 : 0;
};

/**
 * Record a watched video ad. Returns whether it was rewarded
 * (not rewarded if daily limit reached), new balance, and today's count.
 */
export const recordVideoAdWatched = async (): Promise<{
  rewarded: boolean;
  reward: number;
  newBalance: number;
  todayCount: number;
  limitReached: boolean;
}> => {
  const today = todayDateString();
  const storedDate  = await SecureStore.getItemAsync(VIDEO_AD_DATE_KEY);
  const storedCount = await SecureStore.getItemAsync(VIDEO_AD_COUNT_KEY);

  // Reset count if it's a new day
  let currentCount = storedDate === today
    ? (storedCount ? parseInt(storedCount, 10) || 0 : 0)
    : 0;

  if (currentCount >= VIDEO_AD_DAILY_LIMIT) {
    const balance = await getAdRewardBalance();
    return { rewarded: false, reward: 0, newBalance: balance, todayCount: currentCount, limitReached: true };
  }

  const newCount = currentCount + 1;
  const reward   = VIDEO_AD_REWARD_RUPEES;

  // Persist count and date
  await Promise.all([
    SecureStore.setItemAsync(VIDEO_AD_DATE_KEY, today),
    SecureStore.setItemAsync(VIDEO_AD_COUNT_KEY, String(newCount)),
  ]);

  // Credit to balance
  const newBalance = await addAdRewardBalance(reward);

  // Add to history
  const historyRaw = await SecureStore.getItemAsync(AD_REWARD_HISTORY_KEY) ?? "[]";
  let history: AdRewardEntry[] = [];
  try { history = JSON.parse(historyRaw); } catch { history = []; }
  const entry: AdRewardEntry = {
    date: new Date().toISOString(),
    adsWatched: 1,
    rupees: reward,
  };
  const updated = [entry, ...history].slice(0, 50);
  await SecureStore.setItemAsync(AD_REWARD_HISTORY_KEY, JSON.stringify(updated));

  return { rewarded: true, reward, newBalance, todayCount: newCount, limitReached: false };
};

// ─────────────────────────────────────────────────────────────────
// App-Open Bonus Tracking
// Every time the user opens the app = ₹0.01 credited, max 10/day.
// ─────────────────────────────────────────────────────────────────
const APP_OPEN_DATE_KEY  = "solosec_app_open_date";
const APP_OPEN_COUNT_KEY = "solosec_app_open_count";

export const APP_OPEN_REWARD_RUPEES = 0.01;
export const APP_OPEN_DAILY_LIMIT   = 10;

export const recordAppOpenBonus = async (): Promise<{
  rewarded: boolean;
  reward: number;
  newBalance: number;
  todayCount: number;
}> => {
  const today       = todayDateString();
  const storedDate  = await SecureStore.getItemAsync(APP_OPEN_DATE_KEY);
  const storedCount = await SecureStore.getItemAsync(APP_OPEN_COUNT_KEY);

  const currentCount = storedDate === today
    ? (storedCount ? parseInt(storedCount, 10) || 0 : 0)
    : 0;

  if (currentCount >= APP_OPEN_DAILY_LIMIT) {
    const balance = await getAdRewardBalance();
    return { rewarded: false, reward: 0, newBalance: balance, todayCount: currentCount };
  }

  const newCount = currentCount + 1;
  await Promise.all([
    SecureStore.setItemAsync(APP_OPEN_DATE_KEY,  today),
    SecureStore.setItemAsync(APP_OPEN_COUNT_KEY, String(newCount)),
  ]);

  const reward     = APP_OPEN_REWARD_RUPEES;
  const newBalance = await addAdRewardBalance(reward);

  // Record in history
  const historyRaw = await SecureStore.getItemAsync(AD_REWARD_HISTORY_KEY) ?? "[]";
  let history: AdRewardEntry[] = [];
  try { history = JSON.parse(historyRaw); } catch { history = []; }
  const updated = [
    { date: new Date().toISOString(), adsWatched: 0, rupees: reward, type: "app_open" } as any,
    ...history,
  ].slice(0, 100);
  await SecureStore.setItemAsync(AD_REWARD_HISTORY_KEY, JSON.stringify(updated));

  return { rewarded: true, reward, newBalance, todayCount: newCount };
};

export const getTodayAppOpenCount = async (): Promise<number> => {
  const [storedDate, storedCount] = await Promise.all([
    SecureStore.getItemAsync(APP_OPEN_DATE_KEY),
    SecureStore.getItemAsync(APP_OPEN_COUNT_KEY),
  ]);
  if (storedDate !== todayDateString()) return 0;
  return storedCount ? parseInt(storedCount, 10) || 0 : 0;
};

// ─────────────────────────────────────────────────────────────────
// Daily Video Streak Bonus
// When the user watches 5 video ads in a single day → +₹0.50 bonus.
// Only awarded once per day (one bonus per 5-video milestone).
// ─────────────────────────────────────────────────────────────────
const VIDEO_STREAK_BONUS_DATE_KEY = "solosec_video_streak_bonus_date";

export const VIDEO_STREAK_THRESHOLD = 5;    // watch 5 videos to trigger
export const VIDEO_STREAK_BONUS_RUPEES = 0.50;

export const checkAndGrantVideoStreakBonus = async (todayVideoCount: number): Promise<{
  bonusGranted: boolean;
  newBalance: number;
}> => {
  if (todayVideoCount < VIDEO_STREAK_THRESHOLD) {
    const balance = await getAdRewardBalance();
    return { bonusGranted: false, newBalance: balance };
  }

  const today      = todayDateString();
  const storedDate = await SecureStore.getItemAsync(VIDEO_STREAK_BONUS_DATE_KEY);

  // Already granted today
  if (storedDate === today) {
    const balance = await getAdRewardBalance();
    return { bonusGranted: false, newBalance: balance };
  }

  await SecureStore.setItemAsync(VIDEO_STREAK_BONUS_DATE_KEY, today);
  const newBalance = await addAdRewardBalance(VIDEO_STREAK_BONUS_RUPEES);

  // Record in history
  const historyRaw = await SecureStore.getItemAsync(AD_REWARD_HISTORY_KEY) ?? "[]";
  let history: AdRewardEntry[] = [];
  try { history = JSON.parse(historyRaw); } catch { history = []; }
  const updated = [
    { date: new Date().toISOString(), adsWatched: VIDEO_STREAK_THRESHOLD, rupees: VIDEO_STREAK_BONUS_RUPEES, type: "streak_bonus" } as any,
    ...history,
  ].slice(0, 100);
  await SecureStore.setItemAsync(AD_REWARD_HISTORY_KEY, JSON.stringify(updated));

  return { bonusGranted: true, newBalance };
};
