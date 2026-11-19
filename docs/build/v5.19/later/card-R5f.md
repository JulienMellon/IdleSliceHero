# Card R5f: one flag store, one bus (v5.19, lane U; this card's Files override OWNERS)

**Goal:** replace the four hand-written `useSyncExternalStore` flag stores and the four listener-set buses with two small helpers. Behaviour and exported names stay the same.

## Files
- Own: new `src/lib/flag-store.ts` and `src/lib/bus.ts`, with tests in `src/lib/__tests__/`. The internals of `src/components/report/sheet-state.ts`, `components/layers/sheet-state.ts`, `components/endgame/banner-state.ts`, `components/<menu>/sheet-state.ts` (`createSheetState`, after R1L's rename) and its three users, `components/pulse-bus.ts`, `components/endgame/reveal-bus.ts`, `components/<shifts>/jam-bus.ts`, and `src/audio/bus.ts` (internals only; lane A is informed).
- Do not touch: `src/services/grant-bus.ts`, which buffers and has one listener, on purpose.

## Steps
- [ ] **1.** `createFlag<T>(initial: T)` returns `{ get, set, subscribe, useValue }`. `set` is a no-op when `Object.is(old, next)`. `useValue` wraps `useSyncExternalStore` (the server snapshot is `initial`).
- [ ] **2.** `createBus<T = void>()` returns `{ on(fn): () => void, emit(v: T), size(): number }`. `reveal-bus`'s "false when nobody listens" uses `size()`.
- [ ] **3.** Re-implement each file on the helpers. **Keep every exported name and signature**, including the named `use…` hooks: React Compiler needs a function named `use…`, not a `.useValue` method on an object.
- [ ] **4.** Delete `createSheetState` once its three users are on `createFlag`, or keep it as a 3-line wrapper if that reads better.

## Tests that must exist
- Flag: set, subscribe and unsubscribe; no notify on the same value.
- Bus: on and emit, unsubscribe during emit, `size`.
- The existing `pulse-bus` and `reveal-bus` tests pass unchanged.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/lib src/components src/audio`.
