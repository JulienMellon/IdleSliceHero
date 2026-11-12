# Card R3 — return hooks (v5.14, lanes E and U)

Your card text is already in the repo. Read exactly this range and nothing else from that file:
```
sed -n '57,83p' docs/PLAN-v5.14-retention.md
```
It gives the three features (Nonna's night oven, the welcome-back gift, the next-scene teaser), the fixtures to append (51–55), the files and the checks.

## Additions
- Card B3 edits fixtures 45 and 46 in `scripts/screenshots.py` at the same time. Append 51–55 at the end of the fixture list and touch nothing else in that file.
- `game.ts` is 1,195 lines. Read only what you need: `grep -n "offlineCapSeconds\|applyOffline\|export function migrate\|SAVE_VERSION" src/engine/game.ts`, then read around those lines.
- Old saves must load: add a test that migrates a save without the night-oven field.

## Progress (append one line per feature as its checks pass: `night-oven`, `gift`, `teaser`, `fixtures`)
