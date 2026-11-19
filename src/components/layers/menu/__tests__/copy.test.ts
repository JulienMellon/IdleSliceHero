/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

import { COPY as INDUSTRIAL, SPEAKERS as INDUSTRIAL_SPEAKERS } from '../../shifts/copy';
import { COPY as UPTOWN, SPEAKERS as UPTOWN_SPEAKERS } from '../../stars/copy';
import { COPY as UNIVERSITY, SPEAKERS as UNIVERSITY_SPEAKERS } from '../copy';

/** The rows of section 1's subsections for one neighbourhood, as cells. */
function rows(hood: string): string[][] {
  const md = fs.readFileSync(path.join(__dirname, '../../../../../docs/story/COPY-v5.16.md'), 'utf8');
  const sec1 = md.split(/^## 2\./m)[0].split(/^## 1\./m)[1];
  const out: string[][] = [];
  for (const part of sec1.split(/^### /m).slice(1)) {
    const [head, ...body] = part.split('\n');
    if (head.split(' · ')[0].toLowerCase() !== hood) continue;
    for (const line of body)
      if (line.startsWith('| `'))
        out.push(
          line
            .trim()
            .replace(/^\||\|$/g, '')
            .split(' | ')
            .map((c) => c.trim()),
        );
  }
  return out;
}

describe.each([
  ['university', UNIVERSITY, UNIVERSITY_SPEAKERS],
  ['industrial', INDUSTRIAL, INDUSTRIAL_SPEAKERS],
  ['uptown', UPTOWN, UPTOWN_SPEAKERS],
] as const)('%s copy.ts is the copy file, by key', (hood, table, speakers) => {
  test('every row of the neighbourhood is in the table with the same words and speaker', () => {
    const all = rows(hood);
    expect(all.length).toBeGreaterThan(10);
    expect(Object.keys(table)).toHaveLength(all.length);
    for (const [key, speaker, text] of all) {
      const k = key.replace(/`/g, '');
      expect((table as Record<string, string>)[k]).toBe(text);
      expect(speakers[k]).toBe(speaker === '—' ? undefined : speaker);
    }
  });
});
