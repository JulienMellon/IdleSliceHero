# Card Q7 — loop rules from the critic-log analysis (v5.23b, docs)

**Goal:** turn the analysis of critic rounds 1 to 87 (`docs/build/CRITIC-ANALYSIS-2026-11-22.md`) into written rules, so the next versions stop repeating these failures:
- "Fixed" claims the pixels don't show: D67, G70, D450 (its r3 commit changed no pixels), D454 (a halo drawn behind the dome).
- Cheap minors carried for 4 or more rounds: D465 and D487 were one-line copy fixes that took 4 to 5 rounds.
- Parked notes re-flagged in every review: D493 and D495, about 21 times each.
- Reward moments that ship flat: a [major] in the first round of every payoff feature since round 59.
- Details too small to read: D139, D169, D185, D193, D337, D458, D459, D548.
- Clone art whenever content is multiplied: D457, D490, D507, D508, D509.

**Read first:** `docs/build/README.md` sections 4 and 11; `.claude/agents/critic.md` ("Stricter bar", "Output", "Review file"); `docs/build/agents/critic-output-rule.md`; `.claude/agents/programmer.md` (its report format); `CRITICLOG.md` (its lessons block).

## Files
- Own: `docs/build/README.md`, `.claude/agents/critic.md`, `docs/build/agents/critic-output-rule.md`, `.claude/agents/programmer.md`, the lessons block at the top of `CRITICLOG.md`.
- Do not touch: code, fixtures, any VERSION.md or card. The orchestrator edits STATE.md.

## Steps
- [x] **1. Fix claims name their shot.**
  - Programmer brief: the report gains a `Fixed:` block, one line per row: `<ID> → <shot path> · <what changed in its pixels>`. A row with no shot (code-only, or not in any fixture) is listed under `Unverified:` with the reason.
  - README 4.6: add one sentence to the fix-round prompt: "List each row you fixed with the shot that shows it; a row you could not see in a shot is `Unverified`, not fixed."
  - README 4.2: the orchestrator passes the `Unverified:` IDs to the critic's prompt as `Check first: <IDs>`.
- [x] **2. Cheap minors first.** README 4.6's fix-round prompt changes "Fix bugs and majors first" to "Fix bugs and majors first. Then fix every row whose fix is one string, one format or one clamp, before any other minor."
- [x] **3. Parked notes.**
  - Critic brief: a list `Parked by Julien`. Today it reads: D493 and D495 until v5.25 (economy refit and pacing).
  - A parked row stays in the Open notes table with `sev` = `parked`. It doesn't count toward the gate, and the critic doesn't raise it again in FUN AND RETENTION. It can only reopen if the build makes it worse.
  - Add `parked` to the sev list in `critic-output-rule.md`.
- [x] **4. README 11: card-writing rules.** Add these four:
  - **Reward moment.** Any card that ships a payoff (a win, a completion, a gift, an upgrade, a milestone) specifies the moment: centre stage, a count-up, coins flying to the cash, the cast reacting, nothing stacked on the moment's subject, and a fixture shot taken mid-moment.
  - **Size floor.** A scene detail that is meant to be read or told apart is at least 6 pt at 1× (393 pt wide). A state cue (a pile, a pose, a timer) is at least 10 pt.
  - **Variety check.** A card that multiplies content (a city, a collection, a cast, a set of looks) lists how each item differs by silhouette or prop, not only by colour, before any art is drawn.
  - **Protected elements.** A card that adds anything drawn over the shop names the `cover` check (Q8) in its Checks.
- [x] **5. Critic brief.**
  - Under "Stricter bar": a readable detail under 6 pt at 1× is a [minor], and a state cue under 10 pt is a [major].
  - In "How to review": open the shots for the `Check first:` IDs before anything else.
- [x] **6. CRITICLOG lessons.** Add one line each for patterns 2 (space squeeze: a new chip clips its neighbour's text; give every label a short form and fit to width) and 6 (fixed in the log but not in the pixels), pointing to the new rules.

## Checks
`npm run format:check` (Markdown is in scope if the formatter covers it); `grep -n "Unverified" docs/build/README.md .claude/agents/programmer.md`; `grep -n "parked" .claude/agents/critic.md docs/build/agents/critic-output-rule.md`.

## Report
Standard format, plus each changed section as `file § heading: one line`.
