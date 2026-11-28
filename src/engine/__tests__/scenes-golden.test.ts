// Golden story: the scene ids in order and a hash of the whole script. Splitting or moving scene files must not
// change a word; (v5.25, card T3: re-recorded for W6's ten interludes: downtown-1b, 2b, 3b, 4b, 4c, suburbs-2b, suburbs-1b, waterfront-1b, 1c, 1d;) edit the constants only for an intended story change. (v5.23b re-record: S71, downtown-1 p4 line 1 now "Fine. First you bake. I show you how. Watch, then tap!". v5.21 r2 re-record: S74, waterfront-3b p4 line 2 now says to bid from the shop, the bid having left the goal bar. v5.16 re-record, card T1a, re-recorded in r2 for S27-S43: 40 scenes: the Todd script, 11 interludes, 5 hire scenes, beat 4 won by the rival challenge; this pins the new story, ids, order and text.)
import { createHash } from 'crypto';
import { HOME_SCENES } from '../../content/scenes/home';

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

const IDS = [
  'downtown-1',
  'downtown-1b',
  'downtown-2',
  'downtown-2b',
  'downtown-3',
  'downtown-3b',
  'downtown-4',
  'downtown-4b',
  'downtown-4c',
  'downtown-5',
  'suburbs-1',
  'suburbs-2',
  'suburbs-2b',
  'suburbs-3',
  'suburbs-3b',
  'suburbs-hire',
  'suburbs-1b',
  'suburbs-4',
  'suburbs-5',
  'waterfront-1',
  'waterfront-1b',
  'waterfront-1c',
  'waterfront-1d',
  'waterfront-2',
  'waterfront-hire',
  'waterfront-3',
  'waterfront-3b',
  'waterfront-4',
  'waterfront-5',
  'university-1',
  'university-2',
  'university-3',
  'university-3b',
  'university-3c',
  'university-hire',
  'university-4',
  'industrial-1',
  'industrial-2',
  'industrial-2b',
  'industrial-hire',
  'industrial-3',
  'industrial-3b',
  'industrial-4',
  'uptown-1',
  'uptown-2',
  'uptown-2b',
  'uptown-hire',
  'uptown-3',
  'uptown-3b',
  'uptown-4',
];

describe('golden scenes', () => {
  it('golden: HOME_SCENES ids stay in story order', () => {
    expect(HOME_SCENES.map((s) => s.id)).toEqual(IDS);
  });

  it('golden: JSON.stringify(HOME_SCENES) hashes to the recorded script', () => {
    expect(sha1(JSON.stringify(HOME_SCENES))).toBe('c6f832eb1f386f6b11bf03ec7667c34fb7c4bcf8');
  });
});
