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
