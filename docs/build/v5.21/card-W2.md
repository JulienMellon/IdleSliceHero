# Card W2 — chapter titles, teasers and task labels (v5.21, lane T, writer)

**Goal:** the words of the Story tab and the goal bar for the home city's 24 chapters.

**Read first:** `docs/build/v5.21/chapters.md` (card E1's table: every chapter's scene and tasks); the scene each chapter unlocks (`src/content/cities/home/scenes/<shop>.ts`, its title and first panel only); `docs/story/CAST.md`.

## Output
`docs/story/COPY-v5.21.md`, three tables:
1. `chapter.<sceneId>.title` — the chapter's name, ≤ 24 characters. It may reuse the scene's title.
2. `chapter.<sceneId>.teaser` — one line, ≤ 70 characters, that makes the player want the scene **without saying what happens in it** (name the character and the situation only).
3. `task.<sceneId>.<n>` — each task's label, ≤ 32 characters, with the card's numbers as `{target}` and `{shop}` placeholders (the UI adds "212/424"). Also `task.kind.<kind>` generic labels for each kind as fallbacks.

## Steps
- [x] **1.** 24 titles, 24 teasers, every task label in the table.
- [x] **2.** The bar's waiting line `chapter.ready` ("Next scene in {time}") and the all-done line `chapter.done`.
- [x] **3.** Rules: no label says "buy", "upgrade" or names a level; a head is named by name ("Hire Marco"); outcomes read as goals ("Serve 30 a minute in Downtown").

## Report
Standard format with counts and the longest of each kind.
