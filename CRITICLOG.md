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
