// The Test panel's neighbourhood jumps (card X3): the snapshot loader, the backup / undo slot and "build the next shop now". Pure TypeScript with the
// store and the storage passed in (`JumpHost`), so jest runs it in node; jumps-section.tsx wires the real ones. Nothing here may write the real save.
import { CITIES, cityOf } from '../content/cities';
import { buildShop, migrate, nextToBuild, type BuyResult, type GameState } from '../engine/game';
import { dayKey, weekKey } from '../engine/rewards';

/** The test build's save (the store's own key in a test build) and the one-level backup slot beside it. */
export const TEST_SAVE_KEY = 'slice-empire/save/test-v1';
export const BACKUP_KEY = 'slice-empire/save/test-v1-backup';
/** The real player's save: no jump may ever write it. */
export const REAL_SAVE_KEY = 'slice-empire/save/v1';

/** One captured state (scripts/test-snapshots.ts): a shop "just built" in a city, or the city complete. `state.lastSavedAt` is the snapshot's own clock. */
export interface SnapshotRow {
  city: string;
  hood: string;
  label: string;
  state: GameState;
}
export interface SnapshotFile {
  saveVersion: number;
  made: string;
  rows: SnapshotRow[];
}

/** The committed snapshots (src/dev/snapshots.json). */
export function snapshotFile(): SnapshotFile {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./snapshots.json') as SnapshotFile;
}

/** The rows grouped by city, in the order the city packs are listed (`CITIES`); a city with no rows is left out. */
export function groupByCity(rows: readonly SnapshotRow[]): { city: string; name: string; rows: SnapshotRow[] }[] {
  const ids = [...Object.keys(CITIES), ...rows.map((r) => r.city).filter((c) => !(c in CITIES))];
  return [...new Set(ids)].map((id) => ({ city: id, name: CITIES[id]?.name ?? id, rows: rows.filter((r) => r.city === id) })).filter((g) => g.rows.length > 0);
}

// ---------- The loader ----------

const DAY_MS = 86_400_000;
const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
};
const keyOfDay = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);

/**
 * The snapshot with its own clock moved to `now`: every wall-clock stamp keeps its distance from the clock (`lastSavedAt`, the rewards' last-seen stamp
 * and boosts, the features' `at` / `retryAt` stamps) and the rewards' date keys keep their distance in days, so a streak stays a streak. Play seconds are
 * a play clock, not a wall one, and stay as they are. Returns a plain copy; the row is not touched.
 */
export function rebase(state: GameState, now: number): GameState {
  const raw = JSON.parse(JSON.stringify(state)) as GameState;
  const clock = raw.lastSavedAt;
  const delta = now - clock;
  const shiftDays = dayNumber(dayKey(now)) - dayNumber(dayKey(clock));
  const ms = (v: unknown) => (typeof v === 'number' && v > 0 ? v + delta : v);
  const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v) ? keyOfDay(dayNumber(v) + shiftDays) : v);
  raw.lastSavedAt = now;
  const r = raw.rewards;
  r.lastSeen = ms(r.lastSeen) as number;
  r.boosts = r.boosts.map((b) => ({ ...b, until: ms(b.until) as number }));
  r.day = date(r.day) as string;
  if (r.week) r.week = weekKey(now);
  r.giftShownDay = date(r.giftShownDay) as string;
  r.gift = { ...r.gift, last: date(r.gift.last) as string };
  for (const slice of Object.values(raw.x ?? {}) as Record<string, unknown>[]) {
    if (!slice || typeof slice !== 'object') continue;
    if ('at' in slice) slice.at = ms(slice.at);
    if ('retryAt' in slice) slice.retryAt = ms(slice.retryAt);
  }
  return raw;
}

/** Load a snapshot as a game at `now` (gameNow(), the test clock's offset included): the current `migrate` over the rebased state. */
export function loadSnapshot(row: SnapshotRow, now: number): GameState {
  return migrate(rebase(row.state, now), now);
}

// ---------- Backup and undo ----------

export interface KeyValue {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** What a jump needs from the app: the test save's key and storage, the clock, and the game in memory. */
export interface JumpHost {
  storage: KeyValue;
  /** The key the store saves under: always a test key (a host that names the real one is refused). */
  saveKey: string;
  now(): number;
  current(): GameState;
  /** Wait until the store's pending save has landed, so the slot holds the current game. */
  flush(): Promise<void>;
  /** Put a game in the store (the slot is written by the caller). */
  set(game: GameState): void;
}

function guard(host: JumpHost) {
  if (host.saveKey === REAL_SAVE_KEY || !host.saveKey.startsWith('slice-empire/save/test-'))
    throw new Error(`jumps write only test saves, not ${host.saveKey}`);
}

/**
 * Jump to a snapshot: the current save goes to the backup slot first (one level: it replaces an older backup), then the snapshot, rebased to now,
 * becomes the game and the test save.
 */
export async function jumpTo(host: JumpHost, row: SnapshotRow): Promise<GameState> {
  guard(host);
  await host.flush();
  const saved = await host.storage.getItem(host.saveKey);
  await host.storage.setItem(BACKUP_KEY, saved ?? JSON.stringify(host.current()));
  const game = loadSnapshot(row, host.now());
  await host.storage.setItem(host.saveKey, JSON.stringify(game));
  host.set(game);
  return game;
}

/** Whether the backup slot holds a save (the Undo row is enabled). */
export async function hasBackup(storage: KeyValue): Promise<boolean> {
  return !!(await storage.getItem(BACKUP_KEY));
}

/** Undo the last jump: the backup goes back as the test save, byte for byte, and the slot is emptied. Refused when the slot is empty. */
export async function undoJump(host: JumpHost): Promise<{ ok: true; state: GameState } | { ok: false; reason: string }> {
  guard(host);
  const backup = await host.storage.getItem(BACKUP_KEY);
  if (!backup) return { ok: false, reason: 'No jump to undo' };
  let raw: unknown;
  try {
    raw = JSON.parse(backup);
  } catch {
    return { ok: false, reason: 'The backup is unreadable' };
  }
  const state = migrate(raw, host.now());
  await host.storage.setItem(host.saveKey, backup);
  await host.storage.removeItem(BACKUP_KEY);
  host.set(state);
  return { ok: true, state };
}

// ---------- Build next shop now ----------

/**
 * Build the next neighbourhood in `cityOf(g).neighbourhoods` order through the engine's own `buildShop` (so it costs what a build costs, and a free-buys
 * test build builds it free), with the story lock skipped: the lock is the founder's takeover scene, so the state `buildShop` sees has it as seen, and the
 * state that comes back has the real list again (the scene still plays when it is due). It may break the story order.
 */
export function buildNextNow(g: GameState): BuyResult {
  const next = nextToBuild(g);
  if (!next) return { ok: false, reason: 'Every shop is built' };
  const takeover = cityOf(g).fit.takeover.sceneId;
  const open = g.seenScenes.includes(takeover) ? g : { ...g, seenScenes: [...g.seenScenes, takeover] };
  const r = buildShop(open, next.id);
  return r.ok ? { ok: true, state: { ...r.state, seenScenes: g.seenScenes } } : r;
}
