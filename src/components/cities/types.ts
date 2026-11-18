// What a city's art pack hands the shared art code (docs/PLAN-refactor.md P6). One object per city, registered in cities/index.ts.
// Types only: a city's folder imports these, the shared files import the registry, and nothing here imports either.
import type { ComponentType, ReactElement } from 'react';

import type { Backdrop as BackdropId, CharacterId } from '../../content/types';
import type { Box, ShopLook as RoomLook } from '../cutscene/backdrop-art';
import type { SceneFn } from '../cutscene/backdrops/shared';
import type { Look } from '../portrait/look-data';
import type { ShopLook } from '../scene/identity';

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

/** The sky and ground behind a shop on the street: three sky stops (top to bottom) and two ground greens. */
export interface StreetLook {
  sky: [string, string, string];
  ground: string;
  ground2: string;
}

/** A city's shop art as pure data (so node tests import it): every map below is keyed by the city's neighbourhood ids. */
export interface CityShopArt {
  /** How the pizzeria is painted on the street (scene/identity.ts LOOKS). */
  looks: Readonly<Record<string, ShopLook>>;
  /** The street's sky and ground behind it (scene/background.tsx LOOK). */
  street: Readonly<Record<string, StreetLook>>;
  /** The tall or lettered cut-scene pieces the layout tests measure, in art units, by name (cutscene/backdrop-art.ts SIGN_BOXES, keyed `<city id>/<name>`). */
  signs: Readonly<Record<string, Box>>;
  /** The shop interior's room in a cut-scene (cutscene/backdrop-art.ts SHOP_LOOKS). */
  rooms: Readonly<Record<string, RoomLook>>;
}

export type MapRoad = readonly [x0: number, y0: number, x1: number, y1: number];

/** One city's map drawing (the City screen), in the map's 100 by 84 units. */
export interface MapArt {
  /** The ground under everything (the map's panel behind it uses the same colour). */
  ground: string;
  roads: readonly MapRoad[];
  /** The sea or bay: a closed shape off the right edge. */
  water: { d: string; rim: string; color: string };
  /** A river drawn before the roads, so a road over it is a bridge; null when the city has none. */
  river: { d: string; color: string } | null;
  trees: readonly (readonly [number, number])[];
  /** What stands in the middle of town. */
  centre: 'piazza' | 'common';
  /** A landmark in the open lot (it gives way to the franchise lot when one is offered). */
  landmark: 'none' | 'ballpark';
}

/** The pure half of a city's art (what node tests can import): its shop art and its map, which starts from the home city's map (same streets, new names). */
export interface CityData {
  shop: CityShopArt;
  map: (home: MapArt) => MapArt;
}

/** The drawn half: the registry (index.ts) hands each of these to the shared file that draws it. */
export interface CityArt {
  backdrops: CityBackdrops;
  portraits: CityPortraits;
  /** The skyline behind each of the city's shops on the street, by neighbourhood id. `Windows` is the shared window grid. */
  skylines: (kit: { Windows: ComponentType<WindowsProps> }) => Record<string, () => ReactElement>;
  /** What stands along the foot of the "Coming soon" card announcing this city (a viewBox 0 0 200 60 drawing). */
  teaserSkyline: ReactElement;
}

export interface WindowsProps {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}
