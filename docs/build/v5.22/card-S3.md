# Card S3 — the shop shows its state (v5.22, lane S)

**Goal:** a player can see where the shop is stuck by looking at it: work piles up after a slow station, the people waiting on it look idle, the people at it look swamped, customers queue and some walk out, idle drivers sit on their scooters. No colour marks a station as the limit.

**Read first:** `docs/build/v5.22/VERSION.md`; E3's `symptoms` and `capacity`; `src/components/scene/stations.ts` (badges, `tone`), `scene/waiting.ts` (the idle-drivers pill), `scene/crew.ts`, `scene/people.tsx`, the crowd budgets in `scene/__tests__/`.

## Files
- Own: `src/components/storefront.tsx`, `src/components/scene/**`, one fixture `scripts/fixtures/<next free number>_s3.py`.
- Do not touch: `src/engine/**`, `report/**`, sidewalk and drawer.

## Steps
- [ ] **1. Piles.** On the pass between prep and ovens, rolled dough discs; on the counter, boxed pies; on the pickup shelf, bags. 0–5 drawn items scaled from the backlog (5 = more than 4× one batch). Pure placement helper with a budget test (no pile over a head, the WELCOME mat, or a badge).
- [ ] **2. Worker poses.** For each station's worker: `piling` at their output → quick bob and a sweat drop every 3 s; `idle` → lean on the counter, a yawn every 6 s or a phone glance. Same art, new transforms; no new characters.
- [ ] **3. Customers.** The door line already draws; a `walkout` customer turns, a frown bubble (12 pt), and walks off the curb. At most one walk-out animating at a time.
- [ ] **4. Drivers.** Idle drivers sit on their scooters (one figure per up to ten, as D430). The pill says only "{n} drivers waiting" — no station names (remove `slowest` from `waiting.ts`'s pill).
- [ ] **5. Remove the tomato tint** on tied station badges (G80: `tone`) — every badge uses the basil tone.
- [ ] **6. Tests:** budgets for piles and poses; the badge tone is the same for every station. **Fixture:** a shop short on ovens (dough piles, counter worker idle), short on drivers (bags pile on the pickup shelf, the counter worker idles), short on counter (boxes pile).

## Rules
Overlap fixes in pure modules with a budget test; run the whole crowd suite. Don't remove the WELCOME mat. No per-frame allocations in the render path (perf audit rules in v5.16's handoff).

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
