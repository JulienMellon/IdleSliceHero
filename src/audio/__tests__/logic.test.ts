// Node built-ins without @types/node in the app's tsconfig (tests run under ts-jest's node types)
declare const __dirname: string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs: { readFileSync(p: string, e: string): string; existsSync(p: string): boolean; readdirSync(p: string): string[]; statSync(p: string): { size: number } } = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path: { join(...p: string[]): string } = require('path');

import { HOME_SCENES } from '../../content/scenes/home';
import { NEIGHBORHOODS } from '../../content/tuning';
import { beatUnit, collectSize, EXCLUSIVE_CUES, milestoneCrossed, musicFor, nextVariant, panelCue, PurchaseChain, purchaseSting, quantizeDelay, sharedTimeline, StingGate, stingUnit, VoiceLimiter, type StingKind } from '../logic';

const ROOT = path.join(__dirname, '..', '..', '..');
const MANIFEST = fs.readFileSync(path.join(__dirname, '..', 'manifest.ts'), 'utf8');

describe('quantizeDelay', () => {
  it('lands the stinger downbeat on the next beat', () => {
    // 120 bpm: beats every 0.5 s. At 1.30 s the next beat is 1.5 s; a 0.25 s pickup starts at 1.25 → too late, so 2.0
    const d = quantizeDelay(1.3, 120, 1, 0.25);
    expect(1.3 + d + 0.25).toBeCloseTo(2.0, 6);
    const e = quantizeDelay(1.1, 120, 1, 0.25);
    expect(1.1 + e + 0.25).toBeCloseTo(1.5, 6);
  });
  it('waits for the bar when asked, and is never negative', () => {
    for (let pos = 0; pos < 10; pos += 0.137) {
      const d = quantizeDelay(pos, 92, 4, 0.33);
      expect(d).toBeGreaterThanOrEqual(0);
      const land = (pos + d + 0.33) / ((60 / 92) * 4);
      expect(Math.abs(land - Math.round(land))).toBeLessThan(1e-6);
    }
  });
  it('plays at once with no clock', () => {
    expect(quantizeDelay(NaN, 120, 1, 0.2)).toBe(0);
  });
});

describe('VoiceLimiter (AU22)', () => {
  it('caps at 3 voices, 60 ms apart, each extra 3 dB down', () => {
    const v = new VoiceLimiter();
    expect(v.hit(0)).toBeCloseTo(1);
    expect(v.hit(30)).toBe(0); // too close
    expect(v.hit(70)).toBeCloseTo(Math.pow(10, -3 / 20));
    expect(v.hit(140)).toBeCloseTo(Math.pow(10, -6 / 20));
    expect(v.hit(210)).toBe(0); // 4th within 300 ms
    expect(v.hit(320)).toBeGreaterThan(0); // the first has aged out
  });
});

describe('PurchaseChain (AU2)', () => {
  it('climbs a semitone per purchase within 2 s, caps, and resets after a pause', () => {
    const c = new PurchaseChain(8, 2000);
    const steps = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500].map((t) => c.next(t));
    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 7, 7]);
    expect(c.next(7000)).toBe(0);
  });
});

describe('variants and sizes', () => {
  it('never repeats a variant twice in a row', () => {
    let v = 0;
    for (let i = 0; i < 200; i++) {
      const n = nextVariant(v, 4, Math.random());
      expect(n).not.toBe(v);
      v = n;
    }
    expect(nextVariant(0, 1, 0.5)).toBe(0);
  });
  it('sizes the Collect by the payout against cash', () => {
    expect(collectSize(50, 1000)).toBe(0);
    expect(collectSize(1000, 1000)).toBe(1);
    expect(collectSize(20000, 1000)).toBe(2);
    expect(collectSize(10, 0)).toBe(2);
  });
});

describe('stingers (AU14)', () => {
  it('milestones beat bottlenecks; level 100 is the big one', () => {
    expect(milestoneCrossed(24, 25)).toBe('milestone');
    expect(milestoneCrossed(99, 100)).toBe('milestone_big');
    expect(milestoneCrossed(25, 26)).toBeNull();
    expect(purchaseSting('ovens', { levelBefore: 49, levelAfter: 50, bottleneckBefore: 'ovens', bottleneckAfter: 'prep' })).toBe('milestone');
    expect(purchaseSting('ovens', { levelBefore: 10, levelAfter: 11, bottleneckBefore: 'ovens', bottleneckAfter: 'prep' })).toBe('bottleneck');
    expect(purchaseSting('ovens', { levelBefore: 10, levelAfter: 11, bottleneckBefore: 'prep', bottleneckAfter: 'prep' })).toBeNull();
    expect(purchaseSting('manager', {})).toBe('manager');
    expect(purchaseSting('fleet', { vehicle: 4 })).toBe('drone');
    expect(purchaseSting('fleet', { vehicle: 2 })).toBe('fleet');
    expect(purchaseSting('expand', {})).toBe('upgrade');
  });
});

describe('music and story cues (AU12, AU13, AU20)', () => {
  it('plays the sparse Downtown until Nonna takes over, and a scene plays its own neighbourhood', () => {
    expect(musicFor({ active: 'downtown', downtownFull: false, scene: null })).toBe('downtown_sparse');
    expect(musicFor({ active: 'downtown', downtownFull: true, scene: null })).toBe('downtown');
    expect(musicFor({ active: 'suburbs', downtownFull: true, scene: { neighborhood: 'waterfront', panelCue: 'none' } })).toBe('waterfront');
    expect(musicFor({ active: 'suburbs', downtownFull: true, scene: { neighborhood: 'waterfront', panelCue: 'megaslice' } })).toBe('megaslice_hq');
  });
  it('gives every scene a cue, every beat 3 its villain, every beat 4 a win', () => {
    for (const s of HOME_SCENES) {
      const cues = s.panels.map((_, i) => panelCue(s, i));
      expect(cues.some((c) => c !== 'none')).toBe(true);
      if (s.beat === 1) expect(cues).toContain('welcome');
      if (s.beat === 2) expect(cues).toContain('warmth');
      if (s.beat === 3) expect(cues).toContain('megaslice');
      if (s.beat === 4) expect(cues.some((c) => EXCLUSIVE_CUES.has(c))).toBe(true);
    }
    const reveal = (id: string) => HOME_SCENES.find((s) => s.id === id)!.panels.map((_, i, a) => panelCue(HOME_SCENES.find((s) => s.id === id)!, i));
    expect(reveal('downtown-4')).toContain('recipe');
    // downtown-1 saves its welcome for Nonna's smile on the last panel (AU30)
    expect(reveal('downtown-1')).toEqual(['none', 'none', 'none', 'none', 'welcome']);
    expect(EXCLUSIVE_CUES.has('rep')).toBe(true);
    expect(reveal('industrial-4')).toContain('reunion');
    expect(reveal('uptown-4')).toEqual(expect.arrayContaining(['victor-exit', 'city-theme']));
  });
});

describe('stinger timing and gating (AU31, AU32)', () => {
  it('quantises Downtown to the dotted quarter, chordal stingers to the bar', () => {
    expect(beatUnit('downtown')).toBe(1.5);
    expect(beatUnit('suburbs')).toBe(1);
    expect(stingUnit('bottleneck', 4, 'suburbs')).toBe(1);
    for (const k of ['milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'welcome', 'warmth'] as StingKind[]) {
      expect(stingUnit(k, 3, 'downtown')).toBe(3);
    }
  });
  it('lets a bottleneck stinger through at most once per 20 s', () => {
    const g = new StingGate(20000);
    expect(g.admit('bottleneck', 0, 2000)).toBe(true);
    expect(g.admit('bottleneck', 5000, 2000)).toBe(false);
    expect(g.admit('bottleneck', 19000, 2000)).toBe(false);
    expect(g.admit('bottleneck', 20500, 2000)).toBe(true);
  });
  it('never restarts or stacks a stinger of equal or lower priority; a higher one takes over', () => {
    const g = new StingGate();
    expect(g.admit('milestone', 0, 5000)).toBe(true);
    expect(g.busy(1000)).toBe(true);
    expect(g.admit('milestone', 1000, 5000)).toBe(false); // no restart
    expect(g.admit('upgrade', 1500, 3000)).toBe(false); // lower
    expect(g.admit('milestone_big', 2000, 5000)).toBe(true); // higher
    expect(g.admit('manager', 3000, 5000)).toBe(false);
    expect(g.admit('upgrade', 7500, 3000)).toBe(true); // after it ends
    expect(g.busy(11000)).toBe(false);
  });
  it('keeps the position when Downtown hands from the sparse chart to the full band', () => {
    expect(sharedTimeline('downtown_sparse', 'downtown')).toBe(true);
    expect(sharedTimeline('suburbs', 'downtown')).toBe(false);
  });
});

describe('generated manifest', () => {
  it('points at files that exist', () => {
    const files = [...MANIFEST.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
    expect(files.length).toBeGreaterThan(100);
    for (const f of files) expect(fs.existsSync(path.join(__dirname, '..', f))).toBe(true);
  });
  it('has every loop, every stinger in every key, and every story cue the director uses', () => {
    const kinds: StingKind[] = ['bottleneck', 'milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'welcome', 'warmth', 'build', 'perk', 'offline'];
    for (const n of NEIGHBORHOODS) {
      expect(MANIFEST).toMatch(new RegExp(`\\n  ${n.id}: \\{ src: require\\('../../assets/audio/music/`));
      expect(MANIFEST).toContain(`triumph_${n.id}:`);
      for (const k of kinds) expect(MANIFEST).toContain(`${n.id}_${k}: { src:`);
    }
    for (const id of ['downtown_sparse', 'megaslice_hq', 'megaslice_rep', 'victor_exit', 'recipe', 'reunion', 'city_theme', 'waterfront_bid']) {
      expect(MANIFEST).toContain(`${id}: { src:`);
    }
  });
  it('keeps the audio inside its memory budget (AU23)', () => {
    const size = (dir: string) => fs.readdirSync(path.join(ROOT, 'assets', 'audio', dir)).reduce((a, f) => a + fs.statSync(path.join(ROOT, 'assets', 'audio', dir, f)).size, 0);
    expect(size('sfx')).toBeLessThan(1.5 * 1024 * 1024);
    expect(size('music') + size('sting') + size('story') + size('sfx')).toBeLessThan(14 * 1024 * 1024);
  });
});
