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

export interface ScenePanel {
  backdrop: Backdrop;
  /** 0–2 characters shown in the panel, left to right. */
  cast: { id: CharacterId; mood: Mood }[];
  /** Optional narration box at the top of the panel. */
  caption?: string;
  /** Optional foreground prop drawn into the scene. */
  prop?: 'vending-machine';
  /** 0–3 speech bubbles, shown in order. */
  lines: SceneLine[];
}

export type SceneTrigger =
  /** Plays when the neighborhood is unlocked (Downtown: on first launch). */
  | { kind: 'unlock'; neighborhood: NeighborhoodId }
  /** Plays when this many pizzas have been delivered to the neighborhood. */
  | { kind: 'deliveries'; neighborhood: NeighborhoodId; count: number };

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
  /** 3–5 panels */
  panels: ScenePanel[];
}
