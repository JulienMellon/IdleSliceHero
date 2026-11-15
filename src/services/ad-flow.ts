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
}

export function createAdFlow(ports: AdPorts) {
  let state: ConsentState = initialConsent();
  let busy = false;
  return {
    state: (): ConsentState => state,
    setTutorialDone(v = true): void {
      if (v) state = consentReduce(state, { type: 'tutorial_done' });
    },
    ready(): boolean {
      if (!mayOfferAd(state)) return false;
      return !state.umpDone || ports.loaded();
    },
    async show(p: AdPlacement): Promise<AdResult> {
      if (busy) return 'unavailable';
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
      }
    },
  };
}
