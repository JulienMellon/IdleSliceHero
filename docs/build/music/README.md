# Music rewrite — orchestrator contract

You are the orchestrator for the Slice Empire music rewrite (repo `IdleSliceHero`). This track is separate from the version loop in `docs/build/README.md`: it has its own state file and it bumps no version. Your job is to launch one agent at a time, run the verify commands, build the audition reel, keep `STATE.md` current, and stop for Julien's ears.

**Nobody in this loop can hear.** Not you, not the composer, not the audiocritic. Julien's listen is the only gate. Never tell him how something sounds; tell him what was built and measured, and hand him the reel.

## 1. What you read
At session start read exactly three files: this one, `docs/build/music/STATE.md`, and the round file STATE names (`R0-bank.md`, `R1-loops.md` or `R2-stingers-story.md`).

Never open: card files, files under `reports/` or `notes/`, review files, source files, `docs/PLAN-music-rewrite.md`, `docs/AUDIO.md`, any log, `docs/build/README.md`, `docs/build/STATE.md`, screenshots, or project docs. Agents read those. You pass paths.

## 2. Output rules for your own commands
- Every command ends in `| tail -n N` (N ≤ 15), `| grep …`, `| cut …` or a redirect to `/tmp/*.log`.
- `git diff --stat | tail -12` only. Never a diff body.
- Don't poll a background agent or open its transcript. Wait for its notification.
- From a report keep one word per card, the `Built:` line and the `Needs:` line. Write them to STATE at once.
- Load no skill and no extra tool except the ones that send a file and open a pull request.

## 3. Start of a session
```
git config user.name "Julien Mellon"
git config user.email "$(grep -o 'user.email="[^"]*"' HANDOFF.md | head -1 | cut -d'"' -f2)"
[ -d node_modules ] || npm ci > /tmp/ci.log 2>&1; tail -1 /tmp/ci.log
grep -n '^round:\|^step:\|^bank:\|^next:' docs/build/music/STATE.md | cut -c1-200
```
Then deal with **Julien's answer**, the last line of the start prompt:
1. If it holds anything other than "none", save it unedited: append a line with today's date and his words to `docs/build/music/notes/<round>.md` (the round STATE names). Don't paraphrase and don't trim.
2. If STATE says `step: listen`:
   - **A clear yes** (a bank letter in R0; "go", "approved", "sounds good" or the like in R1 and R2) → set `heard:` in STATE, move to the next round (`round:` next, `step: cards`), and read that round's file. If he added notes to his yes, the first card of the next round gets `extra: Julien's notes: docs/build/music/notes/<round>.md`.
   - **Notes with no yes** → a notes round on the same round (section 9).
   - **No answer** → ask him the round's question once and end the session. Never run a round whose predecessor he has not heard.
3. If STATE says any other step, continue from what `step` and `next:` say.

## 4. Agents
Use only `composer` and `audiocritic`. Never `general-purpose`, `Plan` or `Explore`. **One composer at a time**: every card edits `tools/audio/compose.py`, and the audio build uses the whole machine. Launch agents in the background. Don't touch the working tree while a composer runs.

If `composer` is not among your agent types (the brief was merged after this session started), use `programmer` and put this line first in the prompt: `Your brief for this card is .claude/agents/composer.md. Read it first; it replaces your house rules, including the ban on installs.`

Spawn prompt for a card (add an `extra:` line only where this file or the round file says so):
```
Your task card is the file docs/build/music/<card file>. Read it first and follow it exactly.
As each step's check passes, tick its box in the card file, so the work can be resumed.
Keep your final report under 12 lines, in your standard format.
```

## 5. One round, start to finish
1. **Cards.** Launch the round file's cards in order, one at a time. `DONE` → mark it done in STATE and launch the next. `PARTIAL` or `BLOCKED` → read only the `Needs:` line: if the round file's Defaults answer it, send that default to the same composer with SendMessage; if it needs a file outside the composer's lane, record it in STATE `open:` and go on; otherwise ask Julien one question.
2. **Verify** (section 6). On a failure send the failing lines (10 at most) to the composer of the last card. Don't debug yourself.
3. **Commit and push** (section 8).
4. **Review**, if the round file lists one: launch `audiocritic` with the prompt in section 7. It is advisory.
5. **One fix pass.** If the review returned a bug or a major, send this to the last composer if it is alive, otherwise spawn a `composer`:
   ```
   Fix pass. Your notes are the rows with sev bug or major in the "## Open notes" table at the end of docs/build/music/review-<round>-audio.md (read only that table: sed -n '/^## Open notes/,$p' <file>).
   Rules and files are those of docs/build/music/<last card of the round>. Rebuild the cues you change, re-run that card's checks, update its measures file. Report as usual.
   ```
   Then verify and commit again. **No second review**: minors and anything still open carry in that table to the next round's review.
6. **Reel.** `python3 tools/audio/reel.py <round> 2>&1 | tail -3`, then `head -40 tools/audio/build/reel/<round>.txt`. Send `tools/audio/build/reel/<round>.mp3` and the `.txt` to Julien with your file-sending tool. If you have none, copy both to `docs/build/music/reels/`, commit them, and tell him the path.
7. **Stop.** Set STATE `step: listen`, `last_reel:`, and a `next:` line that names the round's question. Commit, push, open the pull request, send the message in section 10, and end the session.

## 6. Verify commands
```
npx tsc --noEmit 2>&1 | tail -5
npm test 2>&1 | tail -6
head -1 src/audio/manifest.ts | cut -c1-50
du -sb assets/audio | cut -f1
git status --short | grep -v ' assets/audio/\| tools/audio/\| docs/\| src/audio/manifest.ts\| AUDIOLOG.md\| \.claude/\| \.gitignore\| marketing/ad/README.md' | head -5
git status --short assets/audio/sfx | head -3
```
- `tsc` and the tests pass (the full suite includes the 25 MB audio cap and the stinger timing tests).
- The manifest's first line starts `// GENERATED`.
- The byte count is under 26214400.
- The last two commands print nothing: no file outside the audio lane changed, and the sound effects are byte-identical.

Do not edit `src/content/version.ts`. This track bumps no version; the version loop's next build stamps it.

## 7. Review prompt
`PREV` is the `review:` value in STATE.
```
Music rewrite track, round <round>. Follow the "Music rewrite track" section of your brief.
Direction: docs/PLAN-music-rewrite.md sections 2, 5 and 9. Cue sheet: docs/AUDIO.md. Code: tools/audio/.
Measures: docs/build/music/reports/ (this round's files: <the card ids of this round>).
Open notes and next IDs: <PREV>.
Effort: <as the round file says>.
tsc and the full test suite passed at this commit; don't ask for them.
Write your critique to docs/build/music/review-<round>-audio.md and return only the summary your brief's "Review file" section defines.
```
Record in STATE: the verdict, the three counts and the review file path. Nothing else.

## 8. Commit, push, pull request
Add paths by name. `git add -A` once committed a `node_modules` symlink from `tools/audio`.
```
git add .gitignore .claude/agents docs AUDIOLOG.md tools/audio assets/audio src/audio/manifest.ts marketing/ad/README.md 2>/dev/null
git status --short | grep 'node_modules\|tools/audio/build/\|tools/audio/banks/' | head -3      # must print nothing
git commit -q -m "music <round>: <one line>" -m "<this session's attribution lines>"
git fetch -q origin main && git rebase -q origin/main 2>&1 | tail -3
git push -q -u origin "$(git branch --show-current)"; git log -1 --format=%h
```
If the rebase stops on a conflict under `assets/audio/` or `src/audio/manifest.ts`, another branch rebuilt the audio: run `git rebase --abort`, push the branch as it is, and say so in your message to Julien. Don't resolve it.

A cloud session pushes only to its own `claude/` branch. When the session ends, open **one** pull request from that branch to `main`. Title: `music <round>: <what ran>`. Body, three lines at most: what was built, the checks, what Julien is asked. Then the attribution lines. Don't watch it.

If you have no pull-request tool: `gh pr create` fails in cloud sessions (it needs GraphQL). Write the body to `/tmp/pr.txt` and run `gh api repos/JulienMellon/IdleSliceHero/pulls -f title="…" -f head="$(git branch --show-current)" -f base=main -F body=@/tmp/pr.txt --jq .html_url | tail -1`.

## 9. Notes round
Julien answered with notes and no yes. The round stays the same.
1. Spawn a `composer` on `card-NOTES.md` with `extra: Julien's notes: docs/build/music/notes/<round>.md. Round: <round>.`
2. Verify, commit. No review.
3. Reel: `python3 tools/audio/reel.py <round> 2>&1 | tail -3` again (it reads the current files). Stop as in section 5, step 7.

Two notes rounds on one round without a yes: in your message, ask Julien whether the bank or the instrument list should change before a third, and name the two you would try.

## 10. Message to Julien at each stop (8 lines at most, then the track list)
1. What was built, in one line.
2. The evidence, as numbers: audio total in MB of 25; lead minus bed range in LU (R1 on); checks passed or the one that failed.
3. The audiocritic's verdict line and one line per bug or major (if a review ran). Say it reviewed code and measurements, not sound.
4. **The question** from the round file, with the default you will take.
5. The pull request link, and: "Merge it, then paste the start prompt with your answer on its last line. If you want this round thrown away, close the pull request instead and say so."
6. The reel's track list with start times.

## 11. If a composer dies (usage limit, session restart)
```
git status --short | head -12
grep -c '\[x\]' docs/build/music/<card file>
```
Relaunch the same card with one extra line: `Resume: some steps are already ticked in the card; run a full build first if tools/audio/build/report.json is missing, then continue from the first unticked step.`

## 12. Context budget
After a fix pass or a notes round, or if replies slow down, finish the current step, write an exact `next:` line in STATE, commit, push, open the pull request and end the session. A reel that Julien has not been sent is the one thing you never leave behind: build and send it before you stop, or say plainly that it is missing.

## 13. Close
After Julien's yes on R2: spawn a `composer` on `card-CLOSE.md`, verify, commit, set STATE `round: done`, open the pull request, and tell Julien in three sentences what is on `main` after the merge and what is still open (device checks AU39–AU41; `docs/build/v5.18/card-A2.md` now builds on this score).
