# v5.22 — read the shop yourself

**Scope (Julien, 2026-11-20):** `docs/PLAN-v5.20-onboarding.md`, version v5.22; DECISIONS #38–#41. His words: **"I don't actually want to direct the player to 'buy this' with red highlights. We need to communicate the state of the business earnings in multiple ways so finding the bottleneck and upgrading is the player's job."**

So after Chapter 1 the game never says what to buy and never colours a station for being the limit. The shop shows its state six ways at once:

| Channel | Card |
|---|---|
| 1. Piles: rolled dough on the pass, boxed pies on the counter, bags on the pickup shelf, sized by the backlog | S3 |
| 2. Workers: a swamped worker hurries and wipes their brow; an idle one leans, yawns, checks a phone; idle drivers sit on their scooters | S3 |
| 3. Customers: a line at the door; a customer who waits too long walks out with a frown bubble; empty tables | S3 |
| 4. Sound: oven dings stacking up, an unanswered phone, a bell on tips | A3 |
| 5. Symptom lines from heads and managers ("Dough's stacking up by the ovens, boss.") — never "buy X" | E3 + W3 |
| 6. The report: same-coloured capacity bars (pizzas a minute each station can handle, drivers included) against one dashed line for customers a minute; "Served 41/min · Missed 7/min" | E3 + U3 |

Upgrade cards show capacity ("Ovens · 18/min → 22"), not "+$/min" (U4). The report is live from a shop's first head hire and has a 3-step tutorial that explains how to read it and stops there (E4).

**Removed after Chapter 1:** the drawer's "Bottleneck: …" header, "Buy both" (pill and card), the tomato tint on tied station badges (G80), station names on the idle-drivers pill (D421), the red/amber/green lamps and "Slammed / Busy / Idle" chips, the "+$/min" previews. This reverses the 2026-11-13 decision to keep "Buy both" (DECISIONS #38).

**Out of scope:** the store (v5.23). The service score's effects (tipping, cold line) stay; only their colours and words change.

## Cards
| ID | Lane | What | Card |
|---|---|---|---|
| E3 | E | Report data: live from the first head, per-station and driver capacity, missed orders, symptom states and bark triggers | `card-E3.md` |
| W3 | T | Symptom lines for heads and managers; report tutorial; strip and sheet words | `card-W3.md` |
| U3 | U | The report strip and sheet, redrawn as bars against a demand line | `card-U3.md` |
| U4 | U | Upgrade cards show capacity; the pointers in the sidewalk and drawer go | `card-U4.md` |
| S3 | S | Piles, worker poses, walk-outs, idle drivers; the tomato tint and the pill's station names go | `card-S3.md` |
| E4 | E | The report tutorial (3 steps) and the chapter's `report` task | `card-E4.md` |
| A3 | A | Three quiet SFX that scale with the piles | `card-A3.md` |

## Waves
1. **E3 ‖ W3.**
2. **U3 ‖ S3.** Disjoint (`report/**` vs `scene/**` + `storefront.tsx`).
3. **U4** alone (it and E4 both edit blocks of `src/app/index.tsx`).
4. **E4 ‖ A3.** Disjoint. E4 uses the report targets U3 registered (U3 step 4). Launch A3 **only if** `docs/build/music/STATE.md` says `round: done`; otherwise mark it `blocked` in STATE, carry it, and go on: A3 owns the same files as the music track.
5. **Verify** (`L=v5.22`, `P=v5.21`). Expected changed shots: every live shop shot (piles, poses), the report, the sidewalk, the drawer. Commit, review.

## Reviews
- r1:
  - `critic` at **full** effort. Extra line: `Focus: with nothing pointing, can you find the shop's limit from the scene alone in under 10 seconds? From the report alone? Is anything still coloured or worded as "buy this"? Do the piles and poses read at phone size?`
  - `codecritic` at **medium**, paths `src scripts`, session's model.
  - `storycritic` at **medium** on `docs/story/COPY-v5.22.md`: every line describes a symptom; none prescribes.
  - `audiocritic` at **low**, only if A3 ran.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
|---|---|
| E | E3, E4 |
| U | U3 (report), U4 (cards, drawer, sidewalk) |
| S | S3 |
| T | W3 |
| A | A3 |

## Defaults
- **Colours:** one bar colour (basil `#4FA05B`) for every station; the demand line is ink, dashed. Nothing red in the report. Missed orders are a number, not a colour.
- **Symptom states** (E3): a station is `piling` when its output backlog stays above 2× one batch for 10 s; `idle` when it waited for input more than 60% of the last 20 s; drivers `idle` when more than half wait for 10 s; the floor `line` when customers wait at the door 10 s; `walkout` per customer who leaves.
- **Bark frequency:** a symptom line at most once per 45 s per shop, and only after the state has held 10 s; more frequent the longer a pile sits (45 s → 30 s after 2 minutes).
- **Who speaks:** a station's head about their station; the manager about the shop; before any hire, nobody (the scene and the report still show it).
- **Chapter 1 keeps its named purchases** (the second oven, Marco). Nothing after it names one.

## Close
README section 8. Report: verdicts, whether A3 ran, and what is open. Set STATE to v5.23 and stop.

## Added 2026-11-21 (S8, Julien): card S4
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| S4 | S | Sharded screenshot run (`--shard K/N`, `--jobs N`, merged report and layout) | `card-S4.md` |

**Wave:** run S4 first, alone, before wave 1. It edits `scripts/screenshots.py`, which other cards' fixture checks run, and it changes README section 5's verify line. **Fix routing:** owner S → S4.
