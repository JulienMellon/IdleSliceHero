// Web, tests and the screenshot run: no SDK. `?ads=rewarded|dismissed|unavailable` picks the answer (default unavailable).
import { queryFlag } from './query';
import type { AdResult, Ads } from './types';

const mode = (): AdResult => {
  const v = queryFlag('ads');
  return v === 'rewarded' || v === 'dismissed' ? v : 'unavailable';
};

export const ads: Ads = {
  ready: () => mode() !== 'unavailable',
  show: async () => mode(),
};

/** The tutorial is over: the iOS build may now ask for consent. Nothing to do here. */
export function adsTutorialDone(): void {}
export async function startAds(): Promise<void> {}
