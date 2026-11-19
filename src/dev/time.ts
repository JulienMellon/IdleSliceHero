// Card X2, the Time section's actions (the rows are in x2-sections.tsx). Pure TS over the store's public API.
// Every move of the clock is forward, then the store's own `load` runs: the real return path (`migrate` → `applyOffline` → `refreshRewards` → the
// return story beat), so the offline popup, the 2x offer, the offline cap, boost expiry, the daily gift and the streak all come from it, not a copy.
import { gameClockOffset, gameNow, gameSpeed, setGameClockOffset, setGameSpeed } from '../engine/clock';
import { useGame } from '../store/game-store';
import { saveCheats } from './cheat-prefs';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** The "Away for" rows. */
export const AWAY_ROWS = [
  { label: '15 min', ms: 15 * MIN },
  { label: '1 h', ms: HOUR },
  { label: '8 h', ms: 8 * HOUR },
  { label: '1 day', ms: DAY },
  { label: '3 days', ms: 3 * DAY },
] as const;

/** The "Play forward" rows, in play seconds. */
export const FORWARD_ROWS = [
  { label: '1 min', seconds: 60 },
  { label: '10 min', seconds: 600 },
  { label: '1 h', seconds: 3600 },
] as const;

export const SPEEDS = [1, 4, 16] as const;

/** Steps run before the page gets a frame back (so the panel stays responsive on a 1 h run). */
export const STEPS_PER_FRAME = 60;

/** 00:01 local tomorrow, as ms (the local calendar, so a DST night is handled by `Date`). */
export function nextDayAt(now: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 1).getTime();
}

/** 00:01 local on the next Monday after today (a Monday asks for the one a week on). */
export function nextMondayAt(now: number): number {
  const d = new Date(now);
  const add = (8 - d.getDay()) % 7 || 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + add, 0, 1).getTime();
}

/** "Test clock +1 d 8 h": the offset to the nearest minute, in its two largest units; only ever forward. (Next day lands on 00:01 by the wall clock, which has moved on since, so the offset is a little under whole minutes.) */
export function clockReadout(offsetMs: number): string {
  const total = Math.max(0, Math.round(offsetMs / MIN));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  const parts = [d && `${d} d`, h && `${h} h`, m && `${m} min`].filter(Boolean) as string[];
  return `Test clock +${parts.length ? parts.slice(0, 2).join(' ') : '0 min'}`;
}

let busy = false;
/** A time move is running (Away for waits for the save and the load; Play forward for its chunks): the panel greys its rows. */
export const timeBusy = (): boolean => busy;

/** Save, move the game clock forward by `ms`, then run the store's return path. Returns false for a move that is not forward or while one runs. */
export async function awayFor(ms: number): Promise<boolean> {
  if (busy || !(ms > 0)) return false;
  busy = true;
  try {
    const store = useGame.getState();
    await store.save();
    setGameClockOffset(gameClockOffset() + ms);
    await saveCheats();
    await store.load();
    return true;
  } finally {
    busy = false;
  }
}

/** Away until 00:01 local tomorrow, or the next Monday's. */
export const awayToNextDay = (): Promise<boolean> => awayFor(nextDayAt(gameNow()) - gameNow());
export const awayToNextMonday = (): Promise<boolean> => awayFor(nextMondayAt(gameNow()) - gameNow());

const nextFrame = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/**
 * Play `seconds` of foreground time in 1-second steps with the store's own `tick` (`playTick` + bonus + orders), `perFrame` steps at a time.
 * Each step also moves the clock offset by the second, so wall time and play time agree. The tick multiplies `dt` by the game speed, so the call
 * passes `1 / speed`: a step is exactly one second at 1x, 4x and 16x.
 */
export async function playForward(seconds: number, opts: { perFrame?: number; frame?: () => Promise<void> } = {}): Promise<boolean> {
  if (busy || !(seconds > 0)) return false;
  busy = true;
  const perFrame = opts.perFrame ?? STEPS_PER_FRAME;
  const frame = opts.frame ?? nextFrame;
  try {
    const steps = Math.floor(seconds);
    for (let i = 0; i < steps; i++) {
      setGameClockOffset(gameClockOffset() + 1000);
      useGame.getState().tick(1 / gameSpeed());
      if ((i + 1) % perFrame === 0 && i + 1 < steps) await frame();
    }
    await saveCheats();
    void useGame.getState().save();
    return true;
  } finally {
    busy = false;
  }
}

/** Game speed 1x, 4x or 16x (saved with the test cheats). */
export function setSpeed(x: (typeof SPEEDS)[number]): void {
  setGameSpeed(x);
  void saveCheats();
}
