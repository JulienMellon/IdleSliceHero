# Card Q4 — the loop's rules catch up with its tools (v5.15-loop, docs)

**Goal:** the orchestrator's contract and the agent briefs describe the loop as cards Q1, Q2, Q3 and Q6 left it, and four review rules change.

**Why (measured 2026-11-13, `docs/PLAN-loop-improvements.md`):**
- Programmers never saw their own screens: UI cards were checked with `tsc`, `jest` and `py_compile` only.
- Bug G95 was open in five straight reviews; each fix cleared the one configuration in the note.
- A critic's suggested fix ("40 pt buttons") overrode a house rule and nobody decided that.
- In a re-check round the critic was handed 156 images for notes that named 17 shots.

**Read first:** `docs/build/README.md` (all of it; it is the contract you are editing), `docs/build/v5.15-loop/VERSION.md`, the `Changed:` lines of cards Q1 to Q3 and Q6 in STATE's log (your spawn prompt says where), `scripts/review_shots.py`, and the three briefs named below.

## Files
- Own: `docs/build/README.md`, `.claude/agents/programmer.md`, `.claude/agents/critic.md`, `docs/build/agents/critic-output-rule.md` (only if the open-notes table changes), `scripts/review_shots.py`, `AGENTS.md` (one line), `HANDOFF.md` (one lesson line).
- Do not touch: `src/**`, the other scripts, any card or VERSION file, `docs/build/STATE.md`.

## Steps
- [x] **1. `review_shots.py --notes`.** `python3 scripts/review_shots.py <new> <prev> --notes <review file>` builds the review set from two lists only: shots whose pixels changed, and shots named in the "where" column of that file's `## Open notes` table (numbers such as `59`, `05b2`, and ranges such as `67–70`; match a shot by the part of its file name before the first hyphen, so `62` does not also select `62b`). Without `--notes` it behaves as now. `index.json` marks each shot `new`, `changed` or `noted`.
- [x] **2. The threshold.** Screenshots are now deterministic (card Q1), so lower `CHANGED_FRACTION` from 0.5% to 0.1%. If Q1 reported `PARTIAL`, set it just above the largest residue Q1 named, and say what you chose.
- [x] **3. README section 5 (verify).** After the report line, add the layout line: `python3 -c "import json;print(json.load(open('screenshots/$L/layout.json'))['new'])"` must print `0`; a non-zero count goes to the owning lane's programmer with the findings, like a failed test. Update the wait time to what Q1 reported.
- [x] **4. README section 3 (spawn prompt).** One added line for a card that has a `Fixtures` section: `When your checks pass, run: npx expo export --platform web > /tmp/export.log 2>&1 && python3 scripts/screenshots.py dev --only <your fixture file>. Open at most three shots from screenshots/dev at half size and fix what you see before you report.` And one line for any card that writes a fixture: `Fixtures follow scripts/fixtures/README.md: move time with advance(), never time.sleep, and call expect() before a shot that shows a state.` The cards of v5.16 to v5.19 were written before the screenshot tools changed, so this line is how their programmers learn the new way.
- [x] **5. README section 4, step 6 (fix round): two rounds per bug.** A row with `sev` = `bug` that was open in the two previous reviews of this version is not sent again as a note. The orchestrator's message for that row is: `<ID> has survived two fixes. Before changing the code, write a test that fails for every state this element can be in (list the states in the test's name), then fix until it passes.` The orchestrator knows the count from the IDs in the one-line-per-bug returns it already records.
- [x] **6. README section 7 (review prompts).** For r2 and r3 the critic's review set is built with `--notes <PREV>`. Add to the r2 and r3 prompt: `A new minor on a shot marked neither changed nor noted is recorded as carried and does not count against the gate.`
- [x] **7. README section 8 (close).** Add the `METRICS.md` line that card Q6 defined.
- [x] **8. `critic.md`: house rules a suggested fix may not break.** A short section: tap targets (44 pt drawn, or 40 pt or more with a proven `hitSlop`; never under 40 pt); text 10 pt or more; the WELCOME mat and the other owner-required elements already listed in the brief. "If your fix needs an exception, say so in the note and tag it `needs-owner`." Also: the layout check now reports small controls, small text and clipped text before you see the build, so spend your attention on what it cannot see.
- [x] **9. `programmer.md`.** Replace "Draw tap targets at 44 pt. Don't rely on hitSlop." with the rule in step 8, and name `src/components/__tests__/tap-targets.test.ts` as where a `hitSlop` is proven. Replace "Never run … the screenshot script" with: never the full suite; on a card with a `Fixtures` section, run your own fixture with `--only` and look at no more than three shots. Add: text is 10 pt or more. The brief's `description:` line says the same about the screenshot script; change it to match.
- [x] **10. `AGENTS.md`.** Change "Run lint and typecheck before declaring any task done." to "Run typecheck before declaring any task done. (Lint is not configured yet; see docs/build/DECISIONS.md #32.)"
- [x] **11. `HANDOFF.md`, Lessons learned.** One line: a review note's suggested fix does not outrank a house rule (the 40 pt HUD buttons of v5.15 r3).

## Rules
- Keep the README's shape and section numbers. Change the fewest lines that make each rule true. It must stay a file the orchestrator can read in one pass.
- The README must not tell the orchestrator to open a card, a review, source or a screenshot. Every new rule has to work from what it already records.
- Write for a reader who has only this file: no "as discussed", no reference to this card.

## Checks
- `python3 -m py_compile scripts/review_shots.py`
- `python3 scripts/review_shots.py v5.15-r3 v5.15-r2 --notes docs/build/v5.15/review-r2-critic.md | tail -1` runs, and `screenshots/v5.15-r3/review/index.json` marks these 17 shots `noted` or `changed`: 05b2, 14, 36, 41, 46, 56, 59, 61, 62, 62b, 64b, 65, 67, 68, 69, 70, 72.
- `grep -c "layout.json" docs/build/README.md` is at least 1; `grep -c "\-\-notes" docs/build/README.md` is at least 1; `grep -c "METRICS.md" docs/build/README.md` is at least 1.
- `grep -n "hitSlop" .claude/agents/programmer.md .claude/agents/critic.md` shows the new rule in both.
- `wc -c docs/build/README.md`: report the size before and after (it was 8,201 bytes). Aim to add under 2,500.
