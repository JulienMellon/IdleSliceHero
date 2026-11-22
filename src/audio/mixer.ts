// The audio mixer: everything the director decides about *what is playing*, written against the AudioOutput seam
// (output-core.ts) so it runs in Node against a fake. No expo-audio, no react-native, no store: the director
// (director.ts) turns store and bus events into these calls; the output (output.*.ts) makes the sound.
// Rules live in logic.ts (tested); cue data comes in through the Catalog (the generated manifest, in the app).
import type { NeighborhoodId } from '../content/types';
import {
  DUCK,
  RarePlays,
  StingGate,
  RESTART_TRACKS,
  beatUnit,
  dbToGain,
  nextVariant,
  perkDuckSeconds,
  quantizeDelay,
  sharedTimeline,
  shouldReleaseWarmCollect,
  stingDuck,
  stingTiming,
  stingUnit,
  type MusicTrack,
  type StingKind,
} from './logic';
import { musicId, sfxId, stingId, storyId, type AudioOutput } from './output-core';

export const CROSSFADE_MS = 600; // AU19
export const DUCK_DOWN_MS = 80; // AU22
export const DUCK_UP_MS = 400;
export const CUE_OUT_MS = 300; // an outgoing story cue always fades (AU26)
export const SFX_UNDER_STING = 0.7; // AU38
/** The music off switch reaches the sting and story buses after the 200 ms fade the director asks for. */
const BUS_MUTE_AFTER_MS = 250;

/** Rare one-shots: unloaded after each play instead of staying resident (AU55). */
export const RARE: ReadonlySet<string> = new Set(['collect', 'build', 'gavel', 'grade', 'expand']);
export const SFX_SECONDS: Readonly<Record<string, number>> = {
  collect: 1.5,
  build: 0.8,
  fleet: 0.6,
  grade: 0.6,
  gavel: 0.6,
  expand: 0.5,
  milestone: 0.4,
  oven_ding: 0.5,
  phone_ring: 2,
  tip_bell: 0.45,
};
/** Effects created in this order once the first frame is up; sparkle, milestone and fleet join them (they used to wait for first use). */
export const COMMON_SFX: readonly string[] = ['tap', 'cash', 'buy', 'rush', 'bubble', 'full', 'refused', 'click', 'sparkle', 'milestone', 'fleet'];
/** The title screen's sounds, then the Downtown set the first minutes of play use (AU39). */
export const TITLE_SET: readonly string[] = ['click/0', 'tap/0', 'bubble/0'];
export const DOWNTOWN_SET: readonly string[] = ['tap/1', 'cash/0', 'cash/1', 'buy/0', 'rush/0'];
/** Players alive once the save is in, a scene is open and the title and Downtown sets are loaded (2 loops, 2 cues, 8 effects). */
export const LAUNCH_PLAYER_BUDGET = 12;
const REST_CHUNK = 3;
const REST_EVERY_MS = 120;
const STING_PRELOAD_MS = 1500;
export const STING_PRELOAD: readonly StingKind[] = ['bottleneck', 'milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'build', 'perk'];

export interface Catalog {
  sfxCount(id: string): number;
  music(track: MusicTrack): { seconds: number; bpm: number; beatsPerBar: number; barRoots?: readonly number[] };
  sting(key: string): { seconds: number; musicSeconds?: number; downbeatSeconds: number };
  story(id: string): { seconds: number; bpm?: number; payoffSeconds?: number };
}

/** The effects to create at launch (title set, then Downtown set) and the rest to create after the first frame. */
export function launchPlan(catalog: Pick<Catalog, 'sfxCount'>): { launch: string[]; rest: string[] } {
  const launch = [...TITLE_SET, ...DOWNTOWN_SET];
  const rest: string[] = [];
  for (const id of COMMON_SFX) {
    for (let v = 0; v < catalog.sfxCount(id); v++) {
      const key = `${id}/${v}`;
      if (!launch.includes(key)) rest.push(key);
    }
  }
  return { launch: launch.map((k) => `sfx:${k}`), rest: rest.map((k) => `sfx:${k}`) };
}

/**
 * AU41: another app's audio. When the session says one is playing at launch, Music starts off for this session.
 * The saved preference is never touched; the player's own choice (a toggle) ends the rule.
 */
export class OtherAudioRule {
  private off = false;
  start(otherPlaying: boolean | null) {
    this.off = otherPlaying === true;
  }
  /** The player turned Music on or off by hand: their word beats the session's. */
  userChoice() {
    this.off = false;
  }
  get suppressed() {
    return this.off;
  }
  /** Music is on when the saved preference says so and the session hasn't switched it off. */
  allows(pref: boolean) {
    return pref && !this.off;
  }
}

export interface MixerDeps {
  out: AudioOutput;
  catalog: Catalog;
  /** The saved preferences. */
  prefs: () => { music: boolean; sound: boolean };
  /** Called when "another app is playing" starts or ends suppressing Music (launch, or the player's own toggle). */
  onSuppressed?: (suppressed: boolean) => void;
  random?: () => number;
}

interface StoryNow {
  id: string;
  startedAt: number;
  pausedAt: number | null;
  exclusive: boolean;
}
type Timer = ReturnType<typeof setTimeout>;

export function createMixer(deps: MixerDeps) {
  const { out, catalog, prefs } = deps;
  const random = deps.random ?? Math.random;
  const rule = new OtherAudioRule();
  let unlocked = true;
  let appActive = true;

  // ---- music
  let current: MusicTrack | null = null;
  let pendingFrom: number | null = null;
  const positions = new Map<MusicTrack, number>();
  /** Multiplicative ducks keyed by reason; the loop plays at the product. */
  const ducks = new Map<string, number>();
  const duckTimers = new Map<string, Timer>();

  // ---- effects
  const firing = new RarePlays();
  /** Rare effects `warm` created itself, which the sweep may release (AU76). */
  const warmed = new Set<string>();
  const lastVariant = new Map<string, number>();
  const gate = new StingGate();

  // ---- stingers
  let stingHood: NeighborhoodId | null = null;
  const stingLoaded = new Set<string>();
  const pendingStings = new Map<Timer, string>();
  const orphans = new Map<string, string>();
  const pendingPerks = new Set<Timer>();
  let preloadTimer: Timer | null = null;
  let heldUntil = 0;
  let heldKind: 'build' | 'bid' | null = null;
  const pendingCues = new Set<Timer>();

  // ---- story
  let storyNow: StoryNow | null = null;
  let storyEnd: Timer | null = null;

  // ---- launch
  let restQueue: string[] = [];
  let restTimer: Timer | null = null;
  let busMute: Timer | null = null;

  const now = () => Date.now();
  const setRule = (change: () => void) => {
    const before = rule.suppressed;
    change();
    if (rule.suppressed !== before) deps.onSuppressed?.(rule.suppressed);
  };
  const num = (x: number, fallback: number) => (Number.isFinite(x) ? x : fallback);

  function musicOn() {
    return rule.allows(prefs().music);
  }

  /** Bus gains follow the preferences: Sound owns the effects bus, Music the stinger and story buses (the loop is faded by the ducks). */
  function syncBuses() {
    out.setBus('music', 1);
    out.setBus('sfx', prefs().sound ? 1 : 0);
    if (busMute) clearTimeout(busMute);
    busMute = null;
    if (musicOn()) {
      out.setBus('sting', 1);
      out.setBus('story', 1);
    } else {
      busMute = setTimeout(() => {
        busMute = null;
        if (!musicOn()) {
          out.setBus('sting', 0);
          out.setBus('story', 0);
        }
      }, BUS_MUTE_AFTER_MS);
    }
  }

  // ------------------------------------------------------------------------------------------ launch
  function boot(o: { unlocked: boolean }) {
    unlocked = o.unlocked;
    setRule(() => rule.start(out.otherAudio()));
    syncBuses();
    for (const id of launchPlan(catalog).launch) out.load(id);
  }

  /** The first frame is up: create the remaining common effects a few at a time, so no frame carries them all. */
  function afterFirstFrame() {
    if (restTimer || restQueue.length) return;
    restQueue = launchPlan(catalog).rest;
    const step = () => {
      restTimer = null;
      for (const id of restQueue.splice(0, REST_CHUNK)) out.load(id);
      if (restQueue.length) restTimer = setTimeout(step, REST_EVERY_MS);
    };
    restTimer = setTimeout(step, REST_EVERY_MS);
  }

  // ------------------------------------------------------------------------------------------ music
  function musicGain() {
    if (!musicOn() || !appActive || !unlocked) return 0;
    let g = 1;
    for (const d of ducks.values()) g *= d;
    return g;
  }

  function applyMusic(ms: number) {
    if (!current) return;
    const id = musicId(current);
    const g = musicGain();
    if (g > 0) {
      if (!out.playing(id)) {
        out.loop(id, pendingFrom === null ? undefined : { from: pendingFrom });
        pendingFrom = null;
      }
      out.fade(id, g, ms);
    } else {
      // silent: pause rather than decode at volume 0 (resumes from the same spot)
      out.stop(id, ms);
    }
  }

  function duck(reason: string, gain: number | null, holdMs?: number) {
    const t = duckTimers.get(reason);
    if (t) clearTimeout(t);
    duckTimers.delete(reason);
    const before = musicGain();
    if (gain === null) ducks.delete(reason);
    else ducks.set(reason, gain);
    applyMusic(musicGain() < before ? DUCK_DOWN_MS : DUCK_UP_MS);
    if (gain !== null && holdMs)
      duckTimers.set(
        reason,
        setTimeout(() => duck(reason, null), holdMs),
      );
  }

  function setTrack(next: MusicTrack) {
    if (next === current) return;
    const prev = current;
    const outPos = prev ? num(out.position(musicId(prev)), 0) : 0;
    if (prev) {
      positions.set(prev, outPos);
      out.stop(musicId(prev), CROSSFADE_MS);
    }
    // Nonna's takeover: the full band picks up where the sparse chart was (AU41)
    if (sharedTimeline(prev, next)) positions.set(next, outPos);
    if (RESTART_TRACKS.has(next)) positions.set(next, 0);
    current = next;
    const id = musicId(next);
    const pos = (positions.get(next) ?? 0) % catalog.music(next).seconds;
    const g = musicGain();
    if (g > 0) {
      pendingFrom = null;
      out.loop(id, { gain: 0, from: pos });
      out.fade(id, g, CROSSFADE_MS);
    } else {
      out.load(id);
      pendingFrom = pos;
    }
  }

  // ------------------------------------------------------------------------------------------ effects
  function sfx(id: string, opts: { variant?: number; gain?: number; jitter?: number } = {}) {
    if (!prefs().sound || !unlocked || !appActive) return;
    const n = catalog.sfxCount(id);
    const v = Math.min(n - 1, opts.variant ?? nextVariant(lastVariant.get(id) ?? -1, n, random()));
    lastVariant.set(id, v);
    const semis = (random() * 2 - 1) * (opts.jitter ?? 1);
    const under = gate.busy(now()) ? SFX_UNDER_STING : 1;
    const key = `${id}/${v}`;
    const oid = sfxId(id, v);
    const rare = RARE.has(id);
    if (rare) {
      firing.acquire(key);
      warmed.delete(key); // a played effect is the play's own, released when it ends
    }
    out.play(oid, {
      gain: (opts.gain ?? 1) * under,
      rate: Math.pow(2, semis / 12),
      seconds: SFX_SECONDS[id] ?? 0.35,
      overlap: rare,
      // C102: the sound is released with its last play, never under another that is still sounding
      onEnd: rare
        ? () => {
            if (!firing.release(key)) return;
            warmed.delete(key);
            out.unload(oid);
          }
        : undefined,
    });
  }

  /** Whether an effect's sound is created (or decoding). */
  function loaded(id: string, v: number) {
    return out.isLoaded(sfxId(id, v));
  }

  /** Create a rare effect ahead of its play (AU61). `release`: the sweep may drop it again if it goes unused (the offline Collect). */
  function warm(id: string, v: number, release = false) {
    const oid = sfxId(id, v);
    if (out.isLoaded(oid)) return;
    out.load(oid);
    if (release) warmed.add(`${id}/${v}`);
  }

  /** Release a Collect that `warm` created, once nothing is playing or about to (AU76); this runs with sound off too (M59). */
  function sweepWarm(offlineOpen: boolean) {
    for (const key of [...warmed]) {
      const oid = `sfx:${key}`;
      if (!out.isLoaded(oid)) {
        warmed.delete(key);
        continue;
      }
      if (shouldReleaseWarmCollect({ warmed: true, firing: firing.active(key), playing: out.playing(oid), offlineOpen })) {
        warmed.delete(key);
        out.unload(oid);
      }
    }
  }

  // ------------------------------------------------------------------------------------------ stingers
  function useStingKey(hood: NeighborhoodId) {
    if (stingHood === hood) return;
    // the held build stinger of the key we are moving to stays in the set: it is still sounding and Skip must reach it
    const keep = heldKind === 'build' && now() < heldUntil ? `${hood}_build` : null;
    for (const key of [...stingLoaded]) {
      if (key === keep) continue;
      const id = stingId(key);
      // a stinger still sounding is released when it ends, never cut (AU43), but it stays fadable (AU60)
      if (out.playing(id)) {
        const left = Math.max(0, catalog.sting(key).seconds - num(out.position(id), 0));
        orphans.set(id, key);
        setTimeout(
          () => {
            orphans.delete(id);
            if (!stingLoaded.has(key)) out.unload(id); // it may have come back as the active key since
          },
          left * 1000 + 200,
        );
      } else out.unload(id);
      stingLoaded.delete(key);
    }
    stingHood = hood;
  }

  function stingVoice(hood: NeighborhoodId, kind: StingKind | 'bid') {
    if (kind !== 'build' && kind !== 'bid') useStingKey(hood);
    const key = `${hood}_${kind}`;
    const id = stingId(key);
    if (!stingLoaded.has(key)) {
      out.load(id);
      // other keys' build/bid sounds are kept with the active key's set and released with it
      stingLoaded.add(key);
    }
    return { id, info: catalog.sting(key) };
  }

  /** Create `hood`'s stingers 1.5 s after the key becomes active (AU40); `where()` is asked again when the timer fires. */
  function scheduleStingPreload(hood: NeighborhoodId, where: () => NeighborhoodId) {
    if (stingHood === hood) return;
    if (preloadTimer) clearTimeout(preloadTimer);
    preloadTimer = setTimeout(() => {
      preloadTimer = null;
      const h = where();
      if (!musicOn()) return;
      const buildHeld = heldKind === 'build' && now() < heldUntil;
      for (const k of STING_PRELOAD) if (!(k === 'build' && buildHeld)) stingVoice(h, k); // AU60
    }, STING_PRELOAD_MS);
  }

  /** Fade gameplay stingers out. `keepHeld`: a build or bid stinger rides into the scene it opened (AU42). */
  function stopStings(ms: number, keepHeld = false) {
    const held = keepHeld && heldKind && now() < heldUntil ? heldKind : null;
    for (const [t, id] of pendingStings) {
      clearTimeout(t);
      if (!(held && id.endsWith(`_${held}`))) out.stop(id, 0); // scheduled, not sounding yet
    }
    pendingStings.clear();
    for (const key of stingLoaded) {
      if (held && key.endsWith(`_${held}`)) continue;
      if (out.playing(stingId(key))) out.stop(stingId(key), ms);
    }
    for (const [id, key] of orphans) {
      if (held && key.endsWith(`_${held}`)) continue;
      if (out.playing(id)) out.stop(id, ms);
    }
    gate.clear();
    if (!held) {
      duck('sting', null);
      heldUntil = 0;
      heldKind = null;
    }
  }

  /** Play a stinger in `hood`'s key; its beat 1 lands on the loop's next beat or bar unless `immediate`. */
  function sting(hood: NeighborhoodId, kind: StingKind | 'bid', o: { immediate?: boolean; gated?: boolean; duck?: number } = {}) {
    if (!musicOn() || !unlocked || !appActive) return;
    const { id, info } = stingVoice(hood, kind);
    const t0 = now();
    const m = current ? catalog.music(current) : null;
    const pos = m && current ? out.position(musicId(current)) : NaN;
    // chordal stingers wait for a bar on the tonic (AU47); the bottleneck line only for the next beat
    let delay = 0;
    let extra = 1;
    if (!o.immediate && m && current && Number.isFinite(pos) && kind !== 'bid') {
      const unit = stingUnit(kind as StingKind, m.beatsPerBar, current);
      if (unit === beatUnit(current)) delay = quantizeDelay(pos, m.bpm, unit, info.downbeatSeconds);
      else ({ delay, extraDuck: extra } = stingTiming(pos, m.bpm, m.beatsPerBar, m.barRoots, info.downbeatSeconds));
    }
    // the duck and the gate last as long as the music, not the reverb tail (AU53)
    const musicLen = info.musicSeconds ?? info.seconds;
    if (o.gated !== false && kind !== 'bid' && !gate.admit(kind as StingKind, t0, (delay + musicLen) * 1000)) return;
    if (kind === 'build' || kind === 'bid') {
      heldKind = kind;
      heldUntil = t0 + musicLen * 1000;
    }
    // the output places the sound on its own clock (sample-accurate on the phone); the duck rides a timer at the same moment
    out.play(id, { gain: 1, at: delay, seconds: info.seconds });
    const t = setTimeout(() => {
      pendingStings.delete(t);
      duck('sting', (o.duck ?? (kind === 'bid' ? DUCK.bid : stingDuck(kind as StingKind))) * extra, musicLen * 1000);
    }, delay * 1000);
    pendingStings.set(t, id);
  }

  /** Run a story cue now, or when the held build/bid stinger ends — unless the scene has moved on by then (AU57). */
  function afterHeld(fn: () => void, stillHere: () => boolean) {
    const wait = heldUntil - now();
    if (wait <= 0) return fn();
    const t = setTimeout(() => {
      pendingCues.delete(t);
      if (stillHere()) fn();
    }, wait);
    pendingCues.add(t);
  }

  function clearPendingCues() {
    for (const t of pendingCues) clearTimeout(t);
    pendingCues.clear();
  }

  // ------------------------------------------------------------------------------------------ story
  function armStoryEnd(ms: number) {
    if (storyEnd) clearTimeout(storyEnd);
    storyEnd = setTimeout(() => {
      storyEnd = null;
      storyNow = null;
      duck('story', null);
    }, ms);
  }

  function stopStory(ms: number, keepDuck = false) {
    if (storyEnd) clearTimeout(storyEnd);
    storyEnd = null;
    const was = storyNow;
    storyNow = null;
    if (was) out.stop(storyId(was.id), ms);
    if (!keepDuck) duck('story', null);
  }

  function story(id: string, exclusive: boolean) {
    // a triumph is never cut before its payoff crash plus a beat (AU45)
    const cur = storyNow ? catalog.story(storyNow.id) : null;
    if (cur && storyNow && cur.payoffSeconds !== undefined && storyNow.pausedAt === null) {
      const beat = cur.bpm ? 60 / cur.bpm : 0.5;
      const wait = storyNow.startedAt + (cur.payoffSeconds + beat) * 1000 - now();
      if (wait > 0) {
        const t = setTimeout(() => {
          pendingCues.delete(t);
          story(id, exclusive);
        }, wait);
        pendingCues.add(t);
        return;
      }
    }
    stopStory(CUE_OUT_MS, exclusive);
    if (!musicOn() || !unlocked || !appActive) return;
    const info = catalog.story(id);
    out.play(storyId(id), { gain: 1, seconds: info.seconds });
    if (exclusive) duck('story', 0);
    storyNow = { id, startedAt: now(), pausedAt: null, exclusive };
    armStoryEnd(info.seconds * 1000);
  }

  /** Duck the story cue −6 dB for `seconds` (a perk landing before the payoff), then bring it back if it is still the one playing. */
  function duckStory(sn: StoryNow, seconds: number) {
    out.fade(storyId(sn.id), dbToGain(-6), DUCK_DOWN_MS);
    setTimeout(() => {
      if (storyNow === sn && sn.pausedAt === null) out.fade(storyId(sn.id), 1, DUCK_UP_MS);
    }, seconds * 1000);
  }

  /**
   * A perk, layered over a triumph or the city theme still building to its payoff, in the scene's key (AU26): it waits
   * for the payoff, at most 3 s (AU66, AU75). If the payoff is still ahead when it fires, the cue ducks −6 dB
   * for the perk's length. The timer is not in pendingCues, so a panel change doesn't drop the perk.
   */
  function perk(hood: NeighborhoodId) {
    const t0 = now();
    const sn = storyNow && storyNow.pausedAt === null ? storyNow : null;
    const cue = sn ? catalog.story(sn.id) : null;
    const payoffAt = sn && cue && cue.payoffSeconds !== undefined ? sn.startedAt + cue.payoffSeconds * 1000 : 0;
    if (sn && payoffAt > t0) {
      const info = catalog.sting(`${hood}_perk`);
      const t = setTimeout(
        () => {
          pendingPerks.delete(t);
          if (storyNow === sn && sn.pausedAt === null && payoffAt > now()) {
            const len = perkDuckSeconds(info.musicSeconds ?? info.seconds, payoffAt, now(), DUCK_UP_MS);
            if (len > 0) duckStory(sn, len); // AU77: back up before the payoff crash
          }
          sting(hood, 'perk', { immediate: true, gated: false, duck: 1 });
        },
        Math.min(3000, payoffAt - t0),
      );
      pendingPerks.add(t);
      return;
    }
    sting(hood, 'perk', { immediate: true, gated: false, duck: 1 });
  }

  function skip(ms: number) {
    clearPendingCues();
    for (const t of pendingPerks) clearTimeout(t);
    pendingPerks.clear();
    stopStings(ms);
    stopStory(ms);
  }

  /** Music switched off: cues and stingers fade; the loop follows through `applyMusic` (the director refreshes). */
  function musicOff() {
    clearPendingCues();
    stopStory(200);
    stopStings(200);
  }

  // ------------------------------------------------------------------------------------------ app state
  function setAppActive(active: boolean) {
    const was = appActive;
    appActive = active;
    if (was === active) return;
    out.setActive?.(active); // U20: an output with a clock of its own suspends it in the background
    if (!active) {
      if (current) out.stop(musicId(current), 0);
      if (storyNow) {
        out.stop(storyId(storyNow.id), 0);
        storyNow.pausedAt = now();
        if (storyEnd) clearTimeout(storyEnd);
        storyEnd = null;
      }
      stopStings(0);
    } else {
      // resume a story cue with more than half a second left, else let the loop back in
      const cue = storyNow;
      if (cue && cue.pausedAt !== null) {
        const played = (cue.pausedAt - cue.startedAt) / 1000;
        const left = catalog.story(cue.id).seconds - played;
        if (left > 0.5 && musicOn()) {
          cue.startedAt = now() - played * 1000;
          cue.pausedAt = null;
          out.resume(storyId(cue.id));
          // AU80: a perk duck that fell due while the app was away was skipped (paused): the cue comes back to full
          out.fade(storyId(cue.id), 1, DUCK_UP_MS);
          armStoryEnd(left * 1000);
        } else stopStory(0);
      }
    }
  }

  function unlock() {
    unlocked = true;
  }

  /** The player changed a preference: a hand-made Music choice ends the other-audio rule (AU41); buses follow. */
  function prefsChanged(musicToggled: boolean) {
    if (musicToggled) setRule(() => rule.userChoice());
    syncBuses();
  }

  return {
    boot,
    afterFirstFrame,
    unlock,
    setAppActive,
    prefsChanged,
    musicOn,
    setTrack,
    duck,
    applyMusic,
    sfx,
    warm,
    loaded,
    sweepWarm,
    sting,
    stopStings,
    scheduleStingPreload,
    afterHeld,
    clearPendingCues,
    story,
    stopStory,
    perk,
    skip,
    musicOff,
    get storyNow() {
      return storyNow;
    },
    get held() {
      return { kind: heldKind, until: heldUntil };
    },
    get otherAudioSuppressed() {
      return rule.suppressed;
    },
    get appActive() {
      return appActive;
    },
    get track() {
      return current;
    },
  };
}

export type Mixer = ReturnType<typeof createMixer>;
