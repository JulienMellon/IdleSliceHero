# Plan — retention loop, v5.14 → v5.15

Owner: Julien. Started 2026-11-11 ("make this game fun, addictive, and have a pace that brings players back over and over"). Loop rules: `HANDOFF.md`. Review state: `CRITICLOG.md` (round 61), `CODELOG.md` (round 24).

## Where it stands
- **Done and on `main`:** v5.12 (economy ≈ 5 days), v5.13 (golden pizza, special orders, economy refit, round-60 fixes).
- **v5.14 has NOT started.** The three cards below were sent on 2026-11-11 but every programmer hit the usage limit before writing anything. The working tree was clean at `fbc481a`. Launch the three cards as written: the files are disjoint, but the shared files are noted on each card.
- **Codecritic:** it skips v5.13 and v5.14 under the skip rule. **v5.15 reviews `5d82004..HEAD`.**
- **Report to Julien:** verdicts, bugs and majors only (his request, 2026-11-11).

## v5.14 cards

### Card C3 — fix round on the golden pizza and special orders (programmer)
Bar: award-winning games ("Monopoly GO! pays every completed task with a coin shower; Balatro makes the rare card visibly different and escalates the number").
- **G93 bug (47c):** the lucky pop is cut off. "LUCKY SLICE ×4!" is sliced by the tab strip and "+$22.2K" loses its "+" at the left edge. `floating-bonus.tsx` sets `left: pop.x - 90, top: pop.y - 24` with a 46 pt rise and no clamp.
  - Fix: clamp left to [8, width − 188], and drop the pop below the box in the top lane. Put the clamp in a pure function and test it.
- **G94 bug (05c):** the refused-tap toast "Ovens: need $20K" carries onto the City screen over "$190/sec".
  - Fix: clear the toast on screen change, or anchor it to the shop scene.
- **D436 major (50):** on order success the 260 ms glow washes out the portrait and "+$37K · Coach Dale". There is no coin burst and the shop doesn't react.
  - Fix: put the glow behind the content or on the border only; "+$37K" at 20 pt in #2E7D32; 5 `emitCoin` plus `emitPayout` from the chip; portrait bounce 1 → 1.15.
- **D437 major (47, 47b):** the golden pizza is a 30 pt pale box on a pale sky, and the lucky one barely differs.
  - Fix for every pizza: 1.3× scale, #F6C343 → #FFB300 gradient, a 10 pt radial glow and 3 trailing sparkles.
  - Lucky one: 1.6× scale, rotating rays and a "LUCKY" tag.
  - Keep the tap target ≥ 44 pt and the motion native-driven.
- **D441 major (48):** the offer chip shows no reward and no expiry. `chipView.reward` already exists.
  - Fix: "+$37K" in basil green under Accept, and a draining bar on the chip's bottom edge.
- **D444 major (47c):** the lucky slice pays with 3 coins and a clipped label.
  - Fix: a full-width "LUCKY SLICE ×4!" banner at scene centre for 1.2 s, 10 coins and a cash-counter kick. The cooks' cheer is card B3's.
- **D438 minor:** the streak pips are 6 pt dots. Fix: 8 pt slice icons plus a "4/5" label.
- **D442 minor (49):** the active chip doesn't say how to win. Fix: "tap to rush!" under the bar when behind pace.
- **D443 minor:** Marisol's "Well done, Captain" uses her own title. Fix: "Well done, sailor."
- **D445 minor:** neither hook appears in the first 60 s. Fix: send one scripted golden pizza right after downtown-4 (first time only), with "A gift, caro. Tap it!" if the coach card can show it cheaply.
- **D446 minor:** a normal pizza's payout isn't exciting. Fix: add a "+45 s of sales" second line on the pop.
- **D422 note:** fixture 49 shows "20 / 40 pies" with counters 5/0/0. Make fixtures 47–50 plausible.
- **Files:**
  - Own: `floating-bonus.tsx`, `order-chip.tsx`, `order-model.ts`, `engine/bonus.ts`, `engine/orders.ts`, `content/hooks.ts`, their tests, and fixtures 47–50 in `scripts/screenshots.py`.
  - Shared, small edits only: `store/game-store.ts`, `app/index.tsx`, `app/city.tsx`.
- **Checks:** `npx tsc --noEmit`; `npx jest src/engine src/content src/components/__tests__`; `python3 -m py_compile scripts/screenshots.py`.

### Card B3 — scene minors (programmer)
- **D439 (14, 34, 35, 41):** the "+$" pop stacks on the waiting pill, making a 45 pt band across faces.
  - Fix: move the pill to the sill under the counter, or fade it while a pop is up. Add a budget test: pill and pop never cover a face.
- **D440 (42):** the milestone badge hides two station chips and the awning corner, and Marco's bubble pokes through the left wall at x 22.
  - Fix: move the badge 20 pt down-right, clamp the bubble inside the wall, and test it.
- **D430 (40, 41, 43, 46):** queue drivers overlap about 30% with feet on the sill, and five diners clump over the table.
  - Fix: drivers ≤ 15% overlap (3 maximum plus a "×N" pill), feet inside the floor edge. Queued diners never overlap a table or a seated diner (cap the queue plus "+N").
  - Add budgets that fail on today's code.
- **D428 (45, 46):** no deck, step or rail is visible at the Corner shop (footprint 1).
  - Fix: show the deck at footprint 1, or move fixtures 45/46 to footprint 2.
- **D432 (47, 07, 41):** the fence still reads as an orphan segment.
  - Fix: remove it where there's no yard. In Suburbs, add a lawn strip and a shrub so it reads as a front yard.
- **For D444:** a `cheer` pulse (`pulse-bus.ts`) that makes the cooks raise both arms for about 1.2 s, on primitive props. Skip it if it costs more than about 40 lines, and report the pulse name.
- **Rules:** fix overlaps in pure modules with budgets, run the whole crowd suite, and keep the WELCOME mat.
- **Files:** `src/components/scene/**`, `storefront.tsx`, `pulse-bus.ts`, their tests, and fixtures 45/46.
- **Checks:** `npx tsc --noEmit`; `npx jest src/components`.

### Card R3 — return hooks (programmer)
Critic D424 [major]: the session end shows no timer, filling bar or chest, and the cap is invisible ("Monopoly GO! always shows the next reward's countdown"). D425 [major]: the return popup is a receipt, not a gift ("AFK Journey makes the player open a visibly full chest that bursts on tap"), and it still says "Capped at 4h 0m".

1. **Nonna's night oven** (the away meter and cap upgrades).
   - **Tiers:** base 4 h (`TUNING.offlineCapSeconds`), then 8 h and 12 h, each bought once, city-wide, as a drawer card ("Night oven: holds 8 h").
   - **Unlocks:** tier 2 when Waterfront is built, tier 3 when Industrial is built.
   - **Price:** 20 min / 60 min of citywide income, using the boost-free income function the rewards use.
   - **Save:** persist the tier with a safe `migrate` default; old saves must load. The offline tick uses the owned cap.
   - **HUD chip** ("🌙 4 h") opens an info sheet: "While you're away, Nonna's night oven keeps baking for up to 4 h. Come back before it's full!", plus the tiers and the next one's price or lock reason.
   - **Code:** pure `src/engine/night-oven.ts` with tests; constants in `content/hooks.ts` (NIGHT_OVEN).
2. **Welcome-back gift**, replacing the `OfflinePopup` receipt in `game-ui.tsx`. Keep testID `collect-offline` on the button, because the screenshot script taps it.
   - **Before opening:** "Welcome back!", a big SVG oven, its door shut and glowing in proportion to fill, and a fill meter ("3 h 12 m of 4 h").
   - **When full:** "The night oven was full — it holds 4 h", plus "Upgrade it to hold 8 h" if a bigger tier exists. Never the word "Capped".
   - **"Open the oven" button:** the door swings open, the total counts up over about 0.8 s, and a coin burst plays (`emitCoin`, as in `floating-bonus.tsx`). Then the per-shop rows fade in, and the popup closes on a second tap or after 1.5 s.
   - **News line**, from a pure function: e.g. "Suburbs sold 12,400 pies while you were out", or "Waterfront waited for you: hire a manager and it bakes while you're away".
   - **Code:** pure `offlineGiftView(summary, nightOven)` in `components/offline-model.ts` with tests.
3. **Next-scene teaser.**
   - **Where:** a progress ring on the HUD scrapbook button (`open-scrapbook`), and one line in the `app/scrapbook.tsx` header.
   - **Text:** e.g. "Next: Dale's story continues after 1,200 more Suburbs pies", "…when you build Waterfront", "…when you bid on Pier 9". With nothing left: "The story is complete (for now)". Name the character and the condition only, never the scene's content.
   - **Code:** pure `nextSceneTeaser(state)` with a test per trigger kind.
- **Performance:** primitive props, progress quantised to 5% steps, no re-render on every tick.
- **Fixtures to append:** 51 (chip plus info sheet), 52 (gift before opening, about 80% full), 53 (mid count-up), 54 (full oven with the upgrade line), 55 (scrapbook teaser). Don't call `settle()` for 52–54, because it taps `collect-offline`.
- **Files:**
  - Own: `night-oven.ts`, `offline-model.ts`, tests; `engine/game.ts` (cap lookup, save field, migrate, summary only); `cutscene-input.ts`; `game-ui.tsx`; `app/scrapbook.tsx`.
  - Shared: `app/index.tsx`, `store/game-store.ts`, `content/hooks.ts` (append only), `scripts/screenshots.py` (append 51–55).
- **Checks:** as card C3.

## Verify and review (orchestrator)
1. Bump `APP_VERSION` to 5.14. Run `npx tsc --noEmit`, `npm test` and `npx expo export --platform web`.
2. Take screenshots **detached**: `nohup python3 -u scripts/screenshots.py v5.14 > /tmp/shots.log 2>&1 &`, then wait about 7 min. Check `report.json` for `loaded: true` and `errors: []`.
3. Run `python3 scripts/review_shots.py v5.14 v5.13`. Commit, push, then run the **critic only** (the codecritic is skipped).

## v5.15 — endgame (not yet carded)
- **Shop mastery stars:** three per shop (all heads, Flagship, Golden ovens). The stars unlock the cosmetics REWARDS already plans.
- **Victor's weekly counter-attack:** MegaSlice targets one shop each week; defend it with a rush challenge.
- **A post-story goal bar:** "Coming soon: Boston", and mastery progress. This closes D427.
- Plus round-62 notes. **The codecritic runs** on `5d82004..HEAD`; open from round 24: C106 (an economy marker for pre-retune saves before TestFlight), A22/M50 and A17/M32 (mediums).

## Open economy decision (Julien)
- **The trade-off:** v5.13 keeps order values about ×25–80 per shop. The cost is a "tap spree" of about 90–300 cheap levels right after each build, and a few sessions with no purchase before a build.
- **The alternative:** a strict proportional fit (`K=600 RHO=0.45 MCR=0.02 npx tsx scripts/pacing-fit.ts fit3`) removes the spree, but needs about ×6,000 per shop (Uptown about $1.6e16 a pie), so older shops stop mattering. Julien has been told; no answer yet.
