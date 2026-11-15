// The one import for game code. Metro picks the .native.ts file on iOS and the .web.ts stub elsewhere.
import { adsTutorialDone, ads as rawAds, startAds } from './ads';
import { analytics, startAnalytics } from './analytics';
import { crash, startCrash } from './crash';
import { EVENTS } from './events';
import { purchases as rawPurchases, startPurchases } from './purchases';
import { grantBus, privacy } from './runtime';
import type { Ads, Purchases } from './types';

export { analytics, crash, adsTutorialDone };
export { EVENTS };
export type { EventName } from './events';
export type { Grant } from './grants';
export type { AdPlacement, AdResult, Ads, Analytics, Crash, ProductId, Props, Purchases } from './types';

/** The game's one listener for paid-out purchases (diamonds, boost, cosmetic, Plus); grants made before it listens are held. */
export const onGrant = grantBus.subscribe;

/** Sends ad_started when a show is asked for and ad_completed when the player earned the reward. */
export const ads: Ads = {
  ready: (p) => rawAds.ready(p),
  async show(p) {
    analytics.track(EVENTS.adStarted, { placement: p });
    const r = await rawAds.show(p);
    if (r === 'rewarded') analytics.track(EVENTS.adCompleted, { placement: p });
    return r;
  },
};

/** Sends iap_purchased when a buy goes through. */
export const purchases: Purchases = {
  ...rawPurchases,
  async buy(id) {
    const r = await rawPurchases.buy(id);
    if (r === 'purchased') analytics.track(EVENTS.iapPurchased, { product: id });
    return r;
  },
};

let started: Promise<void> | null = null;

/** Start every service once, opt-out first. Nothing here prompts the player; consent waits for the first ad. */
export function startServices(): Promise<void> {
  return (started ??= (async () => {
    await privacy.load();
    startCrash();
    await Promise.all([startAnalytics(), startPurchases(), startAds()]).catch((e) => crash.capture(e, 'startServices'));
  })());
}
