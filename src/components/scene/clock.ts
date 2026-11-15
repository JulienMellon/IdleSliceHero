// The scene's animation clock: a 15 fps tick that pauses (and resumes where it left off) with the app.
// Also the two small hooks every animation shares: is the app in the foreground (`useAppActive`) and does the
// player want less motion (`useReducedMotion`), plus the measuring marks behind `?perf=1` (scripts/review/perf.py).
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { queryFlag } from '../../services/query';
import { isForeground } from '../app-state-model';
import { motionPlan, type MotionPlan } from '../motion-model';

/** One shared subscription per setting (dozens of buttons ask; the system is asked once). */
function sharedFlag(read: () => boolean, listen: (set: (v: boolean) => void) => () => void) {
  let value = read();
  const subs = new Set<() => void>();
  let off: (() => void) | null = null;
  const set = (v: boolean) => {
    if (v === value) return;
    value = v;
    subs.forEach((f) => f());
  };
  return {
    get: () => value,
    subscribe(f: () => void) {
      if (subs.size === 0) {
        set(read());
        off = listen(set);
      }
      subs.add(f);
      return () => {
        subs.delete(f);
        if (subs.size === 0) {
          off?.();
          off = null;
        }
      };
    },
  };
}

const appActive = sharedFlag(
  () => isForeground(AppState.currentState),
  (set) => {
    const sub = AppState.addEventListener('change', (s) => set(isForeground(s)));
    return () => sub.remove();
  },
);

let reducedNow = false;
const reduceMotion = sharedFlag(
  () => reducedNow,
  (set) => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && ((reducedNow = v), set(v))).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => ((reducedNow = v), set(v)));
    return () => {
      alive = false;
      sub.remove();
    };
  },
);
/** True while the app is in the foreground. `inactive` (Control Center, a notification) still counts as the foreground: the game keeps showing behind it. */
export const useAppActive = (): boolean => useSyncExternalStore(appActive.subscribe, appActive.get, () => true);

/** The player's Reduce Motion setting (iOS Settings > Accessibility > Motion), live. Coin flights, bursts, turning rays and shakes ask this and fade instead. */
export const useReducedMotion = (): boolean => useSyncExternalStore(reduceMotion.subscribe, reduceMotion.get, () => false);

/** What may move now: Reduce Motion and the foreground, in one answer (motion-model.ts). Take the flags you need from it as primitives. */
export function useMotion(): MotionPlan {
  const reduced = useReducedMotion();
  const active = useAppActive();
  return motionPlan(reduced, active);
}

export function useClock(fps: number, paused: boolean) {
  const [t, setT] = useState(0);
  const base = useRef({ wall: Date.now(), t: 0 });
  // a backgrounded app draws nothing: the clock stops and picks up where it left off
  const active = useAppActive();
  const stopped = paused || !active;
  useEffect(() => {
    if (stopped) return;
    base.current = { wall: Date.now(), t: base.current.t };
    const id = setInterval(() => setT(base.current.t + (Date.now() - base.current.wall) / 1000), 1000 / fps);
    return () => {
      base.current.t += (Date.now() - base.current.wall) / 1000;
      clearInterval(id);
    };
  }, [fps, stopped]);
  return t;
}

// ---- measuring (scripts/review/perf.py): off unless the page was opened with ?perf=1, so a player's build does nothing here ----
const PERF = queryFlag('perf') === '1';
interface PerfBox {
  commits: Record<string, number>;
  ms: Record<string, number[]>;
}
const perfBox = (): PerfBox => {
  const g = globalThis as { __perf?: PerfBox };
  return (g.__perf ??= { commits: {}, ms: {} });
};

/** Call at the top of a component's body and nothing else: counts its commits and times render-to-layout (`performance.measure(name)` too). */
export function usePerfMarks(name: string): void {
  'use no memo'; // reads the clock during render on purpose; keeps the caller (GameScreen) compiled
  const t0 = PERF ? performance.now() : 0;
  useLayoutEffect(() => {
    if (!PERF) return;
    const box = perfBox();
    box.commits[name] = (box.commits[name] ?? 0) + 1;
    (box.ms[name] ??= []).push(performance.now() - t0);
    try {
      performance.measure(name, { start: t0, end: performance.now() });
    } catch {
      /* a browser without the options form: the numbers in __perf are enough */
    }
  });
}
