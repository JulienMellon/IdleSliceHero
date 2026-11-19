# Card X2 — money and time (v5.19-test, lane E)

**Goal:** in the test build Julien can buy anything (free buys, on by default), top up or empty cash and diamonds, make store purchases succeed, and move the game clock forward through the real return path; in the normal build every one of these is a no-op that the bundle doesn't contain.

**Read first:** `docs/API.md`; `docs/PLAN-test-mode.md` section 2 ("Money" and "Time"); `docs/build/v5.19-test/VERSION.md` ("What the code says", "Defaults"); `src/dev/README.md` (card X1).

## Files
- Own: `src/engine/clock.ts`, `src/dev/money.ts` and `src/dev/time.ts` (new: the section bodies), `src/dev/__tests__/money.test.ts`, `src/dev/__tests__/time.test.ts` (new).
- Own, the lines named only: `src/engine/game.ts` (`canAfford` at 977, `pay` at 980, the new `canAffordDiamonds`/`payDiamonds` beside them, a `dt` multiplier at the top of `playTick` at 1194); `src/engine/night-oven.ts:95`; `src/engine/rewards.ts:501` and the spend at 506; `src/engine/vanity.ts:30-31`; `src/components/sidewalk-row.tsx:207`; `src/components/rewards-ui.tsx:628`; `src/components/endgame/shop-model.ts:57`; `src/components/sidewalk-model.ts` (the two `needText` calls, 194 and 334); `src/services/purchases.web.ts` (the answer it gives, for the toggle).
- Shared, append-only: `src/dev/panel-sections.ts` (two lines: Money, Time), `src/store/game-store.ts` (test-mode actions in a block marked `X2`), `scripts/fixtures/test-mode/x2_money_time.py`.
- Do not touch: `rewards.ts:311` (its `pay` **gives** cash), `game-store.ts:355,365` (claim undo), `src/engine/clock.ts` callers, `storefront.tsx` (C155 is already fixed), anything X3 or X4 own.

## Steps
- [ ] **1. Free buys.** Module flag in `game.ts` with `setFreeBuys(on)` that does nothing unless the test-mode condition holds (`process.env.EXPO_PUBLIC_TEST_MODE === '1' && Platform.OS === 'web'`, VERSION.md Defaults). With it on, `canAfford` returns true for any non-null cost and `pay` returns `ok` with cash unchanged. A null cost (maxed, locked) stays unaffordable. Locks (`upgradeLock`, story locks) still apply. `totalEarned` and `stats` are never touched. Default ON in the test build, saved in the test prefs.
- [ ] **2. The bypasses.** `sidewalk-row.tsx:207` and `night-oven.ts:95` go through `canAfford`. Pure refactor in the normal build: no shot may change.
- [ ] **3. Diamonds.** `canAffordDiamonds(s, n)` / `payDiamonds(s, n)` next to `canAfford`/`pay`, reading `s.rewards.diamonds`, with the same free-buy branch. Route the four checks through them: `rewards.ts:501` (and its spend at 506), `vanity.ts:30-31`, `rewards-ui.tsx:628`, `endgame/shop-model.ts:57`.
- [ ] **4. Need-text.** While free buys are on, `sidewalk-model.ts` returns `need: null` (both sites). The goal bar is unchanged.
- [ ] **5. Money rows** (`src/dev/money.ts`): Free buys toggle; `+10 min income` and `+1 h income` (current $/s × seconds, added to `cash` and `totalEarned` like earned money); `Cash → $0`; `Diamonds +100`; `Store purchases succeed` toggle (sets the web stub's answer in memory, because the artifact host strips `?buy=`).
- [ ] **6. The clock.** `clock.ts`: `setGameClockOffset(ms)` (forward only; ignored outside the test build) and `gameNow() = Date.now() + offset`. The offset is 0 and the setter a no-op in the normal build. Saved in the test prefs, restored before the save loads.
- [ ] **7. Away for** 15 min · 1 h · 8 h · 1 day · 3 days: save, add to the offset, then run the store's real return path (the `loadSave` route at `game-store.ts:318`: `migrate` → `applyOffline` (`game.ts:1330`) → `refreshRewards` (`rewards.ts:250`) → the return story beat). The offline popup, the 2× offer, the offline cap, boost expiry, the daily gift and the streak must all come from that path, not from a copy of it.
- [ ] **8. Next day** (00:01 local tomorrow) and **Next Monday** (00:01 local): the offset that lands there, then the same return path.
- [ ] **9. Play forward** 1 min · 10 min · 1 h: the normal foreground tick (`playTick` + bonus + orders, as the store's `tick` runs it) in 1-second steps without rendering, in chunks (e.g. 60 steps per frame) so the UI stays responsive; it also moves the offset by the same amount so wall time and play time agree.
- [ ] **10. Speed** 1× · 4× · 16×: multiplies `dt` in the store's `tick` before `playTick`. Saved in the test prefs.
- [ ] **11. Readout** `Test clock +1 d 8 h` in the Time section. No row moves the clock back (`rewards.clockBehind` treats that as a rollback).

## Tests that must exist
Free buys: on → every `canAfford` with a cost is true, `pay` leaves cash, null cost still false, a lock still refuses; off → identical to before (the existing A36 tests pass untouched). Diamonds: the same four cases. Normal build (env unset): `setFreeBuys(true)` and `setGameClockOffset(1e9)` change nothing. Away for 8 h gives the same `OfflineResult` as a save stamped 8 h ago loaded normally. Next day claims a new daily gift and advances the streak; Next Monday resets weekly tasks. Play forward 10 min equals 600 calls of the store tick. Need-text is null with free buys on.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/dev src/store src/components`; the normal export's `grep -rl "TEST MODE PANEL" dist/` prints nothing.

## Fixtures
`scripts/fixtures/test-mode/x2_money_time.py` (new): free buys on with $0 showing an affordable row and no need-text; Away for 8 h showing the offline popup; Next day showing the daily gift; the Time section with the readout. Run it as card X1 says (`SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode … --only x2_money_time`). Also run the normal `npx expo export --platform web` and `python3 scripts/screenshots.py dev --only 05_midgame` to see the refactor in step 2 changed nothing.

## Report
Standard format, plus: the line of every call you routed through `canAfford`/`canAffordDiamonds`.
