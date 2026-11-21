// The tutorial's vocabulary (card C3, review A43): the engine's steps name these, the Coach overlay and the registry (components/coach) re-export them.

/** What a step lets the player do: tap the lit spot; wait (nothing to tap); look (a moment to see it); free play. */
export type CoachMode = 'tap' | 'wait' | 'look' | 'free';

/** Every spot the tutorial can point at. Scene ids are registered by the storefront (card C2), drawer ids by the drawer (card C3). */
export type CoachTargetId =
  | 'station:prep'
  | 'station:oven'
  | 'station:counter'
  | 'dial:prep'
  | 'dial:oven'
  | 'dial:counter'
  | 'ovens:all'
  | 'hud:cash'
  | 'hud:goal'
  | 'walk:prep'
  | 'walk:ovens'
  | 'walk:counter'
  | 'walk:drivers'
  | 'walk:all'
  | 'drawer:hire:prep';
