/**
 * avatar.ts — shared profile image URL resolver
 *
 * Single source of truth used by every component that shows a profile picture:
 *   UserAvatar, DashboardHeader, ProfileScreen, ProfileSettingsScreen, etc.
 *
 * Rules:
 *   data:   — base64 encoded image stored in DB (legacy) — use directly
 *   http(s) — absolute URL (Google OAuth picture, CDN, new /uploads path) — use directly
 *   /       — relative server path e.g. "/uploads/abc.jpg" — prepend BASE_URL
 *   ""      — empty string or null/undefined — return null (show initials fallback)
 */

import { BASE_URL } from "../config/api";

export function resolveAvatar(profileImage?: string | null): string | null {
  if (!profileImage || profileImage.trim() === "") return null;

  // base64 data URL — use directly (legacy images stored in DB)
  if (profileImage.startsWith("data:")) return profileImage;

  // absolute URL (Google profile picture, CDN, etc.) — use directly
  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
    return profileImage;
  }

  // relative path from backend — prepend base URL
  // e.g. "/uploads/profile-abc123.jpg" → "https://backend.com/uploads/profile-abc123.jpg"
  const cleanPath = profileImage.startsWith("/") ? profileImage : `/${profileImage}`;
  return `${BASE_URL}${cleanPath}`;
}
