import type { KV } from './types';

export function memoryKV(seed: Record<string, string> = {}): KV & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(seed));
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => void m.set(k, v),
    dump: () => Object.fromEntries(m),
  };
}

/** localStorage when the browser has it, else memory. */
export function webKV(): KV {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  if (!ls) return memoryKV();
  return {
    get: async (k) => {
      try { return ls.getItem(k); } catch { return null; }
    },
    set: async (k, v) => {
      try { ls.setItem(k, v); } catch { /* private mode: keep going */ }
    },
  };
}
