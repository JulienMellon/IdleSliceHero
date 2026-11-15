// The phone build. Effects and stingers run on react-native-audio-api: each file is decoded once into a buffer,
// every play is a new source (so two plays of one sound overlap and never cut each other), a gain node per bus,
// and a soft-knee limiter on the master (audio-api 1.0 has no compressor node). A stinger is started with
// `start(when)` on the context clock, so its beat 1 is placed by the audio thread, not by a JS timer.
// Music loops and story cues stay on expo-audio (expo-output.ts): the loop is one native player with `loop = true`
// (no restart by hand); nothing in the code or the docs shows a gap, and the device checklist (M) measures it.
import { requireOptionalNativeModule } from 'expo';
import { AudioContext, AudioManager, type AudioBuffer, type GainNode } from 'react-native-audio-api';

import { createExpoOutput, sourceOf } from './expo-output';
import { busOf, limiterCurve, type AudioOutput, type Bus, type PlayOpts } from './output-core';

/** Sources sounding at once, over all effects and stingers: past this the oldest is stopped. */
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
  const viaExpo = (id: string) => busOf(id) === 'music' || busOf(id) === 'story';

  function decode(id: string): Promise<AudioBuffer | null> {
    const have = buffers.get(id);
    if (have) return Promise.resolve(have);
    let p = loading.get(id);
    if (!p) {
      const src = sourceOf(id);
      p = src === null
        ? Promise.resolve(null)
        : ctx.decodeAudioData(src).then(
            (b) => {
              loading.delete(id);
              buffers.set(id, b);
              return b;
            },
            () => {
              loading.delete(id);
              return null;
            },
          );
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
    if (voices.size > MAX_VOICES) {
      const oldest = voices.values().next().value as Voice | undefined;
      if (oldest && oldest !== voice) oldest.src.stop();
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
      void decode(id);
    },
    unload(id) {
      if (viaExpo(id)) return expo.unload(id);
      buffers.delete(id);
      loading.delete(id);
    },
    isLoaded: (id) => (viaExpo(id) ? expo.isLoaded(id) : buffers.has(id) || loading.has(id)),
    loadedCount: () => buffers.size + expo.loadedCount(),
    play(id, o) {
      if (viaExpo(id)) return expo.play(id, o);
      const when = now() + (o.at ?? 0);
      const buf = buffers.get(id);
      if (buf) return start(id, buf, o, when);
      void decode(id).then((b) => (b ? start(id, b, o, when) : o.onEnd?.()));
    },
    loop: (id, o) => expo.loop(id, o),
    stop(id, fadeMs = 0) {
      if (viaExpo(id)) return expo.stop(id, fadeMs);
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
