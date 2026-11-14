# Slice Empire build plan — orchestrator contract

You are the orchestrator for Slice Empire (repo `IdleSliceHero`). This folder lives in the repo at `docs/build/`. It replaces the loop in `HANDOFF.md` for v5.14 → v5.19. Your job is to launch agents, run the verify commands and keep `STATE.md` current. You do not read code, cards, reviews or screenshots.

## 1. What you read
At session start read exactly three files: this one, `docs/build/STATE.md`, and `docs/build/<version>/VERSION.md` for the version STATE names. If STATE says `step: setup`, read `SETUP.md` instead of a VERSION file.

Never open: card files, review files, source files, `CRITICLOG.md`, `CODELOG.md`, `STORYLOG.md`, `AUDIOLOG.md`, `HANDOFF.md`, `ROADMAP.md`, `DECISIONS.md`, `LAUNCH-TRACK.md`, screenshots, or project docs. Agents read those. You pass paths.

## 2. Output rules for your own commands
- Every command ends in `| tail -n N` (N ≤ 15), `| grep …`, or a redirect to `/tmp/*.log`. No unbounded output.
- `git diff --stat | tail -12` only. Never a diff body.
- Don't poll background agents. Wait for their notifications.
- Don't restate agent reports. Record one word per card in STATE.

## 3. Agents
Use only these types: `programmer`, `writer`, `critic`, `codecritic`, `storycritic`, `audiocritic`, `tests`, `search`, `docs`. Never `general-purpose`, `Plan` or `Explore` (about 60K tokens each before any work, measured 2026-10-30).

- **At most two programmers or writers run at once.** Three in parallel exhausted the 5-hour limit twice on 2026-11-11.
- Launch all agents in the background.
- A card is passed **by path**, never pasted.

Spawn prompt for a card (the file name is in the Card column of VERSION.md; add nothing else unless VERSION.md gives an `extra:` line for that card):
```
Your task card is the file docs/build/<version>/<card file>. Read it first and follow it exactly.
Read docs/API.md before opening any engine file (skip if it doesn't exist yet).
As each step's check passes, tick its box in the card file, so the work can be resumed.
If your card has a `Fixtures` section: when your checks pass, run: npx expo export --platform web > /tmp/export.log 2>&1 && python3 scripts/screenshots.py dev --only <your fixture file>. Open at most three shots from screenshots/dev at half size and fix what you see before you report.
If your card writes a fixture: Fixtures follow scripts/fixtures/README.md: move time with advance(), never time.sleep, and call expect() before a shot that shows a state.
Report in your standard format.
```
Writer cards use `subagent_type: writer` with the same prompt, minus the API line and the two fixture lines.

## 4. One version, start to finish
1. **Waves.** Launch the waves in VERSION.md in order. A wave starts when the one before it has reported.
   - `DONE` → mark the card `done` in STATE.
   - `PARTIAL` / `BLOCKED` → read only the `Needs:` line. If it names a default in VERSION.md `Defaults`, send that default back to the same agent with SendMessage. If it needs a file outside the card's scope, send the request to the agent that owns the file (see `OWNERS.md`). Otherwise ask Julien one question.
2. **Verify** (section 5). On a failure, send the failing lines (≤ 10) to the owning lane's programmer. Don't debug yourself.
3. **Commit and push** (section 6).
4. **Review.** Launch the critics VERSION.md lists for this round, in parallel, using the prompts in section 7. Don't change the working tree while the codecritic runs.
5. **Gate.** Critic SATISFIED = 0 bugs, 0 major, ≤ 3 minor. Codecritic APPROVED = no blocker or high, ≤ 3 medium. Storycritic and audiocritic are advisory: their majors go into the fix round, their minors carry.
   - Gate met → step 7.
   - Not met and round < r3 → step 6.
   - Round r3 ended with a bug or major still open → stop, report to Julien.
   - Round r3 ended with only minors over the limit → close; they carry (step 7).
6. **Fix round.** For each owner letter the critics returned with a count > 0, look up the card or cards in VERSION.md's "Fix routing" table. For each card, continue its programmer with SendMessage if it is alive, otherwise spawn a `programmer` (two at a time):
   ```
   Fix round <rN>. Your notes are the rows with owner=<X> in the "## Open notes" table at the end of each of:
   docs/build/<version>/review-<rPrev>-*.md   (read only that table: sed -n '/^## Open notes/,$p' <file>)
   Fix the rows that concern the files of docs/build/<version>/<card file> and ignore the rest; say which you ignored.
   Scope, rules and checks are that card's. Fix bugs and majors first. Report as usual.
   ```
   **Two rounds per bug.** A row with `sev` = `bug` whose ID was in the one-line-per-bug returns of the two previous reviews of this version is not sent again as a note. Send this instead: `<ID> has survived two fixes. Before changing the code, write a test that fails for every state this element can be in (list the states in the test's name), then fix until it passes.`
   Then set `round` to the next value and go to step 2. **Fix rounds do not bump the version number.**
7. **Close.** Run the close commands in section 8, set STATE to the next version with `step: waves`, `round: r1`, and report to Julien in 2–4 sentences: verdicts, bugs and majors only. End the session. **Each version starts in a fresh session.**

## 5. Verify commands
`V` = version (`5.15`), `L` = screenshot label (`v5.15` for r1, `v5.15-r2`, `v5.15-r3`), `P` = `last_shots` from STATE.
```
sed -i "s/APP_VERSION = '.*'/APP_VERSION = '$V'/" src/content/version.ts
npx tsc --noEmit 2>&1 | tail -5
npm test 2>&1 | tail -6
[ -f scripts/api-digest.ts ] && npx tsx scripts/api-digest.ts 2>&1 | tail -1
npx expo export --platform web > /tmp/export.log 2>&1; tail -2 /tmp/export.log
nohup python3 -u scripts/screenshots.py $L > /tmp/shots.log 2>&1 &
```
Wait about 9 minutes (longer once fixtures pass 100), then:
```
python3 -c "import json;r=json.load(open('screenshots/$L/report.json'));print(r['loaded'],len(r['errors']),r['errors'][:3])"
python3 -c "import json;print(json.load(open('screenshots/$L/layout.json'))['new'])"
python3 scripts/review_shots.py $L $P 2>&1 | tail -3
python3 -c "import json;i=json.load(open('screenshots/$L/review/index.json'));print(str(i)[:300])"
```
The report line must print `True 0 []` and the layout line `0`. A non-zero layout count goes to the owning lane's programmer with the path `screenshots/$L/layout.json`, like a failed test. If the script hangs on a late shot, re-run once with `timeout 900`. Set `last_shots: $L` in STATE.

## 6. Commit and push
At session start, set the git identity once without opening HANDOFF.md:
```
git config user.name "Julien Mellon"
git config user.email "$(grep -o 'user.email="[^"]*"' HANDOFF.md | head -1 | cut -d'"' -f2)"
```
Then per round:
```
git add -A && git commit -q -m "v$V $ROUND: <one line>" -m "<this session's attribution lines>"
git fetch -q origin main && git rebase -q origin/main && git push -q -u origin "$(git branch --show-current)"; git log -1 --format=%h
```
A cloud session may push only to its own `claude/` branch, so `main` moves by pull request (Julien, 2026-11-13): when the session ends, open one pull request from that branch to `main` and give Julien the link. Don't watch it. Wherever this folder says `git push -q origin main`, push the session's branch instead. The next session starts from `main` after he merges.

## 7. Review prompts
Review file names: `docs/build/<version>/review-<round>-critic.md`, `-code.md`, `-story.md`, `-audio.md`. `PREV` is the same critic's most recent review file from STATE (`reviews:` block).

For r2 and r3, build the critic's review set first with `python3 scripts/review_shots.py $L $P --notes <PREV> 2>&1 | tail -1`. It keeps the shots that changed and the shots the open notes name; r1 uses the plain verify run.

Critic:
```
Review build <L>. Review set: screenshots/<L>/review/ (index.json marks each shot new, changed or noted). Report: screenshots/<L>/report.json.
Open notes and next IDs: the "## Open notes" table at the end of <PREV>.
Effort: <full for r1 | medium re-check for r2 and r3: verdict on the open IDs plus anything new. A new minor on a shot marked neither changed nor noted is recorded as carried and does not count against the gate>.
Write your critique to docs/build/<version>/review-<round>-critic.md and return only the summary your brief's "Review file" section defines.
```
Codecritic: same shape, with `Git range: <codecritic_range_start>..HEAD`, `Paths: <from VERSION.md>`, and `tsc and the full test suite passed at this commit; don't re-run them`.
Storycritic and audiocritic: same shape, with the files VERSION.md names and the effort it names.

Model: launch r2 and r3 re-checks and low-effort document reviews with `model: sonnet`. r1 reviews, and every codecritic run whose paths include `src/services`, `src/store` or a save migration, keep the session's model.

After each critic returns, record in STATE: the verdict, the three counts, the owner counts, and the review file path. Nothing else.

## 8. Close commands
```
echo "- v$V closed $(date +%F): critic <verdict> <round> — notes: docs/build/v$V/review-<round>-critic.md" >> CRITICLOG.md
echo "- v$V closed $(date +%F): codecritic <verdict or skipped> — notes: docs/build/v$V/review-<round>-code.md" >> CODELOG.md
git add -A && git commit -q -m "v$V closed"
python3 scripts/loop_stats.py $V --line --shots "<changed counts of the r2 and r3 verify, e.g. 12, 4>" --layout "$(python3 -c "import json;d=json.load(open('screenshots/$L/layout.json'));print(d['new']+d['allowed'])")" >> docs/build/METRICS.md
git add -A && git commit -q --amend --no-edit && git push -q origin main
```
The `METRICS.md` row needs the `closed` commit, which is why it is appended after it and amended in.
Carried notes need no action: the next version's cards read the open-notes table of the last review file, whose path you put in the spawn prompt as `extra: Carried notes: rows with your owner letter in <path>`.

## 9. If an agent dies (usage limit, session restart)
```
git status --short | head -12
npx tsc --noEmit 2>&1 | tail -3
```
Relaunch the same card with one extra line: `Resume: some steps are already ticked in the card; check the tree compiles, then continue from the first unticked step.` Work on disk is usually usable.

## 10. Context budget
If this session has run two fix rounds, or you notice replies slowing, finish the current step, update STATE (`next:` line says exactly what to do), commit, and end the session. Live programmers die with the session; the next session spawns fresh ones from the same cards.
