// ─────────────────────────────────────────────────────────────────
// dateUtils.ts — SoloSecurities
// ─────────────────────────────────────────────────────────────────
// Centralized date/time formatting for India (IST - UTC+5:30).
// All formatting uses "en-IN" locale to ensure consistency
// regardless of device locale settings.
// ─────────────────────────────────────────────────────────────────

export const INDIA_LOCALE = "en-IN";
export const INDIA_TIMEZONE = "Asia/Kolkata";

/** Default date format options for full date display */
export const DATE_FULL_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: INDIA_TIMEZONE,
};

/** Date format options for short date display */
export const DATE_SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: INDIA_TIMEZONE,
};

/** Time format options for 12-hour clock */
export const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TIMEZONE,
};

/** Time format options for 24-hour clock */
export const TIME_24H_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: INDIA_TIMEZONE,
};

/** Date + Time combined */
export const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TIMEZONE,
};

/**
 * Parse ISO date string safely, returns Date or null if invalid
 */
export function parseISODate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format date for display in India locale
 */
export function formatDate(
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = DATE_FULL_OPTIONS
): string {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return "—";
  return date.toLocaleDateString(INDIA_LOCALE, options);
}

/**
 * Format time for display in India locale (12-hour format)
 */
export function formatTime(
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = TIME_OPTIONS
): string {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return "—";
  return date.toLocaleTimeString(INDIA_LOCALE, options);
}

/**
 * Format date and time together
 */
export function formatDateTime(
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = DATETIME_OPTIONS
): string {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return "—";
  return date.toLocaleString(INDIA_LOCALE, options);
}

/**
 * Get relative time label: "Today", "Yesterday", or formatted date
 */
export function getRelativeDateLabel(dateString: string | Date | undefined | null): string {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return "—";

  const now = new Date();
  const todayIST = new Date(now.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));
  const dateIST = new Date(date.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));

  todayIST.setHours(0, 0, 0, 0);
  dateIST.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((todayIST.getTime() - dateIST.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Tomorrow";

  return formatDate(date, DATE_SHORT_OPTIONS);
}

/**
 * Check if a date is today in IST
 */
export function isToday(dateString: string | Date | undefined | null): boolean {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return false;

  const now = new Date();
  const todayIST = new Date(now.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));
  const dateIST = new Date(date.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));

  return (
    todayIST.getFullYear() === dateIST.getFullYear() &&
    todayIST.getMonth() === dateIST.getMonth() &&
    todayIST.getDate() === dateIST.getDate()
  );
}

/**
 * Check if a date is yesterday in IST
 */
export function isYesterday(dateString: string | Date | undefined | null): boolean {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return false;

  const now = new Date();
  const todayIST = new Date(now.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));
  const dateIST = new Date(date.toLocaleString("en-US", { timeZone: INDIA_TIMEZONE }));

  todayIST.setDate(todayIST.getDate() - 1);

  return (
    todayIST.getFullYear() === dateIST.getFullYear() &&
    todayIST.getMonth() === dateIST.getMonth() &&
    todayIST.getDate() === dateIST.getDate()
  );
}

/**
 * Get time ago string (e.g., "2h ago", "3d ago")
 */
export function getTimeAgo(dateString: string | Date | undefined | null): string {
  const date = dateString instanceof Date ? dateString : parseISODate(dateString as string);
  if (!date) return "—";

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "Just now";
}

/**
 * Format timestamp from Unix seconds (for JWT exp, etc.)
 */
export function formatUnixTimestamp(timestamp: number | undefined | null): string {
  if (!timestamp || timestamp <= 0) return "—";
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

/**
 * Get remaining time until a target date
 */
export function getRemainingTime(targetDateString: string | Date | undefined | null): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
} {
  const target = targetDateString instanceof Date ? targetDateString : parseISODate(targetDateString as string);
  if (!target) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, text: "Expiry unavailable" };
  }

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, text: "Expired" };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let text = "";
  if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else text = `${minutes}m ${seconds}s`;

  return { expired: false, days, hours, minutes, seconds, text };
}

/**
 * Format number with India locale (e.g., 1,00,000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString(INDIA_LOCALE);
}