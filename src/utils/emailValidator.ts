// ─────────────────────────────────────────────────────────────────
// Email Validation — format check + domain allowlist
//
// Only well-known, legitimate email providers and the company domain
// are permitted. This blocks disposable addresses, typo-squatted
// domains, and arbitrary inboxes from registering.
// ─────────────────────────────────────────────────────────────────

/** Domains that are allowed to register an account. */
const ALLOWED_DOMAINS = new Set([
  // Google
  "gmail.com",
  "googlemail.com",

  // Microsoft / Outlook
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "live.com",
  "live.co.uk",
  "msn.com",

  // Yahoo
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.es",
  "yahoo.it",
  "yahoo.ca",
  "yahoo.com.au",
  "ymail.com",

  // Apple
  "icloud.com",
  "me.com",
  "mac.com",

  // ProtonMail
  "proton.me",
  "protonmail.com",
  "protonmail.ch",

  // Tutanota
  "tutanota.com",
  "tutanota.de",
  "tuta.io",

  // Zoho
  "zoho.com",
  "zohomail.com",

  // AOL / Verizon
  "aol.com",
  "verizon.net",

  // Other major providers
  "icloud.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "web.de",
  "t-online.de",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "wanadoo.fr",
  "163.com",
  "126.com",
  "qq.com",
  "naver.com",
  "hanmail.net",
  "daum.net",
  "rediffmail.com",
  "rocketmail.com",
  "inbox.com",
  "fastmail.com",
  "fastmail.fm",
  "hushmail.com",
  "runbox.com",
  "mailfence.com",
  "disroot.org",
  "pm.me",

  // Company domain
  "solosecurities.com",
]);

/**
 * Basic RFC-like format check — must have local part, @, domain, and TLD.
 */
function isValidFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Returns true only when the email has a valid format AND its domain
 * is in the allowed list.
 */
export function isAllowedEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!isValidFormat(trimmed)) return false;

  const domain = trimmed.split("@")[1];
  return ALLOWED_DOMAINS.has(domain);
}

/**
 * Returns a human-readable error string, or null if the email is fine.
 * Use this directly in form validation.
 *
 * @example
 *   const err = getEmailError(email);
 *   if (err) { setFieldError(err); return; }
 */
export function getEmailError(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) return "Email is required";

  if (!isValidFormat(trimmed)) return "Enter a valid email address";

  const domain = trimmed.toLowerCase().split("@")[1];
  if (!ALLOWED_DOMAINS.has(domain)) {
    return `Email domain "@${domain}" is not supported. Please use Gmail, Yahoo, Outlook, iCloud, ProtonMail, or your solosecurities.com address.`;
  }

  return null;
}
