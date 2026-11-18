// 4c: the 30 ms ramp timer in the expo output runs only while a ramp does. An idle app has no audio timer.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({
    volume: 1,
    playing: false,
    currentTime: 0,
    loop: false,
    play() {},
    pause() {},
    remove() {},
    replace() {},
    seekTo: async () => {},
    setPlaybackRate() {},
    addListener: () => ({ remove() {} }),
  }),
}));
jest.mock('../manifest', () => ({ MUSIC: { downtown: { src: 1 }, uptown: { src: 2 } }, STINGS: {}, STORY: {}, SFX: {} }));

import { createExpoOutput } from '../expo-output';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('ramp timer', () => {
  it('starts with the first ramp and is cleared when the last one ends', () => {
    const out = createExpoOutput();
    out.loop('music:downtown', { gain: 0 });
    expect(jest.getTimerCount()).toBe(0);
    out.fade('music:downtown', 1, 400);
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(450);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('is cleared when a ramp is cancelled before it ends, and again for a later one', () => {
    const out = createExpoOutput();
    out.loop('music:downtown', { gain: 0 });
    out.fade('music:downtown', 1, 5000);
    out.loop('music:downtown', { gain: 0.5 }); // cancels the ramp in flight
    jest.advanceTimersByTime(60);
    expect(jest.getTimerCount()).toBe(0);
    out.fade('music:downtown', 0.2, 100);
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(200);
    expect(jest.getTimerCount()).toBe(0);
  });
});
