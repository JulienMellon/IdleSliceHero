# v5.25: economy refit, shop renovation and pacing

**Scope (Julien, 2026-11-22, cards set 2026-11-28 in S12):** flatten the Home city onto a 20K → 1.5M ladder, sell one pizza per tap, make the first goal under $50, and open Suburbs at about 20 min. Add shop renovation so earlier shops keep earning. Spread the layers across sessions (D493). Add free gifts. Close the carried items Julien picked.

## Decisions (Julien, 2026-11-28)

### Economy
- **Save reset:** `ECONOMY` goes from 3 to 4 with a **full reset** (pre-launch). Nothing carries over, including diamonds, looks and standing IAP grants.
- **Taps:** one pizza per tap, +1 per 10 prep levels.
- **Hood opening prices:**

  | Downtown | Suburbs | Waterfront | University | Industrial | Uptown |
  |---|---|---|---|---|---|
  | $0 | $20K | $80K | $200K | $500K | $1.5M |

  Downtown's own upgrades top out at about $10M of total spend. Managers, heads, stations and decor scale to match.
- **Boston:** follows Home through its scaling rule and is not hand-tuned (still on hold). `pacing-sim` must pass.
- **Whole numbers on screen:** gains may be fractional inside the engine, but the player only ever sees whole numbers (K/M suffix forms such as `$1.5K` are fine).
- **First goal:** under $50, reachable in about 20 s, and the first serves pop cash (D495).

### Pacing
- Suburbs opens at 20 ± 2 min of active play.
- The longest gap between story beats is at most 3 min.
- The Home city takes about 7 days, with the sim player renovating.
- **D493:** session 1 is the shop and its first goals. Then:
  - boats at Downtown ★★ (and Waterfront built, if boats need it);
  - Game Day at the Suburbs unlock;
  - cameo at Suburbs ★;
  - rival at Suburbs ★★.

  No two of these first appear in the same session.

### Renovation
- A shop at ★★★ can be renovated up to 3 times.
- Its stations go back to level 1.
- The shop keeps x2 / x3 / x4 income.
- **Each renovation unlocks:**
  - a plaque I/II/III;
  - 1 fixture upgrade;
  - 3 new cash decor items.

  That is 18 fixtures and 54 decor items in all.
- Franchising resets renovations.
- Downtown and Suburbs each earn ≥ 10% of total income at every later hood opening.

### Other items
- **Free gift:**
  - the first comes at 2 min of active play, then one every 4 h of real time, and only 1 can wait;
  - it holds 5 min of income in cash, and every 3rd gift also holds 10 💎;
  - the player picks it up in the shop scene, and it plays a full reward moment.
- **Offline:** every paid boost kind applies to the offline time it still covers.
- **Starter Pack:** same price. About $7K cash, 400 💎 and 2x for 30 min. The LAUNCH-TRACK description is updated to match.
- **Audio:** `splash_theme` is wired, the 3 ShopEars SFX are made audible, and renovation and gift sounds come from the existing bank. No music decision is needed.

**Needs Julien before v5.24 ships (carried):** create `diamonds_2600` ($19.99, consumable) in App Store Connect and RevenueCat. After v5.25: paste N3's new Starter Pack description into App Store Connect.

**Out of scope:** Boston retune by hand; new cities; paid random rewards (never).

## Cards
| ID | Lane | What | Card |
|---|---|---|---|
| E8 | E | The curve: ECONOMY 4 reset, taps, hood ladder, whole-number formatter, first goals, session-1 pacing | `card-E8.md` |
| N3 | N | Starter Pack grant and LAUNCH-TRACK description | `card-N3.md` |
| E10 | E | Renovation engine and data, `renovation.md`, 7-day pacing and old-shop share | `card-E10.md` |
| W6 | T | Copy: renovation, free gift, Starter Pack, story fixes (S97, S106, 9 story minors) | `card-W6.md` |
| E9 | E | Layer gates (D493), free-gift engine, offline with paid boosts | `card-E9.md` |
| S6 | S | Renovation art for Downtown, Suburbs and Waterfront; first-serve cash pop | `card-S6.md` |
| S7 | S | Renovation art for University, Industrial and Uptown; the gift prop | `card-S7.md` |
| T3 | T | Puts W6's copy and the story fixes into code | `card-T3.md` |
| U7 | U | Renovation offer, confirm and moment; gift moment; whole numbers on screen; U40 | `card-U7.md` |
| A6 | A | splash_theme, ShopEars SFX, renovation and gift sounds | `card-A6.md` |

**Copy lands in code:** W6 → T3. N3 and U7 switch their placeholders to T3's keys (WAVE-NOTES).

**extra (every card):** `Carried notes: rows with your owner letter among U40 C203 C207 C208 T146 C179 A45 C196 S97 S106 in docs/build/v5.24/review-r3-code.md, D577 D586 D572 D573 D564 D570 in docs/build/v5.24/review-r3-critic.md, and the rows of docs/build/v5.24/review-r1-story.md (read only each file's "## Open notes" table). Fix the bugs and medium rows first; say which you left.`

## Waves
1. **E8 ‖ N3.** N3 needs E8's Starter Pack cash. If E8 hasn't reported yet, N3 uses $7,000 and E8's number replaces it in r2.
2. **E10 ‖ W6.** Launch W6 when E10 reports `Needs: renovation.md written`, and E10 keeps going. If that is awkward, run E10, then W6.
3. **E9 ‖ S6.** Disjoint (`src/engine` vs `src/components/scene`).
4. **S7 ‖ T3.** S7 follows S6 because they share `scene/**`.
5. **U7 ‖ A6.**
6. **Verify** (`L=v5.25`, `P=v5.24-r3`). Commit, review.

After each wave: `npx tsc --noEmit 2>&1 | tail -3` and `npm test 2>&1 | tail -6`, and append WAVE-NOTES (the E cards' event and selector names, S6's component names, T3's keys).

## Reviews
- **r1:**
  - `critic` at **full**. Extra line: `Focus: the first 3 minutes (first goal under $50, cash pops, no rival, Game Day, boats or cameo), the Renovate offer and confirm read plainly at phone size, both reward moments are centre stage, no decimal point anywhere on screen. Close D493 and D495 if they hold.`
  - `codecritic` at **medium**, paths `src scripts`, on the session's model (save migration, `src/store`, `src/services`).
  - `storycritic` at **low** on `docs/story/COPY-v5.25.md`.
  - `audiocritic` at **low**, `model: sonnet`, on `docs/AUDIO.md` and the A6 diff.
- **r2, r3:** medium re-checks.

## Fix routing
| Owner | Cards |
|---|---|
| E | E8 (curve, formatter, pacing), E10 (renovation), E9 (gates, gift, offline) |
| N | N3 |
| T | T3 |
| S | S6 (Downtown, Suburbs, Waterfront), S7 (University, Industrial, Uptown, gift box) |
| U | U7 |
| A | A6 |

## Defaults
- **Renovation cost:** starts at 3x the next unopened hood's price × level. The sim may change it; a renovation should pay back within about 30 min of that shop's income.
- **Renovation keeps:** cash, managers, heads, hood unlocks, decor bought before. Only station levels reset.
- **Renovation multiplier:** applies to that shop's income only, not to tap income in other shops.
- **Gift:** cash = 5 min of income at claim, whole dollars. Diamonds on every 3rd claim (10 💎). Ready time counts while offline. 1 waits at most.
- **Gift box spot:** a free floor spot in the shop, never on the WELCOME mat, a station or a head.
- **Rate format:** under $1/s shows as `$N/min`, under $1/min as `<$1/min`.
- **Starter Pack cash:** E8's "one third of the way to Suburbs", rounded to the nearest $500 (default $7,000).
- **Cameo:** if the day-30 visit and the Suburbs ★ cameo are different things, keep both.
- **Boats:** whichever comes later, Downtown ★★ or the Waterfront build.
- **SFX for renovation:** the biggest celebratory sound already in the bank. For the gift: a lighter one.

## Close
README section 8. Report: verdicts, bugs and majors only, the hood ladder's days, and the old-shop share. Remind Julien to paste the new Starter Pack description into App Store Connect. Set STATE to `version: 5.26`, `step: waves`, `round: r1`, `next: wait for Julien to set the next scope`.
