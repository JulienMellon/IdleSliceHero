# v5.25 — economy refit and pacing (scope only; cards not written yet)

**Scope (Julien, 2026-11-22):** "Make all economy refit and pacing work part of v5.25. Skip all refit and pacing until then." Every economy, tuning and first-session pacing item waits for this version. v5.23b and v5.24 don't touch `src/content/tuning.ts`, `scripts/pacing-*.ts` or a story trigger threshold.

**Status:** this version has no cards yet. A planning session with Julien writes them (README section 11) before any wave runs. Its STATE step is `setup`.

## What is parked here
- **The refit parked in STATE since v5.19** (Julien): one pizza per tap, +1 per 10 prep levels; home tops out at about $10M, with Suburbs at about $30K; the first goal under $50; `ECONOMY` 3 → 4, with old saves reset.
- **D493** (critic, open since round 68): session 1 meets every layer at once (the rival, Game Day, the boats, the cameo). Fix: open the rival after Suburbs ★2, and give each layer its own first session.
- **D495** (critic, open since round 68): the first 20 s ends near $0, and tutorial step 14 asks $400 at about $0.6/s (about 10 minutes of waiting). Fix: the first goal under $50, and pops on the first serves.
- Until v5.25 closes them, the critic carries D493 and D495 with `sev` = `parked`, and they don't count toward the gate (card Q7 of v5.23b).

## Questions for the planning session
- Does the `ECONOMY` 3 → 4 save reset still hold now that the Store (v5.23) and the looks catalog (v5.24) exist? A reset would wipe purchased diamonds and looks unless they are carried over.
- What pacing target should the sim hold: the city's completion time, and the longest gap between story beats?
- Does Boston get refit in the same version?
