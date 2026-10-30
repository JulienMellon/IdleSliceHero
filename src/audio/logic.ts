// Pure audio rules (no expo-audio): which music plays, which cue a moment gets, beat quantisation, voice limits.
// The director (director.ts) does the playing; everything it decides comes from here so it can be tested in Node.
import { TUNING } from '../content/tuning';
import type { NeighborhoodId, PanelCue, Scene } from '../content/types';

export type StingKind = 'bottleneck' | 'milestone' | 'milestone_big' | 'manager' | 'upgrade' | 'fleet' | 'drone' | 'welcome' | 'warmth' | 'build' | 'perk' | 'offline';
export type MusicTrack = NeighborhoodId | 'downtown_sparse' | 'megaslice_hq';

/** Everything the director needs to pick the music bed. */
export interface MusicContext {
  active: NeighborhoodId;
  /** Nonna has taken over Downtown (downtown-4 seen): the full band plays there (AU20). */
  downtownFull: boolean;
  scene: { neighborhood: NeighborhoodId; panelCue: PanelCue; beat?: number } | null;
}

/** The loop that should be playing: a scene plays its own neighbourhood; MegaSlice panels play the HQ march. */
export function musicFor(c: MusicContext): MusicTrack {
  if (c.scene?.panelCue === 'megaslice') return 'megaslice_hq';
  const hood = c.scene?.neighborhood ?? c.active;
  // Downtown's early scenes (rain, an empty shop) keep the sparse chart even on a Scrapbook replay (AU50)
  const sparse = c.scene ? c.scene.neighborhood === 'downtown' && (c.scene.beat ?? 4) < 4 : !c.downtownFull;
  return hood === 'downtown' && sparse ? 'downtown_sparse' : hood;
}

/** The story cue for a panel: the panel's own `cue`, else the beat's default (AU12). */
export function panelCue(scene: Scene, panel: number): PanelCue {
  const p = scene.panels[panel];
  if (!p) return 'none';
  if (p.cue) return p.cue;
  if (p.backdrop === 'megaslice-hq') return 'megaslice';
  // an explicit welcome elsewhere in the scene (downtown-1 waits for Nonna's smile: AU30) replaces the default
  if (scene.beat === 1 && panel === firstCastPanel(scene) && !scene.panels.some((q) => q.cue === 'welcome')) return 'welcome';
  if (scene.beat === 2 && panel === 0) return 'warmth';
  if (scene.beat === 3) {
    const rep = scene.panels.findIndex((q) => q.cast.some((c) => c.id === 'megaslice-rep'));
    if (rep === panel) return 'rep';
  }
  return 'none';
}

function firstCastPanel(scene: Scene) {
  const i = scene.panels.findIndex((p) => p.cast.length > 0);
  return i < 0 ? 0 : i;
}

/** Cues that replace the loop while they play (the music drops out) rather than sitting over a ducked loop. */
export const EXCLUSIVE_CUES: ReadonlySet<PanelCue> = new Set(['triumph', 'bell-triumph', 'recipe', 'reunion', 'city-theme', 'rep']);

/** Loop volume during a cut-scene (AU22: −8 dB) and under stingers. */
export const DUCK = { scene: dbToGain(-8), popup: dbToGain(-8), stinger: dbToGain(-6), bottleneck: dbToGain(-3), bid: dbToGain(-10), build: dbToGain(-14) } as const;

export function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

/**
 * Seconds to wait so a stinger's beat 1 lands on the loop's next beat (or bar).
 * `pos` = loop position (s); `unitBeats` = 1 for the next beat, beatsPerBar for the next bar, 0.5 for an eighth.
 * `downbeat` = time of beat 1 inside the stinger file (its pickup comes first). Never negative.
 */
export function quantizeDelay(pos: number, bpm: number, unitBeats: number, downbeat: number): number {
  const unit = (60 / bpm) * unitBeats;
  if (!(unit > 0) || !Number.isFinite(pos)) return 0;
  let next = Math.ceil((pos + 1e-6) / unit) * unit;
  // the pickup has to start `downbeat` seconds before the grid line
  while (next - downbeat - pos < 0.02) next += unit;
  return next - downbeat - pos;
}

/**
 * Bar-quantised stingers wait for a bar whose chord is the tonic, up to `maxBars` ahead, so a cadence never lands
 * its I over the loop's IV or V (AU47). Failing that they take the next bar and the loop ducks further (`extraDuck`).
 */
export function stingTiming(pos: number, bpm: number, beatsPerBar: number, barRoots: readonly number[] | undefined, downbeat: number, maxBars = 2): { delay: number; extraDuck: number } {
  const first = quantizeDelay(pos, bpm, beatsPerBar, downbeat);
  if (!barRoots || barRoots.length === 0) return { delay: first, extraDuck: 1 };
  const bar = (60 / bpm) * beatsPerBar;
  const landing = pos + first + downbeat; // time of the first candidate downbeat
  const n = barRoots.length;
  for (let k = 0; k <= maxBars; k++) {
    const idx = (((Math.round(landing / bar) + k) % n) + n) % n;
    if (barRoots[idx] === 1) return { delay: first + k * bar, extraDuck: 1 };
  }
  return { delay: first, extraDuck: dbToGain(-6) };
}

/** The loop's pulse: Downtown's 6/8 moves in dotted quarters (AU31a); the others in quarters. */
export function beatUnit(track: MusicTrack): number {
  return track === 'downtown' || track === 'downtown_sparse' ? 1.5 : 1;
}

/**
 * Repetition limiter for cash pops and rush taps (AU22): at most `maxVoices` within `windowMs`, at least `minGapMs`
 * apart, each extra voice within the window 3 dB quieter. Returns the gain to play at, or 0 to skip.
 */
export class VoiceLimiter {
  private times: number[] = [];
  constructor(private readonly maxVoices = 3, private readonly minGapMs = 60, private readonly windowMs = 300) {}
  hit(now: number): number {
    this.times = this.times.filter((t) => now - t < this.windowMs);
    const last = this.times[this.times.length - 1];
    if (last !== undefined && now - last < this.minGapMs) return 0;
    if (this.times.length >= this.maxVoices) return 0;
    const gain = dbToGain(-3 * this.times.length);
    this.times.push(now);
    return gain;
  }
}

/** Purchase chain (AU2): each purchase within `windowMs` of the last goes a semitone higher, up to `steps - 1`. */
export class PurchaseChain {
  private step = -1;
  private last = -Infinity;
  constructor(private readonly steps = 8, private readonly windowMs = 2000) {}
  next(now: number): number {
    this.step = now - this.last <= this.windowMs ? Math.min(this.steps - 1, this.step + 1) : 0;
    this.last = now;
    return this.step;
  }
}

/** Round-robin over a cue's variants, never the same one twice in a row. */
export function nextVariant(prev: number, count: number, rand: number): number {
  if (count <= 1) return 0;
  const k = Math.floor(rand * (count - 1));
  return (prev + 1 + k) % count;
}

/** Offline Collect: three sizes by how much the payout is against cash on hand (AU15). */
export function collectSize(earned: number, cashBefore: number): 0 | 1 | 2 {
  const r = earned / Math.max(1, cashBefore);
  return r >= 10 ? 2 : r >= 1 ? 1 : 0;
}

/** What a station level change crossed: the milestone stinger to play, if any. */
export function milestoneCrossed(before: number, after: number): StingKind | null {
  const crossed = TUNING.milestones.filter((m) => before < m && after >= m);
  if (crossed.length === 0) return null;
  return crossed[crossed.length - 1] >= TUNING.milestones[TUNING.milestones.length - 1] ? 'milestone_big' : 'milestone';
}

export type Purchase = 'prep' | 'ovens' | 'counter' | 'drivers' | 'tables' | 'grade' | 'expand' | 'manager' | 'head' | 'fleet' | 'decor' | 'build' | 'bid';

/** A successful purchase → the stinger that rides over the loop, if any (AU14). Milestone beats bottleneck. */
export function purchaseSting(what: Purchase, o: { levelBefore?: number; levelAfter?: number; bottleneckBefore?: string; bottleneckAfter?: string; vehicle?: number }): StingKind | null {
  if (o.levelBefore !== undefined && o.levelAfter !== undefined) {
    const m = milestoneCrossed(o.levelBefore, o.levelAfter);
    if (m) return m;
  }
  if (what === 'manager') return 'manager';
  if (what === 'expand' || what === 'grade' || what === 'head') return 'upgrade';
  if (what === 'fleet') return o.vehicle === 4 ? 'drone' : 'fleet';
  if (o.bottleneckBefore !== undefined && o.bottleneckAfter !== undefined && o.bottleneckBefore !== o.bottleneckAfter) return 'bottleneck';
  return null;
}

/**
 * Quantisation for each stinger: the chordal ones wait for the bar so their tonic lands where the loop's harmony
 * restarts (AU31c); the one-line bottleneck phrase only waits for the next beat.
 */
export function stingUnit(kind: StingKind, beatsPerBar: number, track: MusicTrack): number {
  return kind === 'bottleneck' ? beatUnit(track) : beatsPerBar;
}

/** Priority when stingers compete (AU32): a lower one never interrupts or overlaps a higher one. */
export const STING_PRIORITY: Record<StingKind, number> = {
  bottleneck: 1, upgrade: 2, fleet: 2, drone: 2, perk: 2, offline: 2, milestone: 3, welcome: 3, warmth: 3, manager: 4, build: 4, milestone_big: 5,
};

/**
 * Gate for gameplay stingers (AU32): bottleneck at most once per `cooldownMs`; while a stinger sounds, anything of
 * equal or lower priority is dropped (never restarted, never stacked); a higher one takes over.
 */
export class StingGate {
  private playing: { kind: StingKind; until: number } | null = null;
  private lastBottleneck = -Infinity;
  constructor(private readonly cooldownMs = 20000) {}
  /** True if `kind` may start now; on true the gate records it as playing for `lengthMs`. */
  admit(kind: StingKind, now: number, lengthMs: number): boolean {
    if (kind === 'bottleneck' && now - this.lastBottleneck < this.cooldownMs) return false;
    const cur = this.playing && now < this.playing.until ? this.playing : null;
    if (cur && STING_PRIORITY[kind] <= STING_PRIORITY[cur.kind]) return false;
    this.playing = { kind, until: now + lengthMs };
    if (kind === 'bottleneck') this.lastBottleneck = now;
    return true;
  }
  /** A stinger is sounding (SFX play a little softer under it: AU38). */
  busy(now: number) {
    return !!this.playing && now < this.playing.until;
  }
  clear() {
    this.playing = null;
  }
}

/** Loops that always start from bar 1 (the HQ march: every scheme opens on its villain motif, AU29). */
export const RESTART_TRACKS: ReadonlySet<MusicTrack> = new Set(['megaslice_hq']);
/** Arrangements of one chart that share a timeline, so a hand-off keeps the position (AU41). */
export function sharedTimeline(a: MusicTrack | null, b: MusicTrack) {
  return (a === 'downtown_sparse' && b === 'downtown') || (a === 'downtown' && b === 'downtown_sparse');
}

/** Loop ducking under each stinger kind. */
export function stingDuck(kind: StingKind): number {
  return kind === 'bottleneck' ? DUCK.bottleneck : kind === 'build' ? DUCK.build : DUCK.stinger;
}
