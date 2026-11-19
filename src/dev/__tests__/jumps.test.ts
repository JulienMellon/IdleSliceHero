/// <reference types="jest" />
// Card X3: the jump loader, the backup / undo slot and "build the next shop now", with a fake storage and a fake store.
import { cityOf } from '../../content/cities';
import { buildShop, migrate, newGame, playTick, type GameState } from '../../engine/game';
import { dayKey } from '../../engine/rewards';
import {
  BACKUP_KEY,
  REAL_SAVE_KEY,
  TEST_SAVE_KEY,
  buildNextNow,
  groupByCity,
  hasBackup,
  jumpTo,
  loadSnapshot,
  rebase,
  snapshotFile,
  undoJump,
  type JumpHost,
  type KeyValue,
} from '../jumps';

const file = snapshotFile();
const NOW = Date.UTC(2027, 2, 3, 10, 30);
const row = (label: string) => file.rows.find((r) => r.label === label)!;

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const writes: string[] = [];
  const storage: KeyValue = {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void (writes.push(k), data.set(k, v)),
    removeItem: async (k) => void (writes.push(`remove ${k}`), data.delete(k)),
  };
  return { storage, data, writes };
}

/** A host over a fake storage that starts with a played game saved in the test slot. */
function host(saveKey = TEST_SAVE_KEY) {
  const start = migrate(row('Waterfront — just built').state, NOW - 5000);
  const saved = JSON.stringify({ ...start, cash: 12345, lastSavedAt: NOW - 1000 });
  const fake = fakeStorage({ [saveKey]: saved });
  let game: GameState = migrate(JSON.parse(saved), NOW);
  const h: JumpHost = { storage: fake.storage, saveKey, now: () => NOW, current: () => game, flush: async () => {}, set: (g) => void (game = g) };
  return { h, fake, saved, game: () => game };
}

describe('loadSnapshot', () => {
  it('puts the snapshot on the clock it is loaded at, every stamp keeping its distance', () => {
    const r = row('Industrial — just built');
    const g = loadSnapshot(r, NOW);
    expect(g.lastSavedAt).toBe(NOW);
    expect(g.rewards.day).toBe(dayKey(NOW));
    // the tester's clock is ahead of the snapshot's, so no stamp of the old clock is left in the state
    const old = r.state.lastSavedAt;
    const stale: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'number') {
        if (Math.abs(v - old) < 40 * 86_400_000 && v > 1e12 && !/^\.(cash|totalEarned)$/.test(path)) stale.push(`${path}=${v}`);
      } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    walk(g, '');
    expect(stale).toEqual([]);
  });

  it('rebases the stamps by exactly the distance between the two clocks', () => {
    const r = row('Industrial — just built');
    const raw = rebase(r.state, NOW);
    const delta = NOW - r.state.lastSavedAt;
    expect(raw.rewards.lastSeen).toBe(r.state.rewards.lastSeen + delta);
    expect((raw.x.industrialShifts as { at: number }).at).toBe((r.state.x.industrialShifts as { at: number }).at + delta);
    expect(raw.playSeconds).toBe(r.state.playSeconds);
    expect(raw.cash).toBe(r.state.cash);
  });

  it('does not change the row', () => {
    const r = row('Suburbs — just built');
    const before = JSON.stringify(r);
    loadSnapshot(r, NOW);
    expect(JSON.stringify(r)).toBe(before);
  });

  it('gives a game that plays on', () => {
    for (const r of file.rows) {
      let g = loadSnapshot(r, NOW);
      for (let i = 0; i < 5; i++) g = playTick(g, 1, NOW + i * 1000);
      expect(Number.isFinite(g.cash)).toBe(true);
    }
  });
});

describe('jump and undo', () => {
  it('jump then undo gives back the exact save', async () => {
    const { h, fake, saved, game } = host();
    const target = row('Boston — complete');
    const jumped = await jumpTo(h, target);
    expect(jumped.city).toBe('boston');
    expect(game().city).toBe('boston');
    expect(fake.data.get(BACKUP_KEY)).toBe(saved);
    expect(JSON.parse(fake.data.get(TEST_SAVE_KEY)!).city).toBe('boston');
    expect(await hasBackup(fake.storage)).toBe(true);
    const r = await undoJump(h);
    expect(r.ok).toBe(true);
    expect(fake.data.get(TEST_SAVE_KEY)).toBe(saved);
    expect(game()).toEqual(migrate(JSON.parse(saved), NOW));
    expect(game().city).toBe('home');
    expect(await hasBackup(fake.storage)).toBe(false);
  });

  it('keeps one level: a second jump replaces the backup, and a second undo is refused', async () => {
    const { h, fake } = host();
    await jumpTo(h, row('Suburbs — just built'));
    const middle = fake.data.get(TEST_SAVE_KEY)!;
    await jumpTo(h, row('Boston — complete'));
    expect(fake.data.get(BACKUP_KEY)).toBe(middle);
    expect((await undoJump(h)).ok).toBe(true);
    expect(fake.data.get(TEST_SAVE_KEY)).toBe(middle);
    expect(await undoJump(h)).toEqual({ ok: false, reason: 'No jump to undo' });
  });

  it('refuses an undo with no backup and leaves everything as it was', async () => {
    const { h, fake, saved, game } = host();
    const before = game();
    expect(await hasBackup(fake.storage)).toBe(false);
    expect(await undoJump(h)).toEqual({ ok: false, reason: 'No jump to undo' });
    expect(fake.writes).toEqual([]);
    expect(fake.data.get(TEST_SAVE_KEY)).toBe(saved);
    expect(game()).toBe(before);
  });

  it('never writes slice-empire/save/v1', async () => {
    const { h, fake } = host();
    await jumpTo(h, row('Boston — complete'));
    await undoJump(h);
    await jumpTo(h, row('Uptown — just built'));
    expect(fake.writes.length).toBeGreaterThan(0);
    expect(fake.writes).not.toContain(REAL_SAVE_KEY);
    expect(fake.writes.every((k) => [TEST_SAVE_KEY, BACKUP_KEY, `remove ${BACKUP_KEY}`].includes(k))).toBe(true);
  });

  it('refuses a host that would save under the real key, writing nothing', async () => {
    const { h, fake } = host(REAL_SAVE_KEY);
    await expect(jumpTo(h, row('Boston — complete'))).rejects.toThrow(/test saves/);
    await expect(undoJump(h)).rejects.toThrow(/test saves/);
    expect(fake.writes).toEqual([]);
  });
});

describe('buildNextNow', () => {
  const built = (g: GameState) => Object.values(g.shops).filter((s) => s.built).length;

  it('builds exactly one shop, past the story lock, and leaves the scenes as they were', () => {
    // a fresh home game: Nonna has not taken over, so the ordinary build is locked
    const g: GameState = { ...newGame(NOW), cash: 1e12 };
    const normal = buildShop(g, cityOf(g).neighbourhoods[1].id);
    expect(normal.ok).toBe(false);
    const r = buildNextNow(g);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(built(r.state)).toBe(built(g) + 1);
    expect(r.state.shops[cityOf(g).neighbourhoods[1].id].built).toBe(true);
    expect(r.state.seenScenes).toEqual(g.seenScenes);
    expect(r.state.cash).toBeLessThan(g.cash);
    // and the next press builds the next one in order
    const again = buildNextNow(r.state);
    expect(again.ok).toBe(true);
    if (again.ok) expect(built(again.state)).toBe(built(g) + 2);
  });

  it('is refused without the cash, and when every shop is built', () => {
    const poor = buildNextNow({ ...newGame(NOW), cash: 0 });
    expect(poor).toEqual({ ok: false, reason: 'Not enough cash' });
    const full = loadSnapshot(row('Port Marinara — complete'), NOW);
    expect(buildNextNow(full)).toEqual({ ok: false, reason: 'Every shop is built' });
  });
});

describe('groupByCity', () => {
  it('lists each city once, in pack order, with its rows', () => {
    const groups = groupByCity(file.rows);
    expect(groups.map((g) => g.city)).toEqual(['home', 'boston']);
    expect(groups.map((g) => g.name)).toEqual(['Port Marinara', 'Boston']);
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(file.rows.length);
  });
});
