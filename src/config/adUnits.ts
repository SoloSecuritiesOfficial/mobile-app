/**
 * adUnits.ts — SoloSecurities AdMob Ad Unit IDs
 *
 * AdMob App ID: ca-app-pub-4705207925908028~8229931071
 *
 * All 4 unit IDs are real production units.
 */

export const AD_UNITS = {
  /** Inline adaptive banner — every content screen */
  BANNER:       "ca-app-pub-4705207925908028/4786224093",

  /** Rewarded Interstitial — video before quiz retake / lab retry */
  REWARDED:     "ca-app-pub-4705207925908028/4722420545",

  /** Interstitial — full-screen between screen transitions */
  INTERSTITIAL: "ca-app-pub-4705207925908028/8366152086",

  /** App Open — when user brings the app to foreground */
  APP_OPEN:     "ca-app-pub-4705207925908028/4468848681",
} as const;

/** true when the unit is a real ID (not a placeholder) */
export function isAdUnitReady(unitId: string): boolean {
  return !unitId.includes("REPLACE_WITH");
}
