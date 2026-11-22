# Card E3 — the report's data and the shop's symptoms (v5.22, lane E)

**Goal:** the report has what the new screen and scene need, from a shop's first head hire: what each station (and the drivers) can handle a minute, what customers want, what was served and missed, and a symptom state per station that the scene, the barks and the sound read. Nothing in the data ranks stations or names "the" limit.

**Read first:** `docs/build/v5.22/VERSION.md` (Defaults: symptom states, bark frequency); `docs/API.md`; `src/engine/features/service.ts` (`reportActive`, `ReportView`, `flowOf`); `src/content/service.ts`; `src/engine/features/heads.ts` and `src/content/heads.ts` (`BarkTrigger`); `src/engine/chapters.ts` (v5.21's missed-orders reader).

## Files
- Own: `src/engine/features/service.ts`, `src/content/service.ts` (numbers only), `src/engine/features/heads.ts`, `src/content/heads.ts`, `src/engine/chapters.ts` (switch `noMissed` to the new reader), `src/store/game-store.ts` (the `reportOpened` action only), tests under `src/engine/**/__tests__/`.
- Do not touch: `src/components/**`, `src/app/**`.

## Steps
- [x] **1. Live from the first head.** `reportActive(g, id)` = the shop is built and has at least one head or a manager. Drop the `bonusUnlocked` condition for the view. The service score's money effects (the tip and cold multipliers in `effectOf`) still start at the takeover, as today, so pacing doesn't move. A station the player still taps by hand is `you: true` in the view; its capacity is what the player has managed over the last 60 s.
- [x] **2. The view.** `ReportView` gains `capacity: { prep; ovens; counter; drivers }` (pizzas a minute each can handle now), `wanted`, `served`, `missed` (per minute, rolling 60 s) and `symptoms: Record<'prep'|'ovens'|'counter'|'drivers'|'floor', Symptom | null>` with `Symptom = 'piling' | 'idle' | 'line' | 'walkout'` by the Defaults. Add `capacityAfter(g, id, what)`: the station's capacity after one more level (U4's cards). Remove `worst` and `lamps` from the view (keep `service`, `state`, the tipping and cold effects); remove `kitchenLimits` if nothing outside the engine still reads it after U3 and U4 (send `Needs:` to them otherwise).
- [x] **3. Bark triggers.** `BarkTrigger` gains `pile`, `idle`, `line`, `drivers-idle`; `slammed` is replaced by `pile`. The scheduler fires a symptom bark by the Defaults' frequency, from the station's head (stations) or the manager (`line`, `drivers-idle`). Copy keys `bark.<shop>.<station>.<trigger>` and `manager.<shop>.<trigger>` (W3 writes them; a missing key is silent).
- [x] **4. Chapter hook.** `noMissed` reads `missed`. Add `reportOpened` to the save (set by an action U3 calls when the sheet opens), read by the chapter task `report`.
- [x] **5. Tests.** A shop with ovens far short shows `piling` at prep, `idle` at counter, a capacity table whose smallest kitchen entry is ovens; a shop with no heads is inactive; one head makes it live; barks respect the frequency.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`; `npx tsx scripts/api-digest.ts`; `npx tsx scripts/pacing-sim.ts | tail -12` (unchanged).

## Report
Standard format, plus the readers outside the engine that used `worst`, `lamps` or `kitchenLimits` (for U3, U4, S3).

## Round r2 (E)
- [x] **6. Drivers short shows a symptom.** Bags backing up at the counter with no idle driver count as the counter's `piling` even when the kitchen could make more (service.ts `senseShop`); test in service.test.ts.
- [x] **7. D556 once-flag.** `ChapterSave.missedZero`, `markMissedZeroShown`, store action `missedZeroShown`; tests in chapters.test.ts.
