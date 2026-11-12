# Franchise to Boston — Prestige Design (Slice Empire)

2026-10-29 · Julien

> Exported 2026-11-12 from the Claude Doc "Franchise to Boston — Prestige Design (Slice Empire)" (https://claude.ai/artifact/9uMDJs6y6gEJEau4FHx6aX). Written against build v3.3; line references and the "next after v3.6" build order are from then. The Doc is the source; edit there and re-export.

## Summary

Franchising is Slice Empire's planned prestige loop: after the player wins Port Marinara, they sell the city, keep a permanent earnings multiplier (Franchise Stars), and start over in Boston. None of it is built yet. The v3.3 finale ends on a goal bar reading "Port Marinara is yours! Franchising soon" (`src/app/index.tsx:88`), and the playtest flagged that dead end.

What the design docs already commit to:

- Franchising resets cash, pizzerias and upgrades in the current city, and pays out Franchise Stars (`docs/DESIGN.md`, Prestige).
- Each Star adds a permanent earnings multiplier; the earnings formula already includes it.
- City order after the home city: Boston, Chicago, New York, Los Angeles. Each new city has bigger numbers and one new twist, such as traffic or weather.
- Boston has a written cast of six, a lieutenant (Trish Vance) and two cameos. Genevieve's finale already sets it up: Victor Crust says he'll be waiting in Boston, and Nonna Rosa says to pack the sauce and a sweater.

Everything marked **Proposed** below is a starting specific for the session to correct, not a decision. The session needs to settle the Star formula, what resets versus persists, whether the home city can be revisited, Boston's twist, and how the story scales to a second city (section 9).

## Goals and non-goals

Prestige should turn the finale from a dead end into the start of a second, faster run through a new city.

**Goals**

- Give the post-finale player a clear next goal within one tap of the City map.
- Make a second run feel faster and richer than the first because of the Star multiplier, not repetitive.
- Keep the story spine: Victor Crust, Nonna Rosa and the MegaSlice war carry into Boston.
- Reuse the existing engine: shops, stations, managers, fleet and scenes behave the same in every city.

**Non-goals for this session**

- Designing Chicago, New York or Los Angeles beyond the rules already in `docs/DESIGN.md`.
- The dead-zone fix, the daily and weekly tasks, and any diamond shop. Those have their own tracks.
- Rewarded ads and the 2x ad boost.

## The franchise loop

A player becomes eligible to franchise once Genevieve's finale (`uptown-4`) has played and the home city is complete. Franchising is always the player's choice and never automatic.

**Proposed flow**

1. After the finale, the goal bar becomes a **Franchise** button on the City map.
2. Tapping it opens a confirm sheet showing the Stars this run would earn, the new multiplier, and exactly what resets.
3. On confirm, a short transition scene plays, the home city is archived, and the player lands in Boston with $0 and one empty lot.
4. Boston starts with the same tutorial-free opening as a new neighbourhood unlock: build the first pizzeria, hire a manager, expand.

**What resets and what persists**

| Item | Franchise behaviour | Status |
| --- | --- | --- |
| Cash, pizzerias, station levels, managers | Reset (from `docs/DESIGN.md`) | Decided |
| Fleet (bike to drone) | Reset | Proposed |
| Franchise Stars and multiplier | Persist | Decided |
| Seen scenes and Scrapbook | Persist | Proposed |
| Story-scene perks | Stay earned but apply only to their home-city shop | Proposed |
| Diamonds, daily streak, cosmetics | Persist | Proposed |
| Returning to Port Marinara | Not possible in the first version | Proposed |

## Franchise Stars and the multiplier

**Proposed:** Stars scale with the square root of the earnings made in the city, so a longer, better run pays more but with diminishing returns. Each Star adds a flat 10% of base earnings, summed rather than compounded. The divisor K is a calibration constant, to be set from the pacing sim so a clean first clear of about 3.7 hours yields roughly 10 Stars.

```latex
\text{Stars} = \left\lfloor \sqrt{\dfrac{\text{city earnings}}{K}} \right\rfloor \qquad \text{multiplier} = 1 + 0.10 \times \text{total Stars}
```

Worked values for the multiplier, which feeds the earnings formula already in `docs/DESIGN.md`:

| Total Stars | Multiplier |
| --- | --- |
| 10 | 2.0x |
| 25 | 3.5x |
| 50 | 6.0x |
| 100 | 11.0x |

Stars are never spent, only counted, which keeps the system to one number. Spending Stars on perks is a possible later layer.

## Boston

Boston is the second city: six neighbourhoods, one lieutenant, and one new mechanic. `docs/DESIGN.md` says each city has bigger numbers and a single twist such as traffic or weather.

**Proposed twist: winter weather.** Nonna's "Boston is cold" line already points this way. Periodic snow spells slow drivers by 30% for about 2 minutes, while walk-ins surge by 50%, so players lean on seating and counters during a spell. The values are placeholders to tune.

**Proposed numbers rule:** Boston's costs and order values are set so that, at 10 Stars (2.0x), the first Boston pizzeria pays itself back in about the same time as Downtown's first (around 90 seconds). The sim should set the actual base values.

**Cast (written in `docs/DESIGN.md`)**

| Neighbourhood | Character | Arc |
| --- | --- | --- |
| North End | Father Dom, priest | His church bake sale is losing to MegaSlice coupons |
| Southie | Kayla Dunn, bartender | Refuses to stock anything but local food |
| Back Bay | Preston Whitmore III, heir | Secretly wants to be a pizza chef |
| Fenway | Manny Ortiz, ballpark vendor | Fighting for a stadium food contract |
| Cambridge | Dr. Lena Ko, scientist | Building a "perfect pizza oven" that keeps exploding |
| Dorchester | Grandma Bea | Nonna Rosa's old rival who becomes her friend |

The lieutenant is Trish Vance, MegaSlice regional VP. Priya cameos to help fix Dr. Ko's oven, and Nonna Rosa visits for the Grandma Bea storyline.

## Story and scenes

The bridge already exists: Genevieve's finale has Victor Crust say he'll be waiting in Boston, and Nonna Rosa tell the player to pack the sauce and take a sweater. Franchising should pay that off with a scene, not a menu.

- **Franchise scene (Proposed):** one short scene on confirm. Nonna hands Port Marinara's day-to-day to her managers, and the player boards for Boston. It plays once, ahead of Boston's first neighbourhood.
- **Scene count:** `docs/DESIGN.md` sets 4 scenes per character (unlock, milestone, complication, resolution), so 6 characters give 24 scenes. Trish Vance appears across the complication and resolution beats and is defeated in the city finale.
- **Returning cast:** 1 to 2 favourites in supporting roles in about 3 to 4 scenes, and they grow between cities (Priya now leads a tech team).
- **Avoid repeating the formula (Proposed):** the playtest noted every beat 3 is a MegaSlice scheme and every beat 4 resolves from a pizza count. Boston's finales should each be something the player does, like a purchase or a goal, not only a count.
- **Pacing:** the story gate decided for v3.5 (one beat on return, then at most one per 90 seconds of play) applies in Boston too. Unlock beats stay immediate.

## Interactions with existing systems

**A conflict to resolve first:** `docs/REWARDS.md` says no feature grants a permanent gameplay advantage, with permanent rewards cosmetic and every income boost timed. Franchise Stars are a permanent multiplier, and the same doc's earnings formula already includes them. The story perks agreed for v3.5 also bend that rule. The doc should be reworded to allow Stars and small neighbourhood-scoped perks.

| System | Interaction | Proposed handling |
| --- | --- | --- |
| Story perks | Scoped to one neighbourhood's shop, so home-city perks don't apply in Boston | Each Boston character gets one small perk in their own neighbourhood |
| Offline cap (4h) | Sal's perk raises offline earnings in Industrial only | No change; Boston has no equivalent unless a character gets one |
| Fleet | City-wide upgrade, resets with the city | Rebuy in Boston; costs scale with the city |
| Cash rewards | Expressed as minutes of income | Works unchanged across resets |
| Scrapbook | Currently "Story n/24" | Needs a per-city view and a combined total |
| Pacing gate | One beat on return, then one per 90 seconds | Applies in every city |
| Daily and weekly tasks | Planned right after v3.6 | Task pool must be city-aware after the first franchise |

## Engineering notes

What the code looks like today, and what franchising would change. The first two points were checked in the source; the rest come from the code review and should be confirmed when work starts.

- `Scene.city` is typed as the literal `'home'` (`src/content/types.ts`), so it must widen to a city id before Boston scenes exist.
- The goal bar reads a `cityComplete` flag (`src/app/index.tsx:88`). Franchising needs a real eligibility check and a Franchise action, not just this label.
- Scenes are derived from delivery counts rather than stored in a queue, so Boston scenes need per-city counters.

**Proposed additions**

- Save fields: `stars`, `cityIndex`, and per-city shop state. This is a `SAVE_VERSION` bump with a `migrate` default of 0 Stars and city 0, and it lands after the v3.5 pacing migration so the two don't collide.
- A pure `franchise(state)` function in the engine that returns the next state, kept testable under ts-jest.
- Content for each city moves into its own module under `src/content/`, with the neighbourhood list selected by `cityIndex`.

**Tests to write first (each should fail on v3.3)**

- `franchise` resets cash and shops but keeps Stars and seen scenes.
- The Star formula returns known values at fixed earnings, including 0 for a tiny run.
- A pre-franchise save migrates to 0 Stars in city 0 without losing data.
- Earnings scale by the multiplier and not by anything else.

## Open decisions

Each row has a proposed answer to correct, rather than an open question.

| # | Decision | Proposed answer |
| --- | --- | --- |
| 1 | Star formula and the constant K | Square root of city earnings, +10% per Star, K set so a first clear gives about 10 Stars |
| 2 | Do Stars get spent? | No, counted only; revisit later |
| 3 | Does the fleet reset? | Yes |
| 4 | Can the player return to Port Marinara? | Not in the first version |
| 5 | Do home-city perks carry over? | Stay earned, apply only to home-city shops |
| 6 | Boston's twist | Winter weather: drivers 30% slower, walk-ins 50% higher for about 2 minutes |
| 7 | Franchise timing | Button after the finale, confirm sheet showing Stars gained |
| 8 | Boston's finales | Player-driven (a purchase or goal) rather than a pizza count |
| 9 | Scrapbook layout | Per-city tabs with a combined total |
| 10 | Reconcile `docs/REWARDS.md` | Reword to allow Stars and neighbourhood-scoped perks |
| 11 | Build order | After daily and weekly tasks, which follow v3.6 |

## Sources

All from the IdleSliceHero repo at build v3.3 (github.com/JulienMellon/IdleSliceHero):

- `docs/DESIGN.md`: Progression, Prestige (franchising), Economy, Story, City 2 cast (Boston), Pacing and format.
- `docs/REWARDS.md`: the no-permanent-advantage rule and the earnings formula with the Star multiplier.
- `src/app/index.tsx:88`: the "Franchising soon" goal bar.
- `src/content/types.ts`: `Scene.city` typed as `'home'`.
- `src/content/scenes/home.ts`: Genevieve's finale and the Victor and Nonna lines about Boston.
- `claude/HANDOFF.md` and the playtest review: the dead-end finale and the repeated scene formula.
