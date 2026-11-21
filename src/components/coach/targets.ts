// The Coach's target registry (v5.20, card C1): any component can name a spot of the screen by id and report where it is,
// and the one overlay (overlay.tsx) cuts its hole there. Rects are in screen points (`measureInWindow`'s own space).
// The store is plain module state: a subscriber is told only when ITS target's rect changes.
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** Every spot the tutorial can point at. Scene ids are registered by the storefront (card C2), drawer ids by the drawer (card C3). */
export type CoachTargetId =
  | 'station:prep'
  | 'station:oven'
  | 'station:counter'
  | 'dial:prep'
  | 'dial:oven'
  | 'dial:counter'
  | 'ovens:all'
  | 'hud:cash'
  | 'hud:goal'
  | 'walk:prep'
  | 'walk:ovens'
  | 'walk:counter'
  | 'walk:drivers'
  | 'walk:all'
  | 'drawer:hire:prep';

/** A screen rect in points: x0,y0 the top-left corner, x1,y1 the bottom-right. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** What a ref gives us: any native node that can say where it is on the screen. */
export interface Measurable {
  measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
}

const rects = new Map<string, Rect>();
const listeners = new Map<string, Set<() => void>>();
const nodes = new Map<string, Measurable>();

// half a point: finer jitter (a scroll settling, sub-pixel layout) never wakes a subscriber
const snap = (v: number) => Math.round(v * 2) / 2;

const same = (a: Rect, b: Rect) => a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1;

function notify(id: string) {
  listeners.get(id)?.forEach((fn) => fn());
}

/** Report where a target is (screen points), or `null` when it is gone. Subscribers hear of it only when the rect really changed. */
export function registerTarget(id: CoachTargetId, rect: Rect | null): void {
  const next = rect && { x0: snap(rect.x0), y0: snap(rect.y0), x1: snap(rect.x1), y1: snap(rect.y1) };
  const prev = rects.get(id);
  if (!next) {
    if (prev) {
      rects.delete(id);
      notify(id);
    }
    return;
  }
  if (prev && same(prev, next)) return;
  rects.set(id, next);
  notify(id);
}

/** Where a target is now, or null when nothing has registered it. The object is replaced only when the rect changes. */
export const targetRect = (id: CoachTargetId): Rect | null => rects.get(id) ?? null;

/** Listen to some targets; returns the unsubscribe. */
export function subscribeTargets(ids: readonly CoachTargetId[], fn: () => void): () => void {
  for (const id of ids) {
    let set = listeners.get(id);
    if (!set) listeners.set(id, (set = new Set()));
    set.add(fn);
  }
  return () => {
    for (const id of ids) listeners.get(id)?.delete(fn);
  };
}

/** Drop everything (tests, and a franchise's fresh screen). */
export function resetTargets(): void {
  rects.clear();
  nodes.clear();
  listeners.clear();
}

function measure(id: CoachTargetId, node: Measurable) {
  node.measureInWindow?.((x, y, w, h) => {
    // a node that has been replaced since the call went out must not write its stale answer
    if (nodes.get(id) !== node) return;
    registerTarget(id, w > 0 && h > 0 ? { x0: x, y0: y, x1: x + w, y1: y + h } : null);
  });
}

/** Measure the named targets again (after a scroll ends or a layout settles). With no ids: every registered one. */
export function remeasureTargets(ids?: readonly CoachTargetId[]): void {
  const list = ids ?? ([...nodes.keys()] as CoachTargetId[]);
  for (const id of list) {
    const node = nodes.get(id);
    if (node) measure(id, node);
  }
}

/** A ref callback that also carries the `onLayout` that re-measures: `<View ref={t} onLayout={t.onLayout}>`. */
export type CoachTargetRef = ((node: Measurable | null) => void) & { onLayout: () => void };

/** The ref of one target; exported for tests (the hook is `useCoachTarget`). */
export function makeTargetRef(id: CoachTargetId): CoachTargetRef {
  let mine: Measurable | null = null;
  const ref = ((node: Measurable | null) => {
    if (node) {
      mine = node;
      nodes.set(id, node);
      measure(id, node);
    } else {
      // unmounted: leave only if the registry still holds this node (a newer one may already have taken the id)
      if (mine && nodes.get(id) === mine) {
        nodes.delete(id);
        registerTarget(id, null);
      }
      mine = null;
    }
  }) as CoachTargetRef;
  ref.onLayout = () => {
    if (mine) measure(id, mine);
  };
  return ref;
}

/** Name this view a target: it measures itself when it mounts and on `onLayout`, and unregisters when it unmounts. */
export function useCoachTarget(id: CoachTargetId): CoachTargetRef {
  return useMemo(() => makeTargetRef(id), [id]);
}

/** One string for a set of targets: '' for none, '?' while any is missing, else every rect. A string compares by value, so a subscriber wakes only for a real change. */
export function rectsKey(ids: readonly CoachTargetId[]): string {
  const parts: string[] = [];
  for (const id of ids) {
    const r = rects.get(id);
    if (!r) return '?';
    parts.push(`${r.x0},${r.y0},${r.x1},${r.y1}`);
  }
  return parts.join(';');
}

/** The rects `rectsKey` stands for: null while any is missing. */
export function parseRectsKey(key: string): Rect[] | null {
  if (key === '?') return null;
  if (key === '') return [];
  return key.split(';').map((p) => {
    const [x0, y0, x1, y1] = p.split(',').map(Number);
    return { x0, y0, x1, y1 };
  });
}

/** Several targets' rects, in the order asked; null while any is missing. */
export function useTargetRects(ids: readonly CoachTargetId[]): Rect[] | null {
  const idKey = ids.join(',');
  const subscribe = useCallback((fn: () => void) => subscribeTargets(idKey ? (idKey.split(',') as CoachTargetId[]) : [], fn), [idKey]);
  const get = useCallback(() => rectsKey(idKey ? (idKey.split(',') as CoachTargetId[]) : []), [idKey]);
  const key = useSyncExternalStore(subscribe, get, get);
  return useMemo(() => parseRectsKey(key), [key]);
}
