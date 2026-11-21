# v5.21 — chapters and the task list: the bar becomes a goal

**Scope (Julien, 2026-11-20):** `docs/PLAN-v5.20-onboarding.md`, version v5.21; DECISIONS #36 and #37. Every main story beat of the home city belongs to a chapter of 2–4 visible tasks; the beat plays when its chapter is done (still one beat per 90 s). The goal bar shows the current chapter's next task with its progress, and a tap opens the task list, whose first tab is **Story**. The tutorial's steps 7 and 8 turn on.

Julien's words: "I think the core story should have clear goals to reach the next scene, communicated by the task list." "Let's find a way to have a task list open when you tap the progress bar. The progress bar can still show progress to the next task a player has to complete. The first task list should be integrated with the tutorial."

**Pacing must not move.** Each chapter's slowest task is the count or condition that gates the beat today; the other tasks must be done well before it on the tuned player. `scripts/pacing-sim.ts`'s day table is the check.

**Out of scope:** the report and the bottleneck pointers (v5.22) — chapter tasks that need the report (`report`, `noMissed`) are defined here with the engine readers they need but their report tutorial is v5.22's. Boston keeps today's triggers (its pack has no chapters; a scene without a chapter keeps its trigger). Interludes and manager-hire scenes keep their triggers.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| E1 | E | Chapter data for the home city's 24 main beats; the engine gate; task progress; migration; pacing | `card-E1.md` |
| W2 | T | Chapter titles, next-scene teasers and task labels | `card-W2.md` |
| U1 | U | The goal bar shows the chapter task; a tap opens the task list | `card-U1.md` |
| U2 | U | The Story tab of the task list; the list reachable from the start | `card-U2.md` |
| E2 | E | Tutorial steps 7 and 8 on | `card-E2.md` |

## Waves
1. **E1 ‖ W2.** W2 reads E1's draft table from `docs/build/v5.21/chapters.md`, which E1 writes in its step 1 before any code: launch W2 after E1 reports that step done (E1 sends `Needs:` with "chapters.md written" and keeps going). If that is awkward, run E1, then W2.
2. **U1 ‖ U2.** Disjoint: U1 owns `index.tsx`'s goal block and `game-ui.tsx`; U2 owns `rewards-ui.tsx`, `rewards-model.ts` and the chapters copy table. Both need E1's selectors and W2's copy.
3. **E2** alone.
4. **Verify** (`L=v5.21`, `P=v5.20`). Expected changed shots: every shot with the goal bar; the tasks drawer. Commit, review.

## Reviews
- r1:
  - `critic` at **full** effort. Extra line: `Focus: can a first-time player tell, from the bar and the Story tab alone, what to do next and what it unlocks? Does a task ever say what to buy?`
  - `codecritic` at **medium**, paths `src scripts`, session's model (save migration).
  - `storycritic` at **medium** on `docs/story/COPY-v5.21.md`: teasers must make the next scene wanted without spoiling it.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E1 (data, gate, progress, migration), E2 (tutorial) |
| U | U1 (goal bar), U2 (Story tab) |
| T | W2 |

## Defaults
- **Chapter reward:** the scene, plus 5 💎 once rewards are unlocked (before the takeover the 💎 are banked and paid at unlock).
- **Bar when every task of the chapter is done but the beat waits on the 90 s rule:** "Next scene in 0:42", counting down.
- **After the last home chapter:** the bar falls through to today's mastery goal, then the story count.
- **The bar never shows a purchase.** `pickGoal`'s candidates leave the bar; the hires and builds stay on the sidewalk and in the drawer.
- **Task kinds** are outcomes: `serve` (count in a shop), `rate` (pizzas a minute in a shop, held 30 s), `hire` (a named head, or the manager), `build`, `win` (rival challenge), `bid`, `noMissed` (no missed orders for N s; needs v5.22's report reader, so E1 adds a minimal missed-orders reader), `playtime` (only where today's gate is an `after` timer: "Nonna's on her way · 3:12").
- **The parked economy refit** (STATE `open:`): chapter `serve` targets are read from today's triggers when E1 writes them; if the refit later changes the triggers' counts, it changes the chapter targets with them.
- **Old saves:** chapters whose beat is seen are done; the current chapter's tasks tick on load from the save's counters.

## Close
README section 8. Report: verdicts, the pacing table against v5.20's, and what is open. Set STATE to v5.22 and stop.

## Added 2026-11-21 (S8, Julien): card E1b
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| E1b | E | The next shop's build waits for the current chapter (the story advances in order) | `card-E1b.md` |

Run E1b alone, before the r3 verify. Fix routing: owner E → E1, E1b, E2.
