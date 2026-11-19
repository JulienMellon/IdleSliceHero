/* eslint-disable @typescript-eslint/no-require-imports, expo/no-dynamic-env-var */
/// <reference types="jest" />
// Card X1: the switch, the test save keys and the TEST pill's tap area.
import { controlPasses, hitSize, MIN_DRAWN, MIN_HIT } from '../../components/tap-targets';
import { TEST_PILL } from '../test-mode';

jest.mock('@react-native-async-storage/async-storage', () => {
  const calls: { op: string; key: string }[] = [];
  return {
    __esModule: true,
    calls,
    default: {
      getItem: async (key: string) => (calls.push({ op: 'get', key }), null),
      setItem: async (key: string) => void calls.push({ op: 'set', key }),
      removeItem: async (key: string) => void calls.push({ op: 'remove', key }),
    },
  };
});

// the store starts these on its first load; none of them touches the keys under test
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => [] },
  startServices: async () => {},
}));

const SWITCH = 'EXPO_PUBLIC_TEST_MODE';

/** `fn` with the env var set to `value` (undefined = unset), restored after. */
function withSwitch<T>(value: string | undefined, fn: () => T): T {
  const before = process.env[SWITCH];
  if (value === undefined) delete process.env[SWITCH];
  else process.env[SWITCH] = value;
  try {
    return fn();
  } finally {
    if (before === undefined) delete process.env[SWITCH];
    else process.env[SWITCH] = before;
  }
}

function testModeWith(value: string | undefined): boolean {
  return withSwitch(value, () => {
    let on = false;
    jest.isolateModules(() => {
      on = require('../test-mode').TEST_MODE;
    });
    return on;
  });
}

/** Every AsyncStorage key a freshly loaded store touches while it loads, saves, loads again and resets (with the switch `value`). */
async function keysTouched(value: string | undefined): Promise<{ op: string; key: string }[]> {
  return withSwitch(value, async () => {
    const m: { store?: typeof import('../../store/game-store'); calls?: { op: string; key: string }[] } = {};
    jest.isolateModules(() => {
      m.calls = require('@react-native-async-storage/async-storage').calls;
      m.store = require('../../store/game-store');
    });
    m.calls!.length = 0;
    const api = m.store!.useGame.getState();
    await api.load();
    await api.save();
    await api.resetGame();
    // the prefs are written through setPrefs (the starter pack's "offered" flag)
    m.store!.useGame.getState().markStarterOffered();
    await new Promise((r) => setTimeout(r, 0));
    return [...m.calls!];
  });
}

describe('TEST_MODE', () => {
  it('is false with the env var unset', () => expect(testModeWith(undefined)).toBe(false));
  it("is false with '0'", () => expect(testModeWith('0')).toBe(false));
  it("is true with '1'", () => expect(testModeWith('1')).toBe(true));
});

describe('save keys', () => {
  it('the test build uses both test keys and never touches the v1 save', async () => {
    const touched = await keysTouched('1');
    const keys = new Set(touched.map((c) => c.key));
    expect(touched.some((c) => c.op === 'set' && c.key === 'slice-empire/save/test-v1')).toBe(true);
    expect(touched.some((c) => c.op === 'get' && c.key === 'slice-empire/save/test-v1')).toBe(true);
    expect(keys.has('slice-empire/store/test-v1')).toBe(true);
    expect(keys.has('slice-empire/save/v1')).toBe(false);
    expect(keys.has('slice-empire/store/v1')).toBe(false);
  });
  it('the normal build keeps the v1 keys', async () => {
    const touched = await keysTouched(undefined);
    const keys = new Set(touched.map((c) => c.key));
    expect(keys.has('slice-empire/save/v1')).toBe(true);
    expect(keys.has('slice-empire/store/v1')).toBe(true);
    expect([...keys].filter((k) => k.includes('test'))).toEqual([]);
  });
});

describe('the TEST pill (X1 step 3)', () => {
  const x = { drawn: TEST_PILL.width, slopBefore: TEST_PILL.slop, slopAfter: TEST_PILL.slop, roomBefore: TEST_PILL.roomLeft, roomAfter: TEST_PILL.roomRight };
  const y = { drawn: TEST_PILL.height, slopBefore: TEST_PILL.slop, slopAfter: TEST_PILL.slop, roomBefore: TEST_PILL.roomTop, roomAfter: TEST_PILL.roomBottom };
  it('is drawn 44 pt tall and 56 wide: the screenshot probe 44 px rule with no hitSlop', () => {
    expect(TEST_PILL.height).toBeGreaterThanOrEqual(MIN_HIT);
    expect(TEST_PILL.width).toBeGreaterThanOrEqual(MIN_HIT);
    expect(TEST_PILL.height).toBeGreaterThanOrEqual(MIN_DRAWN);
    expect(TEST_PILL.height + 2 * TEST_PILL.slop).toBeGreaterThanOrEqual(MIN_HIT);
    expect(controlPasses(x, y)).toBe(true);
    expect(
      hitSize({ height: TEST_PILL.height, slopTop: TEST_PILL.slop, slopBottom: TEST_PILL.slop, roomTop: TEST_PILL.roomTop, roomBottom: TEST_PILL.roomBottom }),
    ).toBe(44);
  });
});
