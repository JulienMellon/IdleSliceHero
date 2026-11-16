// The phone build. Effects and stingers run on react-native-audio-api: each file is decoded once into a buffer,
// every play is a new source (so two plays of one sound overlap and never cut each other), a gain node per bus,
// and a soft-knee limiter on the master (audio-api 1.0 has no compressor node). A stinger is started with
// `start(when)` on the context clock, so its beat 1 is placed by the audio thread, not by a JS timer.
// Music loops and story cues stay on expo-audio (expo-output.ts): the loop is one native player with `loop = true`
// (no restart by hand); nothing in the code or the docs shows a gap, and the device checklist (M) measures it.
import { requireOptionalNativeModule } from 'expo';
import { AudioContext, AudioManager, type AudioBuffer, type GainNode } from 'react-native-audio-api';

import { createExpoOutput, sourceOf } from './expo-output';
import {
  DECODED_BYTES_BUDGET, Epochs, LIMITER_RANGE, busOf, decodedBytes, limiterCurve, voiceToSteal,
  type AudioOutput, type Bus, type PlayOpts,
} from './output-core';

/** Sources sounding at once, over all effects and stingers: past this the oldest effect is stopped (a stinger never is). */
export const MAX_VOICES = 24;

interface Voice {
  id: string;
  src: { stop: (when?: number) => void };
  gain: GainNode;
  startAt: number;
}

/** An optional native `SliceAudioSession.isOtherAudioPlaying()` (AVAudioSession's hint); absent until the app ships one. */
interface SessionProbe { isOtherAudioPlaying?: () => boolean }

export function createOutput(): AudioOutput {
  const expo = createExpoOutput();
  let ctx: AudioContext;
  let master: GainNode;
  const buses: Partial<Record<Bus, GainNode>> = {};
  try {
    // follow the silent switch and mix with the player's own music, as the expo-audio mode does
    AudioManager.setSystemOptions({ ios: { category: 'ambient' } });
    ctx = new AudioContext({ latencyHint: 'interactive' });
    const shaper = ctx.createWaveShaper();
    shaper.curve = limiterCurve();
    master = ctx.createGain();
    master.gain.value = 1 / LIMITER_RANGE; // the curve is laid out over ±LIMITER_RANGE (AU78)
    master.connect(shaper);
    shaper.connect(ctx.destination);
    for (const b of ['sfx', 'sting'] as const) {
      const g = ctx.createGain();
      g.connect(master);
      buses[b] = g;
    }
  } catch {
    return expo; // Expo Go or no native module: everything on expo-audio, as on the web
  }

  const buffers = new Map<string, AudioBuffer>();
  const loading = new Map<string, Promise<AudioBuffer | null>>();
  const voices = new Set<Voice>();
  /** C132: a stop or an unload overtakes a play still decoding; an unload overtakes a decode (AU81). */
  const playEpoch = new Epochs();
  const loadEpoch = new Epochs();
  let bytes = 0;
  const sized = new Map<string, number>();
  // U20: the context is suspended in the background and while both of its buses are silent
  const busLevel: Partial<Record<Bus, number>> = { sfx: 1, sting: 1 };
  let appOn = true;
  let suspended = false;
  const syncClock = () => {
    const want = appOn && ((busLevel.sfx ?? 0) > 0 || (busLevel.sting ?? 0) > 0);
    if (want === !suspended) return;
    suspended = !want;
    try {
      void (want ? ctx.resume() : ctx.suspend()).catch(() => {});
    } catch {
      /* the clock stays as it was */
    }
  };
  const viaExpo = (id: string) => busOf(id) === 'music' || busOf(id) === 'story';

  function decode(id: string): Promise<AudioBuffer | null> {
    const have = buffers.get(id);
    if (have) return Promise.resolve(have);
    let p = loading.get(id);
    if (!p) {
      const src = sourceOf(id);
      const epoch = loadEpoch.get(id);
      // unloaded while decoding: the result is dropped, not kept untracked (AU81)
      const mine = () => loadEpoch.get(id) === epoch;
      const mark: Promise<AudioBuffer | null> = src === null
        ? Promise.resolve(null)
        : ctx.decodeAudioData(src).then(
            (b) => {
              if (loading.get(id) === mark) loading.delete(id);
              if (!mine()) return null;
              buffers.set(id, b);
              const n = decodedBytes(b.length, b.numberOfChannels);
              sized.set(id, n);
              bytes += n;
              return b;
            },
            () => {
              if (loading.get(id) === mark) loading.delete(id);
              return null;
            },
          );
      p = mark;
      loading.set(id, p);
    }
    return p;
  }

  function start(id: string, buf: AudioBuffer, o: PlayOpts, when: number) {
    const bus = buses[busOf(id) === 'sting' ? 'sting' : 'sfx']!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = o.rate ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = o.gain;
    src.connect(gain);
    gain.connect(bus);
    const voice: Voice = { id, src, gain, startAt: when };
    voices.add(voice);
    const live = [...voices];
    const victim = voiceToSteal(live.map((v) => v.id), MAX_VOICES);
    if (victim >= 0 && live[victim] !== voice) {
      voices.delete(live[victim]); // out of the count at once; its onended only disconnects
      live[victim].src.stop();
    }
    src.onended = () => {
      voices.delete(voice);
      gain.disconnect();
      o.onEnd?.();
    };
    src.start(when); // a time already past starts at once
  }

  const now = () => ctx.currentTime;
  const latest = (id: string) => {
    let v: Voice | null = null;
    for (const x of voices) if (x.id === id && x.startAt <= now() && (!v || x.startAt > v.startAt)) v = x;
    return v;
  };

  const probe = requireOptionalNativeModule<SessionProbe>('SliceAudioSession');

  return {
    load(id) {
      if (viaExpo(id)) return expo.load(id);
      // M67: past the budget a stinger set is no longer decoded ahead of time; its play decodes it when it is needed
      if (busOf(id) === 'sting' && bytes > DECODED_BYTES_BUDGET && !buffers.has(id)) return;
      void decode(id);
    },
    unload(id) {
      if (viaExpo(id)) return expo.unload(id);
      loadEpoch.bump(id);
      playEpoch.bump(id);
      buffers.delete(id);
      loading.delete(id);
      bytes -= sized.get(id) ?? 0;
      sized.delete(id);
    },
    isLoaded: (id) => (viaExpo(id) ? expo.isLoaded(id) : buffers.has(id) || loading.has(id)),
    loadedCount: () => buffers.size + expo.loadedCount(),
    play(id, o) {
      if (viaExpo(id)) return expo.play(id, o);
      if (suspended && appOn) {
        suspended = false; // a play wakes the clock before it is placed on it
        try {
          void ctx.resume().catch(() => {});
        } catch {
          /* ignore */
        }
      }
      const when = now() + (o.at ?? 0);
      const buf = buffers.get(id);
      if (buf) return start(id, buf, o, when);
      const epoch = playEpoch.get(id);
      void decode(id).then((b) => {
        if (b && playEpoch.get(id) === epoch) start(id, b, o, when);
        else o.onEnd?.();
      });
    },
    loop: (id, o) => expo.loop(id, o),
    stop(id, fadeMs = 0) {
      if (viaExpo(id)) return expo.stop(id, fadeMs);
      playEpoch.bump(id);
      for (const v of [...voices]) {
        if (v.id !== id) continue;
        if (fadeMs > 0 && v.startAt <= now()) {
          const t = now();
          v.gain.gain.cancelScheduledValues(t);
          v.gain.gain.setValueAtTime(v.gain.gain.value, t);
          v.gain.gain.linearRampToValueAtTime(0, t + fadeMs / 1000);
          v.src.stop(t + fadeMs / 1000);
        } else v.src.stop();
      }
    },
    resume: (id) => expo.resume(id),
    fade(id, gain, ms) {
      if (viaExpo(id)) return expo.fade(id, gain, ms);
      const t = now();
      for (const v of voices) {
        if (v.id !== id) continue;
        v.gain.gain.cancelScheduledValues(t);
        v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        v.gain.gain.linearRampToValueAtTime(gain, t + ms / 1000);
      }
    },
    playing: (id) => (viaExpo(id) ? expo.playing(id) : latest(id) !== null),
    position(id) {
      if (viaExpo(id)) return expo.position(id);
      const v = latest(id);
      return v ? now() - v.startAt : NaN;
    },
    setBus(bus, gain) {
      expo.setBus(bus, gain);
      const node = buses[bus];
      if (node) node.gain.setTargetAtTime(gain, now(), 0.01);
      if (bus === 'sfx' || bus === 'sting') {
        busLevel[bus] = gain;
        syncClock();
      }
    },
    setActive(active) {
      appOn = active;
      syncClock();
    },
    otherAudio: () => {
      try {
        const r = probe?.isOtherAudioPlaying?.();
        return typeof r === 'boolean' ? r : null;
      } catch {
        return null;
      }
    },
  };
}
