# Session 1 — the loop update (no game change)

**Start check:** `grep -n '^version:\|^step:\|^last_shots:' docs/build/STATE.md` must show `version: 5.15-loop`. If it shows anything else, this is the wrong file: stop and tell Julien what STATE says.

**VERSION file:** `docs/build/v5.15-loop/VERSION.md`. It overrides the README in four places (no version bump, no critics, programmers may run the screenshot script, its own verify block). Follow it.

## Do
1. Waves in its order: Q2 + Q6, then Q1, then Q3, then Q4. One programmer at a time from wave 2 on.
2. Its verify block. A failed line goes to the card that owns the check, with at most 10 failing lines.
3. Its "Commit and close" section, with one change: set STATE's `next:` to `fresh session; read docs/build/sessions/S2-v5.16-first-half.md`.

## Context rules (they outrank habit; the README's rules still apply)
- Read these files and no others: this one, `docs/build/README.md`, `docs/build/STATE.md`, and the one VERSION file named above. Never a card, review, source file, log, screenshot, diff body, or another file in this folder.
- Every command you run ends in `| tail -n N` (N ≤ 15), `| grep …`, or a redirect to a file.
- Agents: only the types README section 3 lists, always in the background, card passed by path with the README's spawn prompt and this one added line: `Keep your final report under 12 lines.` Never Explore, Plan or general-purpose. Do not poll and do not open an agent's transcript.
- From an agent's report keep one word per card (and the `Needs:` line if there is one). Write it to STATE at once, so nothing depends on your memory of the report.
- Update STATE after every wave. If your context is summarised, or you have run two fix rounds, finish the current step, write an exact `next:` line, do the "End" steps below and stop.
- Load no skill and no extra tool except the one that opens the pull request at the end.
- Ask Julien only what README section 4 says to ask. Otherwise apply the defaults in the VERSION file.

## End
- Commit and push as README section 6 says (the session's own branch, never `main`).
- Open one pull request from that branch to `main` (Julien asked for one per session, DECISIONS #34). Title: the commit's first line. Body: three lines at most (what ran, the gate result, what is next), then the attribution lines. Do not watch it.
- Tell Julien in 2 to 4 sentences: verdicts or checks, bugs and majors only, the PR link, and the name of the next session file. Then stop.
