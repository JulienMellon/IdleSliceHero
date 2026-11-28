# Card E9 — layer gates, free gifts, offline boosts (v5.25, lane E)

**Goal:**
- **Layers (closes D493):** session 1 is the shop and its first goals. The other layers each get their own first session: boats at Downtown ★★, Game Day at the Suburbs unlock, the cameo at Suburbs ★, the rival at Suburbs ★★.
- **Free gift:** a free gift waits in the shop about 2 minutes in, then every 4 hours.
- **Offline:** offline earnings honour every paid boost for the time it still covers.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md`; `src/engine/features/layers/{rival,game-day,boats}.ts`; `src/engine/story.ts` (~88-97); `src/content/layers.ts` (`RIVAL`, Game Day and boat timers); `src/components/scene/cameo.ts` (read only) and `src/content/rewards.ts` (~178-183, the day-30 visit); `src/engine/game.ts` (`applyOffline` ~1340-1445); `src/engine/offers.ts` (`offlineBoost`, `offlineFactor`); `src/engine/paid-boost.ts`; `src/engine/rewards.ts` (~457, gifts ~464-530).

## Files
- Own:
  - layers: `src/engine/features/layers/{rival,game-day,boats}.ts`, `src/content/layers.ts`, `src/engine/story.ts` (rival offer wait only);
  - cameo: the cameo's trigger in `src/content/rewards.ts` (trigger only, not the calendar);
  - gift: a new `src/engine/features/free-gift.ts` and `src/content/free-gift.ts`, plus `src/engine/features/index.ts` (append one line);
  - offline: `src/engine/game.ts` (`applyOffline` and the gift save field only), `src/engine/offers.ts`, `src/engine/paid-boost.ts`;
  - `scripts/pacing-fit.ts` (session layer assertions only);
  - their tests.
- Tests to check: `grep -rln "rival\|gameDay\|boats\|applyOffline\|offlineBoost" src/engine/__tests__ scripts/fixtures`.
- Do not touch: `src/components/**` (S7 draws the gift; U7 the moment); copy (W6, T3).

## Steps
- [ ] **1. Gates (D493).**
  - **Rival:** opens at Suburbs ★★, not at Downtown beat 3.
  - **Game Day:** at the Suburbs unlock, as today, but its first event waits for a full timer gap after the unlock.
  - **Boats:** need Downtown ★★ and, if boats can only run in a built Waterfront shop, Waterfront built as well (whichever comes later).
  - **Cameo:** at Suburbs ★ (keep the day-30 visit too if it is a separate thing; say which in the report).

  New `pacing-fit session1` assertion: no two of {rival, Game Day, boats, cameo} first appear within the same 40-minute session of the sim player, and none appears in the first session.
- [x] **2. Free gift engine.**
  - **Save:** `freeGift: { nextAt: number; count: number; ready: boolean }`.
  - **Timing:** the first gift is ready at 120 s of active play, then every 4 h of real (wall) time. It counts while offline, but never more than 1 waits.
  - **Contents:** `claimFreeGift(g, now)` gives cash worth 5 min of the shop's income at claim time (whole dollars), and every 3rd claim also gives 10 💎.
  - **Event:** emits `free_gift_claimed { cash, diamonds }` for the scene, the UI and the audio.
  - **Selector:** `freeGiftReady(g, now)`.
  - Defaults go in `src/content/free-gift.ts`.
- [x] **3. Offline with paid boosts.** List every kind of paid boost: timed boosts in `rewards.boosts`, diamond boosters (`paid-boost.ts`), the GM boost, the Starter Pack boost (N3 grants it as a timed boost) and any other. Then write a test per kind: active for 10 min of a 60-min absence, offline pays boosted for 10 min, then base for 50. Fix the kinds that fail. Timed boosts already pass (game.ts ~1416).
- [x] **4. Tests.** Gates, gift timing (first at 120 s, then 4 h, never stacking), gift contents, offline per boost kind, the save round trip.

## Checks
- `npx tsc --noEmit`
- `npx jest`
- `npx tsx scripts/pacing-fit.ts session1`
- `npx tsx scripts/pacing-sim.ts`
- `npm run format:check`
- `npx tsx scripts/api-digest.ts`

## Report
Standard format, plus the sim minute where each layer first appears, the boost kinds that failed before the fix, and the gift's new events and selectors.
