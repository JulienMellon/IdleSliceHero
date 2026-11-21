# Card W1 — Nonna's Chapter 1 lines (v5.20, lane T, writer)

**Goal:** the 15 lines Nonna says during the tutorial, one per step, each one instruction a first-time player can follow without knowing idle games.

**Read first:** `docs/PLAN-v5.20-onboarding.md`; today's lines in `src/engine/tutorial.ts` (`buildSteps`); Nonna's voice in `src/content/cities/home/scenes/downtown.ts` and `docs/story/CAST.md`.

## Output
One file: `docs/story/COPY-v5.20.md`. A table with columns `key | step | lit target | line`. Keys `tutorial.<n>` for n = 1..15. Add a second table `tutorial.alt.<n>` for the two lines that change with state (see step 2 below).

## Steps
- [x] **1. Write the 15 lines.** Each ≤ 70 characters, one instruction or one observation, in Nonna's voice (warm, bossy, a little Italian, never a pun on every line). The step, what is lit and when it ends:

| n | Lit | Ends when | Must say |
|---|---|---|---|
| 1 | prep table | prep started | tap the prep table |
| 2 | prep table + its dial | dough rolled | the dial fills while the dough rolls; full = ready |
| 3 | oven | oven started | tap the oven |
| 4 | oven dial | baked | the dial is the timer; the number is how many pies are inside |
| 5 | counter | served | tap the counter to serve |
| 6 | cash in the HUD | 2.5 s or a tap | sales become money |
| 7 | goal bar | task list opened | Nonna keeps a list; tap it (shown from v5.21) |
| 8 | task list | list closed | what the list is for; the next task is the second oven (shown from v5.21) |
| 9 | nothing (free play) | can afford the oven | keep going; save for a second oven. Use `{cost}` for the price |
| 10 | sidewalk Ovens card | ovens = 2 | tap Ovens to buy the second oven |
| 11 | both ovens | 2.5 s or a tap | two ovens bake two at once |
| 12 | the All button | drawer open | every upgrade lives in here |
| 13 | the drawer's prep-head hire card | drawer closed | Marco rolls dough for you; hire him when you can. Use `{marco}` |
| 14 | nothing (free play) | Marco hired | none needed; may be empty (`—`) or one short nudge |
| 15 | the prep dial running on its own | 2.5 s or a tap | Marco rolls on his own now; you bake and serve |

- [x] **2. Two state variants.** `tutorial.alt.9`: shown when the player had the oven money and spent it elsewhere ("save up again"). `tutorial.alt.13`: shown when Marco is already affordable when step 13 starts.
- [x] **3. Protected words.** "prep table", "oven", "counter", "Ovens", "All" are the on-screen labels; keep them exactly. Never say "bottleneck".

## Report
Standard format, with the count of lines and the longest line's length.
