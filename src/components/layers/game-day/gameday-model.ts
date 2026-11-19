// Suburbs, Game Day, as plain data (v5.16 S2a): the HUD chip, the banner, the free seats that glow, the wave of families walking in and
// the "+$X from Game Day" pop. The rules are engine/features/layers/game-day.ts (`gameDayView`); the words are the copy table.
// The wave reuses the people builders (`Person` props from scene/looks) and keeps to the crowd budgets (wave-budget.test.ts). Pure.
import { GAME_DAY } from '../../../content/layers';
import { money } from '../../../engine/format';
import type { GameDayView } from '../../../engine/features/layers/game-day';
import type { PersonProps } from '../../scene/looks';
import { PATIO_SEAT, SEAT, type Layout } from '../../scene/layout';
import { STEP_FRAMES } from '../../scene/quantise';
import { P, frameRight, unprojectX } from '../../scene/projection';
import { dressed } from '../../../content/copy';
import { fillText, LABELS, lc, lcc } from '../layer-text';
import { mmss } from '../layer-model';

// ---------- the HUD chip and the banner ----------

/** The chip's text ("Game Day 7:42" counting down to the next game; during the rush, the rush's seconds left), or '' when the layer is not live. */
export function gameDayChipText(v: GameDayView, city?: string): string {
  if (!v.active) return '';
  const time = mmss(v.rush ? v.left : v.nextIn);
  // a city may word the rush itself ("Fans flood Fenway 0:31"); before it, every city says "Game Day 7:42"
  const rush = v.rush ? dressed(city, 'layer.suburbs.gameday.chip.rush', '') : '';
  return rush ? fillText(rush, { time }) : lc('layer.suburbs.gameday.chip', { time });
}

/** The chip shows beside the game-day shop (`hood`: Suburbs at home, `hoodOf(g, 'gameDay')`), and anywhere while the rush runs (it is over in 45 s: the player should know). */
export const gameDayChipShown = (v: GameDayView, active: string, hood: string): boolean => v.active && (v.rush || active === hood);

/** The banner while the rush runs. */
export const gameDayBanner = (v: GameDayView, city?: string): string => (v.active && v.rush ? lcc(city, 'layer.suburbs.gameday.banner') : '');

// ---------- free seats ----------

export interface Chair {
  x: number;
  y: number;
  /** A patio chair (smaller set). */
  patio: boolean;
}

/**
 * Every chair a family can take, in the order the rush fills them: the right-hand chair of each table (the regular keeps the left one:
 * scene/cast.ts), indoors first, then the patio's, then the left chairs.
 */
export function chairsOf(lay: Pick<Layout, 'tables' | 'patio'>, patioShown: number): Chair[] {
  const right: Chair[] = [];
  const left: Chair[] = [];
  for (const t of lay.tables) {
    right.push({ x: t.x + SEAT, y: t.y, patio: false });
    left.push({ x: t.x - SEAT, y: t.y, patio: false });
  }
  for (const t of lay.patio.slice(0, Math.max(0, patioShown))) {
    right.push({ x: t.x + PATIO_SEAT, y: t.y, patio: true });
    left.push({ x: t.x - PATIO_SEAT, y: t.y, patio: true });
  }
  return [...right, ...left];
}

/** How many chairs the rush can fill: the free share of the seats, in chairs (two seats a chair), at least one while any seat is free. */
export function freeChairs(totalChairs: number, v: Pick<GameDayView, 'seatsFree' | 'seats'>): number {
  if (v.seats <= 0 || v.seatsFree <= 0 || totalChairs <= 0) return 0;
  return Math.max(1, Math.min(totalChairs, Math.round((totalChairs * v.seatsFree) / v.seats)));
}

// ---------- the wave ----------

export const WAVE = {
  /** Families on screen at once (each is an adult and a child): the crowd budget. */
  maxGroups: 2,
  /** A family's pace (room units a second); the walk takes as long as the way to the door (`walkTime`). */
  speed: 24,
  /** The lane the families walk along (room y): nearer than the sidewalk queues (y -7) and the parked vehicle's lane (-30), as the walk-ins' lane is. */
  laneY: -42,
  /** The door is reached at this depth, where the family fades (the doormat is y -8…-22: they fade in front of it). */
  doorY: -30,
  /** A family fades over the last part of its walk. */
  fadeFrom: 0.6,
  /** The child walks this many room units behind the adult. */
  kidLag: 24,
  /** The child is drawn this much of the adult's size. */
  kidScale: 0.78,
} as const;

/** Room units kept between one family's adult and the next family's child (a figure is about 26 wide on screen, so 30 leaves air). */
export const FAMILY_AIR = 30;

/** The straight walk from beyond the right edge to the door, in room units along x. */
export const walkLength = (lay: Pick<Layout, 'door' | 'frame'>): number =>
  unprojectX(frameRight(lay.frame) + 26, WAVE.laneY, lay.frame) - lay.door.lanes.guestX;

/** Seconds a family takes from the screen edge to the door: the way over the pace. The flagship's door is near the edge, so its walk is short. */
export const walkTime = (lay: Pick<Layout, 'door' | 'frame'>): number => Math.max(1, walkLength(lay)) / WAVE.speed;

/**
 * Seconds between one family appearing and the next: long enough that the next adult stays FAMILY_AIR clear of the last family's child
 * at the same pace, and never more than `maxGroups` families on a walk at once.
 */
export const waveGap = (lay: Pick<Layout, 'door' | 'frame'>): number => Math.max(walkTime(lay) / WAVE.maxGroups, (WAVE.kidLag + FAMILY_AIR) / WAVE.speed);

/** Seats a family fills (an adult and a child): half a table's four, so one chair of the two at a table. */
export const FAMILY_SEATS = 2;

/** Families the rush brings: one per two free seats, to what fits in the rush at the walking gap and walk. */
export function familiesFor(seatsFree: number, lay: Pick<Layout, 'door' | 'frame'>): number {
  const fit = Math.floor((GAME_DAY.rushSeconds - walkTime(lay)) / waveGap(lay)) + 1;
  return Math.max(0, Math.min(fit, Math.ceil(seatsFree / FAMILY_SEATS)));
}

/** Seconds between families when `families` come: spread over the rush (the wave lasts as long as the rush does), never closer than `waveGap`. */
export const spreadGap = (lay: Pick<Layout, 'door' | 'frame'>, families: number): number =>
  Math.max(waveGap(lay), (GAME_DAY.rushSeconds - walkTime(lay)) / Math.max(1, families));

/** Families that have reached the door by `t` seconds into the rush (the chairs they fill). */
export function arrived(t: number, families: number, lay: Pick<Layout, 'door' | 'frame'>): number {
  const gap = spreadGap(lay, families);
  const walk = walkTime(lay);
  let n = 0;
  for (let i = 0; i < families; i++) if (t >= i * gap + walk) n++;
  return n;
}

/** The chairs still glowing `t` seconds into the rush: the free ones less one for each family that has come in. */
export const glowing = (free: number, t: number, families: number, lay: Pick<Layout, 'door' | 'frame'>): number =>
  Math.max(0, free - arrived(t, families, lay));

export interface WaveFigure {
  key: string;
  /** Room position. */
  x: number;
  y: number;
  /** The figure's props for `Person`. */
  props: Pick<PersonProps, 'kind' | 'seed' | 'step' | 'flip' | 'scale' | 'o' | 'mood'>;
}

const smooth = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Where each figure of the wave stands `t` seconds into the rush (the rush's clock, not the scene's), `free` chairs being open.
 * A family walks in a straight line from beyond the right edge to the door and fades there. Figures are listed adult then child.
 */
export function waveFigures(lay: Pick<Layout, 'door' | 'frame'>, t: number, families: number, clock: number): WaveFigure[] {
  const out: WaveFigure[] = [];
  const gap = spreadGap(lay, families);
  const walk = walkTime(lay);
  const startX = unprojectX(frameRight(lay.frame) + 26, WAVE.laneY, lay.frame);
  const doorX = lay.door.lanes.guestX;
  const pose = Math.floor(clock * STEP_FRAMES);
  for (let i = 0; i < families; i++) {
    const age = t - i * gap;
    if (age < 0) break;
    if (age >= walk) continue;
    const p = age / walk;
    // a straight walk at a steady pace from beyond the right edge to the door, where the family fades
    const ax = smooth(startX, doorX, p);
    const ay = smooth(WAVE.laneY, WAVE.doorY, p);
    const o = p > WAVE.fadeFrom ? Math.max(0, 1 - (p - WAVE.fadeFrom) / (1 - WAVE.fadeFrom)) : 1;
    const walkStep = (k: number) => (((pose + k) % STEP_FRAMES) + 0.5) * ((Math.PI * 2) / STEP_FRAMES);
    out.push({ key: `w${i}a`, x: ax, y: ay, props: { kind: 'guest', seed: 7100 + i * 2, step: walkStep(i), flip: true, o, mood: 'happy' } });
    out.push({
      key: `w${i}k`,
      x: ax + WAVE.kidLag,
      y: ay,
      props: { kind: 'guest', seed: 7101 + i * 2, step: walkStep(i + 3), flip: true, scale: WAVE.kidScale, o, mood: 'happy' },
    });
  }
  return out;
}

export interface SeatedFamily {
  key: string;
  /** The chair the family took (room position, and which way it faces: the right-hand chair faces left). */
  x: number;
  y: number;
  flip: boolean;
  seed: number;
  /** Seconds since the family sat down: a burst of confetti plays over the first BURST_SECONDS. */
  age: number;
}

/** The confetti over a chair a family has just taken. */
export const BURST_SECONDS = 0.9;

/**
 * Who is seated `t` seconds into the rush: the family that has come in sits in the next free chair (the order `chairsOf` gives), and
 * stays for the rest of the rush. At most `free` chairs fill, and never more than there are families.
 */
export function seatedFamilies(lay: Pick<Layout, 'door' | 'frame'>, chairs: readonly Chair[], free: number, t: number, families: number): SeatedFamily[] {
  const gap = spreadGap(lay, families);
  const walk = walkTime(lay);
  const out: SeatedFamily[] = [];
  const n = Math.min(families, free, chairs.length);
  for (let i = 0; i < n; i++) {
    const age = t - (i * gap + walk);
    if (age < 0) break;
    const c = chairs[i];
    // the right-hand chair of a table faces left (scene/cast.ts: the companion), the left one faces right
    out.push({ key: `sf${i}`, x: c.x, y: c.y, flip: i < chairs.length / 2, seed: 7300 + i * 5, age });
  }
  return out;
}

/** Screen point of a room point on the floor. */
export const floorPt = (x: number, y: number): [number, number] => P(x, y);

// ---------- the pop ----------

/** "+$1.23K from Game Day": the pies the rush sold, at what a pie pays. */
export function gameDayPopText(soldBefore: number, soldAfter: number, valuePerPie: number): string {
  const pies = Math.max(0, Math.floor(soldAfter) - Math.floor(soldBefore));
  return lc('layer.suburbs.gameday.pop', { cash: money(pies * Math.max(0, valuePerPie)) });
}
