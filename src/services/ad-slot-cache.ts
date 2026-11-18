// T103: the one-ad cache behind the native rewarded ads, with the SDK injected so retry, reset and staleness are tested in node.
// Holds at most one loaded ad. `preload` asks for the next one (no sooner than the retry floor after a try); `take` spends it.

export interface SlotCachePorts<S> {
  /** Initialise the SDK. Rejects on failure; the caller's wrapper forgets a failed init so the next call tries again. */
  init(): Promise<void>;
  /** Load one ad; null when none came. Never rejects in practice (a rejection counts as none). */
  load(): Promise<S | null>;
  now(): number;
  /** A loaded ad goes stale after this long (ms). */
  staleMs: number;
  /** After a failed or unfilled load, ask again no sooner than this (ms). */
  retryFloorMs: number;
}

export function createSlotCache<S>(p: SlotCachePorts<S>) {
  let cached: { slot: S; at: number } | null = null;
  let loading: Promise<void> | null = null;
  let lastTry = 0;
  const fresh = (): boolean => !!cached && p.now() - cached.at < p.staleMs;
  const safeLoad = (): Promise<S | null> => p.load().catch(() => null);
  return {
    /** An unexpired ad is waiting. */
    fresh,
    /** Start loading the next ad unless one is waiting or loading, or the last try was inside the retry floor. */
    preload(): void {
      if (fresh() || loading) return;
      if (p.now() - lastTry < p.retryFloorMs) return;
      lastTry = p.now();
      loading = p
        .init()
        .then(safeLoad)
        .then((s) => void (cached = s ? { slot: s, at: p.now() } : null))
        .catch(() => {})
        .finally(() => void (loading = null));
    },
    /** Spend the waiting ad (loading one now if it is missing or stale). A shown ad is spent: the next may load at once; a failed one waits out the floor. */
    async take(): Promise<S | null> {
      await p.init();
      if (loading) await loading;
      const slot = fresh() ? cached!.slot : await safeLoad();
      cached = null;
      lastTry = slot ? 0 : p.now();
      return slot;
    },
  };
}
