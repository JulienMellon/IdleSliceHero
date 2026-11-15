/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

import { LAYER_COPY, LAYER_SPEAKERS } from '../layer-copy';
import { LABELS, lc, rivalKey, rivalLine, rivalSpeaker, speakerOf } from '../layer-text';

/** The copy file's rows for Suburbs, Waterfront (section 1) and the rival (section 2), as cells. */
function rows(): string[][] {
  const md = fs.readFileSync(path.join(__dirname, '../../../../docs/story/COPY-v5.16.md'), 'utf8');
  const out: string[][] = [];
  for (const sec of md.split(/^## /m).slice(1)) {
    const [head, ...body] = sec.split('\n');
    const n = head.split('.')[0];
    if (n !== '1' && n !== '2') continue;
    for (const line of body) {
      if (!line.startsWith('| `')) continue;
      const cells = line.trim().replace(/^\||\|$/g, '').split(' | ').map((c) => c.trim());
      const key = cells[0].replace(/`/g, '');
      if (n === '1' && !/^(layer\.(suburbs|waterfront)|upgrade\.waterfront)/.test(key)) continue;
      if (cells.length === 3) out.push([key, cells[1], cells[2]]);
    }
  }
  return out;
}

describe('layer-copy.ts is the copy file, by key', () => {
  test('every row of Suburbs, Waterfront and the rival is in the table with the same words and speaker', () => {
    const all = rows();
    expect(all).toHaveLength(Object.keys(LAYER_COPY).length);
    for (const [key, who, text] of all) {
      expect((LAYER_COPY as Record<string, string>)[key]).toBe(text);
      expect(LAYER_SPEAKERS[key]).toBe(who === '—' ? undefined : who);
    }
  });

  test('every neighbourhood has its four rival lines', () => {
    for (const hood of ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'] as const) {
      for (const kind of ['open', 'title', 'win', 'lose'] as const) expect(LAYER_COPY[rivalKey(hood, kind)]).toBeTruthy();
    }
  });

  test('placeholders are filled; a missing value is left as written', () => {
    expect(lc('layer.suburbs.gameday.chip', { time: '3:07' })).toBe('Game Day 3:07');
    expect(lc('layer.waterfront.auction.raise', { bid: '$126M' })).toBe('MegaSlice raised it. $126M wins Pier 9');
    expect(lc('layer.waterfront.auction.chip')).toBe('Next raise {time}');
    expect(rivalLine('suburbs', 'title', { n: 120 })).toBe('Halftime Showdown: 120 pies in 5 minutes');
  });

  test('speakers', () => {
    expect(speakerOf('layer.suburbs.gameday.start')).toBe('Dale');
    expect(speakerOf('layer.suburbs.gameday.chip')).toBeNull();
    expect(rivalSpeaker('waterfront', 'open')).toBe('Victor Crust');
    expect(rivalSpeaker('suburbs', 'open')).toBe('Todd');
    expect(rivalSpeaker('suburbs', 'win')).toBe('Dale');
  });

  test('the captions the copy file has no row for are short', () => {
    for (const v of Object.values(LABELS)) expect(v.length).toBeLessThanOrEqual(24);
  });
});
