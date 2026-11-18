// Rewarded-ad placements (card U3): the one rule for an ad button and the limits of each placement, as pure functions.
// The component (ad-button.tsx) and the store (game-store.ts) only call these; the tests are in __tests__/ad-model.test.ts.
//
//   placement       where                               limit                                   what a reward gives
//   double_claim    claim sheet (daily, weekly, gift)   once per claim                          the claim's cash and diamonds again
//   reroll_task     a daily task's row                  once a day (`rewards.rerollUsed`)       another daily task in its place
//   streak_save     the gift calendar's missed day      once per 30-day cycle (`gift.saveUsed`) the streak repair, without the 20 diamonds
//   offline_2x      the welcome-back gift               once per return                         the offline total doubled (replaces a timed boost, never stacks)
//   daily_booster   the booster shelf                   once a day (`StorePrefs.boosterAdDay`)  one 2x 15 min booster
import type { ClaimDelta } from '../../engine/offers';
import type { AdPlacement, AdResult } from '../../services/types';

// ---------- the one rule ----------

export type AdOutcome = 'plus' | 'rewarded' | 'skipped';

export interface AdDeps {
  /** The player owns Nonna's Plus. */
  plus: boolean;
  show: (p: AdPlacement) => Promise<AdResult>;
}

/**
 * The one rule behind every ad button. Nonna's Plus: the benefit is given at once and no ad is shown or counted. Otherwise the ad is
 * shown: `rewarded` gives the benefit; `dismissed` and `unavailable` give nothing and are not an error, the player just goes on.
 * Events: none here. The services index sends `ad_started` and `ad_completed` from `ads.show` (C128); the button sends `ad_offered` when it appears.
 */
export async function runAd(placement: AdPlacement, deps: AdDeps): Promise<AdOutcome> {
  if (deps.plus) return 'plus';
  let result: AdResult = 'unavailable';
  try {
    result = await deps.show(placement);
  } catch {
    /* `show` never throws; if a stub does, it is the same as no ad */
  }
  if (result !== 'rewarded') return 'skipped';
  return 'rewarded';
}

/** How often a mounted ad button asks the service whether an ad could be shown now, so it comes back after a stale or unfilled ad with no app restart. */
export const READY_CHECK_MS = 4000;

/** The benefit is given for these outcomes. */
export const gives = (o: AdOutcome): boolean => o !== 'skipped';

/** Whether the button is on show: a Plus owner always has it; anyone else when an ad could be shown. */
export const buttonShown = (plus: boolean, adReady: boolean): boolean => plus || adReady;

/** `ad_offered` is tracked each time this becomes true: an ad is ready and the player has no Plus (a Plus owner is never offered an ad). */
export const adOffering = (plus: boolean, adReady: boolean): boolean => adReady && !plus;

/** What the button says: the Plus line when the benefit is free, the ad line otherwise. */
export const adLabel = (plus: boolean, ad: string, plusLine: string): string => (plus ? plusLine : ad);

// The rules below moved to engine/offers.ts (A34); they are re-exported so the screens and tests keep their import.
export {
  DAILY_BOOSTER,
  applyDouble,
  boosterAdOffer,
  canReroll,
  claimDelta,
  claimOffer,
  grantDailyBooster,
  hasDelta,
  offlineBoost,
  offlineExtra,
  offlineFactor,
  offlineOffer,
  repairByAd,
  rerollDaily,
  rerollTask,
  streakSaveOffer,
  type ClaimDelta,
} from '../../engine/offers';

// ---------- the claim the sheet is about ----------

export type ClaimKind = 'daily' | 'weekly' | 'gift';

export interface ClaimInfo {
  kind: ClaimKind;
  /** What the claim paid (once). */
  delta: ClaimDelta;
  /** The claim has been doubled (by an ad or by Nonna's Plus). */
  doubled: boolean;
  /** Ms; the sheet's key. */
  at: number;
}

/** The double button's words (D497): what it adds when that is one thing ("Double it · +$81.2K"), "×2" when the claim paid cash and diamonds. */
export function doubleLabel(d: ClaimDelta, money: (n: number) => string): string {
  const cash = d.cash >= 1;
  const dia = d.diamonds >= 1;
  if (cash && dia) return 'Double it · ×2';
  if (cash) return `Double it · +${money(d.cash)}`;
  if (dia) return `Double it · +${d.diamonds} ${d.diamonds === 1 ? 'diamond' : 'diamonds'}`;
  return 'Double it';
}

/** "+$1.2K and 20 diamonds": the claim's size in words (`money` formats the cash). */
export function deltaText(d: ClaimDelta, money: (n: number) => string): string {
  const parts: string[] = [];
  if (d.cash >= 1) parts.push(`+${money(d.cash)}`);
  if (d.diamonds >= 1) parts.push(`${d.diamonds} ${d.diamonds === 1 ? 'diamond' : 'diamonds'}`);
  return parts.join(' and ');
}
