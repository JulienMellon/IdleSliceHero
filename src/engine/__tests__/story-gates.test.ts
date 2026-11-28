/// <reference types="jest" />
// v5.25 (card T3, engine hook): an interlude with a gate (content SCENE_GATES) also waits for it in `pendingScenes`, and the home city's ambient beats are due,
// once each, by `dueAmbient` / `markAmbientPlayed`.
import { HOME_AMBIENT, SCENE_GATES } from '../../content/cities/home/scenes/ambient';
import { HOME_SCENES } from '../../content/scenes/home';
import * as G from '../game';
import { withStars } from '../features/layers/__tests__/gate-helpers';
import { ambientPlayed, dueAmbient, gateFacts, markAmbientPlayed } from '../story';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const ids = (g: G.GameState) => G.pendingScenes(g, HOME_SCENES).map((s) => s.id);
const shopOf = (g: G.GameState, id: string, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...p } } });

/** Waterfront built, the scenes before the interludes seen long ago, an hour of play on the clock. */
const stretch = (seen: string[], at: Record<string, number> = {}): G.GameState => {
  const g = shopOf(shopOf(G.newGame(NOW), 'suburbs', { built: true }), 'waterfront', { built: true });
  return { ...g, playSeconds: 10_000, seenScenes: seen, sceneAt: Object.fromEntries(seen.map((s) => [s, at[s] ?? 0])) };
};
const heads = (g: G.GameState, kinds: Partial<Record<'prep' | 'oven' | 'counter', boolean>>) =>
  shopOf(g, 'waterfront', { heads: { ...g.shops.waterfront.heads, ...kinds } });

describe('an interlude with a gate waits for it', () => {
  it('names the gates the content gives', () => {
    expect(Object.keys(SCENE_GATES).sort()).toEqual(['waterfront-1b', 'waterfront-1c', 'waterfront-1d']);
  });

  it('waterfront-1b (Gus) waits for the oven head', () => {
    const g = stretch(['waterfront-1']);
    expect(ids(g)).not.toContain('waterfront-1b');
    expect(ids(heads(g, { prep: true }))).not.toContain('waterfront-1b');
    expect(ids(heads(g, { oven: true }))).toContain('waterfront-1b');
  });

  it('waterfront-1c waits for the boats (Downtown two stars, Waterfront built) and Finn, the prep head', () => {
    const g = stretch(['waterfront-1', 'waterfront-1b', 'downtown-4b']);
    const finn = heads(g, { prep: true });
    expect(ids(finn)).not.toContain('waterfront-1c');
    expect(ids(withStars(g, 0, 2))).not.toContain('waterfront-1c');
    const both = withStars(finn, 0, 2);
    expect(gateFacts(both).boatsOpen).toBe(true);
    expect(ids(both)).toContain('waterfront-1c');
    // one star is not enough
    expect(ids(withStars(finn, 0, 1))).not.toContain('waterfront-1c');
  });

  it('waterfront-1d plays only while Waterfront has no manager', () => {
    const g = stretch(['waterfront-1', 'downtown-4c']);
    expect(ids(g)).toContain('waterfront-1d');
    expect(ids(shopOf(g, 'waterfront', { managed: true }))).not.toContain('waterfront-1d');
  });

  it('a scene with no gate is unaffected', () => {
    const g = stretch(['waterfront-1']);
    expect(ids(g)).toEqual(G.pendingScenes(g, HOME_SCENES).map((s) => s.id));
    expect(gateFacts(g)).toMatchObject({ boatsOpen: false });
    expect(gateFacts(heads(g, { oven: true })).headHired('waterfront', 'oven')).toBe(true);
    expect(gateFacts(shopOf(g, 'waterfront', { managed: true })).managed('waterfront')).toBe(true);
  });
});

describe('ambient beats', () => {
  const first = HOME_AMBIENT[0];

  it('one is due `seconds` of play after the scene it follows, not before', () => {
    const g = { ...stretch(['waterfront-1'], { 'waterfront-1': 5000 }), playSeconds: 5000 + first.seconds - 1 };
    expect(dueAmbient(g)).toEqual([]);
    expect(dueAmbient({ ...g, playSeconds: 5000 + first.seconds }).map((b) => b.key)).toEqual(['ambient.wf.1']);
    // the second follows the same scene 180 s later
    expect(dueAmbient({ ...g, playSeconds: 5000 + 360 }).map((b) => b.key)).toEqual(['ambient.wf.1', 'ambient.wf.2']);
    // no scene seen, no beat
    expect(dueAmbient(stretch([]))).toEqual([]);
  });

  it('each plays once: marked in the save, then never due again, through a save and load', () => {
    const g = { ...stretch(['waterfront-1'], { 'waterfront-1': 0 }), playSeconds: 400 };
    expect(dueAmbient(g).map((b) => b.key)).toEqual(['ambient.wf.1', 'ambient.wf.2']);
    const one = markAmbientPlayed(g, first);
    expect(ambientPlayed(one, first)).toBe(true);
    expect(one.sceneAt['ambient.wf.1']).toBe(400);
    expect(dueAmbient(one).map((b) => b.key)).toEqual(['ambient.wf.2']);
    expect(markAmbientPlayed(one, first)).toBe(one);
    const loaded = G.migrate(JSON.parse(JSON.stringify(one)), NOW);
    expect(dueAmbient({ ...loaded, playSeconds: 400 }).map((b) => b.key)).toEqual(['ambient.wf.2']);
  });

  it('wf.13 (and waterfront-1d) are for a Waterfront with no manager only', () => {
    const last = HOME_AMBIENT[12];
    const g = { ...stretch(['waterfront-1d'], { 'waterfront-1d': 0 }), playSeconds: 1000 };
    expect(dueAmbient(g).map((b) => b.key)).toContain(last.key);
    expect(dueAmbient(shopOf(g, 'waterfront', { managed: true })).map((b) => b.key)).not.toContain(last.key);
  });

  it('are the home city’s only', () => {
    const g = { ...G.newGame(NOW, 'boston'), playSeconds: 9999, seenScenes: ['waterfront-1'], sceneAt: { 'waterfront-1': 0 } };
    expect(dueAmbient(g)).toEqual([]);
  });
});
