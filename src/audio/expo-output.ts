// The expo-audio output: one player per sound for effects and stingers, a pool of two for loops and story cues.
// The web build uses it for everything (today's behaviour, play for play); the phone build keeps it for the music
// loops and the story cues, and runs effects and stingers on react-native-audio-api (output.native.ts).
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { MUSIC, SFX, STINGS, STORY } from './manifest';
import { busOf, type AudioOutput, type Bus, type LoopOpts, type PlayOpts } from './output-core';

type Timer = ReturnType<typeof setTimeout>;

function safe<T>(f: () => T, fallback?: T): T {
  try {
    return f();
  } catch {
    return fallback as T;
  }
}

/** The asset behind an id, or null for an id the manifest doesn't know. */
export function sourceOf(id: string): number | null {
  const i = id.indexOf(':');
  const kind = id.slice(0, i);
  const rest = id.slice(i + 1);
  if (kind === 'sfx') {
    const [name, v] = rest.split('/');
    return ((SFX as Record<string, readonly number[]>)[name]?.[Number(v)] as number | undefined) ?? null;
  }
  const table = kind === 'sting' ? STINGS : kind === 'music' ? MUSIC : kind === 'story' ? STORY : null;
  return ((table as Record<string, { src: number }> | null)?.[rest]?.src as number | undefined) ?? null;
}

interface Slot { p: AudioPlayer; id: string | null; used: number }

export function createExpoOutput(): AudioOutput {
  const busGain: Record<Bus, number> = { music: 1, story: 1, sting: 1, sfx: 1 };
  /** Effects and stingers: one player per id. */
  const players = new Map<string, AudioPlayer>();
  /** Loops and story cues: two slots each, an id takes one over with `replace`. */
  const pools: Record<'music' | 'story', Slot[]> = { music: [], story: [] };
  const own = new Map<AudioPlayer, { gain: number; bus: Bus }>();
  const ramps = new Map<AudioPlayer, { from: number; to: number; t0: number; ms: number; done?: () => void }>();
  let rampTimer: ReturnType<typeof setInterval> | null = null;
  const waiting = new Map<string, Set<Timer>>();
  let tick = 0;

  const level = (p: AudioPlayer) => {
    const o = own.get(p);
    return o ? o.gain * busGain[o.bus] : 1;
  };
  const apply = (p: AudioPlayer) => safe(() => (p.volume = level(p)));
  const setGain = (p: AudioPlayer, gain: number) => {
    const o = own.get(p);
    if (o) o.gain = gain;
    apply(p);
  };

  function rampTo(p: AudioPlayer, to: number, ms: number, done?: () => void) {
    const from = own.get(p)?.gain ?? to;
    if (ms <= 0 || Math.abs(from - to) < 0.002) {
      setGain(p, to);
      ramps.delete(p);
      done?.();
      return;
    }
    ramps.set(p, { from, to, t0: Date.now(), ms, done });
    if (!rampTimer) rampTimer = setInterval(stepRamps, 30);
  }

  function stepRamps() {
    const now = Date.now();
    for (const [p, r] of [...ramps]) {
      const k = Math.min(1, (now - r.t0) / r.ms);
      setGain(p, r.from + (r.to - r.from) * k);
      if (k >= 1) {
        ramps.delete(p);
        r.done?.();
      }
    }
    if (ramps.size === 0 && rampTimer) {
      clearInterval(rampTimer);
      rampTimer = null;
    }
  }

  function make(src: number | null, bus: Bus): AudioPlayer {
    const p = createAudioPlayer(src);
    safe(() => (p.shouldCorrectPitch = false));
    own.set(p, { gain: bus === 'music' ? 0 : 1, bus });
    apply(p);
    return p;
  }

  function drop(p: AudioPlayer) {
    ramps.delete(p);
    own.delete(p);
    safe(() => p.remove());
  }

  /**
   * Start a one-shot from the top. A player that has played is rewound right after it ends, so the next play
   * is immediate; one still mid-sound is seeked first and played when the seek lands (AU39).
   * `onEnd` runs when the player reports it finished, or `seconds` + 300 ms after playback actually started
   * (not after the call: a seek can delay it), whichever comes first (AU61).
   */
  function fire(p: AudioPlayer, seconds: number, gain: number, rate: number, onEnd?: () => void, temp = false) {
    ramps.delete(p);
    setGain(p, gain);
    safe(() => {
      if (rate !== 1) p.setPlaybackRate(rate);
      else if (safe(() => p.playbackRate, 1) !== 1) p.setPlaybackRate(1);
    });
    let finished = false;
    let timer: Timer | undefined;
    let sub: { remove: () => void } | undefined;
    const done = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      safe(() => sub?.remove());
      if (temp) drop(p);
      else if (!onEnd && !safe(() => p.playing, false)) void p.seekTo(0).catch(() => {});
      onEnd?.();
    };
    const start = () => {
      safe(() => p.play());
      timer = setTimeout(done, (seconds / rate) * 1000 + (onEnd ? 300 : 60));
    };
    if (onEnd) sub = safe(() => p.addListener('playbackStatusUpdate', (st) => { if (st.didJustFinish) done(); }));
    const at = safe(() => p.currentTime, 0);
    if (at > 0.01) {
      void p.seekTo(0).then(start).catch(() => { if (onEnd) done(); });
    } else start();
  }

  // ---- loops and story cues: the pool
  const poolOf = (id: string) => pools[busOf(id) === 'story' ? 'story' : 'music'];
  function slotFor(id: string): Slot | null {
    const pool = poolOf(id);
    const bus = busOf(id);
    const held = pool.find((s) => s.id === id);
    if (held) {
      held.used = ++tick;
      return held;
    }
    const src = sourceOf(id);
    if (src === null) return null;
    let slot: Slot | undefined = pool.length < 2 ? undefined : pool.find((s) => !safe(() => s.p.playing, false)) ?? [...pool].sort((a, b) => a.used - b.used)[0];
    if (!slot) {
      slot = { p: make(null, bus), id: null, used: 0 };
      pool.push(slot);
    }
    slot.id = id;
    slot.used = ++tick;
    ramps.delete(slot.p);
    safe(() => slot!.p.replace(src));
    safe(() => (slot!.p.loop = bus === 'music'));
    setGain(slot.p, bus === 'music' ? 0 : 1);
    return slot;
  }
  const heldSlot = (id: string) => poolOf(id).find((s) => s.id === id) ?? null;

  const isPooled = (id: string) => busOf(id) === 'music' || busOf(id) === 'story';

  function cancelWaiting(id: string) {
    for (const t of waiting.get(id) ?? []) clearTimeout(t);
    waiting.delete(id);
  }

  const out: AudioOutput = {
    load(id) {
      if (isPooled(id)) {
        slotFor(id);
        return;
      }
      if (players.has(id)) return;
      const src = sourceOf(id);
      if (src !== null) players.set(id, make(src, busOf(id)));
    },
    unload(id) {
      cancelWaiting(id);
      if (isPooled(id)) {
        const s = heldSlot(id);
        if (s) {
          safe(() => s.p.pause());
          s.id = null;
        }
        return;
      }
      const p = players.get(id);
      if (!p) return;
      players.delete(id);
      drop(p);
    },
    isLoaded: (id) => (isPooled(id) ? !!heldSlot(id) : players.has(id)),
    loadedCount: () => players.size + pools.music.length + pools.story.length,
    play(id, o: PlayOpts) {
      const rate = o.rate ?? 1;
      const seconds = o.seconds ?? 0.35;
      const go = () => {
        if (isPooled(id)) {
          const had = !!heldSlot(id);
          const s = slotFor(id);
          if (!s) return;
          ramps.delete(s.p);
          setGain(s.p, o.gain);
          if (had) void s.p.seekTo(0).catch(() => {});
          safe(() => s.p.play());
          return;
        }
        let p = players.get(id);
        if (!p) {
          out.load(id);
          p = players.get(id);
        }
        if (!p) return o.onEnd?.();
        // a second play of a rare effect sounds over the first (C102): it gets a player of its own for its length
        if (o.overlap && o.onEnd && safe(() => p!.playing, false) && safe(() => p!.currentTime, 0) > 0.01) {
          const src = sourceOf(id);
          if (src !== null) return fire(make(src, busOf(id)), seconds, o.gain, rate, o.onEnd, true);
        }
        fire(p, seconds, o.gain, rate, o.onEnd);
      };
      if ((o.at ?? 0) > 0.001) {
        const t = setTimeout(() => {
          waiting.get(id)?.delete(t);
          go();
        }, o.at! * 1000);
        if (!waiting.has(id)) waiting.set(id, new Set());
        waiting.get(id)!.add(t);
      } else go();
    },
    loop(id, o: LoopOpts = {}) {
      const s = slotFor(id);
      if (!s) return;
      ramps.delete(s.p);
      if (o.gain !== undefined) setGain(s.p, o.gain);
      if (o.from !== undefined && (o.from > 0 || safe(() => s.p.currentTime, 0) > 0.01)) void s.p.seekTo(o.from).catch(() => {});
      if (!safe(() => s.p.playing, false)) safe(() => s.p.play());
    },
    stop(id, fadeMs = 0) {
      cancelWaiting(id);
      const p = isPooled(id) ? heldSlot(id)?.p : players.get(id);
      if (!p || !safe(() => p.playing, false)) return;
      rampTo(p, 0, fadeMs, () => safe(() => p.pause()));
    },
    resume(id) {
      const s = heldSlot(id);
      if (s) safe(() => s.p.play());
    },
    fade(id, gain, ms) {
      const p = isPooled(id) ? heldSlot(id)?.p : players.get(id);
      if (p) rampTo(p, gain, ms);
    },
    playing(id) {
      const p = isPooled(id) ? heldSlot(id)?.p : players.get(id);
      return p ? safe(() => p.playing, false) : false;
    },
    position(id) {
      const p = isPooled(id) ? heldSlot(id)?.p : players.get(id);
      if (!p) return NaN;
      if (!isPooled(id) && !safe(() => p.playing, false)) return NaN;
      return safe(() => p.currentTime, NaN);
    },
    setBus(bus, gain) {
      busGain[bus] = gain;
      for (const [p, o] of own) if (o.bus === bus) apply(p);
    },
    otherAudio: () => null, // expo-audio doesn't expose iOS's other-audio hint
  };
  return out;
}
