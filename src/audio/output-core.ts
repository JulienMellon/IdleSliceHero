// The audio output contract: the one seam between the mixer (mixer.ts, pure, tested) and whatever makes sound.
// Metro picks output.native.ts on a phone and output.web.ts in the browser; both import this file, never './output'
// (on a phone that name is the native file itself). output.ts re-exports it for the mixer and the tests.
//
// An id names one sound: `sfx:tap/2`, `sting:downtown_milestone`, `music:uptown`, `story:triumph_downtown`.
// The mixer never sees a player, a buffer or a node.

export type Bus = 'music' | 'story' | 'sting' | 'sfx';

export const sfxId = (id: string, variant: number) => `sfx:${id}/${variant}`;
export const stingId = (key: string) => `sting:${key}`;
export const musicId = (track: string) => `music:${track}`;
export const storyId = (cue: string) => `story:${cue}`;
export function busOf(id: string): Bus {
  const b = id.slice(0, id.indexOf(':'));
  return b === 'music' || b === 'story' || b === 'sting' ? b : 'sfx';
}

export interface PlayOpts {
  /** Linear gain for this play (before its bus). */
  gain: number;
  /** Playback rate, 1 = as recorded (the pitch jitter: 2^(semitones / 12)). */
  rate?: number;
  /** Start this many seconds from now, on the output's own clock (a stinger's beat 1 lands here). */
  at?: number;
  /** Length of the sound at rate 1, in seconds: a backstop for outputs that can't report the end. */
  seconds?: number;
  /** A second play of the same id sounds over the first instead of cutting it (C102). */
  overlap?: boolean;
  /** The play has finished (or was stopped). Called once. */
  onEnd?: () => void;
}

export interface LoopOpts {
  gain?: number;
  /** Start here (seconds into the loop); omitted: resume where it stopped, or from the top. */
  from?: number;
}

export interface AudioOutput {
  /** Decode or create the sound for `id`. Idempotent; a later `play` loads it too, just later. */
  load(id: string): void;
  /** Release `id`. A play still sounding is left to finish where the output can (buffers), cut where it can't (players). */
  unload(id: string): void;
  isLoaded(id: string): boolean;
  /** Players or buffers alive: the launch budget counts these. */
  loadedCount(): number;
  /** Fire a one-shot from its top. */
  play(id: string, o: PlayOpts): void;
  /** Start or resume a loop (looping is the output's: no restart, no gap handled by the caller). */
  loop(id: string, o?: LoopOpts): void;
  /** Stop every play of `id`, scheduled or sounding, over `fadeMs`. A loop or a cue keeps its place for `resume`/`loop`. */
  stop(id: string, fadeMs?: number): void;
  /** Carry on a stopped cue or loop from where it stopped. */
  resume(id: string): void;
  /** Ramp `id`'s own gain (the loop's ducks, a cue's −6 dB). */
  fade(id: string, gain: number, ms: number): void;
  playing(id: string): boolean;
  /** Seconds into a loop or cue, or into the latest play of a one-shot; NaN when it isn't sounding. */
  position(id: string): number;
  setBus(bus: Bus, gain: number): void;
  /** U20: the app is in the foreground (true) or not. An output with an audio clock suspends it in the background; optional. */
  setActive?(active: boolean): void;
  /**
   * AU41: does the audio session say another app is playing? `null` = this output can't tell.
   * Read once at launch.
   */
  otherAudio(): boolean | null;
}

/** An output that makes no sound: what Node (Jest) and tsc resolve for `createOutput`, and a base for fakes. */
export function createSilentOutput(): AudioOutput {
  const loaded = new Set<string>();
  return {
    load: (id) => void loaded.add(id),
    unload: (id) => void loaded.delete(id),
    isLoaded: (id) => loaded.has(id),
    loadedCount: () => loaded.size,
    play: (_id, o) => o.onEnd?.(),
    loop: () => {},
    stop: () => {},
    resume: () => {},
    fade: () => {},
    playing: () => false,
    position: () => NaN,
    setBus: () => {},
    otherAudio: () => null,
  };
}

/** The largest sum of buses the mix table allows (1.25 of full scale): the limiter is shaped to carry it without a hard clip (AU78). */
export const LIMITER_RANGE = 1.25;

/**
 * A soft-knee limiter curve for a WaveShaper: linear to `knee`, then bent so the output never passes 1.
 * react-native-audio-api 1.0 has no compressor node, so the native master limiter is this static curve.
 * A WaveShaper only sees −1..1 and clips what is beyond, so the master gain in front of it is `1 / range` and the
 * curve is laid out over −range..range: a signal sum of 1.25 reaches the end of the curve instead of clipping at 0.95.
 * `n` points over input −1..1 (odd, so 0 maps to 0); the output is the same level as the input below the knee.
 */
export function limiterCurve(n = 2049, knee = 0.8, range = LIMITER_RANGE): Float32Array {
  const out = new Float32Array(n);
  const room = 1 - knee;
  for (let i = 0; i < n; i++) {
    const x = ((i / (n - 1)) * 2 - 1) * range;
    const a = Math.abs(x);
    const y = a <= knee ? a : knee + room * Math.tanh((a - knee) / room);
    out[i] = Math.sign(x) * y;
  }
  return out;
}

/** AU79: the voice cap is full: which of the live voices (oldest first) to cut for the new one. Only effects are cut, never a stinger; -1 = none. */
export function voiceToSteal(ids: readonly string[], cap: number): number {
  if (ids.length <= cap) return -1;
  return ids.findIndex((id) => busOf(id) === 'sfx');
}

/**
 * C132: a count per id that a stop or an unload bumps, so a play or a decode still in flight when it happens can see
 * it has been overtaken and drop its result instead of sounding (or being kept) after the fact.
 */
export class Epochs {
  private n = new Map<string, number>();
  get(id: string): number {
    return this.n.get(id) ?? 0;
  }
  bump(id: string): void {
    this.n.set(id, this.get(id) + 1);
  }
}

/** M67: decoded sound resident at once before the optional preloads (stinger sets) stop being created ahead of time. */
export const DECODED_BYTES_BUDGET = 20 * 1024 * 1024;
/** Bytes of a decoded buffer: 32-bit floats per sample per channel. */
export const decodedBytes = (length: number, channels: number) => length * channels * 4;
