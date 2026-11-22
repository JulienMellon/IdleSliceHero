# v5.23 copy: the Store, its cards, diamond boosters (card W4)

Placeholders: `{n}` is a count (diamonds, looks or ad rewards, as the key says); `{cash}` is in-game cash from `money()`, already prefixed "≈" by the line; `{name}` is a booster's name; `{time}` is the time left in the paid-boost slot; `{mult}` and `{hours}` come from the pack's grant. Prices are never typed in: the store supplies them.

## 1. Store intro

| Key | Points at | Speaker | Text |
| --- | --- | --- | --- |
| `tutorial.16` | the Store chip | Nonna Rosa | A new owner needs a starter pack. I made one. Tap the Store, cara. |
| `tutorial.17` | the Starter card, inside the Store | Nonna Rosa | Store in the phone! Modern ideas. My pack waits here, cara. No rush. |

## 2. Starter card

| Key | Speaker | Text |
| --- | --- | --- |
| `store.starter.title` | — | Nonna's Starter Pack |
| `store.starter.nonna` | Nonna Rosa | I pack it myself. Like a lunch, cara. |
| `store.starter.blurb` | — | {n} diamonds, {mult}× income for {hours} hours and the Founder awning |
| `store.starter.ribbon` | — | ONE PER OWNER |
| `store.chip.diamonds` | — | Enough for {n} shop looks |
| `store.chip.awning` | — | Only in this pack |
| `store.chip.boost` | — | ≈ {cash} at your shop's pace |
| `store.starter.rate` | — | Most diamonds per dollar in the store |

## 3. Diamond packs

| Key | Text |
| --- | --- |
| `store.pack.diamonds_80.title` | Pinch of Diamonds |
| `store.pack.diamonds_500.title` | Box of Diamonds |
| `store.pack.diamonds_1200.title` | Crate of Diamonds |
| `store.bonus` | +{n} bonus |
| `store.best` | Best rate |
| `store.firstbuy` | First buy: 2× |
| `store.looks` | Enough for {n} looks |

## 4. Plus

| Key | Text |
| --- | --- |
| `store.plus.title` | Nonna's Plus |
| `store.plus.ads` | You took {n} ad rewards this week. With Plus, they're one tap. |
| `store.plus.once` | Pay once. Yours forever. |

## 5. Boosters

| Key | Text |
| --- | --- |
| `booster.rush.name` | Rush Hour |
| `booster.rush.desc` | Double income, 1 hour. The lunch crowd. |
| `booster.dinner.name` | Dinner Service |
| `booster.dinner.desc` | Double income, 4 hours. All tables full. |
| `booster.bignight.name` | Big Night |
| `booster.bignight.desc` | Double income, 12 hours. The ovens sing. |
| `booster.pace` | ≈ {cash} at your shop's pace |
| `booster.running` | {name} running · {time} left |
| `booster.full` | Ay, the slot holds 24 h. Nothing spent. |

## 6. Reminders

| Key | Speaker | Text |
| --- | --- | --- |
| `store.dot.label` | — (accessibility) | Nonna's Starter Pack is in the Store |
| `store.nudge` | Nonna Rosa | In my day, we waited. Today? The Store. |

## 7. Carried fixes (v5.22 r2, owner T)

| Note | Key | file:line | Speaker | Text |
| --- | --- | --- | --- | --- |
| D555, S91 | `tutorial.report.3` | `src/content/copy/home/tutorial.ts:24` | Nonna Rosa | Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss. |
| S98 | `report.customers.row` | `src/content/copy/home/report.ts` (new key; `report-model.ts:209` row name uses it, `report.demand` stays on the dashed line) | — | Hungry crowd |
| S95 | `hook.giftLine` | `src/content/hooks.ts:72` | Nonna Rosa | A gift, cara. Tap it! |
| S95 | `voice.home.offers.1` | `src/content/cities/home/voice.ts:201` (first entry) | Nonna Rosa | “{n} pies, cara. Two minutes. Fast hands!” |
| D545 | `chapter.downtown-1.line` | `src/content/copy/home/chapters.ts` (new key) | Nonna Rosa | You have the keys, cara. Make Downtown smell like Rosa's again. |
| S70 | `tutorial.12` | `src/content/copy/home/tutorial.ts:17` | Nonna Rosa | Tap All. Every upgrade and every hire lives in there. |
| S71 | `scene.downtown-1.p4.1` | `src/content/cities/home/scenes/downtown.ts:45` | Nonna Rosa | Fine. First you bake. I show you how. Watch, then tap! |
| S87 | `task.kind.bid.short` | `src/content/copy/home/chapters.ts:122` (new key, after `task.kind.bid`; the goal bar uses it) | — | Win Pier 9 |
| S67 | `scene.boston-0.p1.backdrop` | `src/content/cities/boston/scenes/north-end.ts:16` | — | downtown |
