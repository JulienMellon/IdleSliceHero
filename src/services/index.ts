// The one import for game code. Metro picks the .native.ts file on iOS and the .web.ts stub elsewhere.
import { adsTutorialDone, ads, startAds } from './ads';
import { analytics, startAnalytics } from './analytics';
import { crash, startCrash } from './crash';
import { purchases, startPurchases } from './purchases';
import { grantBus, privacy } from './runtime';

export { ads, analytics, crash, purchases, adsTutorialDone };
export { EVENTS } from './events';
export type { EventName } from './events';
export type { Grant } from './grants';
export type { AdPlacement, AdResult, Ads, Analytics, Crash, ProductId, Props, Purchases } from './types';

/** The game's one listener for paid-out purchases (diamonds, boost, cosmetic, Plus); grants made before it listens are held. */
export const onGrant = grantBus.subscribe;

let started: Promise<void> | null = null;

/** Start every service once, opt-out first. Nothing here prompts the player; consent waits for the first ad. */
export function startServices(): Promise<void> {
  return (started ??= (async () => {
    await privacy.load();
    startCrash();
    await Promise.all([startAnalytics(), startPurchases(), startAds()]).catch((e) => crash.capture(e, 'startServices'));
  })());
}
