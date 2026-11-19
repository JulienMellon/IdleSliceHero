/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
/* eslint-disable @typescript-eslint/no-require-imports, expo/no-dynamic-env-var */
/// <reference types="jest" />
// Card X4 (v5.19-test), Story & save: the next beat, skip tutorial, export and import, reset.
const mem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => mem[k] ?? null,
    setItem: async (k: string, v: string) => void (mem[k] = v),
    removeItem: async (k: string) => void delete mem[k],
  },
}));
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => [] },
  startServices: async () => {},
}));

import { CITIES, cityOf } from '../../content/cities';
import { STORY_PACING } from '../../content/tuning';
import { TEST_PREFS_KEY } from '../../components/store/store-model';
import { gameClockOffset, gameSpeed, resetGameClockOffset, setGameClockOffset, setGameSpeed } from '../../engine/clock';
import { challengeOffered, firstHood, freeBuysOn, migrate, newGame, pendingScenes, setFreeBuys, sceneId, TUTORIAL_DONE, type GameState } from '../../engine/game';
import { coachStep, tutorialAdvance } from '../../engine/tutorial';
import { CHEATS_KEY } from '../cheat-prefs';
import { BACKUP_KEY, REAL_SAVE_KEY, TEST_SAVE_KEY, type JumpHost, type KeyValue } from '../jumps';
import {
  COPIED_MS,
  RESET_KEYS,
  copyText,
  exportSave,
  importSave,
  nextBeatNow,
  nextBeatReason,
  parseSave,
  resetTestSave,
  skipTutorial,
  type ResetHost,
} from '../story-save';

const NOW = Date.UTC(2027, 2, 3, 10, 30);

const SWITCH = 'EXPO_PUBLIC_TEST_MODE';
const before = process.env[SWITCH];
beforeEach(() => {
  process.env[SWITCH] = '1';
});
afterEach(() => {
  if (before === undefined) delete process.env[SWITCH];
  else process.env[SWITCH] = before;
});

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

/** A host over a fake storage that starts with `game` saved in the test slot (and in memory). */
function host(game: GameState, extra: Record<string, string> = {}) {
  const saved = JSON.stringify(game);
  const fake = fakeStorage({ [TEST_SAVE_KEY]: saved, ...extra });
  let mem: GameState = game;
  const h: JumpHost = { storage: fake.storage, saveKey: TEST_SAVE_KEY, now: () => NOW, current: () => mem, flush: async () => {}, set: (g) => void (mem = g) };
  return { h, fake, saved, game: () => mem };
}

/** Every scene seen but `target`, whose shop is built and whose `after` scene stamp is `playSeconds` (the wait has just begun). */
function waitingOn(cityId: string, sceneIdWaiting: string): GameState {
  const base = newGame(NOW, cityId);
  const city = cityOf(base);
  const target = city.scenes.find((s) => s.id === sceneIdWaiting)!;
  if (target.trigger.kind !== 'after') throw new Error('not an after scene');
  const shops = Object.fromEntries(Object.entries(base.shops).map(([id, s]) => [id, { ...s, built: true }])) as GameState['shops'];
  return {
    ...base,
    shops,
    tutorial: TUTORIAL_DONE,
    playSeconds: 5000,
    seenScenes: city.scenes.filter((s) => s.id !== target.id).map((s) => s.id),
    sceneAt: { [target.trigger.scene]: 5000 },
  };
}

const afterScenes = Object.values(CITIES).flatMap((c) => c.scenes.filter((s) => s.trigger.kind === 'after').map((s) => [c.id, s.id] as const));

describe('Play next story beat now (step 1)', () => {
  it.each(afterScenes)('%s: %s waits on its gap, and is pending the moment the row runs', (cityId, id) => {
    const g = waitingOn(cityId, id);
    const scenes = cityOf(g).scenes;
    expect(pendingScenes(g, scenes)).toEqual([]);
    const r = nextBeatNow(g);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kind).toBe('scene');
    expect(r.id).toBe(id);
    expect(pendingScenes(r.state, scenes).map((s) => s.id)).toEqual([id]);
    // the tuning and the rest of the state stay as they were; only the beat stamp moved, earlier
    expect(r.state.playSeconds).toBe(g.playSeconds);
    expect(r.state.seenScenes).toBe(g.seenScenes);
    expect(Object.keys(r.state.sceneAt)).toEqual(Object.keys(g.sceneAt));
  });

  it('is refused, with a reason, when no beat waits on a gap', () => {
    const fresh = newGame(NOW);
    expect(nextBeatNow(fresh)).toEqual({ ok: false, reason: 'No story beat is waiting on a gap' });
    expect(nextBeatReason(fresh)).toBe('No story beat is waiting on a gap');
    // the beat is already due: nothing waits either
    const [cityId, id] = afterScenes[0];
    const due = { ...waitingOn(cityId, id), playSeconds: 1e6 };
    expect(nextBeatReason(due)).not.toBeNull();
    // and once it has been moved, the row is off again
    const moved = nextBeatNow(waitingOn(cityId, id));
    if (moved.ok) expect(nextBeatReason(moved.state)).not.toBeNull();
  });

  it('takes the soonest wait first', () => {
    const [cityId, id] = afterScenes[0];
    const g = waitingOn(cityId, id);
    const r = nextBeatNow(g);
    expect(r.ok && r.id).toBe(id);
  });

  it('offers the rival challenge held by the finale gap, moving the beat 3 stamp, not the tuning', () => {
    const base = newGame(NOW);
    const city = cityOf(base);
    const hood = firstHood(city);
    const at = 1000;
    // beat 3 seen just now, the shop built: the rival is open and the 120 s gap is running
    const g: GameState = { ...base, playSeconds: at + 10, seenScenes: [sceneId(hood, 1), sceneId(hood, 2), sceneId(hood, 3)], sceneAt: { [sceneId(hood, 3)]: at } };
    expect(challengeOffered(g, hood)).toBe(false);
    const r = nextBeatNow(g);
    expect(r.ok && r.kind).toBe('challenge');
    if (!r.ok) return;
    expect(challengeOffered(r.state, hood)).toBe(true);
    expect(STORY_PACING.firstHoodBeat4GapSeconds).toBe(120);
  });

  it('plays through the store: the scene opens and the story moves one beat', () => {
    const [cityId, id] = afterScenes.find(([c]) => c === 'home')!;
    const m: { store?: typeof import('../../store/game-store') } = {};
    jest.isolateModules(() => {
      m.store = require('../../store/game-store');
    });
    const { useGame } = m.store!;
    const g = waitingOn(cityId, id);
    useGame.setState({ game: g, loaded: true, titleDone: true, playing: null });
    const r = nextBeatNow(useGame.getState().game);
    if (!r.ok) throw new Error(r.reason);
    useGame.getState().testSetGame(r.state);
    expect(useGame.getState().playing?.scene.id).toBe(id);
    useGame.getState().finishScene();
    const after = useGame.getState().game;
    expect(after.seenScenes).toEqual([...g.seenScenes, id]);
    expect(useGame.getState().playing).toBeNull();
  });

  it('does nothing outside a test build', () => {
    delete process.env[SWITCH];
    const m: { store?: typeof import('../../store/game-store') } = {};
    jest.isolateModules(() => {
      m.store = require('../../store/game-store');
    });
    const { useGame } = m.store!;
    const g = newGame(NOW);
    useGame.setState({ game: g, loaded: true });
    useGame.getState().testSetGame({ ...g, cash: 99 });
    expect(useGame.getState().game).toBe(g);
  });
});

describe('Skip tutorial (step 2)', () => {
  it('leaves coachStep null from every step', () => {
    for (let t = 0; t < TUTORIAL_DONE; t++) {
      const g = { ...newGame(NOW), tutorial: t };
      const done = skipTutorial(g);
      expect(done.tutorial).toBe(TUTORIAL_DONE);
      expect(coachStep(done)).toBeNull();
      // and the coach does not start it over
      expect(tutorialAdvance(done).tutorial).toBe(TUTORIAL_DONE);
    }
  });

  it('puts the first shop where the last coach step ends, never lowering anything', () => {
    const base = newGame(NOW);
    const id = firstHood(cityOf(base));
    const done = skipTutorial(base);
    expect(done.shops[id].ovens).toBeGreaterThanOrEqual(2);
    expect(done.shops[id].heads.prep).toBe(true);
    expect(done.shops[id].sold).toBeGreaterThanOrEqual(1);
    expect(done.seenScenes).toContain(sceneId(id, 1));
    const rich = { ...base, shops: { ...base.shops, [id]: { ...base.shops[id], ovens: 7, sold: 50 } } };
    expect(skipTutorial(rich).shops[id].ovens).toBe(7);
    expect(skipTutorial(rich).shops[id].sold).toBe(50);
  });

  it('is the same state when the tutorial is over', () => {
    const done = skipTutorial(newGame(NOW));
    expect(skipTutorial(done)).toBe(done);
  });
});

describe('Export and import (steps 3 and 4)', () => {
  const played = (): GameState => ({ ...skipTutorial(newGame(NOW - 5000)), cash: 12345, playSeconds: 777, lastSavedAt: NOW - 1000 });

  it('export then import gives back the same state', async () => {
    const a = host(played());
    const text = await exportSave(a.h);
    expect(text).toBe(a.saved);
    const b = host({ ...newGame(NOW), cash: 1 });
    const r = await importSave(b.h, text);
    expect(r.ok).toBe(true);
    expect(b.game()).toEqual(migrate(JSON.parse(a.saved), NOW));
    expect(b.game().cash).toBe(12345);
    expect(JSON.parse(b.fake.data.get(TEST_SAVE_KEY)!)).toEqual(JSON.parse(JSON.stringify(b.game())));
  });

  it('backs the current save up first, then loads: the backup is byte for byte the old save', async () => {
    const b = host({ ...newGame(NOW), cash: 1 });
    const text = JSON.stringify(played());
    const r = await importSave(b.h, text);
    expect(r.ok).toBe(true);
    expect(b.fake.data.get(BACKUP_KEY)).toBe(b.saved);
    expect(b.fake.writes.indexOf(BACKUP_KEY)).toBeLessThan(b.fake.writes.indexOf(TEST_SAVE_KEY));
    expect(b.fake.writes).not.toContain(REAL_SAVE_KEY);
  });

  it('a bad paste returns the parse error and changes nothing', async () => {
    const b = host({ ...newGame(NOW), cash: 1 });
    const start = b.game();
    const wrote = [...b.fake.writes];
    for (const bad of ['{oops', '', 'not json at all', '[1,2]', '"hello"', 'null', '42', '{}', '{"cash": 5}']) {
      const r = await importSave(b.h, bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/^(Not valid JSON: |Not a save)/);
    }
    expect(b.fake.writes).toEqual(wrote);
    expect(b.game()).toBe(start);
    expect(b.fake.data.get(TEST_SAVE_KEY)).toBe(b.saved);
    expect(b.fake.data.has(BACKUP_KEY)).toBe(false);
  });

  it('shows the engine parse message', () => {
    const r = parseSave('{oops', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Not valid JSON: ');
    expect(parseSave(JSON.stringify(played()), NOW).ok).toBe(true);
  });

  it('refuses a host that would write the real save', async () => {
    const a = host(played());
    const real = { ...a.h, saveKey: REAL_SAVE_KEY };
    await expect(exportSave(real)).rejects.toThrow(/test saves/);
    await expect(importSave(real, JSON.stringify(played()))).rejects.toThrow(/test saves/);
  });

  it('copy: true on success, false when there is no clipboard or it refuses', async () => {
    let got = '';
    expect(await copyText('abc', { writeText: async (t) => void (got = t) })).toBe(true);
    expect(got).toBe('abc');
    expect(await copyText('abc', { writeText: async () => Promise.reject(new Error('denied')) })).toBe(false);
    expect(await copyText('abc', undefined)).toBe(false);
    expect(COPIED_MS).toBe(2000);
  });
});

describe('Reset test save (step 5)', () => {
  const REAL = '{"real":"player save"}';
  /** A reset host over a fake storage that holds every test key and the real save; its defaults are the real clock and cheat setters. */
  function resetFixture() {
    const fake = fakeStorage({
      [TEST_SAVE_KEY]: '{"a":1}',
      [BACKUP_KEY]: '{"b":2}',
      [CHEATS_KEY]: JSON.stringify({ freeBuys: false, purchaseOk: true, clockOffset: 86_400_000, speed: 16 }),
      [TEST_PREFS_KEY]: '{"starterOffered":true}',
      [REAL_SAVE_KEY]: REAL,
    });
    const calls: string[] = [];
    let offsetAtNewGame = -1;
    const h: ResetHost = {
      storage: fake.storage,
      saveKey: TEST_SAVE_KEY,
      flush: async () => void calls.push('flush'),
      defaults: () => {
        setFreeBuys(true);
        setGameSpeed(1);
        resetGameClockOffset();
        calls.push('defaults');
      },
      newGame: async () => {
        offsetAtNewGame = gameClockOffset();
        calls.push('newGame');
      },
    };
    return { h, fake, calls, offsetAtNewGame: () => offsetAtNewGame };
  }

  it('clears the test keys and the store prefs, puts the cheats and the clock offset back, leaves the v1 save and starts a new game', async () => {
    setGameClockOffset(86_400_000);
    setGameSpeed(16);
    setFreeBuys(false);
    expect(gameClockOffset()).toBe(86_400_000);
    const f = resetFixture();
    await resetTestSave(f.h);
    for (const k of [TEST_SAVE_KEY, BACKUP_KEY, CHEATS_KEY, TEST_PREFS_KEY]) expect(f.fake.data.has(k)).toBe(false);
    expect(RESET_KEYS).toEqual([TEST_SAVE_KEY, BACKUP_KEY, CHEATS_KEY, TEST_PREFS_KEY]);
    expect(f.fake.data.get(REAL_SAVE_KEY)).toBe(REAL);
    expect(f.fake.writes).not.toContain(REAL_SAVE_KEY);
    expect(f.fake.writes).not.toContain(`remove ${REAL_SAVE_KEY}`);
    expect(gameClockOffset()).toBe(0);
    expect(gameSpeed()).toBe(1);
    expect(freeBuysOn()).toBe(true);
    // the new game is made on the wall clock, after the offset is gone
    expect(f.offsetAtNewGame()).toBe(0);
    expect(f.calls).toEqual(['flush', 'defaults', 'newGame']);
  });

  it('refuses a host that names the real save, clearing nothing', async () => {
    const f = resetFixture();
    await expect(resetTestSave({ ...f.h, saveKey: REAL_SAVE_KEY })).rejects.toThrow(/test saves/);
    expect(f.fake.writes).toEqual([]);
  });
});
