// The Waterfront stretch's ambient beats and the gates of the interludes that need more than a trigger (v5.25, card T3; docs/story/COPY-v5.25.md section 6).
// Waterfront's first scene (32.5 min) to its manager's (90.5 min) was a 58-minute wait with no story beat. W6 wrote six interludes chained from
// waterfront-1 (every 9 minutes) and 13 ambient beats between them (every 3): the longest active session-1 gap is measured by `npx tsx scripts/pacing-fit.ts session1`,
// which reads `HOME_AMBIENT` with the scenes. The words of an ambient beat are the copy key (`content/copy/home/ambient.ts`); a bark is `speaker` saying it over
// `shop`, a banner a plain line. Pure data and two pure checks (`sceneGateMet`, `ambientDue`) that take the game's facts as plain values; the engine's hook (card Needs) supplies them.
import type { HeadKind } from '../../../tuning';
import type { NeighborhoodId } from '../../../types';

/** One ambient beat: it plays `seconds` of play time after `after` (a scene id) was seen, over `shop`'s kitchen. */
export interface AmbientBeat {
  /** The copy key of its words, `ambient.wf.<n>`. */
  key: string;
  after: string;
  seconds: number;
  shop: NeighborhoodId;
  kind: 'bark' | 'banner';
  /** The speaker of a bark (the display name); absent for a banner. */
  speaker?: string;
  /** Plays only while this shop has no manager. */
  noManager?: NeighborhoodId;
}

const bark = (n: number, after: string, seconds: number, shop: NeighborhoodId, speaker: string, extra: Partial<AmbientBeat> = {}): AmbientBeat => ({
  key: `ambient.wf.${n}`,
  after,
  seconds,
  shop,
  kind: 'bark',
  speaker,
  ...extra,
});
const banner = (n: number, after: string, seconds: number, shop: NeighborhoodId): AmbientBeat => ({
  key: `ambient.wf.${n}`,
  after,
  seconds,
  shop,
  kind: 'banner',
});

/** The 13 ambient beats, in the order they play (each 180 s of play after the one before it, between the interludes). */
export const HOME_AMBIENT: readonly AmbientBeat[] = [
  bark(1, 'waterfront-1', 180, 'waterfront', 'Captain Marisol'),
  bark(2, 'waterfront-1', 360, 'downtown', 'Nonna Rosa'),
  bark(3, 'waterfront-1b', 180, 'suburbs', 'Dale'),
  banner(4, 'waterfront-1b', 360, 'waterfront'),
  bark(5, 'downtown-4b', 180, 'waterfront', 'Captain Marisol'),
  bark(6, 'downtown-4b', 360, 'downtown', 'Marco'),
  bark(7, 'waterfront-1c', 180, 'waterfront', 'Captain Marisol'),
  bark(8, 'waterfront-1c', 360, 'suburbs', 'Dale'),
  banner(9, 'suburbs-1b', 180, 'suburbs'),
  bark(10, 'suburbs-1b', 360, 'downtown', 'Lucia'),
  bark(11, 'downtown-4c', 180, 'waterfront', 'Captain Marisol'),
  banner(12, 'downtown-4c', 360, 'waterfront'),
  bark(13, 'waterfront-1d', 120, 'waterfront', 'Captain Marisol', { noManager: 'waterfront' }),
];

/** What an interlude waits for besides its trigger (the engine's `sceneGateMet` reads it; a scene with no entry has no extra gate). */
export interface SceneGate {
  /** Not before the boats are open (`boatsOpen`, engine/features/layers/gates.ts). */
  boats?: true;
  /** Only while this shop has no manager: once it has one, the scene never plays. */
  noManager?: NeighborhoodId;
  /** Only once this shop's head of that kind is hired (the scene speaks as that head). */
  heads?: readonly { shop: NeighborhoodId; kind: HeadKind }[];
}

/**
 * The interludes with a gate. downtown-1b also waits for the tutorial to end: the store already holds every scene until then (`tutorialHoldsStory`),
 * so it needs no entry. Gus (the Waterfront oven head) speaks in waterfront-1b and Finn (its prep head) in waterfront-1c.
 */
export const SCENE_GATES: Readonly<Record<string, SceneGate>> = {
  'waterfront-1b': { heads: [{ shop: 'waterfront', kind: 'oven' }] },
  'waterfront-1c': { boats: true, heads: [{ shop: 'waterfront', kind: 'prep' }] },
  'waterfront-1d': { noManager: 'waterfront' },
};

/** What a gate asks of the game, as plain values (the engine builds it from the game state). */
export interface GateFacts {
  boatsOpen: boolean;
  managed: (shop: NeighborhoodId) => boolean;
  headHired: (shop: NeighborhoodId, kind: HeadKind) => boolean;
}

/** Whether the scene's extra gate (`SCENE_GATES`) is met; a scene with none always is. */
export function sceneGateMet(sceneId: string, f: GateFacts): boolean {
  const gate = SCENE_GATES[sceneId];
  if (!gate) return true;
  if (gate.boats && !f.boatsOpen) return false;
  if (gate.noManager !== undefined && f.managed(gate.noManager)) return false;
  return (gate.heads ?? []).every((h) => f.headHired(h.shop, h.kind));
}

/**
 * Whether an ambient beat is due: the scene it follows was seen at `sceneAt[after]` (play seconds) and `seconds` of play have passed, and its own gate holds
 * (`noManager`). The engine plays it once.
 */
export function ambientDue(
  beat: AmbientBeat,
  sceneAt: Readonly<Record<string, number | undefined>>,
  playSeconds: number,
  f: Pick<GateFacts, 'managed'>,
): boolean {
  const at = sceneAt[beat.after];
  if (at === undefined || at + beat.seconds > playSeconds) return false;
  return beat.noManager === undefined || !f.managed(beat.noManager);
}
