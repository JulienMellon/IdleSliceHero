// iOS: Google AdMob rewarded video through react-native-google-mobile-ads. The flow (consent order, one ad at a time) is ad-flow.ts.
import mobileAds, { AdEventType, AdsConsent, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

import { createAdFlow } from './ad-flow';
import type { AdResult, Ads } from './types';

const LOAD_TIMEOUT_MS = 10_000;
/** A loaded ad goes stale after an hour; drop ours a little before. */
const STALE_MS = 50 * 60_000;

/** Google's test unit in development; the real rewarded unit comes from the environment and is empty (no ads) if unset. */
const unitId = (): string => (__DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? ''));

interface Slot {
  ad: RewardedAd;
  at: number;
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
        resolve({ ad, at: Date.now(), finished });
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

let cached: Slot | null = null;
let loading: Promise<void> | null = null;
let sdkReady: Promise<void> | null = null;

const fresh = (): boolean => !!cached && Date.now() - cached.at < STALE_MS;
const initSdk = () => (sdkReady ??= mobileAds().initialize().then(() => {}));

function preload(): void {
  if (fresh() || loading) return;
  loading = initSdk()
    .then(loadSlot)
    .then((s) => void (cached = s))
    .catch(() => {})
    .finally(() => void (loading = null));
}

const flow = createAdFlow({
  async ump() {
    // The UMP form shows only where required (EU/UK) and only when consent is not already known.
    const info = await AdsConsent.gatherConsent();
    return { canRequestAds: info.canRequestAds };
  },
  /**
   * The iOS tracking prompt. Needs `expo-tracking-transparency` (requestTrackingPermissionsAsync), which is not installed yet:
   * until it is, report 'unsupported' and AdMob serves non-personalised ads. NSUserTrackingUsageDescription is already in app.json.
   */
  tracking: async () => 'unsupported',
  async showAd() {
    await initSdk();
    const slot = fresh() ? cached : await loadSlot();
    cached = null;
    if (!slot) return 'unavailable';
    try {
      await slot.ad.show();
    } catch {
      return 'unavailable';
    }
    const result = await slot.finished;
    preload();
    return result;
  },
  loaded: fresh,
});

export const ads: Ads = {
  ready: () => flow.ready(),
  show: (p) => flow.show(p),
};

/** The tutorial is over: from now on the first ad request may ask for consent, and the next ad loads in the background. */
export function adsTutorialDone(): void {
  flow.setTutorialDone(true);
}
export async function startAds(): Promise<void> {}
