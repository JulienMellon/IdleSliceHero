// Drives the consent machine with the platform's calls (injected, so this is tested without an SDK) and shows one rewarded ad.
import { consentReduce, initialConsent, mayOfferAd, nextStep, type ConsentState, type TrackingStatus } from './consent';
import type { AdPlacement, AdResult } from './types';

export interface AdPorts {
  /** Gather consent (UMP). Rejects when it can't be known (offline): the flow answers `unavailable` and asks again next time. */
  ump(): Promise<{ canRequestAds: boolean }>;
  /** The iOS tracking prompt; resolves with the status (it only ever shows once). Never rejects in practice. */
  tracking(): Promise<TrackingStatus>;
  /** Load and show one rewarded ad. */
  showAd(p: AdPlacement): Promise<AdResult>;
  /** An ad is loaded and waiting. */
  loaded(): boolean;
  /** Start loading the next ad in the background; the port keeps its own retry floor, so calling it often is fine. Only called once consent allows ads. */
  preload(): void;
  /** C136: an ad unit is configured. Without one there is never an ad, so no button, no consent form and no tracking prompt. Default true. */
  hasUnit?(): boolean;
}

export function createAdFlow(ports: AdPorts) {
  let state: ConsentState = initialConsent();
  let busy = false;
  const hasUnit = (): boolean => ports.hasUnit?.() ?? true;
  /** Consent is settled and allows ads: the next ad may load. */
  const mayLoad = (): boolean => state.umpDone && state.canRequestAds;
  const preload = (): void => {
    if (!hasUnit() || !mayLoad()) return;
    try {
      ports.preload();
    } catch {
      /* a failed preload only means no ad yet; the next call retries */
    }
  };
  return {
    state: (): ConsentState => state,
    setTutorialDone(v = true): void {
      if (v) state = consentReduce(state, { type: 'tutorial_done' });
      preload();
    },
    /** Before consent the button shows (the first tap asks); after it, only while an ad is loaded, and a missing one is asked for again. */
    ready(): boolean {
      if (!hasUnit() || !mayOfferAd(state)) return false;
      if (!state.umpDone) return true;
      const loaded = ports.loaded();
      if (!loaded) preload();
      return loaded;
    },
    async show(p: AdPlacement): Promise<AdResult> {
      if (busy || !hasUnit()) return 'unavailable';
      busy = true;
      try {
        // at most ump, tracking, ad
        for (let i = 0; i < 4; i++) {
          const step = nextStep(state);
          if (step === 'wait' || step === 'unavailable') return 'unavailable';
          if (step === 'ump') {
            try {
              state = consentReduce(state, { type: 'ump', ...(await ports.ump()) });
            } catch {
              return 'unavailable';
            }
          } else if (step === 'tracking') {
            let status: TrackingStatus = 'denied';
            try {
              status = await ports.tracking();
            } catch {
              /* a failed prompt counts as a refusal */
            }
            state = consentReduce(state, { type: 'tracking', status });
          } else {
            try {
              return await ports.showAd(p);
            } catch {
              return 'unavailable';
            }
          }
        }
        return 'unavailable';
      } finally {
        busy = false;
        // every exit (rewarded, dismissed, unfilled, failed) leaves the next ad loading, so the button comes back
        preload();
      }
    },
  };
}
