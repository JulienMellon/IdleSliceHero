// What opens each layer (v5.25, card E9, closes D493). One rule in one place: a layer's gate is a hood (a position in the city's build order)
// built with so many mastery stars (content/layers.ts `LAYER_GATES`, content/rewards.ts `CAMEO_GATE`). The layer modules, the sim's session
// check and the cameo's scene all read these, so none of them keeps its own copy of the rule.
import { HOME_ID, cityOf, findHood, hoodIds, layerHood } from '../../../content/cities';
import { LAYER_GATES } from '../../../content/layers';
import { CAMEO_GATE } from '../../../content/rewards';
import type { NeighborhoodId } from '../../../content/types';
import type { GameState } from '../../game';
import { shopStars } from '../mastery';

export interface Gate {
  /** Position in the city's build order (0 = the first shop). */
  hood: number;
  stars: number;
}

/** The neighbourhood a gate names in this game's city, or null when the city has no such position. */
export const gateHood = (g: Pick<GameState, 'city'>, gate: Gate): NeighborhoodId | null => hoodIds(cityOf(g))[gate.hood] ?? null;

/**
 * The gates are the first city's: they space the layers over a new player's first sessions. A franchised player (Boston and after) has met every
 * layer, and the later cities are fitted to the home city's days (pacing-fit `franchise`), so they open on their own shop as before.
 */
export const gated = (g: Pick<GameState, 'city'>): boolean => cityOf(g).id === HOME_ID;

/** The gate's shop is built and has its stars (a city past the first has no gate: always met). */
export function gateMet(g: GameState, gate: Gate): boolean {
  if (!gated(g)) return true;
  const id = gateHood(g, gate);
  const shop = id === null ? undefined : g.shops[id];
  return !!shop?.built && shopStars(shop, cityOf(g)) >= gate.stars;
}

/** The rival may open (Suburbs at two stars). The shop's own beat 3 and build still apply (`rivalOpen`). */
export const rivalGateMet = (g: GameState): boolean => gateMet(g, LAYER_GATES.rival);

/** Boats run: Downtown at two stars and the boats' shop built. */
export const boatsOpen = (g: GameState): boolean => {
  const id = layerHood(cityOf(g), 'boats');
  return !!id && !!g.shops[id]?.built && gateMet(g, LAYER_GATES.boats);
};

/** The day-30 visitor may stand in the shop (Suburbs at one star). */
export const cameoOpen = (g: GameState): boolean => gateMet(g, CAMEO_GATE);

/** Why the boats are not running yet, or null when they are: the sentence the rack's card shows. */
export function boatsLock(g: GameState): string | null {
  const id = layerHood(cityOf(g), 'boats');
  if (!id || !g.shops[id]?.built) return 'Build this pizzeria first';
  if (gateMet(g, LAYER_GATES.boats)) return null;
  const gateId = gateHood(g, LAYER_GATES.boats);
  return `Earn ${LAYER_GATES.boats.stars} stars in ${(gateId && findHood(gateId, cityOf(g))?.name) || 'the first shop'} first`;
}
