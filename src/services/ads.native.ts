// iOS: Google AdMob rewarded video through react-native-google-mobile-ads. The flow (consent order, one ad at a time) is ad-flow.ts.
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import mobileAds, { AdEventType, AdsConsent, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

import { createAdFlow } from './ad-flow';
import { createSlotCache } from './ad-slot-cache';
import type { AdResult, Ads } from './types';

const LOAD_TIMEOUT_MS = 10_000;
/** A loaded ad goes stale after an hour; drop ours a little before. */
const STALE_MS = 50 * 60_000;
/** After a failed or unfilled load, ask again no sooner than this. */
const RETRY_FLOOR_MS = 30_000;

/** Google's test unit in development; the real rewarded unit comes from the environment and is empty (no ads) if unset. */
const unitId = (): string => (__DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? ''));

interface Slot {
  ad: RewardedAd;
  finished: Promise<AdResult>;
}

function loadSlot(): Promise<Slot | null> {
  const unit = unitId();
  if (!unit) return Promise.resolve(null);
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(unit);
    const unsubs: (() => void)[] = [];
    let earned = false;
    let settled = false;
    let finish: (r: AdResult) => void = () => {};
    const finished = new Promise<AdResult>((res) => (finish = res));
    const cleanup = () => unsubs.splice(0).forEach((u) => u());
    const timer = setTimeout(() => fail(), LOAD_TIMEOUT_MS);
    const fail = () => {
      clearTimeout(timer);
      cleanup();
      if (!settled) {
        settled = true;
        resolve(null);
      }
      finish('unavailable');
    };
    unsubs.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ad, finished });
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        finish(earned ? 'rewarded' : 'dismissed');
      }),
      ad.addAdEventListener(AdEventType.ERROR, fail),
    );
    ad.load();
  });
}

let sdkReady: Promise<void> | null = null;

/** A failed init is forgotten, so the next ask tries again instead of failing for the whole session. */
const initSdk = () =>
  (sdkReady ??= mobileAds()
    .initialize()
    .then(() => {})
    .catch((e) => {
      sdkReady = null;
      throw e;
    }));

const cache = createSlotCache<Slot>({ init: initSdk, load: loadSlot, now: Date.now, staleMs: STALE_MS, retryFloorMs: RETRY_FLOOR_MS });

const flow = createAdFlow({
  async ump() {
    // The UMP form shows only where required (EU/UK) and only when consent is not already known.
    const info = await AdsConsent.gatherConsent();
    return { canRequestAds: info.canRequestAds };
  },
  /** The iOS tracking prompt (shown once by the OS; later calls return the stored answer). A refusal still gets a non-personalised ad. */
  async tracking() {
    try {
      const r = await requestTrackingPermissionsAsync();
      return r.granted ? 'granted' : 'denied';
    } catch {
      return 'unsupported';
    }
  },
  async showAd() {
    const slot = await cache.take();
    if (!slot) return 'unavailable';
    try {
      await slot.ad.show();
    } catch {
      return 'unavailable';
    }
    return slot.finished;
  },
  loaded: cache.fresh,
  preload: cache.preload,
  hasUnit: () => !!unitId(),
});

export const ads: Ads = {
  ready: () => flow.ready(),
  show: (p) => flow.show(p),
};

/** The tutorial is over: from now on the first ad request may ask for consent, and the next ad loads in the background once consent is known. */
export function adsTutorialDone(): void {
  flow.setTutorialDone(true);
}
export async function startAds(): Promise<void> {}
