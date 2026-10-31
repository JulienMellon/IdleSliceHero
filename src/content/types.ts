// Shared content types. Content (tuning + scenes) lives in data files, separate from logic.

export type NeighborhoodId =
  | 'downtown'
  | 'suburbs'
  | 'waterfront'
  | 'university'
  | 'industrial'
  | 'uptown';

export type VehicleId = 'bike' | 'scooter' | 'car' | 'van' | 'drone';

export type CharacterId =
  | 'nonna-rosa'
  | 'dale'
  | 'marisol'
  | 'priya'
  | 'big-sal'
  | 'genevieve'
  | 'victor-crust'
  | 'megaslice-rep';

export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';

/** Backdrop for a panel: a neighborhood, the player's shop, or MegaSlice HQ. */
export type Backdrop = NeighborhoodId | 'shop' | 'megaslice-hq' | 'downtown-rain';

export interface SceneLine {
  /** Display name shown on the speech bubble, e.g. "Nonna Rosa". Use "You" for the player. */
  speaker: string;
  text: string;
}

/** One character on stage. */
export interface CastMember {
  id: CharacterId;
  mood: Mood;
}
/** 0–2 characters, left to right: the stage has two slots, so a third figure is a type error rather than a crash (C100). */
export type Cast = readonly [] | readonly [CastMember] | readonly [CastMember, CastMember];

export interface ScenePanel {
  backdrop: Backdrop;
  cast: Cast;
  /** Optional narration box at the top of the panel. */
  caption?: string;
  /** Optional foreground prop drawn into the scene. */
  prop?: 'vending-machine' | 'sold-sign' | 'recipe-card';
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
  | { kind: 'bid'; neighborhood: NeighborhoodId };

export type SceneReward = 'auto-bake' | 'drones' | 'city-complete';

export interface Scene {
  id: string; // e.g. "waterfront-3"
  city: 'home';
  character: CharacterId;
  neighborhood: NeighborhoodId;
  /** 1 = unlock, 2 = first milestone, 3 = complication (MegaSlice moves in), 4 = resolution */
  beat: 1 | 2 | 3 | 4;
  title: string;
  trigger: SceneTrigger;
  /** Gameplay unlock granted when the scene finishes. */
  reward?: SceneReward;
  /** Grants this neighbourhood's perk (PERKS) when the scene finishes. */
  perk?: true;
  /** 3–5 panels */
  panels: ScenePanel[];
}
