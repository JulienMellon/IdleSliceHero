// Golden story: the scene ids in order and a hash of the whole script. Splitting or moving scene files must not
// change a word; edit the constants only for an intended story change.
import { createHash } from 'crypto';
import { HOME_SCENES } from '../../content/scenes/home';

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

const IDS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'].flatMap((h) => [1, 2, 3, 4].map((b) => `${h}-${b}`));

describe('golden scenes', () => {
  it('golden: HOME_SCENES ids stay in story order', () => {
    expect(HOME_SCENES.map((s) => s.id)).toEqual(IDS);
  });

  it('golden: JSON.stringify(HOME_SCENES) hashes to the recorded script', () => {
    expect(sha1(JSON.stringify(HOME_SCENES))).toBe('ef260fa5afbb7e4797364ee21df0ad7882b4683d');
  });
});
