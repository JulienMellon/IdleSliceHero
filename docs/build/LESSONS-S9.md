# Lessons from session S9 (2026-11-22): transcript analysis

Source: the orchestrator's transcript and all 13 agent transcripts of the session that ran the v5.21 r4 fix, the music R2 notes round, and the v5.22 waves, r1 verify and reviews, and r2 fixes (PR #39). A script read 937 tool calls (`analyze.py` in that session's scratchpad; it is not kept in the repo).

## What went wrong, worst first

| # | Issue | Evidence | Fixed in |
|---|---|---|---|
| 1 | **Fresh container not ready.** No `node_modules`, no Python Playwright, no audio bank. | The first r4 verify crashed on `No module named 'playwright'`, and the orchestrator read `report.json` before the log. The composer worked out `apt-get update` + `fetch_bank.sh` by itself. | `scripts/session-setup.sh`; README §6; README §5 reads the log first; composer brief |
| 2 | **Cross-lane breakage found late.** | 3 PARTIAL reports and 15 follow-up SendMessages. E3 broke `voice.ts`, a type file and the Boston save, none in its card. U3 left 3 red tests and a stale fixture. All 3 v5.22 verify errors were older fixtures expecting removed text. Lane U ran `jest src/components` only, because the brief said not to run the full suite. | programmer brief: full `npm test` before reporting, grep for old names; README §11: card Files list the tests and fixtures |
| 3 | **Copy never landed.** W3 wrote 48 symptom lines in wave 1; no card put them into `voice.ts`. | The home shop was silent through the r1 reviews; E found it in r2. | README §4.1 "Copy lands in code"; README §11 |
| 4 | **Re-reading.** | `COPY-v5.22.md` and `service.ts` read by 6 agents each, `fixtures/README.md` by 5, `VERSION.md` by 4. `docs/API.md` (52K chars) read whole twice, because the spawn prompt said "Read docs/API.md". `storefront.tsx` read in three 21K chunks. 9–34 calls before each agent's first edit. The orchestrator grepped the music README five times to find the notes-round procedure. | spawn prompt: grep API.md; programmer brief "Reading"; README §4.1 wave notes; README §11 session files name the other track's sections |
| 5 | **Waiting that doesn't work.** | 36 sleep or poll loops on background runs; `sleep N; cat` blocked 3 times; `Monitor` called but not available. | programmer and composer briefs: run in the foreground with `timeout` |
| 6 | **Script edits.** | About 60 edits through Python heredocs or `sed -i` instead of Edit; about 10 failed (no match, wrong shape, a test file that wouldn't parse). One call to a lowercase `bash` tool. | programmer brief "Editing" |
| 7 | **Commit-hook noise.** | 18 stop-hook nags (14 uncommitted, 4 untracked), 9 WIP checkpoint commits, scratch shot folders hidden with `.git/info/exclude`, which a new container loses. | `.gitignore` `screenshots/tmp-*/`; README §6 checkpoint rule; scratch label rule in the programmer brief |
| 8 | **Process slips.** | Three programmers ran at once once (a resume counted as a fourth start). The codecritic said APPROVED with 4 mediums, over the gate's 3. | README §3 counting rule; codecritic brief applies the gate |

Not in a file: 2 agents were stopped by the 5-hour limit mid-round. Nothing was lost, and README §9 already covers resuming. The cloud environment has no setup script; `scripts/session-setup.sh` is the one to save there.
