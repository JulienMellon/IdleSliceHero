# Card E4 — the report tutorial (v5.22, lane E)

**Goal:** the first time Chapter 3 of Downtown is current (task "Open the shop report"), Nonna lights the report strip, then one bar, then the demand line, and stops. After that, never again.

**Read first:** `src/engine/tutorial.ts`; `docs/story/COPY-v5.22.md` (`tutorial.report.1..3`); U3's coach targets (`report:strip`, `report:bar:ovens`, `report:demand`, `report:close`).

## Files
- Own: `src/engine/tutorial.ts` (a second short sequence, `reportCoach`), its tests, the coach block of `src/app/index.tsx`, one fixture `scripts/fixtures/<next free number>_e4.py`.

## Steps
- [ ] **1.** A saved `coachDone: string[]`; the sequence id `report`. Starts when the chapter task `report` is the next task and no cut-scene, sheet or other coach step is up.
- [ ] **2.** Steps: `report:strip` tap (opens the sheet) · `report:bar:ovens` look (always the ovens bar, whatever the shop's state, so the tutorial never singles out the limit) · `report:demand` look · ends when the sheet closes. Lines `tutorial.report.1..3`.
- [ ] **3.** The chapter task `report` is done when the sheet has been opened (E3's `reportOpened`), whether or not the coach ran.
- [ ] **4. Tests and fixture:** the three steps; a save that already opened the report never sees it.

## Checks
`npx tsc --noEmit`; `npx jest src/engine`; `npm run format:check`.

## Report
Standard format.
