/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

import { COPY, RECIPE_NAMES, SPEAKERS } from '../copy';
import { copy, copyOr, recipeLine, recipeName, speakerOf } from '../copy-text';

/** The rows of the copy file's tables, by section number (1, 3, 4, 5, 6, 7), as cells. */
function rows(): { section: string; cells: string[] }[] {
  const md = fs.readFileSync(path.join(__dirname, '../../../../docs/story/COPY-v5.15.md'), 'utf8');
  const out: { section: string; cells: string[] }[] = [];
  for (const sec of md.split(/^## /m).slice(1)) {
    const [head, ...body] = sec.split('\n');
    const n = head.split('.')[0];
    if (!['1', '3', '4', '5', '6', '7'].includes(n)) continue;
    for (const line of body) if (line.startsWith('| `')) out.push({ section: n, cells: line.trim().replace(/^\||\|$/g, '').split(' | ').map((c) => c.trim()) });
  }
  return out;
}

describe('copy.ts is the copy file, by key', () => {
  test('every row of sections 1, 3, 4, 5, 6 and 7 is in the table with the same words', () => {
    const all = rows();
    expect(all.length).toBe(Object.keys(COPY).length);
    for (const { section, cells } of all) {
      const key = cells[0].replace(/`/g, '');
      if (section === '1') {
        expect(RECIPE_NAMES[key]).toBe(cells[1]);
        expect((COPY as Record<string, string>)[key]).toBe(cells[2]);
      } else if (cells.length === 3) {
        expect((COPY as Record<string, string>)[key]).toBe(cells[2]);
        expect(SPEAKERS[key]).toBe(cells[1] === '—' ? undefined : cells[1]);
      } else expect((COPY as Record<string, string>)[key]).toBe(cells[1]);
    }
  });

  test('24 recipe cards, six attack triples, two events', () => {
    expect(Object.keys(RECIPE_NAMES)).toHaveLength(24);
    for (const hood of ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown']) {
      for (const k of ['open', 'win', 'lose']) expect(copyOr(`attack.${hood}.${k}`)).toBeTruthy();
    }
    for (const k of ['banner', 'chip', 'start']) for (const e of ['friday', 'gameday']) expect(copyOr(`rush.${e}.${k}`)).toBeTruthy();
  });

  test('placeholders are filled; a missing value is left as written', () => {
    expect(copy('goal.mastery', { n: 7 })).toBe('Mastery 7/18');
    expect(copy('rush.friday.chip', { time: '42m' })).toBe('Rush: 42m left');
    expect(copy('mastery.crew.toast', { shop: 'Uptown' })).toBe('Every head hired in Uptown!');
    expect(copy('mastery.crew.toast')).toBe('Every head hired in {shop}!');
  });

  test('speakers and recipe lookups', () => {
    expect(speakerOf('attack.suburbs.win')).toBe('Dale');
    expect(speakerOf('goal.mastery')).toBeNull();
    expect(recipeName('recipe.suburbs.1')).toBe('Halftime Pepperoni');
    expect(recipeLine('recipe.suburbs.1')).toBe('Beats orange slices. Ask any Mudhen.');
  });

  test('length limits the writer set hold in the table (so every string fits an iPhone SE card)', () => {
    for (const [k, v] of Object.entries(COPY)) {
      if (k.startsWith('recipe.')) expect(v.length).toBeLessThanOrEqual(60);
      if (k.endsWith('.open')) expect(v.length).toBeLessThanOrEqual(90);
      if (k === 'attack.chip.title') expect(v.length).toBeLessThanOrEqual(28);
      if (k === 'attack.banner') expect(v.length).toBeLessThanOrEqual(44);
      if (k.endsWith('.banner') && k.startsWith('rush.')) expect(v.length).toBeLessThanOrEqual(28);
      if (k.endsWith('.chip') && k.startsWith('rush.')) expect(v.length).toBeLessThanOrEqual(20);
    }
    for (const v of Object.values(RECIPE_NAMES)) expect(v.length).toBeLessThanOrEqual(24);
  });
});
