// The shape of the 40-scene script (v5.16, docs/specs/PLAN-v4.4-todd-interludes.md section 7): limits per scene, panel and bubble,
// references between scenes, and the order the Todd name tag climbs down. Pure data checks: nothing here plays the game.
import { HOME_SCENES } from '../../content/scenes/home';
import type { Scene } from '../../content/types';
import { prerequisites } from '../game';

import { MANAGERS, NEIGHBORHOODS } from '../../content/cities/home/data';
const byId = new Map(HOME_SCENES.map((s) => [s.id, s]));
const hire = (s: Scene) => s.trigger.kind === 'manager';
const interludes = HOME_SCENES.filter((s) => s.beat === 'interlude' && !hire(s));
const text = (s: Scene) => s.panels.flatMap((p) => [p.caption ?? '', p.propText ?? '', ...p.lines.map((l) => l.text)]).join(' | ');

describe('the 40 scenes', () => {
  it('are 24 main beats, 11 interludes and 5 hire scenes, with unique ids', () => {
    expect(HOME_SCENES).toHaveLength(40);
    expect(new Set(HOME_SCENES.map((s) => s.id)).size).toBe(40);
    expect(HOME_SCENES.filter((s) => s.beat !== 'interlude')).toHaveLength(24);
    expect(interludes.map((s) => s.id).sort()).toEqual(
      [
        'downtown-5',
        'industrial-2b',
        'industrial-3b',
        'suburbs-3b',
        'suburbs-5',
        'uptown-2b',
        'uptown-3b',
        'university-3b',
        'university-3c',
        'waterfront-3b',
        'waterfront-5',
      ].sort(),
    );
    expect(HOME_SCENES.filter(hire).map((s) => s.id)).toEqual(NEIGHBORHOODS.filter((n) => n.id !== 'downtown').map((n) => `${n.id}-hire`));
  });
  it('keep each neighbourhood together, in story order, with its beats 1 to 4 in order', () => {
    const hoods = HOME_SCENES.map((s) => s.neighborhood);
    expect(hoods).toEqual([...hoods].sort((a, b) => NEIGHBORHOODS.findIndex((n) => n.id === a) - NEIGHBORHOODS.findIndex((n) => n.id === b)));
    for (const n of NEIGHBORHOODS) {
      const mains = HOME_SCENES.filter((s) => s.neighborhood === n.id && s.beat !== 'interlude').map((s) => s.beat);
      expect(mains).toEqual([1, 2, 3, 4]);
    }
  });
  it('have 3 to 5 panels (a hire scene is two), each with at most 2 on stage and 3 bubbles of 90 characters or fewer', () => {
    for (const s of HOME_SCENES) {
      expect(s.panels.length).toBeGreaterThanOrEqual(hire(s) ? 2 : 3);
      expect(s.panels.length).toBeLessThanOrEqual(5);
      for (const p of s.panels) {
        expect(p.cast.length).toBeLessThanOrEqual(2);
        expect(p.lines.length).toBeLessThanOrEqual(3);
        for (const l of p.lines) expect(l.text.length).toBeLessThanOrEqual(90);
      }
    }
  });
  it('are led by their neighbourhood’s character, and a main beat is named <neighbourhood>-<beat>', () => {
    const lead: Record<string, string> = {
      downtown: 'nonna-rosa',
      suburbs: 'dale',
      waterfront: 'marisol',
      university: 'priya',
      industrial: 'big-sal',
      uptown: 'genevieve',
    };
    for (const s of HOME_SCENES) {
      expect(s.character).toBe(lead[s.neighborhood]);
      expect(s.id.startsWith(`${s.neighborhood}-`)).toBe(true);
      if (s.beat !== 'interlude') expect(s.id).toBe(`${s.neighborhood}-${s.beat}`);
    }
  });
});

describe('references between scenes', () => {
  it('every `requires` and `after` names a scene that exists, and nothing waits on itself', () => {
    for (const s of HOME_SCENES)
      for (const id of prerequisites(s)) {
        expect(byId.has(id)).toBe(true);
        expect(id).not.toBe(s.id);
      }
    for (const s of HOME_SCENES) for (const p of s.panels) for (const l of p.lines) if (l.ifSeen) expect(byId.get(l.ifSeen)?.trigger.kind).toBe('manager');
  });
  it('the graph has no cycles', () => {
    const state = new Map<string, 'open' | 'done'>();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 'done') return;
      if (state.get(id) === 'open') throw new Error(`cycle: ${[...path, id].join(' → ')}`);
      state.set(id, 'open');
      for (const pre of prerequisites(byId.get(id)!)) visit(pre, [...path, id]);
      state.set(id, 'done');
    };
    for (const s of HOME_SCENES) visit(s.id, []);
  });
  it('a scene waits on another neighbourhood only where the story says so', () => {
    const cross: string[] = [];
    for (const s of HOME_SCENES) for (const id of prerequisites(s)) if (byId.get(id)!.neighborhood !== s.neighborhood) cross.push(`${s.id} ← ${id}`);
    // downtown-5, suburbs-5 and waterfront-5 pass the Todd gag along; uptown-3's act waits for Industrial's finale; University's act 3 for waterfront-5
    expect(cross.sort()).toEqual(
      ['downtown-5 ← waterfront-4', 'suburbs-5 ← downtown-5', 'uptown-2b ← industrial-4', 'university-3 ← waterfront-5', 'waterfront-5 ← suburbs-5'].sort(),
    );
  });
  it('an interlude that counts from a scene counts from one in its own neighbourhood unless it is one of the three that cross', () => {
    for (const s of interludes) {
      if (s.trigger.kind !== 'after') continue;
      const base = s.trigger.scene;
      if (['downtown-5', 'suburbs-5', 'waterfront-5'].includes(s.id)) continue;
      expect(base.startsWith(`${s.neighborhood}-`)).toBe(true);
      expect(s.trigger.seconds).toBeGreaterThan(0);
    }
  });
  it('an interlude that holds a main beat back is named by that beat', () => {
    const holds: Record<string, string> = {
      'suburbs-3b': 'suburbs-4',
      'waterfront-3b': 'waterfront-4',
      'waterfront-5': 'university-3',
      'university-3c': 'university-4',
      'industrial-2b': 'industrial-3',
      'industrial-3b': 'industrial-4',
      'uptown-2b': 'uptown-3',
      'uptown-3b': 'uptown-4',
    };
    for (const [interlude, beat] of Object.entries(holds)) expect(byId.get(beat)?.requires).toContain(interlude);
  });
});

describe('triggers', () => {
  it('beat 4 is won (the rival challenge) in Suburbs, University, Industrial and Uptown; Downtown’s is Nonna’s takeover count; Waterfront’s is the bid', () => {
    for (const hood of ['suburbs', 'university', 'industrial', 'uptown'])
      expect(byId.get(`${hood}-4`)?.trigger).toEqual({ kind: 'challenge', neighborhood: hood });
    expect(byId.get('downtown-4')?.trigger.kind).toBe('deliveries');
    expect(byId.get('waterfront-4')?.trigger).toEqual({ kind: 'bid', neighborhood: 'waterfront' });
  });
  it('each hire scene plays when its shop has its manager, and the scene shows that manager', () => {
    for (const s of HOME_SCENES.filter(hire)) {
      const m = MANAGERS[s.neighborhood];
      expect(s.trigger).toEqual({ kind: 'manager', neighborhood: s.neighborhood });
      expect(s.panels.flatMap((p) => p.cast.map((c) => c.id))).toContain(m.id);
      expect(s.panels.flatMap((p) => p.lines.map((l) => l.speaker))).toContain(m.name);
    }
  });
  it('a manager’s line in a beat 3 or 4 waits for that manager’s hire scene', () => {
    const lines = HOME_SCENES.flatMap((s) => s.panels.flatMap((p) => p.lines.filter((l) => l.ifSeen).map((l) => `${s.id}: ${l.speaker} after ${l.ifSeen}`)));
    expect(lines.sort()).toEqual([
      'industrial-3: Dee after industrial-hire',
      'suburbs-4: Deb after suburbs-hire',
      'university-4: Noor after university-hire',
      'uptown-3: Anton after uptown-hire',
      'waterfront-3: Skip after waterfront-hire',
    ]);
  });
});

describe('the name-tag ladder', () => {
  // Todd is demoted down the script; reading the scenes in story order must meet each tag in this order
  const ladder: [string, string][] = [
    ['downtown-3', 'VP OF EXPANSION'],
    ['suburbs-3b', 'SENIOR ASSOCIATE'],
    ['waterfront-3b', 'ASSOCIATE'],
    ['waterfront-5', 'INTERN'],
    ['university-3', 'UNPAID INTERN'],
    ['industrial-3', 'VENDING RESTOCKER'],
    ['uptown-4', 'TODD · ROSA'],
  ];
  it('appears in story order, each tag in its own scene', () => {
    let at = -1;
    for (const [id, tag] of ladder) {
      const i = HOME_SCENES.findIndex((s) => s.id === id);
      expect(i).toBeGreaterThan(at);
      expect(text(byId.get(id)!)).toContain(tag);
      at = i;
    }
  });
  it('a name-tag prop carries the tag as its text', () => {
    const tags = HOME_SCENES.flatMap((s) => s.panels.filter((p) => p.prop === 'name-tag').map((p) => p.propText));
    expect(tags).toEqual(['SENIOR ASSOCIATE', 'UNPAID INTERN', "TODD · ROSA'S"]);
  });
  it('Victor gets Todd’s name wrong six times, then right', () => {
    const names = HOME_SCENES.flatMap((s) => s.panels.flatMap((p) => p.lines.filter((l) => l.speaker === 'Victor Crust').map((l) => l.text))).join(' ');
    for (const wrong of ['Tad', 'Rod', 'Tom', 'Dodd', 'Ted', 'Toddler']) expect(names).toContain(wrong);
    expect(names).toContain("You're FIRED... Todd.");
  });
});
