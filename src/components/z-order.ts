// The game screen's stacking order, as one decision (r4: G118, D543, K5).
// Every sibling layer of the root view in app/index.tsx takes its zIndex from here, lowest first. A layer without an entry
// sits at 0 (the scene area, the shop tabs, the drawers inside it), under all of these.
//   hud        the goal bar, the cash pill and the chapter ribbon that hangs over the shop tabs
//   coach      Nonna's scrim with its cut-out: over the HUD (a tap on the HUD must not get past it), under every sheet
//   gift       the daily calendar
//   nightOven  the night-oven sheet
//   sheets     the SHEETS slot (report, layers, claim, starter...)
//   offline    the "Welcome back" popup: over the coach's scrim so Collect always takes a tap
//   coins      payout coins fly over everything, the offline popup's burst included (D454)
export const Z = {
  hud: 2,
  coach: 3,
  gift: 4,
  nightOven: 5,
  sheets: 6,
  offline: 7,
  coins: 8,
} as const;

export type ZLayer = keyof typeof Z;
