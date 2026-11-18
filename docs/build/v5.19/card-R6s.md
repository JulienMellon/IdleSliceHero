# Card R6s: the storefront's hooks (v5.19, lane S)

**Goal:** `storefront.tsx` (846 lines) only assembles the frame. Its per-frame logic moves into named hooks next to it. **Pixel-identical**, and no new allocations per frame.

**Why:** `docs/PLAN-refactor.md` P6, third bullet. Notes to fix:
- **U21** [low]: storefront.tsx:311, :251. Run `stepMoments` only on a key change, and memo `moreTagAt`.
- **A29** [low]: scene `FurnitureSource`. Make the remaining optional fields required.

## Files
- Own: `src/components/storefront.tsx`; new `src/components/scene/use-barks.ts`, `use-crew-step.ts`, `use-moments.ts`, `use-cues.ts`; `src/components/scene/furniture-inputs.ts` (A29).
- Read-only: `scene/moments.ts`, `scene/crew.ts`, `engine/features/heads.ts`, `scroll-cues-model.ts`.

## Steps
- [ ] **1. Extract the hooks.** Move the bark block (`nextBark` … `mem.bark`) into `useBarks`, the crew step into `useCrewStep`, the moments block (`stepMoments`, bounce, chip, mile) into `useMoments`, and the cue placement (`cuesFor`, `clearCueTop`, the wrench `avoid`) into `useCues`. They share the storefront's `mem` ref, passed in; don't make new refs per hook. Keep `'use no memo'` on the storefront and in each hook file, and keep the 15 fps `useClock`.
- [ ] **2. U21.** `useMoments` calls `stepMoments` only when `momentsKey` changes. Memoise `moreTagAt` on its inputs.
- [ ] **3. A29.** Make the remaining optional `FurnitureSource` fields required, and fix the callers.
- [ ] **4. Measure.** Use `usePerfMarks('Storefront')` render time and the allocation count method in `docs/logs/CODELOG-archive.md` (round 2 onwards) for a maxed shop, before and after. Both numbers go in the report; "after" must be ≤ "before".

## Fixtures
Run `--only 05_midgame,09_lategame,39_ladder,140_v2` and compare with the baseline (`python3 scripts/review_shots.py dev v5.19-base | tail -3`). **0 changed** is the gate.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/components/scene`.

## Report
Standard format, plus the storefront line count, and render time and allocations before and after.
