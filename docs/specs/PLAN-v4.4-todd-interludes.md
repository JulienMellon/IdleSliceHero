# Implementation plan — Todd B-plot + interludes (v4.4)

> Copied from the project doc `claude/PLAN-v4.4-todd-interludes.md` (2026-10-30). It was written against save v3 and the old ~4-hour economy. Cards T1a and T1b in `docs/build/v5.16/` say what to rebase: save numbers, delays, shot numbers.

Source script: `docs/story/STORY-v4-final.md` (Claude Doc "Slice Empire — Story Update: The Todd B-Plot"). Status: **planned, decisions locked (Julien, 2026-10-30).**

## 1. Scope
- 11 new scenes (interludes), text edits to 12 existing scenes, 2 new characters (+1 variant), 3 new props.
- One new scene rule: a scene can **require** other scenes to have been seen first.
- Save v3 → v4 (the migration marks skipped interludes as seen).
- Pacing sim, tests, screenshots and the Scrapbook updated for 35 scenes.
- Out of scope: the D336 crowd major, A17, daily/weekly tasks, sound.

## 2. Content model (`src/content/types.ts`)
```ts
export type CharacterId = … | 'mr-smith' | 'todd-coat' | 'slicey';
//   mr-smith  = Todd in the trench coat + drawn-on mustache
//   todd-coat = the same coat, no mustache (waterfront-5, uptown-4 P4)
//   slicey    = Todd in the foam pizza-slice costume

export type SceneTrigger =
  | … existing three kinds …
  /** Interlude: plays this much play time after `scene` was seen. */
  | { kind: 'after'; neighborhood: NeighborhoodId; scene: string; seconds: number };

export interface ScenePanel {
  …
  prop?: 'vending-machine' | 'sold-sign' | 'recipe-card' | 'order-slip' | 'name-tag' | 'phone-footage';
  /** Text drawn on the prop (name tags: "SENIOR ASSOCIATE", "TODD · ROSA'S"). */
  propText?: string;
}

export interface Scene {
  …
  beat: 1 | 2 | 3 | 4 | 'interlude';
  /** Scenes that must be seen before this one may play (also holds a main beat behind an interlude). */
  requires?: string[];
}
```
- Interlude ids: `downtown-5`, `suburbs-3b`, `suburbs-5`, `waterfront-3b`, `waterfront-5`, `university-3b`, `university-3c`, `industrial-2b`, `industrial-3b`, `uptown-2b`, `uptown-3b`. The `<hood>-<beat>` id test applies to main beats only.
- Speaker labels are free text, so "Todd", "Trench Coat" and "Mr. Smith" need no code. `DISPLAY_NAMES['megaslice-rep']` becomes "Todd".

## 3. Scene table (triggers and requirements)
Interlude delays are play seconds after the named scene. The 90 s gap still applies on top.

| Scene | Trigger | Main beat it holds back | Sim target |
| --- | --- | --- | --- |
| suburbs-3b | after suburbs-3 + 150 s | suburbs-4 requires it | 11.5 min |
| waterfront-3b | 50,000 Waterfront pizzas (= `PIER9_BID.unlockPizzas`) | the bid: `pier9Available` requires it | ~27 |
| downtown-5 | after waterfront-4 + 540 s | — | ~45 |
| suburbs-5 | after downtown-5 + 600 s | — | ~55 |
| waterfront-5 | after suburbs-5 + 540 s | university-3 requires it | ~64 |
| university-3b | after university-3 + 360 s | — | ~89 |
| university-3c | after university-3b + 420 s | university-4 requires it | ~96 |
| industrial-2b | after industrial-2 + 420 s | industrial-3 requires it | ~128 |
| industrial-3b | after industrial-3 + 800 s | industrial-4 requires it | ~150 |
| uptown-2b | after uptown-2 + 600 s; requires industrial-4 | uptown-3 requires it | ~190 |
| uptown-3b | after uptown-3 + 660 s | uptown-4 requires it | ~215 |

Waterfront-3b plays on the normal 90 s gap (no "player caused" exception), so the bid button can appear up to 90 s after 50,000 pizzas. That's one less special case.

## 4. Engine (`src/engine/game.ts`, `cutscene-input.ts`)
- **`sceneTriggered`:** the `after` kind is true when `sceneAt[scene] + seconds ≤ playSeconds`. Every scene is also false until all of its `requires` are seen.
- **`pendingScenes`:** keeps story order, but main beats come before interludes when both are ready ("main beats win ties").
- **`sceneHeading`:** shows "Suburbs · Interlude" for an interlude.
- **`pier9Available`:** requires `waterfront-3b` seen instead of `waterfront-3`.
- **`storyWaitHint(game)`:** returns text when a triggered main beat is held behind a finale the player still has to earn. The two cases:
  - "Win over Industrial to continue Uptown's story"
  - "Save Marisol's dock to continue University's story" (happens when University is built before the bid)

  Time-based holds return null, because they clear on their own.
- **Save migration (`fromSave`):** for every seen scene, mark everything it `requires` as seen, recursively, and stamp `sceneAt` with the seen scene's time. This means:
  - An existing save never plays "Sorry in advance about the university" after University.
  - The skipped interludes still unlock in the Scrapbook.
  - It's idempotent, so it runs on every load.

## 5. UI
- **Scrapbook:** each neighbourhood lists its scenes in story order. Interlude tiles show "Interlude" where main tiles show the beat number. The header count uses `HOME_SCENES.length` (35).
- **Goal bar:** the completed-city fallback `Story n/24` uses `HOME_SCENES.length`.
- **Wait hint:** `storyWaitHint` shows as a one-line banner in the waiting neighbourhood's drawer, using the same style as the Nonna countdown.
- **Cut-scene player:** draws `propText` and the new props. No other change.

## 6. Art (`portrait.tsx`, `backdrop.tsx`)
All three are variants of the `megaslice-rep` bust.
- **mr-smith:** a tan trench-coat collar over the shirt, a fedora, and a crooked marker-stroke mustache. The mustache is visibly drawn on: one uneven dark stroke, slightly off-centre.
- **todd-coat:** the same as mr-smith without the mustache.
- **slicey:** a foam cheese-slice wedge framing the face, with pepperoni circles, a crust band on top and the face showing through a cut-out.

Props go in the existing prop window (left of the head):
- **order-slip:** a receipt with "MR. SMITH · 1 LG PEPPERONI".
- **name-tag:** a close-up badge showing `propText`.
- **phone-footage:** a phone screen with grainy stripes, a stairwell silhouette and a REC dot.

## 7. Tests (node, pure `.ts`)
- **`story-content.test.ts` (new):**
  - Panel and scene limits: each scene has 3–5 panels; each panel has ≤ 2 cast and ≤ 3 lines; every bubble is ≤ 90 characters (the front-page quote is 86).
  - References: every `requires` / `after` id exists, and the graph has no cycles; every interlude's neighbourhood matches its `after` scene's id prefix, or the scene is explicitly cross-neighbourhood (downtown-5, suburbs-5 and uptown-2b are).
  - The name-tag ladder appears in story order (a cheap guard against reordering).
- **`story-pacing.test.ts` additions:**
  - An `after` interlude fires at its delay, and not before.
  - A main beat waits on `requires`.
  - Main beats win ties.
  - `pier9Available` needs waterfront-3b.
  - The migration marks required interludes seen (a save that has seen university-3 → downtown-5, suburbs-5 and waterfront-5 are seen).
  - `storyWaitHint` covers both cases.
- **Pacing sim:**
  - It models `after` and `requires`.
  - It prints all 35 scenes and asserts all 35 play.
  - The longest scene gap is ≤ 12 min (was 34.5).
  - City completion moves by ≤ 5 min.
  - It adds one run where University is built before the bid, to check the hint path doesn't stall.

## 8. Shots the plan asked for
mr-smith (downtown-1 P1); name-tag (suburbs-3b P3); order-slip (downtown-5 P4); phone-footage (university-3c P2); slicey (uptown-2b P2); Scrapbook with interlude tiles; the Uptown wait hint. The seeded save for "exactly one scene due: industrial-3" must also list `industrial-2b`.

## 9. Decisions locked (Julien, 2026-10-30)
- The codecritic reviews this build because of the save migration. The critic and storycritic run as usual.
- **Fold in STORYLOG S1–S3 and S5–S8; decline S4.** S4 would take Todd out of industrial-3, which is his VENDING RESTOCKER beat.
  - S1: waterfront-4 gets a closing HQ panel. Victor: "Fine. Keep the dock. I'll buy their brains instead."
  - S2: university-1 P4 adds a closing line: "Also, your driver's route is a crime. I'm writing it down."
  - S3: suburbs-4 P3 adds a closing line (3 bubbles), Dale: "Hey, pal, some sailor lady's been asking about you. Says it's urgent."
  - S5: industrial-1 → "Cold pizza, you're done. Upgrade those ovens." Dale's perk text → "Suburbs dine-in customers pay almost full price".
  - S6: uptown-4 retitled "The Review".
  - S7: waterfront-4 → "You saved this old dock, kid. Now I've got nowhere left to complain but your shop."
  - S8: downtown-2's closer → "Twelve pizzas. In my day, twelve was Tuesday."
- **Story waits:** they show as a drawer banner hint in the waiting neighbourhood, Nonna-countdown style (§5).
- The design loop's notes were numbered S1–S34, which collides with the log's S1–S8; log them under fresh IDs.
