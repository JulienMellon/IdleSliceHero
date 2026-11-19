// The mixer against a fake output (card A1): bus gains, stinger scheduling, overlap of the same effect,
// the lazy-load order and the launch budget, and the other-audio rule. Pure Node: no expo-audio, no native module.
import { dbToGain, quantizeDelay, stingTiming, stingUnit } from '../logic';
import {
  COMMON_SFX,
  DOWNTOWN_SET,
  LAUNCH_PLAYER_BUDGET,
  OtherAudioRule,
  RARE,
  STING_PRELOAD,
  TITLE_SET,
  createMixer,
  launchPlan,
  type Catalog,
} from '../mixer';
import {
  DECODED_BYTES_BUDGET,
  Epochs,
  LIMITER_RANGE,
  busOf,
  decodedBytes,
  limiterCurve,
  voiceToSteal,
  type AudioOutput,
  type Bus,
  type LoopOpts,
  type PlayOpts,
} from '../output-core';

const SFX_COUNT: Record<string, number> = {
  tap: 4,
  cash: 5,
  buy: 8,
  rush: 4,
  bubble: 3,
  full: 2,
  refused: 2,
  click: 1,
  sparkle: 1,
  milestone: 1,
  fleet: 5,
  collect: 3,
  build: 1,
  gavel: 1,
  grade: 1,
  expand: 1,
};
const ROOTS = [1, 5, 1, 1, 1, 5, 1, 1, 4, 5, 1, 5];
const CATALOG: Catalog = {
  sfxCount: (id) => SFX_COUNT[id],
  music: () => ({ seconds: 94.546, bpm: 99, beatsPerBar: 3, barRoots: ROOTS }),
  sting: () => ({ seconds: 6.161, musicSeconds: 6.061, downbeatSeconds: 0.6061 }),
  story: (id) => (id.startsWith('triumph') ? { seconds: 6.474, bpm: 126, payoffSeconds: 3.81 } : { seconds: 4.7 }),
};

interface Play {
  id: string;
  o: PlayOpts;
  ended: boolean;
}

/** Records every call; a play stays "sounding" until `end` is called. Loaded counts follow the real outputs: loops and cues share two slots each. */
class FakeOut implements AudioOutput {
  calls: string[] = [];
  loaded = new Set<string>();
  plays: Play[] = [];
  looping = new Set<string>();
  bus: Partial<Record<Bus, number>> = {};
  pos = new Map<string, number>();
  other: boolean | null = null;
  load(id: string) {
    this.calls.push(`load ${id}`);
    this.loaded.add(id);
  }
  unload(id: string) {
    this.calls.push(`unload ${id}`);
    this.loaded.delete(id);
  }
  isLoaded(id: string) {
    return this.loaded.has(id);
  }
  loadedCount() {
    let n = 0;
    const slots = { music: new Set<string>(), story: new Set<string>() };
    for (const id of this.loaded) {
      const b = busOf(id);
      if (b === 'music' || b === 'story') slots[b].add(id);
      else n++;
    }
    return n + Math.min(2, slots.music.size) + Math.min(2, slots.story.size);
  }
  play(id: string, o: PlayOpts) {
    this.calls.push(`play ${id}`);
    this.loaded.add(id);
    this.plays.push({ id, o, ended: false });
  }
  loop(id: string, o?: LoopOpts) {
    this.calls.push(`loop ${id}${o?.from !== undefined ? ` from ${o.from}` : ''}`);
    this.loaded.add(id);
    this.looping.add(id);
  }
  stop(id: string, ms = 0) {
    this.calls.push(`stop ${id} ${ms}`);
    this.looping.delete(id);
    for (const p of this.plays) if (p.id === id) p.ended = true;
  }
  resume(id: string) {
    this.calls.push(`resume ${id}`);
  }
  fade(id: string, gain: number, ms: number) {
    this.calls.push(`fade ${id} ${gain.toFixed(3)} ${ms}`);
  }
  playing(id: string) {
    return this.looping.has(id) || this.plays.some((p) => p.id === id && !p.ended);
  }
  position(id: string) {
    return this.pos.get(id) ?? NaN;
  }
  setBus(bus: Bus, gain: number) {
    this.calls.push(`bus ${bus} ${gain}`);
    this.bus[bus] = gain;
  }
  otherAudio() {
    return this.other;
  }
  setActive(active: boolean) {
    this.calls.push(`active ${active}`);
  }
  /** The nth play of `id` finishes. */
  end(id: string, nth = 0) {
    const p = this.plays.filter((x) => x.id === id)[nth];
    p.ended = true;
    p.o.onEnd?.();
  }
  count(prefix: string) {
    return this.calls.filter((c) => c.startsWith(prefix)).length;
  }
}

function setup(prefs = { music: true, sound: true }, other: boolean | null = null) {
  const out = new FakeOut();
  out.other = other;
  const state = { ...prefs };
  const mixer = createMixer({ out, catalog: CATALOG, prefs: () => state, random: () => 0.5 });
  mixer.boot({ unlocked: true });
  return { out, mixer, state };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1_000_000);
});
afterEach(() => jest.useRealTimers());

describe('bus gains', () => {
  it('Sound owns the effects bus; the music buses follow Music after the fade-out', () => {
    const { out, mixer, state } = setup();
    expect(out.bus).toEqual({ music: 1, sfx: 1, sting: 1, story: 1 });
    state.sound = false;
    mixer.prefsChanged(false);
    expect(out.bus.sfx).toBe(0);
    state.music = false;
    mixer.prefsChanged(true);
    expect(out.bus.sting).toBe(1); // the 200 ms fade is still running
    jest.advanceTimersByTime(300);
    expect(out.bus.sting).toBe(0);
    expect(out.bus.story).toBe(0);
    state.music = true;
    mixer.prefsChanged(true);
    expect(out.bus.sting).toBe(1);
  });

  it('a muted Sound never reaches the output', () => {
    const { out, mixer } = setup({ music: true, sound: false });
    mixer.sfx('tap');
    expect(out.plays).toHaveLength(0);
  });

  it('ducks reach the loop as a gain fade, the product of the active ducks', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    mixer.duck('scene', dbToGain(-8));
    mixer.duck('sting', dbToGain(-6), 1000);
    const last = out.calls.filter((c) => c.startsWith('fade music:downtown')).pop()!;
    expect(Number(last.split(' ')[2])).toBeCloseTo(dbToGain(-14), 3);
    jest.advanceTimersByTime(1100);
    const after = out.calls.filter((c) => c.startsWith('fade music:downtown')).pop()!;
    expect(Number(after.split(' ')[2])).toBeCloseTo(dbToGain(-8), 3);
  });
});

describe('launch and lazy loading', () => {
  it('starts with the title set, then the Downtown set, and nothing else', () => {
    const { out } = setup();
    expect(out.calls.filter((c) => c.startsWith('load '))).toEqual([...TITLE_SET, ...DOWNTOWN_SET].map((k) => `load sfx:${k}`));
  });

  it('keeps at most 12 players alive at start-up, with both loops and both cues in use', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    mixer.setTrack('downtown_sparse');
    mixer.story('recipe', true);
    mixer.story('reunion', true);
    jest.advanceTimersByTime(1000); // nothing else is created before the first frame and the stinger delay
    expect(out.loadedCount()).toBeLessThanOrEqual(LAUNCH_PLAYER_BUDGET);
    // the old start-up created 27 effect players + 2 loops + 2 cues
    expect(launchPlan(CATALOG).launch.length + 4).toBeLessThanOrEqual(LAUNCH_PLAYER_BUDGET);
  });

  it('creates the rest after the first frame, in order, a few at a time, never a rare effect', () => {
    const { out, mixer } = setup();
    const before = out.count('load ');
    mixer.afterFirstFrame();
    jest.advanceTimersByTime(50);
    expect(out.count('load ')).toBe(before); // not in the first frame
    jest.advanceTimersByTime(130);
    const chunk = out.count('load ') - before;
    expect(chunk).toBeGreaterThan(0);
    expect(chunk).toBeLessThanOrEqual(3);
    jest.advanceTimersByTime(10_000);
    const loads = out.calls.filter((c) => c.startsWith('load ')).map((c) => c.slice(5));
    expect(new Set(loads).size).toBe(loads.length); // each once
    const { launch, rest } = launchPlan(CATALOG);
    expect(loads).toEqual([...launch, ...rest]);
    expect(rest.some((id) => RARE.has(id.slice(4, id.indexOf('/'))))).toBe(false);
    const common = COMMON_SFX.reduce((n, id) => n + SFX_COUNT[id], 0);
    expect(loads).toHaveLength(common);
    expect(loads.some((id) => id.startsWith('sting:'))).toBe(false);
  });

  it("loads a neighbourhood's stingers 1.5 s after its key becomes active, and drops the old key's", () => {
    const { out, mixer } = setup();
    mixer.scheduleStingPreload('downtown', () => 'downtown');
    jest.advanceTimersByTime(1400);
    expect(out.count('load sting:')).toBe(0);
    jest.advanceTimersByTime(200);
    expect([...out.loaded].filter((i) => i.startsWith('sting:'))).toHaveLength(STING_PRELOAD.length);
    expect(out.isLoaded('sting:downtown_milestone')).toBe(true);
    mixer.scheduleStingPreload('uptown', () => 'uptown');
    jest.advanceTimersByTime(1600);
    expect(out.isLoaded('sting:downtown_milestone')).toBe(false);
    expect(out.isLoaded('sting:uptown_milestone')).toBe(true);
  });

  it('a stinger of the old key that is still sounding is released after it ends, not cut', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    out.pos.set('music:downtown', 10);
    mixer.sting('downtown', 'milestone', { immediate: true });
    jest.advanceTimersByTime(10);
    out.pos.set('sting:downtown_milestone', 1);
    mixer.sting('uptown', 'upgrade', { immediate: true }); // moves the key
    expect(out.calls).not.toContain('unload sting:downtown_milestone');
    jest.advanceTimersByTime(5500);
    expect(out.calls).toContain('unload sting:downtown_milestone');
  });
});

describe('stinger scheduling', () => {
  it('places beat 1 on the loop clock: the output is told how long to wait, not a timer in JS', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    out.pos.set('music:downtown', 10.2);
    mixer.sting('downtown', 'bottleneck');
    const want = quantizeDelay(10.2, 99, stingUnit('bottleneck', 3, 'downtown'), 0.6061);
    const play = out.plays.find((p) => p.id === 'sting:downtown_bottleneck')!;
    expect(play.o.at).toBeCloseTo(want, 6);
    expect(play.o.at).toBeGreaterThan(0);
    mixer.sting('downtown', 'milestone');
    const bar = out.plays.find((p) => p.id === 'sting:downtown_milestone')!;
    expect(bar.o.at).toBeCloseTo(stingTiming(10.2, 99, 3, ROOTS, 0.6061).delay, 6);
    expect(out.plays.filter((p) => p.id.startsWith('sting:'))).toHaveLength(2);
  });

  it('plays at once when told to, and when the loop has no position', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    mixer.sting('downtown', 'milestone'); // no position yet: NaN
    expect(out.plays[0].o.at).toBe(0);
    mixer.sting('downtown', 'milestone_big', { immediate: true });
    expect(out.plays[1].o.at).toBe(0);
  });

  it('a lower stinger inside a higher one is dropped, and Skip cancels one still waiting for its bar', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    out.pos.set('music:downtown', 10.2);
    mixer.sting('downtown', 'milestone');
    mixer.sting('downtown', 'upgrade');
    expect(out.plays.filter((p) => p.id.startsWith('sting:'))).toHaveLength(1);
    mixer.skip(400);
    expect(out.calls).toContain('stop sting:downtown_milestone 0');
  });

  it('a stinger ducks the loop when it starts and gives it back when the music is over', () => {
    const { out, mixer } = setup();
    mixer.setTrack('downtown');
    mixer.sting('downtown', 'milestone', { immediate: true });
    jest.advanceTimersByTime(5);
    const fades = () => out.calls.filter((c) => c.startsWith('fade music:downtown')).map((c) => Number(c.split(' ')[2]));
    expect(fades().pop()).toBeCloseTo(dbToGain(-6), 3);
    jest.advanceTimersByTime(6200);
    expect(fades().pop()).toBeCloseTo(1, 3);
  });
});

describe('the same effect twice (C102)', () => {
  it('a second Collect inside the first one never cuts it: two plays overlap, the sound is released with the last', () => {
    const { out, mixer } = setup();
    mixer.sfx('collect', { variant: 1, jitter: 0 });
    mixer.sfx('collect', { variant: 1, jitter: 0 });
    const plays = out.plays.filter((p) => p.id === 'sfx:collect/1');
    expect(plays).toHaveLength(2);
    expect(plays.every((p) => p.o.overlap)).toBe(true);
    expect(out.calls.filter((c) => c.startsWith('stop sfx:collect'))).toHaveLength(0);
    out.end('sfx:collect/1', 0);
    expect(out.calls).not.toContain('unload sfx:collect/1'); // the second is still sounding
    out.end('sfx:collect/1', 1);
    expect(out.calls.filter((c) => c === 'unload sfx:collect/1')).toHaveLength(1);
  });

  it('a common effect is never released and never asked to overlap', () => {
    const { out, mixer } = setup();
    mixer.sfx('tap');
    mixer.sfx('tap');
    expect(out.plays.every((p) => !p.o.overlap && !p.o.onEnd)).toBe(true);
    expect(out.count('unload')).toBe(0);
  });

  it('pitch jitter stays within a semitone and a variant never repeats', () => {
    const out = new FakeOut();
    let r = 0;
    const mixer = createMixer({ out, catalog: CATALOG, prefs: () => ({ music: true, sound: true }), random: () => (r = (r + 0.37) % 1) });
    mixer.boot({ unlocked: true });
    for (let i = 0; i < 20; i++) mixer.sfx('tap');
    const ids = out.plays.map((p) => p.id);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
    for (const p of out.plays) expect(Math.abs(Math.log2(p.o.rate!) * 12)).toBeLessThanOrEqual(1.0001);
  });

  it('a warmed Collect that goes unused is released once the popup is gone, one that was played is not touched', () => {
    const { out, mixer } = setup();
    mixer.warm('collect', 2, true);
    mixer.sweepWarm(true);
    expect(out.isLoaded('sfx:collect/2')).toBe(true); // popup still open
    mixer.sweepWarm(false);
    expect(out.isLoaded('sfx:collect/2')).toBe(false);
    mixer.warm('collect', 1, true);
    mixer.sfx('collect', { variant: 1, jitter: 0 });
    mixer.sweepWarm(false);
    expect(out.calls).not.toContain('unload sfx:collect/1');
  });
});

describe('another app is playing (AU41)', () => {
  it('starts with Music off for the session, effects still play, the saved preference is left alone', () => {
    const { out, mixer, state } = setup({ music: true, sound: true }, true);
    expect(mixer.musicOn()).toBe(false);
    expect(mixer.otherAudioSuppressed).toBe(true);
    expect(state.music).toBe(true); // never written
    mixer.setTrack('downtown');
    expect(out.calls.some((c) => c.startsWith('loop music:'))).toBe(false);
    mixer.sting('downtown', 'milestone', { immediate: true });
    mixer.story('recipe', true);
    expect(out.plays.filter((p) => p.id.startsWith('sting:') || p.id.startsWith('story:'))).toHaveLength(0);
    mixer.sfx('tap');
    expect(out.plays.filter((p) => p.id.startsWith('sfx:'))).toHaveLength(1);
    expect(out.bus.sfx).toBe(1);
    jest.advanceTimersByTime(300);
    expect(out.bus.sting).toBe(0);
  });

  it("the player's own Music choice ends the rule: the loop starts where it would have", () => {
    const { out, mixer } = setup({ music: true, sound: true }, true);
    mixer.setTrack('downtown');
    mixer.prefsChanged(true); // Music toggled by hand
    expect(mixer.musicOn()).toBe(true);
    mixer.applyMusic(400);
    expect(out.calls.some((c) => c.startsWith('loop music:downtown'))).toBe(true);
    expect(out.bus.sting).toBe(1);
  });

  it('nothing else is suppressed: no report, a "no" and a Music switch that was off', () => {
    for (const other of [null, false] as const) {
      const { mixer } = setup({ music: true, sound: true }, other);
      expect(mixer.musicOn()).toBe(true);
    }
    const { mixer } = setup({ music: false, sound: true }, false);
    expect(mixer.musicOn()).toBe(false);
  });

  it('the rule on its own', () => {
    const r = new OtherAudioRule();
    r.start(true);
    expect(r.allows(true)).toBe(false);
    expect(r.allows(false)).toBe(false);
    r.userChoice();
    expect(r.allows(true)).toBe(true);
    r.start(null);
    expect(r.suppressed).toBe(false);
  });
});

describe('the suppressed flag for Settings', () => {
  it('reports the rule at launch and when the player ends it, once each', () => {
    const out = new FakeOut();
    out.other = true;
    const seen: boolean[] = [];
    const mixer = createMixer({ out, catalog: CATALOG, prefs: () => ({ music: true, sound: true }), onSuppressed: (v) => seen.push(v) });
    mixer.boot({ unlocked: true });
    expect(seen).toEqual([true]);
    mixer.prefsChanged(false); // Sound changed, not Music: no report
    mixer.prefsChanged(true);
    mixer.prefsChanged(true);
    expect(seen).toEqual([true, false]);
    expect(mixer.otherAudioSuppressed).toBe(false);
  });
});

describe('the master limiter curve', () => {
  const c = limiterCurve();
  /** The curve at a signal level (the master gain in front of it is 1 / LIMITER_RANGE, so input x is the signal x * range). */
  const atSignal = (signal: number) => {
    const x = signal / LIMITER_RANGE;
    return c[Math.round(((x + 1) / 2) * (c.length - 1))];
  };
  it('is the same level below the knee, odd, monotonic and never reaches 1', () => {
    const n = c.length;
    expect(atSignal(0)).toBe(0);
    expect(atSignal(0.5)).toBeCloseTo(0.5, 2);
    expect(atSignal(-0.5)).toBeCloseTo(-0.5, 2);
    for (let i = 1; i < n; i++) expect(c[i]).toBeGreaterThanOrEqual(c[i - 1]);
    for (let i = 0; i < n; i++) expect(Math.abs(c[i])).toBeLessThan(1);
  });

  it('keeps rising above 1.0: sums of 1.0 to 1.25 are not hard-clipped (AU78)', () => {
    let last = atSignal(1);
    for (const sum of [1.05, 1.1, 1.15, 1.2, 1.25]) {
      expect(atSignal(sum)).toBeGreaterThan(last);
      last = atSignal(sum);
    }
    expect(atSignal(1.25)).toBeGreaterThan(0.99);
    expect(atSignal(1.25)).toBeLessThan(1);
    // the old curve ended at 0.952 for an input of 1: the curve's last point is now well above it
    expect(c[c.length - 1]).toBeGreaterThan(0.99);
  });
});

describe('the voice cap (AU79)', () => {
  it('steals the oldest effect, never a stinger, and nothing under the cap', () => {
    expect(voiceToSteal(['sfx:a/0', 'sfx:b/0'], 2)).toBe(-1);
    expect(voiceToSteal(['sting:x', 'sfx:a/0', 'sfx:b/0'], 2)).toBe(1);
    expect(voiceToSteal(['sting:x', 'sting:y', 'sting:z'], 2)).toBe(-1);
  });
});

describe('plays and decodes overtaken by a stop or an unload (AU81, C132)', () => {
  it('an epoch moves only for its own id', () => {
    const e = new Epochs();
    const a = e.get('sfx:a/0');
    e.bump('sfx:a/0');
    expect(e.get('sfx:a/0')).not.toBe(a);
    expect(e.get('sfx:b/0')).toBe(0);
  });

  it('counts a decoded buffer in float32 bytes against a 20 MB budget', () => {
    expect(decodedBytes(44100, 2)).toBe(352800);
    expect(DECODED_BYTES_BUDGET).toBe(20 * 1024 * 1024);
  });
});

describe('the app in the background (U20, AU80)', () => {
  it('tells the output when the app goes away and comes back, once each', () => {
    const { out, mixer } = setup();
    mixer.setAppActive(false);
    mixer.setAppActive(false);
    mixer.setAppActive(true);
    expect(out.calls.filter((c) => c.startsWith('active '))).toEqual(['active false', 'active true']);
  });

  it('a perk duck that fell due while the app was away does not leave the triumph at -6 dB', () => {
    const { out, mixer } = setup();
    mixer.story('triumph_downtown', true);
    mixer.perk('downtown');
    jest.advanceTimersByTime(3200); // the perk fires at 3 s and ducks the cue for about 0.4 s
    expect(out.calls).toContain('fade story:triumph_downtown 0.501 80');
    mixer.setAppActive(false);
    jest.advanceTimersByTime(1000); // the duck's restore falls due while paused: it is skipped
    mixer.setAppActive(true);
    const from = out.calls.lastIndexOf('resume story:triumph_downtown');
    expect(from).toBeGreaterThan(-1);
    expect(out.calls.slice(from)).toContain('fade story:triumph_downtown 1.000 400');
  });
});
