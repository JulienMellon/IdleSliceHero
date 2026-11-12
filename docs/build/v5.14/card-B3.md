# Card B3 — scene minors (v5.14, lane S)

Your card text is already in the repo. Read exactly this range and nothing else from that file:
```
sed -n '40,56p' docs/PLAN-v5.14-retention.md
```
It gives the notes (D439, D440, D430, D428, D432, the `cheer` pulse), the rules, the files and the checks.

## Additions
- Report the cheer pulse's exact name on a line starting `Pulse:`. Card C3 depends on it.
- Fixtures 45 and 46 are in `scripts/screenshots.py`. Card R3 appends fixtures 51–55 to the same file at the same time; touch only the 45/46 blocks.

## Progress (append one line per note as its check passes)
- D439 done: pill lowered to z 84 (clear of faces), kept right of the back row (tagLeft), pops no longer lifted, pill fades while a pop would land on it; budgets in crowd.test.ts (D439 describe).
- D440 done: badge MILE_SHIFT 20 down-right (clamped), speech pills clamp between the walls (bubbleWalls/bubbleX); budgets in moments.test.ts.
- D430 done: 3 drivers at 30 pitch, feet 7 in front, diners only where no table set stands behind them (rest in the pill, "N waiting" with no figure); budgets in crowd.test.ts/scene.test.ts.
- D428 done: fixtures 45/46 moved to footprints 2/3 (decks always seated there); patio sets dropped where they would push the board/prop under the vehicle; patio-deck.test.ts.
- D432 done: lawn strip (bed ±30 x 10.5 deep) and two shrubs behind the pickets; street-props.test.ts. The picket exists only in the Suburbs, so nothing to remove elsewhere.
- cheer pulse done: pulse-bus.ts onCheer/emitCheer/CHEER_SECONDS (1.2 s); buildCast `cheer` -> cooks act 'cheer'; pulse-bus.test.ts, geometry.test.ts.

