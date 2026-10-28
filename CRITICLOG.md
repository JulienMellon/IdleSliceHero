# Critic Log

Each loop: the **critic** reviews the build's iPhone-size screenshots against App Store screenshots of popular iOS idle games, then the build team ships a new version addressing every note. The loop ends when the critic is satisfied (a build that fails to load or has a blocking bug can never pass).

- Screenshots: `screenshots/<version>/` (regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`)
- Reference set (local only, not committed): Idle Miner Tycoon, AdVenture Capitalist, Eatventure, Pizza Ready!, Idle Lumber Empire, Idle Bank Tycoon, Idle Pizza Restaurant Tycoon
- Critic definition: `.claude/agents/critic.md`

---

## v0.1 — build (2026-10-28)

First playable, matching the design doc's v0.1 scope with placeholder art.

- Expo SDK 58 (pinned 58.0.20), TypeScript, Expo Router, Zustand, AsyncStorage, react-native-svg, Fredoka font
- Engine (`src/engine/game.ts`): bake → shelf → drivers rotate through unlocked neighborhoods → cash; 18 unit tests
- 3 upgrades (oven speed, drivers, vehicle tiers bike → drone), 6 neighborhoods, ×2 milestones at 25/50/100
- Offline earnings, 4-hour cap, "While you were away" popup; saves on purchase, every 30s, and on background
- Cut-scene player (auto-advance, tap, skip, reward card) + Scrapbook replay; all 24 home-city scenes written
- Placeholder art: SVG character portraits (8 characters × 5 moods), 8 scene backdrops, SVG city map with animated drivers

**Decisions made (proposed; change any of them):**
- Home city: fictional **Port Marinara**
- Before managers exist, the oven needs a tap per batch until Nonna's recipe scene (Downtown beat 4, ~2 min in); then it bakes automatically, which is what makes idle/offline earnings work in v0.1
- Starting numbers in `src/content/tuning.ts`, checked with `scripts/pacing-sim.ts`: a greedy player finishes the city in ~8 hours of active play (first 8 scenes in ~10 minutes)
- Scene triggers: beat 1 on unlock, beats 2–4 on pizzas delivered to that neighborhood

## v0.1 — critique (round 1)

**VERDICT: NOT SATISFIED** — loads with no errors and the core loop works end to end; the map crops labels, cut-scene backdrops lose most of their art, and the first minute points the player the wrong way.

**Blockers:** none

**Bugs**
- G1 City map uses `slice`, cropping Uptown under the HUD and Waterfront's label under the sheet
- G2 Shop roof cuts through the "Downtown" label; parked scooters sit on it
- G3 Cut-scene backdrops are 2:1 art in a near-square frame — only the middle ~53% shows
- G4 HUD says "keep tapping!" while drivers are the bottleneck and the shelf is full
- G5 "Not enough cash" toast covers the Drivers row
- G6 HUD bleeds through the 0.94-opacity cut-scene overlay; cash collides with scene titles
- G7 Offline cash is already in the HUD before Collect is pressed; Collect does nothing
- G8 Costs show trailing ".0" ("$60.0K")

**Design notes**
- D1 No payoff in the first minute — every button stays gray for 20s+; make the first purchase land in ~10s
- D2 No always-visible next-goal progress bar (vs Idle Pizza Restaurant Tycoon, Idle Bank Tycoon)
- D3 Vehicle row is below the fold in every shot; oven card too tall
- D4 Too little feedback: tiny overlapping "+$" pops; no cash flash or purchase burst
- D5 Whole screen + SVG re-renders ~30×/sec — battery/frame risk on older iPhones
- D6 "*bite*" caption is weak as a hero line
- D7 Scrapbook badge hard-coded off
- D8 "Baking automatically · tap to rush" wraps to two lines

## v0.2 — build (addresses round 1)

| Note | Fix |
| --- | --- |
| G1 | Map redrawn for a 100×76 viewBox fitted with `meet`; every node sits inside the box and clear of the sheet |
| G2 | New layout: Downtown moved beside the shop; parked drivers line up to the shop's right, off all labels |
| G3 | Backdrops recomposed as 4:3 (extra sky with clouds / shop wall) in a 4:3 frame — no cropping |
| G4 | HUD hint follows the bottleneck: "Shelf full — hire a driver!", "Hire a driver…", or "Tap the oven…" |
| G5 | Toast moved to just under the HUD, auto-clears after 1.8s |
| G6 | Cut-scene backdrop is fully opaque; frame + bubble vertically centered |
| G7 | Offline cash is held until Collect, then counts up in the HUD (and is still saved if the app closes first) |
| G8 | Trailing zeros dropped ("$60K", "$9.5M"); test added |
| D1 | First driver costs $8 (was $20): first purchase ~10s in; unit test guards ≤15s; pacing sim still ~8h per city |
| D2 | Always-visible goal bar under the cash: next neighborhood, or the vehicle it needs, or story progress; tap to buy when full |
| D3 | Oven card ~40% shorter; "Open neighborhood" row folded into the goal bar — all three upgrades fit above the fold |
| D4 | Bigger outlined "+$" pops, one per neighborhood; cash pulses on payouts; purchase burst (✨💰🍕) + success/error haptics, shake on "can't afford" |
| D5 | Sim tick 10→5 Hz; map runs its own 16 fps clock so only the SVG redraws; screen-level 50 ms timer removed |
| D6 | "*bite*" caption rewritten as narration + stronger line |
| D7 | Scrapbook badge counts scenes seen since the Scrapbook was last opened |
| D8 | Oven status shortened to "Auto-baking · tap to rush" (single line) |
