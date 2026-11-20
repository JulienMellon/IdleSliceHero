import { LAYER_KEYS } from '../../content/layers';
import { HOME_SCENES } from '../../content/scenes/home';
import { STORY_PACING } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { pickScene, resolveScene, resumeSceneEnd, sceneHeading, sceneReady, scenePacesGap } from '../cutscene-input';
import * as G from '../game';

import { HOME_FIT } from '../../content/cities/home/fit';
import { PERKS, PIER9_BID } from '../../content/cities/home/data';
const scene = (id: string) => HOME_SCENES.find((s) => s.id === id)!;
/** The pizzas a count-triggered scene waits for (v5.16: fitted in scripts/pacing-fit.ts session1, so the tests read them). */
const countOf = (id: string): number => (scene(id).trigger as { count: number }).count;
const withShop = (s: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({
  ...s,
  shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } },
});
const seenUpTo = (ids: string[], playSeconds = 0, sceneAt: Record<string, number> = {}): G.GameState => ({
  ...G.newGame(0),
  seenScenes: ids,
  playSeconds,
  sceneAt,
});
const LATE = 1e9; // ms: long after any kitchen tap
/** `id`'s rival challenge has been won (the rival feature's own state: features/layers/rival.ts). */
const won = (s: G.GameState, id: NeighborhoodId): G.GameState => ({ ...s, x: { ...s.x, [LAYER_KEYS.rival]: { won: [id], challenge: null, retryAt: {} } } });
const after = (id: string) => (scene(id).trigger as { seconds: number }).seconds;
const ids = (list: { id: string }[]) => list.map((x) => x.id);
/** Everything in Downtown played, so no Downtown scene is waiting in front of the scene a test is about. */
const DT = ['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4'];

describe('story pacing (v3.7)', () => {
  it('the first scene after a launch or return plays straight away', () => {
    const s = withShop(seenUpTo(['downtown-1'], 10), 'downtown', { sold: countOf('downtown-2') });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)?.id).toBe('downtown-2');
  });
  it('after a scene, the next waits for 90 s of play', () => {
    const s = withShop(seenUpTo(['downtown-1'], 100), 'downtown', { sold: countOf('downtown-2') });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 100 - 30)).toBeNull();
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 100 - STORY_PACING.gapSeconds)?.id).toBe('downtown-2');
  });
  it('a scene the player caused (a new pizzeria, the Pier 9 bid) is never held back', () => {
    const s = withShop(seenUpTo(['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4'], 100), 'suburbs', { built: true });
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 99)?.id).toBe('suburbs-1');
  });
  it('Downtown’s beat 4 (a pizza count) waits 120 s of play after beat 3 (S45)', () => {
    const dt = withShop(seenUpTo(['downtown-1', 'downtown-2', 'downtown-3'], 500, { 'downtown-3': 400 }), 'downtown', { sold: countOf('downtown-4') });
    expect(pickScene({ ...dt, playSeconds: 400 + STORY_PACING.firstHoodBeat4GapSeconds - 10 }, HOME_SCENES, LATE, 0, false, null)).toBeNull();
    expect(pickScene({ ...dt, playSeconds: 400 + STORY_PACING.firstHoodBeat4GapSeconds + 10 }, HOME_SCENES, LATE, 0, false, null)?.id).toBe('downtown-4');
  });
  it('the count-triggered scenes wait for more pizzas, beat after beat', () => {
    const c = [2, 3, 4].map((n) => countOf(`downtown-${n}`));
    expect(c[0]).toBeLessThan(c[1]);
    expect(c[1]).toBeLessThan(c[2]);
    expect(countOf('suburbs-2')).toBeLessThan(countOf('suburbs-3'));
  });
  it('play time only grows while playing, not offline', () => {
    const s = G.newGame(0);
    expect(G.playTick(s, 2).playSeconds).toBe(2);
    expect(G.applyOffline({ ...s, playSeconds: 7, lastSavedAt: 0 }, 3600_000).state.playSeconds).toBe(7);
  });
  it('a scene records the play time it was seen at', () => {
    const s = { ...G.newGame(0), playSeconds: 42 };
    expect(G.markSceneSeen(s, scene('downtown-1')).sceneAt['downtown-1']).toBe(42);
  });
});

describe('save migration v2 → v3', () => {
  it('adds play time and scene times, and grants perks for finales already seen', () => {
    const old = {
      ...JSON.parse(JSON.stringify(G.newGame(0))),
      saveVersion: 2,
      playSeconds: undefined,
      sceneAt: undefined,
      seenScenes: ['suburbs-4', 'waterfront-4'],
    };
    const m = G.migrate(old, 0);
    expect(G.SAVE_VERSION).toBe(7);
    expect(m.playSeconds).toBe(0);
    expect(m.sceneAt).toEqual({});
    expect(m.shops.suburbs.perk).toBe(true);
    expect(m.shops.waterfront.perk).toBe(true);
    expect(m.shops.university.perk).toBe(false);
  });
});

describe('neighbourhood perks (v3.7)', () => {
  const managed = (id: NeighborhoodId, perk: boolean) =>
    withShop(G.newGame(0), id, { built: true, managed: true, prep: 40, ovens: 40, counter: 40, drivers: 1, tables: 40, perk });
  it('each perk is defined for its own neighbourhood only', () => {
    expect(Object.keys(PERKS).sort()).toEqual(['industrial', 'suburbs', 'university', 'uptown', 'waterfront']);
  });
  it('Dale: Suburbs walk-ins pay 15% extra', () => {
    const a = G.shopEarnings(managed('suburbs', false), 'suburbs');
    const b = G.shopEarnings(managed('suburbs', true), 'suburbs');
    expect(b / a).toBeCloseTo(1.15, 1); // 40 tables seat nearly every pie
  });
  it('Marisol: Waterfront prices +10%', () => {
    const a = G.shopEarnings(managed('waterfront', false), 'waterfront');
    expect(G.shopEarnings(managed('waterfront', true), 'waterfront') / a).toBeCloseTo(1.1, 6);
  });
  it('Priya: University driver upgrades cost 10% less', () => {
    const a = G.upgradeCostOf(managed('university', false), 'university', 'drivers')!;
    expect(G.upgradeCostOf(managed('university', true), 'university', 'drivers')).toBe(Math.ceil(a * 0.9));
  });
  it('Sal: Industrial earns 25% more while away', () => {
    const a = G.applyOffline({ ...managed('industrial', false), lastSavedAt: 0 }, 600_000);
    const b = G.applyOffline({ ...managed('industrial', true), lastSavedAt: 0 }, 600_000);
    expect(b.earned / a.earned).toBeCloseTo(1.25, 6);
  });
  it('Genevieve: each Uptown decor tier adds 6% instead of 4%', () => {
    const deco = (perk: boolean) => withShop(managed('uptown', perk), 'uptown', { decor: { plants: 3, flooring: 3, tables: 3, walls: 3, signage: 3 } });
    expect(G.shopEarnings(deco(true), 'uptown') / G.shopEarnings(deco(false), 'uptown')).toBeCloseTo((1 + 0.06 * 15) / (1 + 0.04 * 15), 6);
  });
  it('a perk flag on another shop changes nothing', () => {
    const a = G.shopEarnings(managed('downtown', false), 'downtown');
    expect(G.shopEarnings(managed('downtown', true), 'downtown')).toBe(a);
  });
  it('a finale scene grants its neighbourhood perk', () => {
    expect(G.markSceneSeen(G.newGame(0), scene('suburbs-4')).shops.suburbs.perk).toBe(true);
  });
});

describe('Pier 9 bid (v3.7)', () => {
  const ready = () =>
    withShop({ ...seenUpTo(['waterfront-1', 'waterfront-2', 'waterfront-3', 'waterfront-3b']), cash: PIER9_BID.cost * 1.5 }, 'waterfront', {
      built: true,
      managed: true,
      sold: PIER9_BID.unlockPizzas,
    });
  it('costs $120M (about 4–5 minutes of income when it opens, v5.13)', () => expect(PIER9_BID.cost).toBe(120_000_000));
  it('opens after "Man Overboard" and 50,000 Waterfront pizzas', () => {
    expect(G.bidAvailable(ready())).toBe(true);
    expect(G.bidAvailable(withShop(ready(), 'waterfront', { sold: PIER9_BID.unlockPizzas - 1 }))).toBe(false);
    expect(G.bidAvailable({ ...ready(), seenScenes: ['waterfront-1', 'waterfront-2'] })).toBe(false);
  });
  it('"For Sale" alone is not enough: the bid needs waterfront-3b, which plays at the same pizza count', () => {
    expect(G.bidAvailable({ ...ready(), seenScenes: ['waterfront-1', 'waterfront-2', 'waterfront-3'] })).toBe(false);
    expect(scene('waterfront-3b').trigger).toEqual({ kind: 'deliveries', neighborhood: 'waterfront', count: PIER9_BID.unlockPizzas });
    expect(scene('waterfront-3b').requires).toEqual(['waterfront-3']);
    expect(scene('waterfront-4').requires).toEqual(['waterfront-3b']);
  });
  it('winning it spends the bid, grants the perk and plays the finale', () => {
    const r = G.placeBid(ready());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.cash).toBe(PIER9_BID.cost * 0.5);
    expect(r.state.shops.waterfront.perk).toBe(true);
    expect(G.pendingScenes(r.state, HOME_SCENES).map((x) => x.id)).toContain('waterfront-4');
    expect(G.placeBid(r.state).ok).toBe(false);
  });
  it('the finale no longer plays from a pizza count alone', () => {
    const s = withShop(ready(), 'waterfront', { sold: 1e7 });
    expect(G.pendingScenes(s, HOME_SCENES).map((x) => x.id)).not.toContain('waterfront-4');
  });
});

describe('returning to the app (C39, T32)', () => {
  it('a short interruption (Control Center, app switcher) keeps the story gap', () => {
    expect(resumeSceneEnd(480, 5, 600)).toBe(480);
    expect(resumeSceneEnd(480, STORY_PACING.returnSeconds - 1, 600)).toBe(480);
  });
  it('a real absence counts as a return, so one waiting beat may play', () => {
    expect(resumeSceneEnd(480, STORY_PACING.returnSeconds, 600)).toBeNull();
    expect(resumeSceneEnd(480, 3600, 600)).toBeNull();
  });
  it('a reload from an older save never stretches the gap (T35, C47)', () => {
    // the gap started at 480 s of play, but the save on disk only got to 450 s
    expect(resumeSceneEnd(480, 5, 450)).toBe(450);
  });
  it('a cold launch (nothing played yet) stays a return', () => {
    expect(resumeSceneEnd(null, 2, 600)).toBeNull();
  });
});

describe('story data contracts (T29)', () => {
  it('every main beat’s id is <neighbourhood>-<beat> (an interlude’s is not)', () => {
    for (const sc of HOME_SCENES) {
      if (sc.beat === 'interlude') expect(sc.id).not.toBe(sc.id.replace(/-(hire|\d[bc]?)$/, '') + '-' + sc.beat);
      else expect(sc.id).toBe(G.sceneId(sc.neighborhood, sc.beat));
    }
  });
  it('each perk has exactly one granting scene, its finale', () => {
    for (const [hood] of Object.entries(PERKS)) {
      const granting = HOME_SCENES.filter((sc) => sc.perk && sc.neighborhood === hood);
      expect(granting.map((sc) => sc.id)).toEqual([G.finaleId(hood as NeighborhoodId)]);
    }
    for (const sc of HOME_SCENES.filter((x) => x.perk)) expect(PERKS[sc.neighborhood]).toBeDefined();
  });
});

describe('save v3 round trip (T30)', () => {
  it('keeps play time, scene times and perks; drops bad scene times', () => {
    const s0 = G.newGame(0);
    const s = {
      ...s0,
      playSeconds: 1234,
      sceneAt: { 'downtown-1': 0, 'downtown-2': 95 },
      shops: { ...s0.shops, suburbs: { ...s0.shops.suburbs, built: true, perk: true } },
    };
    const back = G.migrate(JSON.parse(JSON.stringify(s)), 0);
    expect(back.playSeconds).toBe(1234);
    expect(back.sceneAt).toEqual({ 'downtown-1': 0, 'downtown-2': 95 });
    expect(back.shops.suburbs.perk).toBe(true);
    const bad = G.migrate({ ...JSON.parse(JSON.stringify(s)), sceneAt: { a: 'x', b: null, c: 5 } }, 0);
    expect(bad.sceneAt).toEqual({ c: 5 });
  });
});

describe('perk scope (T31)', () => {
  const managed = (id: NeighborhoodId, perk: boolean) =>
    withShop(G.newGame(0), id, { built: true, managed: true, prep: 40, ovens: 40, counter: 40, drivers: 1, tables: 40, perk });
  it("Priya's perk leaves the city-wide fleet price alone", () => {
    const a = G.buyVehicle({ ...managed('university', false), cash: 1e12 });
    const b = G.buyVehicle({ ...managed('university', true), cash: 1e12 });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(b.state.cash).toBe(a.state.cash);
  });
  it("Sal's perk leaves foreground earnings alone", () => {
    expect(G.lineTick(managed('industrial', true), 10).cash).toBe(G.lineTick(managed('industrial', false), 10).cash);
  });
  it("Dale's perk raises exactly the walk-in share", () => {
    // plenty of seats: nearly every sale is a walk-in, so revenue = price × (delivered + walkIns × share)
    const s = managed('suburbs', false);
    const sh = s.shops.suburbs;
    const sold = G.shopRate(sh, s.vehicle, HOME_FIT);
    const walkIns = Math.min(sold, G.walkInRate(sh));
    const price = G.def('suburbs').orderValue * G.decorMult(sh, 'suburbs') * G.gmMult(sh);
    expect(G.shopEarnings(managed('suburbs', true), 'suburbs')).toBeCloseTo(price * (sold - walkIns + walkIns * 1.15), 6);
  });
});

// ---------- v5.16: Todd's interludes, the challenge, the managers' hire scenes ----------

describe('interludes (v5.16)', () => {
  const sub3 = (playSeconds: number) =>
    withShop(seenUpTo([...DT, 'suburbs-1', 'suburbs-2', 'suburbs-3'], playSeconds, { 'suburbs-3': 800 }), 'suburbs', { built: true });
  it('an `after` interlude plays at its delay and not before', () => {
    const delay = after('suburbs-3b');
    expect(delay).toBeGreaterThan(0);
    expect(G.sceneTriggered(sub3(800 + delay - 1), scene('suburbs-3b'))).toBe(false);
    expect(G.sceneTriggered(sub3(800 + delay), scene('suburbs-3b'))).toBe(true);
    expect(G.sceneTriggered(seenUpTo([], 1e6), scene('suburbs-3b'))).toBe(false); // the scene it counts from has not been seen
    expect(G.sceneTriggered(withShop(seenUpTo(['suburbs-3'], 1e6, { 'suburbs-3': 0 }), 'suburbs', { built: false }), scene('suburbs-3b'))).toBe(false);
  });
  it('a scene seen with no time on record (an old save, or one the migration marked) counts from the start of play', () => {
    const s = withShop(seenUpTo([...DT, 'suburbs-1', 'suburbs-2', 'suburbs-3'], 0), 'suburbs', { built: true });
    expect(G.sceneTriggered({ ...s, playSeconds: after('suburbs-3b') - 1 }, scene('suburbs-3b'))).toBe(false);
    expect(G.sceneTriggered({ ...s, playSeconds: after('suburbs-3b') }, scene('suburbs-3b'))).toBe(true);
  });
  it('an interlude obeys the 90 s gap like any beat', () => {
    const s = sub3(800 + after('suburbs-3b') + 10);
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, s.playSeconds - 30)).toBeNull();
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, s.playSeconds - STORY_PACING.gapSeconds)?.id).toBe('suburbs-3b');
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)?.id).toBe('suburbs-3b');
  });
  it('a main beat waits on the interludes it requires', () => {
    const s = won(sub3(1e6), 'suburbs');
    expect(G.sceneTriggered(s, scene('suburbs-4'))).toBe(false); // the challenge is won, but "Coach Todd" has not played
    expect(ids(G.pendingScenes(s, HOME_SCENES))).not.toContain('suburbs-4');
    const played = { ...s, seenScenes: [...s.seenScenes, 'suburbs-3b'] };
    expect(G.sceneTriggered(played, scene('suburbs-4'))).toBe(true);
  });
  it('main beats win ties: a main beat and an interlude both ready, the main beat first, though the interlude comes first in the story', () => {
    const seen = [
      'downtown-1',
      'downtown-2',
      'downtown-3',
      'downtown-4',
      'suburbs-1',
      'suburbs-2',
      'suburbs-3',
      'suburbs-3b',
      'waterfront-1',
      'waterfront-2',
      'waterfront-3',
      'waterfront-3b',
      'waterfront-4',
    ];
    const s = won(withShop(seenUpTo(seen, 1e6, { 'waterfront-4': 0, 'suburbs-3': 0 }), 'suburbs', { built: true }), 'suburbs');
    const pending = ids(G.pendingScenes(s, HOME_SCENES));
    expect(pending).toEqual(['suburbs-4', 'downtown-5']);
    expect(HOME_SCENES.findIndex((x) => x.id === 'downtown-5')).toBeLessThan(HOME_SCENES.findIndex((x) => x.id === 'suburbs-4'));
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)?.id).toBe('suburbs-4');
  });
  it('an interlude shows "<Neighbourhood> · Interlude" until its last panel', () => {
    const sc = scene('suburbs-3b');
    expect(sceneHeading(sc, 0, false)).toBe('Suburbs · Interlude');
    expect(sceneHeading(sc, sc.panels.length - 1, false)).toBe(sc.title);
    expect(sceneHeading(scene('suburbs-4'), 0, false)).toBe('Suburbs · Act 4');
  });
});

describe('beat 4 is won (v5.16)', () => {
  const beat3 = (playSeconds: number, hood: NeighborhoodId = 'suburbs') =>
    withShop(
      seenUpTo([...DT, `${hood}-1`, `${hood}-2`, `${hood}-3`, ...(hood === 'suburbs' ? ['suburbs-3b'] : [])], playSeconds, { [`${hood}-3`]: 800 }),
      hood,
      { built: true },
    );
  it('beat 4 waits for the challenge: sold pizzas alone never play it', () => {
    const s = withShop(beat3(5000), 'suburbs', { sold: 1e9 });
    expect(ids(G.pendingScenes(s, HOME_SCENES))).not.toContain('suburbs-4');
    expect(ids(G.pendingScenes(won(s, 'suburbs'), HOME_SCENES))).toContain('suburbs-4');
  });
  it('a won challenge plays beat 4 at once, even inside the 90 s gap (the player caused it)', () => {
    const s = won(beat3(2000), 'suburbs');
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 1995)?.id).toBe('suburbs-4');
    expect(sceneReady(s, scene('suburbs-4'), 1999)).toBe(true);
  });
  it('the challenge is offered 300 s of play after beat 3 (Downtown: 60 s), not before', () => {
    expect(G.challengeOffered(beat3(800 + STORY_PACING.beat4GapSeconds - 1), 'suburbs')).toBe(false);
    expect(G.challengeOffered(beat3(800 + STORY_PACING.beat4GapSeconds), 'suburbs')).toBe(true);
    const dt = withShop(seenUpTo(['downtown-1', 'downtown-2', 'downtown-3'], 0, { 'downtown-3': 400 }), 'downtown', {});
    expect(G.challengeOffered({ ...dt, playSeconds: 400 + STORY_PACING.firstHoodBeat4GapSeconds - 1 }, 'downtown')).toBe(false);
    expect(G.challengeOffered({ ...dt, playSeconds: 400 + STORY_PACING.firstHoodBeat4GapSeconds }, 'downtown')).toBe(true);
  });
  it('the challenge is not offered with no rival: beat 3 unseen, the shop unbuilt, or the challenge already won', () => {
    expect(G.challengeOffered(withShop(seenUpTo(['suburbs-1', 'suburbs-2'], 1e6), 'suburbs', { built: true }), 'suburbs')).toBe(false);
    expect(G.challengeOffered({ ...beat3(1e6), shops: { ...beat3(1e6).shops, suburbs: { ...beat3(1e6).shops.suburbs, built: false } } }, 'suburbs')).toBe(
      false,
    );
    expect(G.challengeOffered(won(beat3(1e6), 'suburbs'), 'suburbs')).toBe(false);
  });
});

describe('hire scenes (v5.16)', () => {
  const hired = (id: NeighborhoodId, managed = true) =>
    withShop(seenUpTo([...DT, `${id}-1`], 100), id, { built: true, managed, heads: { prep: true, oven: true, counter: true } });
  it('plays when the manager is hired and not before', () => {
    expect(G.sceneTriggered(hired('suburbs', false), scene('suburbs-hire'))).toBe(false);
    expect(G.sceneTriggered(hired('suburbs'), scene('suburbs-hire'))).toBe(true);
    expect(G.sceneTriggered(hired('waterfront'), scene('suburbs-hire'))).toBe(false); // another shop's manager
  });
  it('plays at once, even inside the 90 s gap and with a main beat held back by it', () => {
    const s = withShop(hired('suburbs'), 'suburbs', { sold: countOf('suburbs-2') });
    expect(ids(G.pendingScenes(s, HOME_SCENES))).toEqual(['suburbs-2', 'suburbs-hire']);
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, 95)?.id).toBe('suburbs-hire'); // beat 2 is held by the gap, the hire is not
  });
  it('does not restart the gap for the next main beat; any other scene does', () => {
    expect(scenePacesGap(scene('suburbs-hire'))).toBe(false);
    for (const sc of HOME_SCENES.filter((x) => x.trigger.kind !== 'manager')) expect(scenePacesGap(sc)).toBe(true);
  });
  it('is never held back by an interlude', () => {
    const s = hired('suburbs');
    expect(HOME_SCENES.find((x) => x.id === 'suburbs-hire')?.requires).toBeUndefined();
    expect(
      pickScene(
        { ...s, seenScenes: [...s.seenScenes, 'suburbs-2', 'suburbs-3'], sceneAt: { 'suburbs-3': 0 }, playSeconds: 1e6 },
        HOME_SCENES.filter((x) => x.id === 'suburbs-hire' || x.id === 'suburbs-3b'),
        LATE,
        0,
        false,
        999_999,
      )?.id,
    ).toBe('suburbs-hire');
  });
  it('a manager’s line in a beat plays only after the hire scene, and the panel plays without it before', () => {
    const beat4 = scene('suburbs-4');
    const line = (sc: typeof beat4) => sc.panels[1].lines.map((l) => l.speaker);
    expect(line(resolveScene(beat4, []))).toEqual(['Dale']);
    expect(line(resolveScene(beat4, ['suburbs-hire']))).toEqual(['Dale', 'Deb']);
    expect(resolveScene(scene('downtown-1'), [])).toBe(scene('downtown-1')); // nothing to leave out: the same scene
    const s = won(
      withShop(seenUpTo([...DT, 'suburbs-1', 'suburbs-2', 'suburbs-3', 'suburbs-3b'], 1e6, { 'suburbs-3': 0 }), 'suburbs', { built: true }),
      'suburbs',
    );
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)?.panels[1].lines).toHaveLength(1);
    expect(pickScene({ ...s, seenScenes: [...s.seenScenes, 'suburbs-hire'] }, HOME_SCENES, LATE, 0, false, null)?.panels[1].lines).toHaveLength(2);
  });
});

describe('save migration v5 → v6 (v5.16)', () => {
  const v5 = (patch: Record<string, unknown>) => ({ ...JSON.parse(JSON.stringify(G.newGame(0))), saveVersion: 5, ...patch });
  it('a save that has seen University’s act 3 never meets the interludes before it', () => {
    const m = G.migrate(v5({ seenScenes: ['university-3'], sceneAt: { 'university-3': 5000 } }), 0);
    for (const id of ['downtown-5', 'suburbs-5', 'waterfront-5', 'waterfront-4', 'waterfront-3b', 'waterfront-3']) expect(m.seenScenes).toContain(id);
    expect(m.seenScenes).not.toContain('university-3b'); // that one still comes after university-3
    expect(m.sceneAt['downtown-5']).toBe(5000);
    expect(m.sceneAt['university-3']).toBe(5000);
  });
  it('is idempotent: it runs on every load', () => {
    const once = G.migrate(v5({ seenScenes: ['university-3', 'uptown-4'] }), 0);
    const twice = G.migrate(JSON.parse(JSON.stringify(once)), 0);
    expect([...twice.seenScenes].sort()).toEqual([...once.seenScenes].sort());
    expect(twice.sceneAt).toEqual(once.sceneAt);
  });
  it('a save with a beat 4 seen keeps it seen, and the interludes before it are seen too', () => {
    const m = G.migrate(v5({ seenScenes: ['suburbs-1', 'suburbs-2', 'suburbs-3', 'suburbs-4'] }), 0);
    expect(m.seenScenes).toContain('suburbs-4');
    expect(m.seenScenes).toContain('suburbs-3b');
    expect(G.pendingScenes(m, HOME_SCENES).map((x) => x.id)).not.toContain('suburbs-3b');
    const late = G.migrate(v5({ seenScenes: ['uptown-4'] }), 0);
    for (const id of ['uptown-3b', 'uptown-3', 'uptown-2b', 'industrial-4', 'industrial-3b']) expect(late.seenScenes).toContain(id);
  });
  it('a finale already seen leaves its rival closed and the challenge won', () => {
    const m = G.migrate(v5({ seenScenes: ['suburbs-4'] }), 0);
    expect(G.challengeOffered(m, 'suburbs')).toBe(false);
  });
  it('a shop that already has its manager gets its hire scene seen; one without does not', () => {
    const base = JSON.parse(JSON.stringify(G.newGame(0)));
    const shops = {
      ...base.shops,
      suburbs: { ...base.shops.suburbs, built: true, managed: true },
      waterfront: { ...base.shops.waterfront, built: true, managed: false },
    };
    const m = G.migrate(v5({ shops }), 0);
    expect(m.seenScenes).toContain('suburbs-hire');
    expect(m.seenScenes).not.toContain('waterfront-hire');
    expect(G.pendingScenes(m, HOME_SCENES).map((x) => x.id)).not.toContain('suburbs-hire');
  });
  it('a new game and a save with nothing seen are left alone', () => {
    expect(G.migrate(JSON.parse(JSON.stringify(G.newGame(0))), 0).seenScenes).toEqual([]);
  });
});

describe('what a held-back scene tells the player (v5.16)', () => {
  const uptownReady = (seen: string[]) =>
    withShop(seenUpTo(['uptown-1', 'uptown-2', ...seen], 1e6, { 'uptown-2': 0 }), 'uptown', { built: true, sold: countOf('uptown-3') });
  it('Uptown’s act 3 waits for Industrial’s finale: "Win over Industrial to continue Uptown’s story"', () => {
    expect(G.storyWaitHint(uptownReady([]))).toBe('Win over Industrial to continue Uptown’s story');
  });
  it('University waits for the Pier 9 bid when it was built before it: "Save Marisol’s dock to continue University’s story"', () => {
    const s = withShop(seenUpTo(['waterfront-1', 'waterfront-2', 'waterfront-3', 'university-1', 'university-2'], 1e6), 'university', {
      built: true,
      sold: countOf('university-3'),
    });
    expect(G.storyWaitHint(withShop(s, 'waterfront', { built: true }))).toBe('Save Marisol’s dock to continue University’s story');
  });
  it('is silent once the finale is earned (the scene only waits its turn), when the hold is time, and at the start', () => {
    const industrialDone = uptownReady(['industrial-4']);
    expect(G.storyWaitHint(industrialDone)).toBeNull(); // uptown-2b is only waiting for its timer
    const bidWon = withShop(
      seenUpTo(['waterfront-1', 'waterfront-2', 'waterfront-3', 'waterfront-3b', 'waterfront-4', 'university-1', 'university-2'], 1e6, { 'waterfront-4': 1e6 }),
      'university',
      { built: true, sold: countOf('university-3') },
    );
    expect(G.storyWaitHint(bidWon)).toBeNull(); // downtown-5, suburbs-5 and waterfront-5 are on their timers
    expect(G.storyWaitHint(G.newGame(0))).toBeNull();
  });
  it('a finale that is won but waiting its turn is not "still to earn"', () => {
    const s = won(
      withShop(
        withShop(
          seenUpTo(['industrial-1', 'industrial-2', 'industrial-2b', 'industrial-3', 'industrial-3b', 'uptown-1', 'uptown-2'], 1e6, { 'uptown-2': 0 }),
          'industrial',
          { built: true },
        ),
        'uptown',
        { built: true, sold: countOf('uptown-3') },
      ),
      'industrial',
    );
    expect(G.storyWaitHint(s)).toBeNull();
  });
});
