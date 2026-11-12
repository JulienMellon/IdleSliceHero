# Card W1 — copy for v5.15 (writer)

**Write one file:** `docs/story/COPY-v5.15.md`. Programmers copy from it by key, so every entry needs its key.

**Read for voice:** `docs/story/CAST.md`; `sed -n '91,112p' docs/DESIGN.md`; the six files under `src/content/scenes/home/`; `grep -n "MILESTONE_LINES" -A 30 src/components/scene/ladder.ts | head -60` for the existing milestone lines; `grep -n "VISITOR_LINES" -A 8 src/content/rewards.ts`.

## Sections to write
1. **Recipe cards (24).** Four per neighbourhood, tied to that neighbourhood's character and food. Key `recipe.<hood>.<1-4>`. Each: a name (≤ 24 chars) and one flavour line (≤ 60 chars). Card 1 drops at a station's level 50, card 2 when the General Manager is hired, card 3 when the finale is won, card 4 for defending a counter-attack there. Let the line fit the moment.
2. **Head barks.** For each shop's three station heads (prep, oven, counter): find their names in the scenes and CAST; where a shop's heads have no names yet, name them and list the names in a table at the top of the section. Four barks each, ≤ 40 chars: `milestone`, `rush`, `attack` (MegaSlice is targeting the shop), `week` (they are Head of the Week). Key `bark.<hood>.<station>.<kind>`. 72 lines.
3. **Victor's weekly counter-attack.** Six announcements, one per shop, from Victor Crust or Todd, ≤ 90 chars, key `attack.<hood>.open`. One win line and one lose line per shop from that shop's character, keys `.win` and `.lose`. The challenge chip title (≤ 28 chars) and the banner line (≤ 44 chars).
4. **Rush-hour events.** "Friday Night Rush" and "Big Game Day": a banner (≤ 28 chars), a countdown chip (≤ 20 chars, with `{time}`), and one start line each from a fitting character.
5. **Mastery.** Names for the three stars (all heads hired, Flagship, golden ovens), ≤ 16 chars each; a toast line per star (≤ 44 chars, with `{shop}`); the all-18 line.
6. **Post-story.** Goal-bar strings: `Mastery {n}/18`, the next-star hint (≤ 44 chars, with `{shop}` and `{star}`), and the "Coming soon: Boston" card: title, two lines (≤ 60 chars each), and Nonna's sign-off. Don't promise a date.
7. **Shop text.** Names and one-line descriptions (≤ 50 chars) for: `oven-gold`, `storefront-skin`, `oven-woodfired`, `scooter-mint`, `neon-counter`, `awning-gold`, `plaque-master`. Section titles for the vanity shop and the booster shelf, and the empty-shelf line.
8. **Nonna's day-30 cameo.** Six short lines (≤ 40 chars) she says from inside the shop during her week. Keep her existing visitor line as it is.

## Protected
Don't rewrite existing lines. This card only adds.

## Report
Standard writer report, with counts per section.
