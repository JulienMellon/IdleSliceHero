// The gate every city pack passes (card K1; v5.19's three cities are gated mostly by this file). One `describe` per entry of CITIES. A failure
// names the city, the scene and the field: `city "home" · scene "waterfront-3" · panels[1].lines[0].text: 97 characters (max 90)`.
// Pure data checks (plus one engine round trip at the end): nothing here plays the game.
import '../../engine/features';
import { CITIES, teaserFor } from '../cities';
import { BOSTON_CAST } from '../cities/boston/cast';
import { BOSTON_TEASER } from '../cities/boston/copy';
import { HOME_CAST, HOME_NAMES } from '../cities/home/cast';
import { TEST_CITY, TEST_IDS } from '../cities/__fixtures__/test-city';
import { FIT_KEYS, LAYER_KINDS, type CityDef } from '../cities/types';
import { HOME_COPY, t } from '../copy';
import { LAYER_KEYS } from '../layers';
import * as G from '../../engine/game';
import { migrate, newGame, prerequisites, sceneId } from '../../engine/game';
import { HEAD_KINDS } from '../tuning';
import { CHARACTER_IDS, FIXED_BACKDROPS, NARRATOR_SPEAKERS, PROP_IDS, type Scene } from '../types';

const MAX_BUBBLE = 90;
const norm = (name: string) =>
  name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[-\s]+/g, ' ')
    .trim();

/** The characters a city's scenes may stage: its own cast and the home cast, the returning characters (card R7a). */
const castOf = (city: CityDef): Set<string> => new Set<string>([...HOME_CAST, ...city.cast]);

/** Every name a scene may speak in: the player and the disguise, the cast's ids, the heads and managers, the lieutenant and the perk-givers (with or without their title). */
function speakersOf(city: CityDef): Set<string> {
  const names = [...NARRATOR_SPEAKERS, ...castOf(city), city.lieutenant.name];
  for (const hood of Object.values(city.heads)) names.push(...Object.values(hood));
  for (const m of Object.values(city.managers)) names.push(m.name);
  for (const p of Object.values(city.perks)) if (p) names.push(p.who, p.who.replace(/^(Coach|Captain|Dr\.?|Professor)\s+/i, ''));
  return new Set(names.map(norm));
}

/** Every problem in a city pack, each as one line naming the city, the scene and the field (empty when the pack is sound). */
export function problemsOf(city: CityDef): string[] {
  const out: string[] = [];
  const at = (scene: string | null, field: string, why: string) => out.push(`city "${city.id}"${scene ? ` · scene "${scene}"` : ''} · ${field}: ${why}`);
  const hoods = city.neighbourhoods.map((n) => n.id);
  const hoodSet = new Set(hoods);
  const ids = new Set(city.scenes.map((s) => s.id));
  const speakers = speakersOf(city);
  const characters = castOf(city);
  const props = new Set<string>(PROP_IDS);
  const backdrops = new Set<string>([...hoods, ...FIXED_BACKDROPS]);

  // the city
  if (!city.id) at(null, 'id', 'is empty');
  if (!city.name) at(null, 'name', 'is empty');
  if (city.neighbourhoods.length !== 6) at(null, 'neighbourhoods', `${city.neighbourhoods.length} of them (a city has 6)`);
  if (hoodSet.size !== hoods.length) at(null, 'neighbourhoods', 'two share an id');
  if (!city.theme) at(null, 'theme', 'is empty');
  for (const c of city.cast) if (!(CHARACTER_IDS as readonly string[]).includes(c)) at(null, 'cast', `"${c}" is not in the shared cast (content/cast.ts)`);
  if (!characters.has(city.lieutenant.id)) at(null, 'lieutenant.id', `"${city.lieutenant.id}" is not a character id of this city's cast or the home cast`);
  if (!city.lieutenant.name) at(null, 'lieutenant.name', 'is empty');
  for (const h of hoods) {
    if (!city.heads[h]) at(null, `heads.${h}`, 'is missing');
    else for (const k of HEAD_KINDS) if (!city.heads[h][k]) at(null, `heads.${h}.${k}`, 'is missing');
    if (!city.managers[h]) at(null, `managers.${h}`, 'is missing');
    else if (!city.managers[h].name) at(null, `managers.${h}.name`, 'is empty');
    if (!(h in city.layers)) at(null, `layers.${h}`, 'is missing (use null for none)');
  }
  for (const h of Object.keys(city.perks)) if (!hoodSet.has(h)) at(null, `perks.${h}`, 'is not a neighbourhood of this city');
  for (const h of Object.keys(city.heads)) if (!hoodSet.has(h)) at(null, `heads.${h}`, 'is not a neighbourhood of this city');
  for (const h of Object.keys(city.managers)) if (!hoodSet.has(h)) at(null, `managers.${h}`, 'is not a neighbourhood of this city');

  // the teaser: what the city before this one says about it
  if (city.teaser) {
    const { title, lines, signoff, from } = city.teaser;
    for (const [f, v] of [
      ['title', title],
      ['lines[0]', lines[0]],
      ['lines[1]', lines[1]],
      ['signoff', signoff],
      ['from', from],
    ] as const)
      if (!v) at(null, `teaser.${f}`, 'is empty');
  }

  // the layers: each kind is known, and a kind is played by one neighbourhood (the layer modules look it up)
  const played = new Map<string, string>();
  for (const [h, kind] of Object.entries(city.layers)) {
    if (!hoodSet.has(h)) at(null, `layers.${h}`, 'is not a neighbourhood of this city');
    if (kind === null) continue;
    if (!(LAYER_KINDS as readonly string[]).includes(kind)) at(null, `layers.${h}`, `"${kind}" is not a layer kind (${LAYER_KINDS.join(', ')})`);
    else if (played.has(kind)) at(null, `layers.${h}`, `"${kind}" is already played by ${played.get(kind)}`);
    else played.set(kind, h);
  }

  // the fit
  for (const key of FIT_KEYS) if (city.fit[key] === undefined || city.fit[key] === null) at(null, `fit.${key}`, 'is missing');
  for (const key of ['ovenGrades', 'footprints', 'vehicles'] as const)
    if (!Array.isArray(city.fit[key]) || city.fit[key].length < 2) at(null, `fit.${key}`, 'needs at least two entries');
  for (const k of HEAD_KINDS) if (!(city.fit.headCostFirst?.[k] > 0)) at(null, `fit.headCostFirst.${k}`, 'is not a positive price');
  if (city.fit.takeover && !ids.has(city.fit.takeover.sceneId)) at(null, 'fit.takeover.sceneId', `"${city.fit.takeover.sceneId}" is not a scene of this city`);
  if (city.fit.takeover && !(city.fit.takeover.pizzas > 0)) at(null, 'fit.takeover.pizzas', 'is not a positive count');
  for (const n of city.neighbourhoods)
    for (const f of ['orderValue', 'costMult'] as const) if (!(n[f] > 0)) at(null, `neighbourhoods.${n.id}.${f}`, 'is not positive');

  // the bid
  if (city.bid) {
    if (!hoodSet.has(city.bid.hood)) at(null, 'bid.hood', `"${city.bid.hood}" is not a neighbourhood of this city`);
    if (!ids.has(city.bid.afterScene)) at(null, 'bid.afterScene', `"${city.bid.afterScene}" is not a scene of this city`);
    if (!city.scenes.some((s) => s.trigger.kind === 'bid' && s.trigger.neighborhood === city.bid!.hood))
      at(null, 'bid', `no scene is triggered by the bid in ${city.bid.hood}`);
    if (!(city.bid.cost > 0)) at(null, 'bid.cost', 'is not a positive price');
  }

  // the scenes
  if (ids.size !== city.scenes.length) at(null, 'scenes', 'two share an id');
  for (const h of hoods) {
    const beats = city.scenes.filter((s) => s.neighborhood === h && s.beat !== 'interlude').map((s) => s.beat);
    if (beats.join() !== '1,2,3,4') at(null, `scenes of ${h}`, `main beats are [${beats.join(', ')}], they must be [1, 2, 3, 4]`);
  }
  const lines = (s: Scene) => s.panels.flatMap((p, pi) => p.lines.map((l, li) => ({ l, where: `panels[${pi}].lines[${li}]` })));
  for (const s of city.scenes) {
    if (s.city !== city.id) at(s.id, 'city', `"${s.city}", expected "${city.id}"`);
    if (!hoodSet.has(s.neighborhood)) at(s.id, 'neighborhood', `"${s.neighborhood}" is not a neighbourhood of this city`);
    if (!hoodSet.has(s.trigger.neighborhood)) at(s.id, 'trigger.neighborhood', `"${s.trigger.neighborhood}" is not a neighbourhood of this city`);
    if (!characters.has(s.character)) at(s.id, 'character', `"${s.character}" is not a character id of this city's cast or the home cast`);
    if (s.beat !== 'interlude' && s.id !== sceneId(s.neighborhood, s.beat)) at(s.id, 'id', `a main beat is named ${sceneId(s.neighborhood, s.beat)}`);
    if (s.perk && !city.perks[s.neighborhood]) at(s.id, 'perk', `${s.neighborhood} has no perk to grant`);
    for (const pre of prerequisites(s)) {
      if (!ids.has(pre)) at(s.id, 'requires/after', `"${pre}" is not a scene of this city`);
      else if (pre === s.id) at(s.id, 'requires/after', 'waits on itself');
    }
    s.panels.forEach((p, pi) => {
      if (!backdrops.has(p.backdrop))
        at(s.id, `panels[${pi}].backdrop`, `"${p.backdrop}" is not a neighbourhood of this city or one of ${FIXED_BACKDROPS.join(', ')}`);
      if (p.prop && !props.has(p.prop)) at(s.id, `panels[${pi}].prop`, `"${p.prop}" is not a prop id`);
      if (p.cast.length > 2) at(s.id, `panels[${pi}].cast`, `${p.cast.length} on stage (max 2)`);
      p.cast.forEach((c, ci) => {
        if (!characters.has(c.id)) at(s.id, `panels[${pi}].cast[${ci}].id`, `"${c.id}" is not a character id of this city's cast or the home cast`);
      });
    });
    for (const { l, where } of lines(s)) {
      if (!speakers.has(norm(l.speaker))) at(s.id, `${where}.speaker`, `"${l.speaker}" is not a known speaker of this city`);
      if (l.text.length > MAX_BUBBLE) at(s.id, `${where}.text`, `${l.text.length} characters (max ${MAX_BUBBLE})`);
      if (l.ifSeen && !ids.has(l.ifSeen)) at(s.id, `${where}.ifSeen`, `"${l.ifSeen}" is not a scene of this city`);
    }
  }
  // no cycles in what scenes wait for
  const state = new Map<string, 'open' | 'done'>();
  const byId = new Map(city.scenes.map((s) => [s.id, s]));
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 'done' || !byId.has(id)) return;
    if (state.get(id) === 'open') {
      at(id, 'requires/after', `a cycle: ${[...path, id].join(' → ')}`);
      return;
    }
    state.set(id, 'open');
    for (const pre of prerequisites(byId.get(id)!)) visit(pre, [...path, id]);
    state.set(id, 'done');
  };
  for (const s of city.scenes) visit(s.id, []);
  return out;
}

describe('the checker itself', () => {
  const home = CITIES.home;
  const withScene = (patch: (s: Scene) => Scene, id = 'waterfront-1'): CityDef => ({ ...home, scenes: home.scenes.map((s) => (s.id === id ? patch(s) : s)) });
  const long = 'x'.repeat(MAX_BUBBLE + 1);

  it('names the city, the scene and the field of a bubble that is too long', () => {
    const bad = withScene((s) => ({
      ...s,
      panels: s.panels.map((p, i) => (i === 1 ? { ...p, lines: [{ ...p.lines[0], text: long }, ...p.lines.slice(1)] } : p)),
    }));
    expect(problemsOf(bad)).toEqual([`city "home" · scene "waterfront-1" · panels[1].lines[0].text: ${long.length} characters (max ${MAX_BUBBLE})`]);
  });
  it('catches an unknown speaker, character, prop and a missing requirement', () => {
    const bad = withScene((s) => ({
      ...s,
      requires: ['nowhere-9'],
      panels: s.panels.map((p, i) =>
        i === 1 ? { ...p, prop: 'jukebox' as never, cast: [{ id: 'zed' as never, mood: 'happy' as const }], lines: [{ speaker: 'Zed', text: 'Hi.' }] } : p,
      ),
    }));
    const got = problemsOf(bad).join('\n');
    expect(got).toMatch(/scene "waterfront-1" · panels\[1\]\.lines\[0\]\.speaker: "Zed"/);
    expect(got).toMatch(/scene "waterfront-1" · panels\[1\]\.cast\[0\]\.id: "zed"/);
    expect(got).toMatch(/scene "waterfront-1" · panels\[1\]\.prop: "jukebox"/);
    expect(got).toMatch(/scene "waterfront-1" · requires\/after: "nowhere-9"/);
  });
  it('catches a cycle, a layer kind that is not one, and a fit with a key missing', () => {
    const cyc = withScene((s) => ({ ...s, requires: ['waterfront-2'] }), 'waterfront-1');
    expect(problemsOf({ ...cyc, scenes: cyc.scenes.map((s) => (s.id === 'waterfront-2' ? { ...s, requires: ['waterfront-1'] } : s)) }).join('\n')).toMatch(
      /a cycle: waterfront-1 → waterfront-2 → waterfront-1|a cycle: waterfront-2 → waterfront-1 → waterfront-2/,
    );
    expect(problemsOf({ ...home, layers: { ...home.layers, uptown: 'tennis' as never } }).join('\n')).toMatch(
      /city "home" · layers\.uptown: "tennis" is not a layer kind/,
    );
    const { takeover: _t, ...rest } = home.fit;
    void _t;
    expect(problemsOf({ ...home, fit: rest as never }).join('\n')).toMatch(/city "home" · fit\.takeover: is missing/);
  });
  it('catches a city with five neighbourhoods and a neighbourhood with three main beats', () => {
    expect(problemsOf({ ...home, neighbourhoods: home.neighbourhoods.slice(0, 5) }).join('\n')).toMatch(/neighbourhoods: 5 of them/);
    expect(problemsOf({ ...home, scenes: home.scenes.filter((s) => s.id !== 'uptown-4') }).join('\n')).toMatch(/scenes of uptown: main beats are \[1, 2, 3\]/);
  });
});

describe.each(Object.values(CITIES).map((c) => [c.id, c] as const))('city pack "%s"', (_id, city) => {
  it('passes the schema: six neighbourhoods, four main beats each, known ids everywhere, bubbles of 90 characters or fewer, no cycles, a full fit', () => {
    expect(problemsOf(city)).toEqual([]);
  });
  it('is registered under its own id', () => {
    expect(CITIES[city.id]).toBe(city);
  });
  it('starts a game with the first neighbourhood built and the rest not, and a save round-trips its city', () => {
    const g = newGame(1_700_000_000_000, city.id);
    expect(g.city).toBe(city.id);
    expect(Object.keys(g.shops)).toEqual(city.neighbourhoods.map((n) => n.id));
    expect(Object.values(g.shops).filter((s) => s.built)).toHaveLength(1);
    expect(g.shops[city.neighbourhoods[0].id].built).toBe(true);
    expect(g.active).toBe(city.neighbourhoods[0].id);
    expect(migrate(JSON.parse(JSON.stringify(g)), g.lastSavedAt).city).toBe(city.id);
  });
});

describe('saves and cities', () => {
  it('a save from before cities (no `city`) loads in the home city, and so does a city this build does not know', () => {
    const { city: _c, ...old } = newGame(1_700_000_000_000);
    void _c;
    expect(migrate(old, 1_700_000_000_000).city).toBe('home');
    expect(migrate({ ...old, city: 'atlantis' }, 1_700_000_000_000).city).toBe('home');
  });
});

// ---------- the cast, per pack (card R7a) ----------

/** `CHARACTER_IDS` as it was before it was split into packs (content/types.ts, v5.18). */
const OLD_CHARACTER_IDS = [
  'nonna-rosa', 'dale', 'marisol', 'priya', 'big-sal', 'genevieve', 'victor-crust', 'megaslice-rep',
  'mr-smith', 'todd-coat', 'slicey',
  'deb', 'skip', 'noor', 'dee', 'anton',
  'father-dom', 'kayla-dunn', 'preston', 'manny', 'lena-ko', 'grandma-bea', 'trish-vance',
]; // prettier-ignore

describe('the cast, per pack', () => {
  it('concatenates the packs in the order the single list had, so nothing that walks it changes', () => {
    expect([...CHARACTER_IDS]).toEqual(OLD_CHARACTER_IDS);
    expect([...HOME_CAST, ...BOSTON_CAST]).toEqual(OLD_CHARACTER_IDS);
    expect([HOME_CAST.length, BOSTON_CAST.length]).toEqual([16, 7]);
    expect(new Set(CHARACTER_IDS).size).toBe(CHARACTER_IDS.length);
  });
  it("names every character as the teaser did before the table was split (home names plus the pack's own)", () => {
    const was: Record<string, string> = {
      'nonna-rosa': 'Nonna Rosa', dale: 'Dale', marisol: 'Marisol', priya: 'Priya', 'big-sal': 'Big Sal', genevieve: 'Genevieve', 'victor-crust': 'Victor Crust',
      'megaslice-rep': 'the MegaSlice rep', 'mr-smith': 'Mr. Smith', 'todd-coat': 'Todd', slicey: 'Slicey', deb: 'Deb', skip: 'Skip', noor: 'Noor', dee: 'Dee',
      anton: 'Anton', 'father-dom': 'Father Dom', 'kayla-dunn': 'Kayla Dunn', preston: 'Preston', manny: 'Manny', 'lena-ko': 'Dr. Ko',
      'grandma-bea': 'Grandma Bea', 'trish-vance': 'Trish Vance',
    }; // prettier-ignore
    expect({ ...HOME_NAMES, ...CITIES.boston.names }).toEqual(was);
    expect(Object.keys(CITIES.home.names ?? {})).toEqual([...HOME_CAST]);
    expect(Object.keys(CITIES.boston.names ?? {})).toEqual([...BOSTON_CAST]);
  });
  it("is each city's own `cast`: home's sixteen and Boston's seven", () => {
    expect(CITIES.home.cast).toBe(HOME_CAST);
    expect(CITIES.boston.cast).toBe(BOSTON_CAST);
  });
  it("catches a character that is neither the city's nor a returning one", () => {
    const stray: CityDef = {
      ...CITIES.home,
      scenes: CITIES.home.scenes.map((s) => (s.id === 'waterfront-1' ? { ...s, character: 'trish-vance' as const } : s)),
    };
    expect(problemsOf(stray).join('\n')).toMatch(/scene "waterfront-1" · character: "trish-vance" is not a character id of this city's cast/);
    expect(problemsOf({ ...CITIES.home, lieutenant: { id: 'trish-vance', name: 'Trish' } }).join('\n')).toMatch(
      /lieutenant\.id: "trish-vance" is not a character id/,
    );
  });
});

describe("the next city's teaser (teaserFor)", () => {
  it('says what Boston is, word for word, to a home game', () => {
    expect(teaserFor({ city: 'home' })).toBe(BOSTON_TEASER);
    expect(teaserFor({})).toBe(BOSTON_TEASER);
    expect(BOSTON_TEASER).toEqual({
      title: 'Coming soon: Boston',
      lines: ['Victor Crust is waiting in Boston. So is the cold.', 'Your crew is packing the sauce. Keep the ovens hot.'],
      signoff: 'I knit you a sweater. Is ugly. Wear it anyway.',
      from: 'Nonna Rosa',
    });
    // the home table no longer holds the card's words (card R7b): the pack's teaser is the one place they live
    expect(t('soon.boston.title')).toBe('soon.boston.title');
  });
  it('is null where no pack follows, and for a city that is not in the order', () => {
    expect(teaserFor({ city: 'boston' })).toBeNull(); // Chicago has no pack yet
    expect(CITIES.home.teaser).toBeUndefined();
  });
});

// ---------- a fresh pack plays, with no core edit (card R7a) ----------

// The test pack is registered here only, never in CITIES for the app. It is registered after the `describe.each` above has read CITIES.
CITIES[TEST_CITY.id] = TEST_CITY;
afterAll(() => {
  delete CITIES[TEST_CITY.id];
});

const PLAY_START = new Date(2026, 10, 11, 12, 0, 0).getTime();

/** The pack played from its opening to its last finale by a player who has all the cash: builds in order, hires, ticks, wins the challenges, places the bid. */
function playThrough(city: CityDef): { game: G.GameState; order: string[] } {
  const order: string[] = [];
  let g: G.GameState = { ...newGame(PLAY_START, city.id), cash: 1e21, tutorial: G.TUTORIAL_DONE };
  const take = (): void => {
    for (let guard = 0; guard < 100; guard++) {
      const next = G.pendingScenes(g, city.scenes)[0];
      if (!next) return;
      order.push(next.id);
      g = G.markSceneSeen(g, next);
    }
  };
  take();
  for (let step = 0; step < 4000 && order.length < city.scenes.length; step++) {
    // the next shop, run by its heads and a manager (the pack's takeover scene must have played for the second)
    const upNext = G.nextToBuild(g);
    if (upNext) {
      const r = G.buildShop(g, upNext.id);
      if (r.ok)
        g = {
          ...r.state,
          shops: {
            ...r.state.shops,
            [upNext.id]: { ...r.state.shops[upNext.id], managed: true, heads: G.allHeads(), prep: 5, ovens: 5, counter: 5, drivers: 4, tables: 4 },
          },
        };
    }
    if (!g.shops[city.neighbourhoods[0].id].managed)
      g = { ...g, shops: { ...g.shops, [city.neighbourhoods[0].id]: { ...g.shops[city.neighbourhoods[0].id], managed: true, heads: G.allHeads() } } };
    g = G.playTick(g, 30, PLAY_START + step * 30_000);
    // a challenge won once its beat 3 has played
    const won = city.neighbourhoods.map((n) => n.id).filter((h) => g.seenScenes.includes(sceneId(h, 3)));
    g = { ...g, x: { ...g.x, [LAYER_KEYS.rival]: { won, challenge: null, retryAt: {} } } };
    if (G.bidAvailable(g)) {
      const bid = G.placeBid(g);
      if (bid.ok) g = bid.state;
    }
    take();
  }
  return { game: g, order };
}

describe('a fresh pack plays without a core edit (the test city)', () => {
  const finale = (h: string) => sceneId(h, 4);

  it('is not in CITIES for the app, and passes the schema with its own cast, teaser and copy', () => {
    expect(problemsOf(TEST_CITY)).toEqual([]);
    expect(TEST_CITY.cast.length).toBeGreaterThan(0);
    expect(TEST_CITY.teaser?.lines).toHaveLength(2);
    expect(TEST_CITY.neighbourhoods.map((n) => n.id)).toEqual([...TEST_IDS]);
    expect(Object.keys(TEST_CITY.copy ?? {}).length).toBeGreaterThan(0);
  });

  it("says its own words for home keys, with the home line's placeholders, and the home line for the rest", () => {
    for (const [key, line] of Object.entries(TEST_CITY.copy ?? {})) {
      expect(key in HOME_COPY).toBe(true);
      const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(holes(line)).toEqual(holes(HOME_COPY[key]));
      expect(t(key, { n: 3, star: 'Flagship', shop: 'X' }, TEST_CITY.id)).not.toBe(t(key, { n: 3, star: 'Flagship', shop: 'X' }));
    }
    expect(t('mastery.crew.name', {}, TEST_CITY.id)).toBe(t('mastery.crew.name'));
  });

  it('is announced by nobody (it is not in CITY_ORDER) and announces nobody', () => {
    expect(teaserFor({ city: TEST_CITY.id })).toBeNull();
  });

  it('plays from its opening to its last finale: every beat of every shop, in order, the bid and the city complete', () => {
    const { game, order } = playThrough(TEST_CITY);
    expect(game.city).toBe(TEST_CITY.id);
    expect(game.cityComplete).toBe(true);
    expect(order).toContain(finale(TEST_IDS[TEST_IDS.length - 1]));
    expect(order).toHaveLength(TEST_CITY.scenes.length);
    for (const h of TEST_IDS) {
      const beats = [1, 2, 3, 4].map((b) => order.indexOf(sceneId(h, b as 1 | 2 | 3 | 4)));
      expect(beats.every((i) => i >= 0)).toBe(true);
      expect([...beats].sort((a, b) => a - b)).toEqual(beats);
    }
    expect(Object.values(game.shops).every((s) => s.built)).toBe(true);
    // the bid shop's finale came from the bid, not a challenge
    expect(game.shops[TEST_CITY.bid!.hood].perk).toBe(true);
    // and it saves and loads
    expect(migrate(JSON.parse(JSON.stringify(game)), game.lastSavedAt).city).toBe(TEST_CITY.id);
  });
});
