# v5.22 copy: symptom lines, report words, report tutorial (card W3)

Placeholders: `{n}`, `{served}` and `{missed}` are orders a minute, filled by the report. Triggers: `pile` is the station's output stacking up (dough by the oven, pies on the counter, bags on the pickup shelf); `idle` is the head waiting with nothing to do.

## 1. Head symptom barks

| Key | Speaker | Text |
| --- | --- | --- |
| `bark.downtown.prep.pile` | Marco | Dough mountain by the oven! I made that! |
| `bark.downtown.prep.idle` | Marco | Hands free! I floured myself. For fun. |
| `bark.downtown.oven.pile` | Lucia | My pies pile up on the counter, cooling. |
| `bark.downtown.oven.idle` | Lucia | My oven is hot and empty. It hates that. |
| `bark.downtown.counter.pile` | Benny | Bags piling on the shelf. All regulars! |
| `bark.downtown.counter.idle` | Benny | Nothing to ring up. Reciting usuals. |
| `bark.suburbs.prep.pile` | Patty | Dough’s piling by the oven! All labeled! |
| `bark.suburbs.prep.idle` | Patty | Idle hands! Labeling the labels. |
| `bark.suburbs.oven.pile` | Hank | Pies stack on the counter like patties. |
| `bark.suburbs.oven.idle` | Hank | A hot fire, nothing in it. Sad, sport. |
| `bark.suburbs.counter.pile` | Kayla | Bags on the shelf. So many bags. Cool. |
| `bark.suburbs.counter.idle` | Kayla | Counter’s dead. I’m on my phone. |
| `bark.waterfront.prep.pile` | Finn | Dough’s piled by the oven like wet rope! |
| `bark.waterfront.prep.idle` | Finn | Nothing to roll. Tying knots. Untying. |
| `bark.waterfront.oven.pile` | Gus | Pies on the counter, listing to port. |
| `bark.waterfront.oven.idle` | Gus | Hot oven, nothing in it. Dead calm. |
| `bark.waterfront.counter.pile` | Coral | Pickup shelf’s full. No berths left. |
| `bark.waterfront.counter.idle` | Coral | Counter’s clear. Nothing in the harbor. |
| `bark.university.prep.pile` | Raj | Dough by the oven: piling. Graphing it. |
| `bark.university.prep.idle` | Raj | Free cycles. Optimizing my nap. |
| `bark.university.oven.pile` | Mei | Pies pile on the counter. Temp falling. |
| `bark.university.oven.idle` | Mei | Oven’s at temp. Empty. Control group. |
| `bark.university.counter.pile` | Tyler | So many bags on the shelf, bro. Wild. |
| `bark.university.counter.idle` | Tyler | No pies to hand out, bro. Just vibes. |
| `bark.industrial.prep.pile` | Stan | Dough piling by the oven. On the record. |
| `bark.industrial.prep.idle` | Stan | Hands idle. Break’s still at the bell. |
| `bark.industrial.oven.pile` | Ox | (Pies pile up on the counter. Ox frets.) |
| `bark.industrial.oven.idle` | Ox | (Ox stares into the empty oven. Sighs.) |
| `bark.industrial.counter.pile` | Rita | Shelf’s full of bags, hon. Poor things. |
| `bark.industrial.counter.idle` | Rita | Counter’s empty, hon. Crossword time. |
| `bark.uptown.prep.pile` | Pierre | Dough heaped by the oven. Like a buffet. |
| `bark.uptown.prep.idle` | Pierre | Nothing to roll. At last, time to sulk. |
| `bark.uptown.oven.pile` | Margot | Pies stacked on the counter. Inelegant. |
| `bark.uptown.oven.idle` | Margot | Empty oven. I almost miss croissants. |
| `bark.uptown.counter.pile` | Sterling | Bags on the shelf, unclaimed. Unseemly. |
| `bark.uptown.counter.idle` | Sterling | Empty counter. I’m polishing the bell. |

## 2. Manager symptom lines

| Key | Speaker | Text |
| --- | --- | --- |
| `manager.downtown.line` | Nonna Rosa | A line at my door! Like the old days! |
| `manager.downtown.drivers-idle` | Nonna Rosa | My drivers sit and eat my pizza. Ay, ay! |
| `manager.suburbs.line` | Deb | Line’s to the door. My snack bar? Never. |
| `manager.suburbs.drivers-idle` | Deb | Drivers just sitting. I’ll remember. |
| `manager.waterfront.line` | Skip | Line to the door. Counted it twice. |
| `manager.waterfront.drivers-idle` | Skip | Drivers moored on scooters. Logged. |
| `manager.university.line` | Noor | Queue out the door. My favorite kind. |
| `manager.university.drivers-idle` | Noor | Drivers idle on scooters. I timed it. |
| `manager.industrial.line` | Dee | Line at the door. Clock’s running, crew. |
| `manager.industrial.drivers-idle` | Dee | Drivers on their scooters. Not a break. |
| `manager.uptown.line` | Anton | Guests at the door, unseated. A scandal. |
| `manager.uptown.drivers-idle` | Anton | Drivers lounging on their scooters. Tsk. |

## 3. Report words

| Key | Text |
| --- | --- |
| `report.sheet.title` | Shop Report |
| `report.bar.prep` | Prep |
| `report.bar.oven` | Ovens |
| `report.bar.counter` | Counter |
| `report.bar.drivers` | Drivers |
| `report.demand` | Customers |
| `report.served` | Served {n}/min |
| `report.missed` | Missed {n}/min |
| `report.you` | You |
| `report.strip` | Served {served}/min · Missed {missed}/min |

## 4. Report tutorial

| Key | Points at | Speaker | Text |
| --- | --- | --- | --- |
| `tutorial.report.1` | the strip | Nonna Rosa | This strip, cara, is how my shop is doing. Served and missed. |
| `tutorial.report.2` | the Ovens bar | Nonna Rosa | This bar is my ovens. How many pizzas a minute they can bake, cara. |
| `tutorial.report.3` | the dashed line | Nonna Rosa | And the dashed line? How many customers want a pizza, every minute. |

## 5. Chapter task

| Key | Text |
| --- | --- |
| `task.kind.report` | Read the {shop} shop report |

## 6. Carried fixes (v5.21 r3, owner T)

| Note | Key | file:line | Speaker | Text |
| --- | --- | --- | --- | --- |
| D545 | `chapter.downtown-1.line` | `src/content/copy/home/chapters.ts` (new key) | Nonna Rosa | You have the keys, cara. Make Downtown smell like Rosa's again. |
| S70 | `tutorial.12` | `src/content/copy/home/tutorial.ts:17` | Nonna Rosa | Tap All. Every upgrade and every hire lives in there. |
| S71 | `scene.downtown-1.p4.1` | `src/content/cities/home/scenes/downtown.ts:45` | Nonna Rosa | Fine. First you bake. I show you how. Watch, then tap! |
| S87 | `task.kind.bid.short` | `src/content/copy/home/chapters.ts` (new key, after `task.kind.bid`) | — | Win Pier 9 |
| S67 | `scene.boston-0.p1.backdrop` | `src/content/cities/boston/scenes/north-end.ts:16` | — | downtown |
