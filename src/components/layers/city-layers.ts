// Which neighbourhood plays a layer in the CURRENT city (v5.18, card T2). The layer screens used to name their shop (Suburbs for Game Day,
// Uptown for the stars...); in a second city the same layer runs in another shop (Fenway, Southie...), so every screen asks the city's own
// `layers` table, the same one the engine reads (content/cities `layerHood`). Pure: unit-tested in node.
import { cityOf, layerHood } from '../../content/cities';
import type { LayerKind } from '../../content/cities/types';
import type { NeighborhoodId } from '../../content/types';
import type { GameState } from '../../engine/game';

/** The shop that plays the layer in this game's city ('' when the city has none: no shop has that id, so nothing matches it). */
export const hoodOf = (g: { city?: string }, kind: LayerKind): NeighborhoodId => layerHood(cityOf(g), kind) ?? '';

/** The shop that plays the layer once it is built, else null (a screen draws its layer only for that shop). */
export function builtHood(g: { city?: string } & Pick<GameState, 'shops'>, kind: LayerKind): NeighborhoodId | null {
  const id = hoodOf(g, kind);
  return id && g.shops[id]?.built ? id : null;
}
