# v5.24 — a looks catalog worth saving for

**Scope (Julien, 2026-11-20):** `docs/PRICING-STRATEGY.md` §2 and §3; DECISIONS #43 and #46. An engaged free player earns about 900 💎 a month and today's six looks cost 900 in all, so a diamond pack has nothing to buy. This version grows the catalog to about 30 looks in three tiers, with a set per home neighbourhood and a weekly Featured row, and adds the $19.99 pack.

| Tier | Price | Examples |
|---|---|---|
| Small | 60 💎 | menu board, aprons, napkins, tip jar, door chime |
| Medium | 150 💎 | today's items; one hero piece per set |
| Large | 400 💎 | full storefront themes |

- **Sets:** one per home neighbourhood (Downtown classic, Suburbs diner, Waterfront dockside, University dorm, Industrial brick, Uptown marble), 4 pieces each (1 large storefront theme, 1 medium, 2 small). A set's pieces show in its own shop; generic looks show everywhere. Completing a set plays a small flourish (the shop's customers cheer, confetti from the sign) once.
- **Featured this week:** 4 looks shown first on the Vanity tab, rotating by ISO week. Never limited, no timer: everything stays buyable.
- **$19.99 pack** `diamonds_2600`: 1,600 + 1,000 bonus. "Best rate" moves to it automatically (N1's computation).
- Target: about 30 looks and about 6,000 💎 in total.

**Needs Julien before this version ships to the App Store:** create `diamonds_2600` ($19.99, consumable) in App Store Connect and RevenueCat. The web stub needs only its id.

**Out of scope:** new cities; paid random rewards (never).

## Cards
| ID | Lane | What | Card |
|---|---|---|---|
| W5 | T | Names for every new look and set; the Featured header; the set-complete line | `card-W5.md` |
| E7 | E | Catalog data: tiers, prices, parts, where each is worn, sets, the Featured rotation, set-complete | `card-E7.md` |
| S4 | S | Art: Downtown, Suburbs and Waterfront sets, and the generic small looks | `card-S4.md` |
| S5 | S | Art: University, Industrial and Uptown sets; the set-complete flourish | `card-S5.md` |
| U6 | U | The Vanity tab: Featured, tiers, sets with progress | `card-U6.md` |
| N2 | N | The $19.99 pack | `card-N2.md` |

## Waves
1. **E7 ‖ W5.** W5 reads E7's `catalog.md`, which E7 writes in its step 1 before any code: launch W5 when E7 reports that step (`Needs: catalog.md written`; E7 keeps going). If that is awkward, run E7, then W5. E7 uses its ids as placeholder names; U6 copies W5's names.
2. **S4 ‖ N2.**
3. **S5 ‖ U6.** Disjoint (`scene/**` vs `endgame/**` + `shop.tsx`). S4 and S5 both own `scene/cosmetic-props.tsx` and `scene/cosmetics.ts`, which is why they are in different waves.
4. **Verify** (`L=v5.24`, `P=v5.23`). Commit, review.

## Reviews
- r1:
  - `critic` at **full**. Extra line: `Focus: does each set read as its neighbourhood at phone size? Does any look cover a station, a head, a badge or the WELCOME mat? Is every price on the tab one of 60, 150, 400? Is anything presented as limited?`
  - `codecritic` at **medium**, paths `src scripts`, session's model (save fields).
  - `storycritic` at **low** on `docs/story/COPY-v5.24.md`.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
|---|---|
| E | E7 |
| S | S4 (its sets and small looks), S5 (its sets, the flourish) |
| U | U6 |
| N | N2 |
| T | W5 |

## Defaults
- **Ids:** `<part>-<set>` (`awning-diner`, `facade-dockside`) and `<part>-<name>` for generic small looks.
- **Parts that can be worn at once:** one per part (awning, facade, oven, counter, sign, scooter, menu board, aprons, table cloths, tip jar). Wearing a set piece in its own shop replaces the generic look of that part there.
- **Existing owners keep everything;** today's 7 looks keep their prices (150) and become Medium. The day-28 storefront skins and the Founder awning stay outside the shop.
- **Featured:** 4 looks, chosen by `ISO week mod` over the catalog so every look is featured within ~8 weeks; owned looks are skipped.

## Close
README section 8. Report: verdicts, the catalog's count and total diamond price, the App Store Connect item Julien must create, what is open. Then stop: the next scope is Julien's call.
