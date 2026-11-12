# v5.15 — Endgame, economy close-out, collections and cosmetics

**Scope:** wishlist sections 2 (mastery stars, Victor's weekly counter-attack, post-story goal bar, golden ovens and Flagship reachable), 3 (walk-ins remainder, the economy decision, the save marker C106), 5 (recipe cards, head personalities, rush-hour events), 7 except ad buttons (cosmetics drawn, vanity shop, booster shelf, collection line), and Nonna's day-30 cameo and the "Boston: coming soon" card from section 6.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| W1 | T (writer) | All new copy for this version, one file | `card-W1.md` |
| E1 | E | Mastery, counter-attack, events, recipes, C106, one refit | `card-E1.md` |
| U1 | U | Goal bar, end card, banners, collection, shops, ×10/MAX | `card-U1.md` |
| S1 | S | Cosmetics drawn and worn, head reactions, Nonna's cameo | `card-S1.md` |

## Waves
1. **W1 + E1** in parallel.
2. Doc review: `storycritic`, **low effort**, on `docs/story/COPY-v5.15.md` only (no screenshots, no code). Review file `review-r0-story.md`. If it returns majors, send them to the W1 writer (owner T) once, then go on.
3. **U1 + S1** in parallel. `extra` for both: `Copy: docs/story/COPY-v5.15.md. Engine API: docs/API.md (regenerate with npx tsx scripts/api-digest.ts if card E1's exports are missing).`
4. Verify, commit, review, fix rounds.

Every card also gets: `extra: Carried notes: rows with your owner letter in <last v5.14 critic review file>`.

## Reviews
- r1: `critic` full effort; `codecritic` full effort, range `5d82004..HEAD`, paths `src/engine src/store src/app src/components/*.ts src/components/*.tsx` (scene art at low priority). For this version only, `PREV` is: `CODELOG.md, section "Current state" (round 24); open items C106, A22/M50, A17/M32; next IDs K1, C110, A30, M62, U12, T85`.
- r2, r3: medium re-checks of whichever critic was not satisfied.
- `storycritic`: only the wave-2 doc review. `audiocritic`: not run.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E1 |
| U | U1 |
| S | S1 |
| T (strings) | U1, S1 |

## Defaults (apply without asking; Julien may correct them later)
- **Economy:** keep the v5.13 fit and its post-build spree. Add a ×1 / ×10 / MAX buy toggle on the sidewalk so the spree is a few taps.
- **Booster shelf:** boosters are never sold for diamonds. `docs/REWARDS.md` and the monetization plan both say diamonds are vanity-only. The shelf shows the inventory and activates boosters; buying comes with ads and purchases in v5.17.
- **Mastery and cosmetics:** stars 6 and 12 each grant the next weekly cosmetic the player doesn't own; 18 stars grants a new cosmetic, `plaque-master`.
- **C106 policy:** stamp `economy: 2` on every save; change no cash. There are no outside players before TestFlight.
- **Refit targets:** story days stay within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8; all 18 stars between day 10 and day 14 for the check-in player.

## Close
After APPROVED, set `codecritic_range_start` to this version's closing commit.
