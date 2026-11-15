import type { Props } from './types';

/** Analytics events. No personal data in props: ids, counts and placement names only. */
export const EVENTS = {
  adOffered: 'ad_offered',
  adStarted: 'ad_started',
  adCompleted: 'ad_completed',
  iapViewed: 'iap_viewed',
  iapPurchased: 'iap_purchased',
  sceneSeen: 'scene_seen',
  shopBuilt: 'shop_built',
  sessionStart: 'session_start',
  sessionEnd: 'session_end',
} as const;
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Prop keys that must never be sent, whatever a caller passes. */
const BANNED = /^(email|name|user|username|phone|address|ip|idfa|idfv|token|password|lat|lon|location)$/i;

/** Drops banned keys and non-primitive values; long strings are cut to 100 chars. */
export function cleanProps(props?: Props): Props | undefined {
  if (!props) return undefined;
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    if (BANNED.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 100);
    else if (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'boolean') out[k] = v;
  }
  return out;
}
