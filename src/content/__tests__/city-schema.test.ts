// The gate every city pack passes (card K1; v5.19's three cities are gated mostly by this file). One `describe` per entry of CITIES. A failure
// names the city, the scene and the field: `city "home" · scene "waterfront-3" · panels[1].lines[0].text: 97 characters (max 90)`.
// Pure data checks (plus one engine round trip at the end): nothing here plays the game.
import { CITIES } from '../cities';
import { FIT_KEYS, LAYER_KINDS, type CityDef } from '../cities/types';
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

/** Every name a scene may speak in: the player and the disguise, the cast's ids, the heads and managers, the lieutenant and the perk-givers (with or without their title). */
function speakersOf(city: CityDef): Set<string> {
  const names = [...NARRATOR_SPEAKERS, ...CHARACTER_IDS, city.lieutenant.name];
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
  const characters = new Set<string>(CHARACTER_IDS);
  const props = new Set<string>(PROP_IDS);
  const backdrops = new Set<string>([...hoods, ...FIXED_BACKDROPS]);

  // the city
  if (!city.id) at(null, 'id', 'is empty');
  if (!city.name) at(null, 'name', 'is empty');
  if (city.neighbourhoods.length !== 6) at(null, 'neighbourhoods', `${city.neighbourhoods.length} of them (a city has 6)`);
  if (hoodSet.size !== hoods.length) at(null, 'neighbourhoods', 'two share an id');
  if (!city.theme) at(null, 'theme', 'is empty');
  if (!characters.has(city.lieutenant.id)) at(null, 'lieutenant.id', `"${city.lieutenant.id}" is not a character id`);
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
    if (!characters.has(s.character)) at(s.id, 'character', `"${s.character}" is not a character id`);
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
        if (!characters.has(c.id)) at(s.id, `panels[${pi}].cast[${ci}].id`, `"${c.id}" is not a character id`);
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
