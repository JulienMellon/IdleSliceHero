// An ambient bark (v5.25, card T3 and E9: `useGame.ambientBark`) as the scene draws it: the same bubble a head's own bark uses, under the badge of the station whose head speaks.
// Pure (no React). A speaker who is not one of the shop's heads (Captain Marisol, Dale: perk holders heard over the shop) speaks from the counter.
import type { Station } from '../../engine/pipeline';
import { HEAD_BARKS } from '../../content/heads';

/** The store's `ambientBark`, as far as the scene reads it. */
export interface AmbientBarkInput {
  text: string;
  speaker: string;
  shop: string;
  /** The wall time (ms) it began. */
  at: number;
}

/** What the storefront's bark bubble takes: a station, the line and the wall second it began (the shape of a head's own bark). */
export interface BarkShown {
  st: Station;
  text: string;
  at: number;
}

/** The station of the head named `speaker` (a head's display name), the counter when it is nobody's. */
export function speakerStation(heads: Readonly<Record<Station, string>>, speaker: string): Station {
  return (['prep', 'oven', 'counter'] as const).find((st) => heads[st] === speaker) ?? 'counter';
}

/** The ambient bark to draw in shop `id` at wall time `nowMs`: only its own shop's, only for the 2.5 s the bubble stays up. */
export function ambientBarkOn(bark: AmbientBarkInput | null, id: string, heads: Readonly<Record<Station, string>>, nowMs: number): BarkShown | null {
  if (!bark || bark.shop !== id || !bark.text) return null;
  const age = (nowMs - bark.at) / 1000;
  if (age < 0 || age >= HEAD_BARKS.seconds) return null;
  return { st: speakerStation(heads, bark.speaker), text: bark.text, at: bark.at / 1000 };
}
