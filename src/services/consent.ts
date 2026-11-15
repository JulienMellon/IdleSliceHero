// Consent order as a pure state machine: tutorial over -> UMP form (EU/UK, where required) -> iOS tracking prompt -> the ad.
// Never at launch, never before the tutorial. Every refusal path ends in an ad or a clean `unavailable`.

export type TrackingStatus = 'granted' | 'denied' | 'unsupported';
export type Step = 'wait' | 'ump' | 'tracking' | 'ad' | 'unavailable';

export interface ConsentState {
  tutorialDone: boolean;
  umpDone: boolean;
  /** From the UMP SDK: false when a player in the EU/UK refused. */
  canRequestAds: boolean;
  tracking: TrackingStatus | 'unknown';
}

export const initialConsent = (): ConsentState => ({ tutorialDone: false, umpDone: false, canRequestAds: false, tracking: 'unknown' });

export type ConsentEvent =
  | { type: 'tutorial_done' }
  | { type: 'ump'; canRequestAds: boolean }
  | { type: 'tracking'; status: TrackingStatus };

export function consentReduce(s: ConsentState, e: ConsentEvent): ConsentState {
  switch (e.type) {
    case 'tutorial_done':
      return { ...s, tutorialDone: true };
    case 'ump':
      return { ...s, umpDone: true, canRequestAds: e.canRequestAds };
    case 'tracking':
      return { ...s, tracking: e.status };
  }
}

/** What to do next. A refused tracking prompt still gets an ad (not personalised); a refused UMP form gets none. */
export function nextStep(s: ConsentState): Step {
  if (!s.tutorialDone) return 'wait';
  if (!s.umpDone) return 'ump';
  if (!s.canRequestAds) return 'unavailable';
  if (s.tracking === 'unknown') return 'tracking';
  return 'ad';
}

/** The ad button may show: nothing has closed the door yet. */
export const mayOfferAd = (s: ConsentState): boolean => s.tutorialDone && (!s.umpDone || s.canRequestAds);
