// What a city's art pack hands the shared art code (docs/PLAN-refactor.md P6). One object per city, registered in cities/index.ts.
// Types only: a city's folder imports these, the shared files import the registry, and nothing here imports either.
import type { ReactElement } from 'react';

import type { Backdrop as BackdropId, CharacterId } from '../../content/types';
import type { SceneFn } from '../cutscene/backdrops/shared';
import type { Look } from '../portrait/look-data';

/** A city's backdrops: its scenes, their sky and glow, and the shop interior's window and shelf object for each of its neighbourhoods (null for a hood that is not this city's). */
export interface CityBackdrops {
  scenes: Partial<Record<BackdropId, SceneFn>>;
  sky: Partial<Record<BackdropId, [string, string]>>;
  glow: Partial<Record<BackdropId, string>>;
  shopWindow: (hood: string) => ReactElement | null;
  shopObject: (hood: string) => ReactElement | null;
}

/** What an outfit piece is given: the character, the shirt colour (undimmed) and the dimming function. */
export interface OutfitProps {
  who: CharacterId;
  shirt: string;
  tone: (c: string) => string;
}
export type OutfitFn = (p: OutfitProps) => ReactElement | null;

/** The part of a city's portraits that is pure data: who it adds, what they are called and who ages there. */
export interface CityLooks {
  looks: Partial<Record<CharacterId, Look>>;
  names: Partial<Record<CharacterId, string>>;
  /** One changed detail per character in this city's scenes (the home look otherwise). */
  aged: Partial<Record<CharacterId, Partial<Look>>>;
}

/** A city's portraits: its looks, and the drawing of its characters' outfits and of any hair behind a head. */
export interface CityPortraits extends CityLooks {
  outfits: Partial<Record<CharacterId, OutfitFn>>;
  /** Hair drawn behind the head (head 100-box coordinates), under the back hair every style draws. `hair` is already dimmed. */
  behindHead: Partial<Record<CharacterId, (p: { hair: string; tone: (c: string) => string }) => ReactElement | null>>;
}

export interface CityArt {
  backdrops: CityBackdrops;
  portraits: CityPortraits;
}
