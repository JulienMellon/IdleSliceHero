# v5.24 copy: looks catalog names, set names, set-complete lines, Featured row (card W5)

Ids are from `docs/build/v5.24/catalog.md` (card E7). Names are in sentence case, like `COSMETIC_NAMES` in `src/content/rewards.ts`. Chars counts every character of the text cell, placeholders included. The seven existing looks keep their current names.

## 1. Looks (limit 22)

| Key | Set | Speaker | Text | Chars |
| --- | --- | --- | --- | --- |
| `look.facade-classic` | classic | — | Nonna-approved front | 20 |
| `look.awning-classic` | classic | — | Sunday-best awning | 18 |
| `look.menu-classic` | classic | — | Nonna’s scrawled menu | 21 |
| `look.apron-classic` | classic | — | Flour-proof apron | 17 |
| `look.facade-diner` | diner | — | Mudhens diner front | 19 |
| `look.counter-diner` | diner | — | No-cutting counter | 18 |
| `look.tablecloth-diner` | diner | — | Labeled tablecloths | 19 |
| `look.tipjar-diner` | diner | — | Team-fund tip jar | 17 |
| `look.facade-dockside` | dockside | — | Seen-worse boathouse | 20 |
| `look.sign-dockside` | dockside | — | Knotted rope sign | 17 |
| `look.tipjar-dockside` | dockside | — | Counted-twice tip jar | 21 |
| `look.chime-dockside` | dockside | — | Foghorn door chime | 18 |
| `look.facade-dorm` | dorm | — | All-nighter front | 17 |
| `look.scooter-dorm` | dorm | — | Finals-week scooter | 19 |
| `look.menu-dorm` | dorm | — | Peer-reviewed menu | 18 |
| `look.tablecloth-dorm` | dorm | — | Notebook-paper cloths | 21 |
| `look.facade-brick` | brick | — | Union-built front | 17 |
| `look.oven-brick` | brick | — | No-sick-days oven | 17 |
| `look.apron-brick` | brick | — | Night-shift apron | 17 |
| `look.chime-brick` | brick | — | Shift-whistle chime | 19 |
| `look.facade-marble` | marble | — | Far too much marble | 19 |
| `look.awning-marble` | marble | — | Velvet-rope awning | 18 |
| `look.tablecloth-marble` | marble | — | Folded-napkin linens | 20 |
| `look.tipjar-marble` | marble | — | Crystal gratuity bowl | 21 |
| `look.menu-chalkboard` | none | — | Chalkboard menu | 15 |
| `look.apron-checkered` | none | — | Checkered apron | 15 |
| `look.apron-striped` | none | — | Striped apron | 13 |
| `look.tablecloth-gingham` | none | — | Gingham tablecloths | 19 |
| `look.tablecloth-linen` | none | — | Linen tablecloths | 17 |
| `look.tipjar-glass` | none | — | Glass tip jar | 13 |
| `look.tipjar-brass` | none | — | Brass tip jar | 13 |
| `look.chime-bell` | none | — | Front-door bell | 15 |
| `look.chime-wind` | none | — | Wind chimes | 11 |
| `look.awning-candy` | none | — | Candy-stripe awning | 19 |
| `look.scooter-red` | none | — | Red scooter | 11 |

## 2. Sets (name limit 18, set-complete limit 40)

| Key | Shop | Speaker | Text | Chars |
| --- | --- | --- | --- | --- |
| `set.classic` | downtown | — | Rosa’s classic | 14 |
| `set.classic.done` | downtown | Nonna Rosa | Now it looks like Rosa’s. Good, eh? | 35 |
| `set.diner` | suburbs | — | Mudhens diner | 13 |
| `set.diner.done` | suburbs | Deb | Matching set. Coach cried. I didn’t. | 36 |
| `set.dockside` | waterfront | — | Dockside shack | 14 |
| `set.dockside.done` | waterfront | Skip | Full set. Counted it twice. Still full. | 39 |
| `set.dorm` | university | — | Dorm deluxe | 11 |
| `set.dorm.done` | university | Noor | Set complete. The queue approves. Noted. | 40 |
| `set.brick` | industrial | — | Union brick | 11 |
| `set.brick.done` | industrial | Dee | Whole set. Ox nodded. That’s a speech. | 38 |
| `set.marble` | uptown | — | Uptown marble | 13 |
| `set.marble.done` | uptown | Anton | The set is complete. Madame may sit. | 36 |

## 3. Vanity tab

| Key | Speaker | Text | Chars |
| --- | --- | --- | --- |
| `shop.featured` | — | This week’s picks | 17 |
| `shop.set.progress` | — | {have}/{need} pieces | 20 |
