import type { KV } from './types';

export const OPT_OUT_KEY = 'se.analytics.optout';

type Listener = (optedOut: boolean) => void;

/** One synchronous answer to "may we send anything?", shared by analytics and crash reporting. */
export function createPrivacy(kv: KV) {
  let optedOut = false;
  const listeners = new Set<Listener>();
  return {
    async load(): Promise<boolean> {
      optedOut = (await kv.get(OPT_OUT_KEY)) === '1';
      return optedOut;
    },
    isOptedOut: () => optedOut,
    set(v: boolean): void {
      if (v === optedOut) return;
      optedOut = v;
      void kv.set(OPT_OUT_KEY, v ? '1' : '0');
      listeners.forEach((l) => l(v));
    },
    subscribe(l: Listener): () => void {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
  };
}
export type Privacy = ReturnType<typeof createPrivacy>;
