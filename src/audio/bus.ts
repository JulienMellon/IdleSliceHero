// Audio event bus: the store and components say *what happened*; the director decides what it sounds like.
// Pure TS (no expo-audio) so the store stays testable in Node.
import type { NeighborhoodId } from '../content/types';
import type { Purchase, StingKind } from './logic';

export type AudioEvent =
  | { type: 'tap' }
  | { type: 'full' }
  | { type: 'rush' }
  | { type: 'cash' }
  | { type: 'buy'; what: Purchase; sting: StingKind | null; vehicle?: number; hood?: NeighborhoodId }
  | { type: 'refused' }
  | { type: 'click' }
  | { type: 'bubble' }
  | { type: 'perk' }
  | { type: 'offline-open' }
  | { type: 'collect'; size: 0 | 1 | 2 }
  | { type: 'scene-panel'; sceneId: string; panel: number }
  | { type: 'scene-skip' };

type Listener = (e: AudioEvent) => void;
const listeners = new Set<Listener>();

export function emitAudio(e: AudioEvent) {
  for (const l of listeners) {
    try {
      l(e);
    } catch {
      // audio must never break gameplay
    }
  }
}

export function onAudio(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
