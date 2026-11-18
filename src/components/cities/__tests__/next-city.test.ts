/// <reference types="jest" />
// R7b: the "Coming soon" card's device key is one per announced city, and the first city's is the one v5.15 installs already hold.
import { seenKey } from '../next-city';

describe('seenKey', () => {
  test('is byte-identical to the key v5.15 wrote for its card', () => {
    expect(seenKey('boston')).toBe('slice-empire/boston-seen');
  });
  test('is one per city', () => {
    expect(seenKey('chicago')).not.toBe(seenKey('boston'));
  });
});
