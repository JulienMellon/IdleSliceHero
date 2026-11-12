# Card S1 — cosmetics, head reactions, Nonna's cameo (v5.15, lane S)

**Goal:** the cosmetics that today exist as ids and names only are drawn and worn; the station heads react; Nonna stands in the shop during her day-30 week. Strings come from `docs/story/COPY-v5.15.md` by key.

**Read first:** `docs/API.md`; `src/components/slots.tsx` (`SCENE_OVERLAYS`); `grep -n "cosmetic" src/content/rewards.ts src/engine/rewards.ts | head -30`; `sed -n '84,96p' docs/REWARDS.md`. In `scene/`, read only the files that draw the thing you are changing (`grep -ln "oven\|awning\|scooter\|counter" src/components/scene/*.ts*`).

## Files
- Own: `src/components/scene/**`, `src/components/storefront.tsx`, `src/components/scene/cosmetics.ts` (new, pure: id → palette and shape variant), `src/engine/features/heads.ts` and its test (new), `src/content/heads.ts` (new), `scripts/fixtures/66_s1.py`.
- Shared, append-only: `src/engine/features/index.ts`, `src/components/slots.tsx`.
- Do not touch: `src/app/**`, top-level `src/components/*` other than `storefront.tsx`.

## Steps
- [ ] **1. Cosmetics table.** `scene/cosmetics.ts`: for each id, what it changes and how. `oven-gold` and `oven-woodfired` restyle the ovens; `storefront-skin-{cycle}` restyles the facade (one skin per cycle number, at least two distinct ones, then repeat); `scooter-mint` recolours the drivers' vehicles; `neon-counter` adds a neon sign over the counter; `awning-gold` restyles the awning; `plaque-master` adds a gold plaque by the door. Prefer palette and small-shape variants over new geometry. One typed input object feeds the memoised builders (the `furnitureInputs` pattern).
- [ ] **2. Worn state.** Draw what `rewards.worn` lists (card E1 added it; see `docs/API.md`). A cosmetic is city-wide. If `worn` is missing, stop and report BLOCKED.
- [ ] **3. Head reactions** (`features/heads.ts`, pure). A head speaks a bark on: its station's milestone, a rush combo, an attack on its shop, and when it is Head of the Week. At most one bubble on screen per shop, 2.5 s each, at least 20 s apart, never during a cut-scene. Bubbles clamp inside the walls (this was D440). "Levels with its station": a small rank pin on the head at station levels 25, 50 and 100. Head of the Week: one head per week, seeded by the week number (roll only when the week number increases), wears a gold star pin and has its daily-task rewards for that station shown with a star. No income effect.
- [ ] **4. Nonna's cameo.** While the day-30 visit boost is active, Nonna stands by the counter in the shop on screen, with the visit's remaining time on a small tag, and says one of her six lines every few minutes. Later cycles show that cycle's visitor (Big Sal, Genevieve) the same way; use the visitor the rewards engine already names.
- [ ] **5. Carried.** The rows with owner S in the carried-notes file named in your spawn prompt.

## Fixtures (`scripts/fixtures/66_s1.py`, shots 66–73)
66 gold oven and gold awning worn, Downtown; 67 wood-fired oven and neon counter, Waterfront; 68 storefront skin and mint scooters; 69 master plaque; 70 a head's rush bark with rank pins visible; 71 Head of the Week pin; 72 Nonna in the shop with her timer; 73 the same shop with nothing worn, for comparison.

## Rules
Prove any overlap fix with a budget test that fails on the old code, then run the whole crowd suite. Keep the WELCOME mat and the shared signage. Draw nothing in the 61 pt caption zone.

## Checks
`npx tsc --noEmit`; `npx jest src/components src/engine/features`; `python3 -m py_compile scripts/fixtures/66_s1.py`.
