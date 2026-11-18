// Shared content types. Content (tuning + scenes) lives in data files, separate from logic.
import type { CharacterId } from './cast';

/** Every character a scene can put on stage: each city pack's `cast.ts`, concatenated in ./cast.ts (card R7a). A new city's characters are added there. */
export { CHARACTER_IDS } from './cast';
export type { CharacterId };

/** A neighbourhood's id. v5.18 (card K1): a plain string, checked against the current city (`cityOf(g).neighbourhoods`; src/content/__tests__/city-schema.test.ts), not a closed union: a second city is a second folder. */
export type NeighborhoodId = string;

/** The home city's six ids, for the home pack's own tables (scenes, art) where a typo should still fail to compile. */
export type HomeNeighborhoodId = 'downtown' | 'suburbs' | 'waterfront' | 'university' | 'industrial' | 'uptown';

export type VehicleId = 'bike' | 'scooter' | 'car' | 'van' | 'drone';


/** Speaker names that are not a character, a head, a manager or a lieutenant of the city: the player, and Todd's unnamed disguise. */
export const NARRATOR_SPEAKERS: readonly string[] = ['You', 'Trench Coat', 'Todd'];

export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';

/** Backdrop for a panel: a neighborhood, the player's shop, or MegaSlice HQ. */
export type Backdrop = NeighborhoodId | (typeof FIXED_BACKDROPS)[number];

export interface SceneLine {
  /** Display name shown on the speech bubble, e.g. "Nonna Rosa". Use "You" for the player. */
  speaker: string;
  text: string;
  /** The line plays only when this scene has been seen (a manager speaking before or after their hire scene); otherwise the panel plays without it. */
  ifSeen?: string;
}

/** One character on stage. */
export interface CastMember {
  id: CharacterId;
  mood: Mood;
}
/** 0–2 characters, left to right: the stage has two slots, so a third figure is a type error rather than a crash (C100). */
export type Cast = readonly [] | readonly [CastMember] | readonly [CastMember, CastMember];

export const PROP_IDS = [
  'vending-machine',
  'sold-sign',
  'recipe-card',
  'order-slip',
  'name-tag',
  'phone-footage',
  'coupon',
  'envelope',
  'apron',
  'contract',
  'clipboard',
  'phone',
  'photo',
  'thermometer',
  'pantry-shelf',
  'half-ladle',
  'scorecard',
  'golden-ladle',
  'pretzel',
] as const;
export type PropId = (typeof PROP_IDS)[number];

/** The backdrops that belong to no neighbourhood. */
export const FIXED_BACKDROPS = ['shop', 'megaslice-hq', 'downtown-rain'] as const;

export interface ScenePanel {
  backdrop: Backdrop;
  cast: Cast;
  /** Optional narration box at the top of the panel. */
  caption?: string;
  /** Optional foreground prop drawn into the scene (PROP_IDS). */
  prop?: PropId;
  /** Text drawn on the prop (a name tag: "SENIOR ASSOCIATE", "TODD · ROSA'S"). */
  propText?: string;
  /** 0–3 speech bubbles, shown in order. */
  lines: SceneLine[];
  /** Story music for this panel (docs/AUDIO.md). Beats 1–3 get a default from `panelCue`; set it for wins and reveals. */
  cue?: PanelCue;
}

/** A story cue a panel can start (docs/AUDIO.md, AU12/AU13). */
export type PanelCue = 'welcome' | 'warmth' | 'megaslice' | 'rep' | 'triumph' | 'bell-triumph' | 'recipe' | 'reunion' | 'victor-exit' | 'city-theme' | 'none';

export type SceneTrigger =
  /** Plays when the neighborhood is unlocked (Downtown: on first launch). */
  | { kind: 'unlock'; neighborhood: NeighborhoodId }
  /** Plays when this many pizzas have been delivered to the neighborhood. */
  | { kind: 'deliveries'; neighborhood: NeighborhoodId; count: number }
  /** Plays when the player wins this neighbourhood's bid (Pier 9). */
  | { kind: 'bid'; neighborhood: NeighborhoodId }
  /** Interlude: plays this much play time (`seconds`) after `scene` was seen, once the neighbourhood's shop is built. */
  | { kind: 'after'; neighborhood: NeighborhoodId; scene: string; seconds: number }
  /** Beat 4: plays when the player has won this neighbourhood's rival challenge (`challengeWon`, features/layers/rival.ts). */
  | { kind: 'challenge'; neighborhood: NeighborhoodId }
  /** Manager hire scene: plays when this neighbourhood's shop has its General Manager. */
  | { kind: 'manager'; neighborhood: NeighborhoodId };

export type SceneReward = 'auto-bake' | 'drones' | 'city-complete';

export interface Scene {
  id: string; // e.g. "waterfront-3"
  /** The id of the city this scene belongs to (CityDef.id). */
  city: string;
  character: CharacterId;
  neighborhood: NeighborhoodId;
  /** 1 = unlock, 2 = first milestone, 3 = complication (MegaSlice moves in), 4 = resolution; 'interlude' = a Todd scene or a manager's hire scene between beats (id is not `<neighbourhood>-<beat>`). */
  beat: 1 | 2 | 3 | 4 | 'interlude';
  title: string;
  trigger: SceneTrigger;
  /** Scenes that must be seen before this one may play (this also holds a main beat back behind an interlude). A scene named by an `after` trigger is required too. */
  requires?: string[];
  /** Gameplay unlock granted when the scene finishes. */
  reward?: SceneReward;
  /** Grants this neighbourhood's perk (CityDef.perks) when the scene finishes. */
  perk?: true;
  /** 3–5 panels */
  panels: ScenePanel[];
}
