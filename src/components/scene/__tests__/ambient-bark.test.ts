/// <reference types="jest" />
// An ambient bark (v5.25): drawn by the scene's own bark bubble, only in its shop, only for its 2.5 s, under the badge of the head who speaks.
import { HEADS } from '../../../content/cities/home/data';
import { HEAD_BARKS } from '../../../content/heads';
import { ambientBarkOn, speakerStation } from '../ambient-bark';

const bark = { key: 'ambient.wf.6', text: 'Order up!', speaker: 'Marco', shop: 'downtown', at: 10_000 };

describe('the ambient bark in the scene', () => {
  test('a head speaks from its own station; anyone else from the counter', () => {
    expect(speakerStation(HEADS.downtown, 'Marco')).toBe('prep');
    expect(speakerStation(HEADS.downtown, 'Lucia')).toBe('oven');
    expect(speakerStation(HEADS.downtown, 'Benny')).toBe('counter');
    expect(speakerStation(HEADS.downtown, 'Captain Marisol')).toBe('counter');
  });
  test('it shows in its shop for HEAD_BARKS.seconds, in the shape of a head bark (the wall second it began)', () => {
    expect(ambientBarkOn(bark, 'downtown', HEADS.downtown, 10_000)).toEqual({ st: 'prep', text: 'Order up!', at: 10 });
    expect(ambientBarkOn(bark, 'downtown', HEADS.downtown, 10_000 + HEAD_BARKS.seconds * 1000 - 1)).not.toBeNull();
    expect(ambientBarkOn(bark, 'downtown', HEADS.downtown, 10_000 + HEAD_BARKS.seconds * 1000)).toBeNull();
  });
  test('not in another shop, not before it began, not when there is none or no words', () => {
    expect(ambientBarkOn(bark, 'suburbs', HEADS.suburbs, 10_500)).toBeNull();
    expect(ambientBarkOn(bark, 'downtown', HEADS.downtown, 9_000)).toBeNull();
    expect(ambientBarkOn(null, 'downtown', HEADS.downtown, 10_500)).toBeNull();
    expect(ambientBarkOn({ ...bark, text: '' }, 'downtown', HEADS.downtown, 10_500)).toBeNull();
  });
});
