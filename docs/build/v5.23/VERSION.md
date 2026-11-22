# v5.23 — the Store, introduced; packs and diamond boosters

**Scope (Julien, 2026-11-20):** `docs/PLAN-v5.20-onboarding.md` version v5.23 and `docs/PRICING-STRATEGY.md` §3–§6; DECISIONS #42–#45. His words: "When [the starter pack] is offered is a good moment to introduce the game's store, show it to the player and offer the starter pack for purchase in the store." "When communicating the increase value of packs we should not be discussing this as 'worth $5.57+'." "I think we can have timed income boosts."

What the player gets:
- The Store chip from the moment the Starter Pack is first offered (the end of Chapter 1), with every Shop tab open (DECISIONS #47). Nonna leads the player into the Shop's Store tab with the Starter Pack card lit; "Not now" closes the Shop and the pack stays at the top until bought. The pop-up sheet is gone.
- Starter Pack: 400 💎, the Founder awning, 2× income 24 h, $2.99.
- Diamond packs shown as "400 + 100 bonus" / "800 + 400 bonus"; "Best rate" on the $9.99; the first buy of each pays double.
- Diamond boosters on the Boosters tab: Rush Hour 1 h 30 💎, Dinner Service 4 h 90 💎, Big Night 12 h 220 💎, all 2×, in one paid-boost slot that extends and never stacks.
- Value said in game units only: "Enough for 2 shop looks", "Only in this pack", "≈ $1.4M at your shop's pace" (in-game cash). Never "worth", struck-through prices or countdowns.

**Needs Julien before this version ships to the App Store (not before it is built):** the Starter Pack's description in App Store Connect says 400 diamonds. The web stub prices are enough to build and review.

**Out of scope:** the bigger looks catalog and the $19.99 pack (v5.24). Prices in the store stay the store's localized strings (never typed in).

## Cards
| ID | Lane | What | Card |
|---|---|---|---|
| W4 | T | Nonna's Store intro, card copy, booster names and lines, Plus line, reminder line | `card-W4.md` |
| N1 | N | Pack contents, first-buy 2×, "Best rate", the Store tab's cards | `card-N1.md` |
| E5 | E | The paid-boost slot and diamond boosters | `card-E5.md` |
| U5 | U | The Store chip from Chapter 1; Vanity locked until the takeover; Boosters tab shop; reminder dot | `card-U5.md` |
| E6 | E+N | The Store intro (tutorial step 16), removing the Starter pop-up | `card-E6.md` |

## Waves
1. **W4 ‖ E5.**
2. **N1 ‖ U5.** Disjoint: N1 owns `src/components/store/**` and `src/services/**`; U5 owns `src/app/shop.tsx`, `endgame/**`, `diamond-chip.tsx`.
3. **E6** alone.
4. **Verify** (`L=v5.23`, `P=v5.22`), plus `python3 scripts/store_shots.py` if the store fixtures live there. Commit, review.

## Reviews
- r1:
  - `critic` at **full**. Extra line: `Focus: is every price the store's own string? Does any card say "worth", "value", "save", show a struck-through price, a countdown or "limited"? Is "Best rate" true by diamonds per dollar? Is "Not now" as big as Buy? Can a player who said "Not now" find the pack again in one tap?`
  - `codecritic` at **high** (paths include `src/services` and purchases), paths `src scripts`, session's model.
  - `storycritic` at **low** on `docs/story/COPY-v5.23.md`.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
|---|---|
| N | N1, E6 (the pop-up removal) |
| E | E5, E6 (tutorial) |
| U | U5 |
| T | W4 |

## Defaults
- **Prices and amounts** exactly as `docs/PRICING-STRATEGY.md` §3 and §4.
- **First-buy 2×:** per diamond pack product id, once per Apple ID (it rides the ledger, so a restore doesn't repeat it; a reinstall without a restore may show it again, which is acceptable).
- **Paid-boost slot:** 2×, time adds up to 24 h remaining; a booster that would pass 24 h is refused with "Your Big Night is still running" style copy and no diamonds taken.
- **"≈ $X at your shop's pace":** current citywide income (rewards' income, which ignores boosts) × the boost's seconds, formatted with `money()`, prefixed "≈".
- **"Enough for N looks":** medium looks (150 💎) the player doesn't own; hidden when 0.
- **Plus card line:** the count of ad rewards the player took in the last 7 days; hidden when 0.
- **Reminders:** a dot on the Store chip once at the takeover if the pack isn't owned; one Nonna line the first time an unaffordable look is opened. Never a pop-up.
- **Analytics:** `store_opened{from}`, `pack_card_seen{id}`, `booster_bought{id}`.

## Close
README section 8. Report: verdicts, the App Store Connect change Julien must make, what is open. Set STATE to `version: 5.23b` (the cleanup step, `docs/build/v5.23b/VERSION.md`; Julien 2026-11-22), `step: waves`, `round: r1`, and stop. v5.24 starts after v5.23b closes.
