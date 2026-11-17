// The scene's big moments as plain data (D415, D418): where the milestone badge and the rising "Lv N" chip go, and how
// long the chip row dims. Pure, so the budgets are tested in node (the drawing lives in kitchen-hud.tsx).
import { STATIONS_IN_ORDER, type Station } from '../../engine/pipeline';
import { MILESTONE_LINES, crossedMilestone, milestoneSpeaker } from './ladder';
import type { Layout } from './layout';
import { ONE_SCREEN, P, kAt } from './projection';
import type { Rect } from './stations';

/** A station reaches Lv 25 / 50 / 100: a gold badge 72 pt across, centred over the station's furniture. */
export const MILE_R = 36;
export const MILE_SECONDS = 1.6;
/** The chip row (rail, rings, count pills) dims while the badge is up, so the badge is the only thing to read. */
export const HUD_DIM_SECONDS = 1.2;
export const HUD_DIM_OPACITY = 0.3;
/** The chip row's half-height on screen: the rail is 30 tall; the rings' count pills reach a little lower. */
export const CHIP_ROW_HALF = 15;
/** Air between the chip row and anything that rises or pops under it. */
export const ROW_AIR = 4;

export const STATION_LABEL: Record<Station, string> = { prep: 'PREP', oven: 'OVENS', counter: 'COUNTER' };

/** The gap kept between the badge's lower edge and the hat of the head it celebrates (D429: the badge used to sit on the cook). */
export const MILE_HAT_GAP = 30;

/** Screen y of the top of the tallest hat among the people who work a station (a cook's toque, a baker's cap, the cashier's cap): ~56 tall at their depth scale. */
export function stationHatTop(lay: Pick<Layout, 'cooks' | 'bakers' | 'staff'>, st: Station): number {
  const tops = (people: { x: number; y: number }[]) => people.map(({ y }) => P(0, y)[1] - 56 * kAt(y) * 1.14);
  const cookY = lay.cooks.length === 1 ? 74 : 92;
  const who = st === 'prep' ? lay.cooks.map((x, i) => ({ x, y: cookY + (i % 2) * 8 })) : st === 'oven' ? lay.bakers : lay.staff.map((x) => ({ x, y: 92 }));
  return Math.min(...tops(who));
}

/**
 * Where the badge's centre goes: over the station's middle, but 30 above the hats of the people who work it (the badge used to
 * cover the very cook it celebrated), and never so high that its top reaches the chip row (if the hats leave less room than
 * 30 + 72 the badge takes what there is, as high as the row allows).
 */
export function mileAnchor(rect: Rect, rowY: number, hatTop = Number.POSITIVE_INFINITY, sceneW: number = ONE_SCREEN.width): { cx: number; cy: number } {
  const lowest = rowY + CHIP_ROW_HALF + ROW_AIR + MILE_R;
  const mid = (rect.y0 + rect.y1) / 2;
  // D440: shifted MILE_SHIFT down and right of the station's middle, off the two station chips and the awning corner it used to hide; kept on screen
  const cx = Math.min(sceneW - MILE_R - MILE_EDGE, (rect.x0 + rect.x1) / 2 + MILE_SHIFT);
  return { cx, cy: Math.max(lowest, Math.min(mid, hatTop - MILE_HAT_GAP - MILE_R)) + MILE_SHIFT };
}
/** D440: how far (pt) the badge sits down and to the right of where D429 put it, and the air it keeps from the screen's right edge. */
export const MILE_SHIFT = 20;
export const MILE_EDGE = 2;
/** Air (screen pt) a speech pill keeps from the wall it stands inside. */
export const BUBBLE_AIR = 2;
/** The speech pill's width for its text (10 pt bold plus padding). */
export const bubbleWidth = (text: string) => text.length * 5.6 + 16;
/** The shop's side walls as a speech pill sees them: from the left pilaster's inner edge to the right pilaster's (D440: Marco's pill poked through the left wall at x 22). */
export function bubbleWalls(lay: Pick<Layout, 'L' | 'R' | 'frame'>): { x0: number; x1: number } {
  return { x0: P(lay.L + 8, 0, 0, lay.frame)[0], x1: P(lay.R - 8, 0, 0, lay.frame)[0] };
}
/** The pill's centre x: its anchor, moved to keep the whole pill inside the walls (and the scene), whichever is tighter. */
export function bubbleX(x: number, w: number, walls: { x0: number; x1: number }, sceneW: number = ONE_SCREEN.width): number {
  const lo = Math.max(walls.x0 + BUBBLE_AIR, 4) + w / 2;
  const hi = Math.min(walls.x1 - BUBBLE_AIR, sceneW - 4) - w / 2;
  return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, x));
}
/** The waiting pill stays hidden this long after a milestone starts, so the badge and the confetti are the only things to read (D429). */
export const MILE_PILL_HIDE_S = 1.5;
export const hidesWaitingPill = (age: number) => age >= 0 && age < MILE_PILL_HIDE_S;
/** The head's speech pill hangs directly under the badge: its tail tip touches the disc's lower edge. */
export const mileSpeechY = (cy: number) => cy + MILE_R + 20;

/** Pop-in scale by age (s): 0.5 → 1.12 → 1 over the first 0.3 s, snapped to tenths so the memoised badge re-renders only ~4 times. */
export function mileScale(age: number): number {
  if (age < 0 || age >= MILE_SECONDS) return 0;
  if (age >= 0.3) return 1;
  const k = age / 0.3;
  return Math.round((k < 0.6 ? 0.5 + (k / 0.6) * 0.62 : 1.12 - ((k - 0.6) / 0.4) * 0.12) * 10) / 10;
}
/** Badge opacity: full, then fading over its last 0.3 s (in fifths). */
export const mileOpacity = (age: number) => (age < 0 || age >= MILE_SECONDS ? 0 : age > MILE_SECONDS - 0.3 ? Math.round(((MILE_SECONDS - age) / 0.3) * 5) / 5 : 1);
/** The chip row's opacity `age` seconds after a milestone began (1 outside the dim). */
export const hudOpacity = (age: number) => (age >= 0 && age < HUD_DIM_SECONDS ? HUD_DIM_OPACITY : 1);
/** Font size of "Lv 25" / "Lv 100" so the level fits the disc's chord. */
export const mileLevelSize = (text: string) => (text.length > 5 ? 20 : 24);
/** "+108% faster" → "+108%": the speed-up rides in the badge instead of a second pill. */
export const mileSub = (flash: string | null) => (flash ? flash.replace(/\s*faster$/, '') : null);

/**
 * The "Lv N" chip's centre `k` (0..1) of the way through its rise: it starts on the station's furniture and floats
 * `rise` up, but never into the chip row (D418: it used to start on the badge and cross the Ovens count). `r` is the chip's radius.
 */
export function chipAt(rect: Rect, rowY: number, r: number, k: number, rise: number): { x: number; y: number } {
  const start = (rect.y0 + rect.y1) / 2;
  return { x: (rect.x0 + rect.x1) / 2, y: Math.max(rowY + CHIP_ROW_HALF + ROW_AIR + r, start - k * rise) };
}

// ---------- A28: the level-up state machine, out of the storefront's effect ----------
/** The four stations whose level buys bounce their furniture (v5.11); ovens are 'oven' as everywhere else. */
export type Bounced = Station | 'drivers';
export const BOUNCED: readonly Bounced[] = ['prep', 'oven', 'counter', 'drivers'];
export type PerStation = Record<Bounced, number>;

/** What the scene remembers between frames about upgrades: last frame's speeds and levels, and the moments they started. */
export interface Moments {
  speeds: PerStation | null;
  levels: PerStation | null;
  /** What an upgrade did, over the station's badge (or over the door for drivers). */
  flash: { st: Station | 'door'; at: number; text: string } | null;
  bounce: { st: Bounced; at: number } | null;
  chip: { st: Bounced; at: number; text: string } | null;
  /** A station just reached Lv 25 / 50 / 100 (null text: nobody to say it). */
  mile: { st: Station; at: number; text: string | null; level: number } | null;
}
export const newMoments = (): Moments => ({ speeds: null, levels: null, flash: null, bounce: null, chip: null, mile: null });

/** What this frame shows: station speeds (per minute; drivers = their count), levels, which heads are hired and their names. */
export interface MomentsInput {
  speeds: PerStation;
  levels: PerStation;
  hired: Record<Station, boolean>;
  headNames: Record<Station, string>;
  downtown: boolean;
}

/**
 * One frame of the upgrade moments: an upgrade that sped a station up flashes by how much; a level that went up bounces the furniture and
 * raises a "Lv N" chip; a Lv 25 / 50 / 100 adds the milestone (D415) and, for a hired head, asks the head to speak (`asks`: those stations).
 * The first frame (no previous speeds or levels) starts nothing. Pure: `prev` is not changed.
 */
export function stepMoments(prev: Moments, now: MomentsInput, clock: number): { moments: Moments; asks: Station[] } {
  const next: Moments = { ...prev, speeds: now.speeds, levels: now.levels };
  const asks: Station[] = [];
  if (prev.speeds) {
    const pct = (a: number, b: number) => Math.round((b / a - 1) * 100);
    const added = now.speeds.drivers - prev.speeds.drivers;
    if (added > 0) next.flash = { st: 'door', at: clock, text: `+${added} driver${added > 1 ? 's' : ''}` };
    for (const st of STATIONS_IN_ORDER) if (now.speeds[st] > prev.speeds[st] * (1 + 1e-9)) next.flash = { st, at: clock, text: `+${pct(prev.speeds[st], now.speeds[st])}% faster` };
  }
  if (prev.levels) {
    for (const st of BOUNCED) {
      if (now.levels[st] <= prev.levels[st]) continue;
      next.bounce = { st, at: clock };
      next.chip = { st, at: clock, text: `Lv ${now.levels[st]}` };
      if (st === 'drivers') continue;
      const hit = crossedMilestone(prev.levels[st], now.levels[st]);
      if (!hit) continue;
      // a hired head speaks the copy's milestone bark (decided by the caller, if the shop's one bubble is free); Nonna, with no head hired Downtown, keeps her own line
      const who = milestoneSpeaker(now.hired[st], now.headNames[st], now.downtown);
      next.mile = { st, at: clock, text: who && !now.hired[st] ? `${who}: ${MILESTONE_LINES[st][hit]}` : null, level: now.levels[st] };
      if (now.hired[st]) asks.push(st);
    }
  }
  return { moments: next, asks };
}
