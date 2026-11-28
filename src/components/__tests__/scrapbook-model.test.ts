/// <reference types="jest" />
// v5.16 (T1b): the Scrapbook lists every neighbourhood's scenes in story order, labels the interludes "Interlude", titles the five hire scenes
// from the copy (docs/story/COPY-v5.16.md section 6) and counts against all 40 scenes.
import { HOME_SCENES } from '../../content/scenes/home';
import { INTERLUDE_LABEL, chapterScenes, storiesCount, tileLabel } from '../cutscene/scrapbook-model';

import { NEIGHBORHOODS } from '../../content/cities/home/data';
const HIRE_TITLES: Record<string, string> = {
  'suburbs-hire': 'Deb Takes the Counter',
  'waterfront-hire': 'Counted Twice',
  'university-hire': 'A Chapter About You',
  'industrial-hire': 'Nobody Yells at Ox',
  'uptown-hire': 'A Napkin, Folded',
};

describe('scrapbook model', () => {
  test('the header counts against every home scene: 41', () => {
    expect(HOME_SCENES).toHaveLength(41);
    expect(storiesCount(7)).toBe('Stories 7/41');
    expect(storiesCount(0, HOME_SCENES.slice(0, 3))).toBe('Stories 0/3');
  });

  test('the chapters together hold every scene once', () => {
    const all = NEIGHBORHOODS.flatMap((n) => chapterScenes(n.id).map((s) => s.id));
    expect([...all].sort()).toEqual(HOME_SCENES.map((s) => s.id).sort());
  });

  test('interludes are labelled "Interlude", main beats by their number', () => {
    const interludes = HOME_SCENES.filter((s) => s.beat === 'interlude');
    expect(interludes).toHaveLength(17); // Todd's 11, the Downtown slot and the 5 hire scenes
    for (const s of interludes) expect(tileLabel(s)).toBe(INTERLUDE_LABEL);
    for (const s of HOME_SCENES.filter((x) => x.beat !== 'interlude')) expect(tileLabel(s)).toBe(String(s.beat));
  });

  test('the hire scenes are titled from the copy', () => {
    for (const [id, title] of Object.entries(HIRE_TITLES)) expect(HOME_SCENES.find((s) => s.id === id)?.title).toBe(title);
  });

  test("a neighbourhood's tiles run in story order: main beats rise, an interlude follows the scene it is told after, a hire scene comes before the beat where its manager speaks", () => {
    for (const n of NEIGHBORHOODS) {
      const list = chapterScenes(n.id);
      const ids = list.map((s) => s.id);
      const mains = list.filter((s) => s.beat !== 'interlude').map((s) => s.beat as number);
      expect([n.id, mains]).toEqual([n.id, [...mains].sort()]);
      for (const s of list) {
        if (s.trigger.kind === 'after' && ids.includes(s.trigger.scene)) expect([s.id, ids.indexOf(s.trigger.scene) < ids.indexOf(s.id)]).toEqual([s.id, true]);
        const speaks = list.find((o) => o.panels.some((p) => p.lines.some((l) => l.ifSeen === s.id)));
        if (speaks) expect([s.id, ids.indexOf(s.id) < ids.indexOf(speaks.id)]).toEqual([s.id, true]);
      }
    }
  });
});
