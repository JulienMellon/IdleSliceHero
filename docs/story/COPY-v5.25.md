# COPY v5.25 (card W6): renovation, free gift, Starter Pack, story fixes, Home interludes

Lands in: T3. Placeholders, filled by code: `{shop}` neighbourhood name, `{mult}` the renovation's income multiplier, `{numeral}` I / II / III, `{fixture}` a `reno.name.*` fixture name, `{cash}` money(), `{diamonds}` and `{n}` whole counts, `{span}` boostSpan().

## 1. Renovation

### 1.1 Offer
| key | text |
| --- | --- |
| `reno.offer` | Renovate {shop} for {mult}x income |

### 1.2 Confirm screen
| key | text |
| --- | --- |
| `reno.confirm.title` | Renovate {shop}? |
| `reno.confirm.level` | Renovation {numeral} |
| `reno.confirm.resets.head` | Starts over |
| `reno.confirm.resets.1` | Station levels start over |
| `reno.confirm.keeps.head` | You keep |
| `reno.confirm.keeps.1` | Your cash |
| `reno.confirm.keeps.2` | Your whole staff |
| `reno.confirm.keeps.3` | Every neighborhood you’ve opened |
| `reno.confirm.keeps.4` | Decor you’ve already bought |
| `reno.confirm.gains.head` | You gain |
| `reno.confirm.gains.1` | {mult}x income in {shop} |
| `reno.confirm.gains.2` | Plaque {numeral} by the door |
| `reno.confirm.gains.3` | New fixture: {fixture} |
| `reno.confirm.gains.4` | {n} new decor items to buy |
| `reno.confirm.cost` | Cost: {cash} |

### 1.3 Buttons
| key | text |
| --- | --- |
| `reno.button.offer` | Renovate |
| `reno.button.confirm` | Renovate for {cash} |
| `reno.button.short` | Need {cash} |
| `reno.button.cancel` | Not yet |
| `reno.button.done` | Back to work |
| `reno.button.maxed` | Fully renovated |

### 1.4 Reward banners
| key | text |
| --- | --- |
| `reno.banner.1` | Bronze plaque up! {mult}x income |
| `reno.banner.2` | Silver plaque up! {mult}x income |
| `reno.banner.3` | Gold plaque up! {mult}x income |

### 1.5 Cast barks
| key | speaker | text |
| --- | --- | --- |
| `reno.bark.1` | Marco | So shiny! Don’t worry, I’ll get flour on it soon. |
| `reno.bark.2` | Lucia | New paint, same fire. Nobody touches my oven. Still. |
| `reno.bark.3` | Benny | Mrs. Russo says the gold plaque is crooked. It isn’t. |

### 1.6 Plaque text
| key | text |
| --- | --- |
| `reno.plaque.1` | {shop} · I · Built by hand |
| `reno.plaque.2` | {shop} · II · Built to last |
| `reno.plaque.3` | {shop} · III · Still not for sale |

### 1.7 Fixture and decor names: Downtown
| key | text |
| --- | --- |
| `reno.name.reno1-downtown-awning` | Scalloped awning |
| `reno.name.reno1-downtown-espresso` | Steaming espresso |
| `reno.name.reno1-downtown-wine-rack` | Lattice wine rack |
| `reno.name.reno1-downtown-chalkboard` | Sidewalk specials |
| `reno.name.reno2-downtown-oven-arch` | Lucia’s brick arch |
| `reno.name.reno2-downtown-pendant-lamps` | Drop-cord globes |
| `reno.name.reno2-downtown-vespa` | Bread scooter |
| `reno.name.reno2-downtown-herb-box` | Basil window box |
| `reno.name.reno3-downtown-gold-sign` | Gold-leaf sign |
| `reno.name.reno3-downtown-chandelier` | Crystal chandelier |
| `reno.name.reno3-downtown-medallion` | Compass-star tiles |
| `reno.name.reno3-downtown-bust` | Bust of Nonna |

### 1.8 Fixture and decor names: Suburbs
| key | text |
| --- | --- |
| `reno.name.reno1-suburbs-neon-open` | Pink neon OPEN |
| `reno.name.reno1-suburbs-jukebox` | Bubble jukebox |
| `reno.name.reno1-suburbs-stools` | Red-seat stools |
| `reno.name.reno1-suburbs-pie-case` | Bake-sale pie dome |
| `reno.name.reno2-suburbs-chrome-counter` | Checkered counter |
| `reno.name.reno2-suburbs-booth` | Teal vinyl booth |
| `reno.name.reno2-suburbs-pennants` | Mudhens pennants |
| `reno.name.reno2-suburbs-gumball` | Gumball globe |
| `reno.name.reno3-suburbs-roof-sign` | Starburst pylon |
| `reno.name.reno3-suburbs-cadillac` | Pink tail-fin car |
| `reno.name.reno3-suburbs-trophy-case` | Trophy cabinet |
| `reno.name.reno3-suburbs-popcorn-cart` | Halftime popcorn |

### 1.9 Fixture and decor names: Waterfront
| key | text |
| --- | --- |
| `reno.name.reno1-waterfront-rope-rail` | Rope-and-post rail |
| `reno.name.reno1-waterfront-crates` | Lobster crates |
| `reno.name.reno1-waterfront-life-ring` | Spare life ring |
| `reno.name.reno1-waterfront-anchor` | Dropped anchor |
| `reno.name.reno2-waterfront-plank-deck` | Weathered deck |
| `reno.name.reno2-waterfront-net-buoys` | Net of buoys |
| `reno.name.reno2-waterfront-rowboat` | Rowboat bench |
| `reno.name.reno2-waterfront-lantern-post` | Ship’s lantern |
| `reno.name.reno3-waterfront-beacon` | Rooftop lighthouse |
| `reno.name.reno3-waterfront-helm` | Ship’s wheel |
| `reno.name.reno3-waterfront-mast` | Signal-flag mast |
| `reno.name.reno3-waterfront-barrel-table` | Barrel table |

### 1.10 Fixture and decor names: University
| key | text |
| --- | --- |
| `reno.name.reno1-university-banner` | Crest banner |
| `reno.name.reno1-university-bulletin-board` | Cork flyer board |
| `reno.name.reno1-university-bean-bag` | Slumped bean bag |
| `reno.name.reno1-university-string-lights` | Warm string lights |
| `reno.name.reno2-university-lounge-counter` | Stickered counter |
| `reno.name.reno2-university-couch` | Hand-me-down sofa |
| `reno.name.reno2-university-vending` | Snack machine |
| `reno.name.reno2-university-bike-rack` | Bike loop rack |
| `reno.name.reno3-university-clock-tower` | Roof clock tower |
| `reno.name.reno3-university-globe` | Tilted globe |
| `reno.name.reno3-university-library-ladder` | Library ladder |
| `reno.name.reno3-university-telescope` | Stargazer scope |

### 1.11 Fixture and decor names: Industrial
| key | text |
| --- | --- |
| `reno.name.reno1-industrial-steel-shutter` | Roll-up shutter |
| `reno.name.reno1-industrial-pipe-run` | Valve-wheel pipes |
| `reno.name.reno1-industrial-drums` | Striped oil drums |
| `reno.name.reno1-industrial-pegboard` | Tool pegboard |
| `reno.name.reno2-industrial-chimney` | Brick smokestack |
| `reno.name.reno2-industrial-flour-pallet` | Flour pallet |
| `reno.name.reno2-industrial-gear-clock` | Cog-wheel clock |
| `reno.name.reno2-industrial-work-lamp` | Caged work lamp |
| `reno.name.reno3-industrial-gantry` | Gantry crane |
| `reno.name.reno3-industrial-boiler` | Riveted boiler |
| `reno.name.reno3-industrial-conveyor` | Pizza-box conveyor |
| `reno.name.reno3-industrial-anvil-table` | Ox’s anvil table |

### 1.12 Fixture and decor names: Uptown
| key | text |
| --- | --- |
| `reno.name.reno1-uptown-brass-door` | Revolving door |
| `reno.name.reno1-uptown-velvet-rope` | Velvet rope line |
| `reno.name.reno1-uptown-orchid` | Orchid spray |
| `reno.name.reno1-uptown-lectern` | Reservation stand |
| `reno.name.reno2-uptown-marble-counter` | Veined marble top |
| `reno.name.reno2-uptown-columns` | Fluted columns |
| `reno.name.reno2-uptown-piano` | Grand piano |
| `reno.name.reno2-uptown-portrait` | Portrait of Madame |
| `reno.name.reno3-uptown-crown-sign` | Gold crown sign |
| `reno.name.reno3-uptown-ice-swan` | Ice swan |
| `reno.name.reno3-uptown-champagne-tower` | Coupe-glass tower |
| `reno.name.reno3-uptown-deco-arch` | Sunburst mirror |

## 2. Free gift
| key | speaker | text |
| --- | --- | --- |
| `gift.hint` | — | A gift box waits in your shop. Tap it! |
| `gift.banner.cash` | — | Free gift! +{cash} |
| `gift.banner.both` | — | Free gift! +{cash} and {diamonds} 💎 |
| `gift.bark.1` | Nonna Rosa | A box for you, cara. Open it. Is rude to make it wait. |
| `gift.bark.2` | Marco | I didn’t shake it. Okay, a little. It sounds like money! |
| `gift.bark.3` | Benny | Package for the boss! No tip needed. This time. |

## 3. Starter Pack
| key | text |
| --- | --- |
| `store.starter.title` | Nonna’s Starter Pack |
| `store.starter.subtitle` | Everything a new owner needs, packed by Nonna |
| `store.starter.item.cash` | {cash} in cash |
| `store.starter.item.diamonds` | {n} diamonds |
| `store.starter.item.boost` | {mult}x income for {span} |
| `store.starter.blurb` | {cash} in cash + {n} 💎 + {mult}x income for {span} |

## 4. Story fixes
| ID | file | key | string, or why it stays |
| --- | --- | --- | --- |
| S48 | `src/content/copy/home/endgame.ts` (generated from `docs/story/COPY-v5.15.md`) | `rush.gameday.start` | Playoffs today, pal! Every family wants pizza at halftime. Go, Mudhens! |
| S67 | `src/content/cities/boston/scenes/north-end.ts` | `boston-0.p1.backdrop` | `downtown` |
| S89 | `src/components/goal-model.ts` | — | Keep: no string changes; the goal bar follows the list order in code (U). |
| S97 | `scripts` review fixtures | — | Keep: no string changes; fixtures should show `bark.downtown.oven.pile`, `manager.downtown.line` and `bark.industrial.oven.idle` (E). |
| S105 | `src/content/copy/home/tutorial.ts` | `tutorial.report.3` | Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss. |
| S106 | `src/content/copy/home/endgame.ts` (via COPY-v5.15.md) and `src/content/rewards.ts` | `shop.item.oven-gold.name`, `COSMETIC_NAMES['oven-gold']` | Golden oven |
| S106 | same | `shop.item.oven-woodfired.name`, `COSMETIC_NAMES['oven-woodfired']` | Wood-fired oven |
| S106 | same | `shop.item.scooter-mint.name`, `COSMETIC_NAMES['scooter-mint']` | Mint scooter |
| S106 | same | `shop.item.neon-counter.name`, `COSMETIC_NAMES['neon-counter']` | Neon counter |
| S106 | same | `shop.item.awning-gold.name`, `COSMETIC_NAMES['awning-gold']` | Golden awning |
| S106 | same | `shop.item.plaque-master.name`, `COSMETIC_NAMES['plaque-master']` | Master’s plaque |
| S106 | same | `shop.item.storefront-skin.name`, `COSMETIC_NAMES['storefront-skin']` | Fresh storefront |
| S106 | `src/content/rewards.ts` | `COSMETIC_NAMES['awning-founder']` | Founder awning |
| S107 | `src/components/endgame/shop-model.ts` | `shop.look.wear`, `shop.look.worn`, `shop.look.earn`, `shop.tier.*` | Keep: already in `copy/home/looks.ts`, and "Earn {n} stars" is capitalised. |
| S108 | `src/components/endgame/shop-model.ts` | `shop.look.shows` | Keep: "{set} · shows in {hood}" already reads "Rosa’s classic · shows in Downtown". |
| S109 | `src/content/copy/home/looks.ts` | `set.classic.done` | Looks like Rosa’s now, cara. Good, eh? |

## 5. Home interludes (session 1)

### 5.1 downtown-1b
| key | value |
| --- | --- |
| `scene.downtown-1b.title` | The Chair |
| `scene.downtown-1b.trigger` | after downtown-1 +180 s |
| `scene.downtown-1b.meta` | city home · character nonna-rosa · neighborhood downtown · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.downtown-1b.p1.caption` | shop | nonna-rosa (neutral) | — | Nonna has dragged her old chair to the door. It creaks. So does she. |
| `scene.downtown-1b.p1.line1` | | | Nonna Rosa | My knees, they retire. My eyes? Never. From here, I supervise. |
| `scene.downtown-1b.p1.line2` | | | You | Supervise what, exactly? |
| `scene.downtown-1b.p2.line1` | shop | nonna-rosa (angry) | Nonna Rosa | You. You hold the dough like it owes you money. |
| `scene.downtown-1b.p2.line2` | | | You | Is that bad? |
| `scene.downtown-1b.p2.line3` | | | Nonna Rosa | Gentle, cara. Dough remembers. So do I. |
| `scene.downtown-1b.p3.caption` | downtown | nonna-rosa (surprised), mr-smith (neutral) | — | Across the street, a trench coat walks past. Slowly. Again. |
| `scene.downtown-1b.p3.line1` | | | Nonna Rosa | That man. He walks past my window again and again. He thinks I don’t see. |
| `scene.downtown-1b.p3.line2` | | | Nonna Rosa | I never forget a face, cara. Even one hiding in a collar. |

### 5.2 downtown-2b
| key | value |
| --- | --- |
| `scene.downtown-2b.title` | The Fine Print |
| `scene.downtown-2b.trigger` | after downtown-2 +180 s |
| `scene.downtown-2b.meta` | city home · character nonna-rosa · neighborhood downtown · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.downtown-2b.p1.caption` | shop | nonna-rosa (happy) | — | Nonna has found a use for Mr. Smith’s MegaSlice coupons. |
| `scene.downtown-2b.p1.line1` | | | Nonna Rosa | Under the wobbly table. At last, MegaSlice holds something up. |
| `scene.downtown-2b.p1.line2` | | | You | Nonna, that’s a good one. |
| `scene.downtown-2b.p1.line3` | | | Nonna Rosa | I have many. I save them for special occasions. |
| `scene.downtown-2b.p2.line1` | shop | nonna-rosa (surprised) | Nonna Rosa | Ay, the fine print. “Soon, every pizzeria will be a MegaSlice.” |
| `scene.downtown-2b.p2.line2` | | | You | That’s not a coupon. That’s a threat. |
| `scene.downtown-2b.p2.line3` | | | Nonna Rosa | A threat with a discount. Very modern. |
| `scene.downtown-2b.p3.caption` | downtown | nonna-rosa (neutral) | — | A long black car slows outside Rosa’s. Then it drives on. |
| `scene.downtown-2b.p3.line1` | | | Nonna Rosa | Fancy car. Nobody fancy comes Downtown, cara. Unless they want something. |
| `scene.downtown-2b.p3.line2` | | | Nonna Rosa | So we bake. If somebody comes, they find us busy. |

### 5.3 downtown-3b
| key | value |
| --- | --- |
| `scene.downtown-3b.title` | Real Bread |
| `scene.downtown-3b.trigger` | after downtown-3 +200 s |
| `scene.downtown-3b.meta` | city home · character nonna-rosa · neighborhood downtown · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.downtown-3b.p1.caption` | shop | nonna-rosa (neutral) | — | The day after the suit. Lucia has put a stool in front of the oven. |
| `scene.downtown-3b.p1.line1` | | | Lucia | I sleep here now, Zia. Suits are like mice. They come back. |
| `scene.downtown-3b.p1.line2` | | | Nonna Rosa | You sleep at home. The oven protects itself. It has fire. |
| `scene.downtown-3b.p2.line1` | shop | nonna-rosa (angry) | Nonna Rosa | “Real bread,” he says. As if there is another kind. |
| `scene.downtown-3b.p2.line2` | | | You | You’re still thinking about his crust. |
| `scene.downtown-3b.p2.line3` | | | Nonna Rosa | I am thinking about OUR crust. Ours is better. And it can be better still. |
| `scene.downtown-3b.p3.caption` | downtown | nonna-rosa (happy) | — | Outside, the line reaches the corner. |
| `scene.downtown-3b.p3.line1` | | | Nonna Rosa | Look at them, cara. Every one of them is a “no” to MegaSlice. |
| `scene.downtown-3b.p3.line2` | | | Nonna Rosa | Keep baking. When Downtown smells like Rosa’s again, I show you something. |

### 5.4 suburbs-2b
| key | value |
| --- | --- |
| `scene.suburbs-2b.title` | Pizza Practice |
| `scene.suburbs-2b.trigger` | after suburbs-2 +180 s |
| `scene.suburbs-2b.meta` | city home · character dale · neighborhood suburbs · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.suburbs-2b.p1.caption` | suburbs | dale (happy) | — | Mudhens practice. New drill: run a lap, earn a slice. |
| `scene.suburbs-2b.p1.line1` | | | Dale | Look at ’em hustle, pal! Orange slices never made a kid run like that. |
| `scene.suburbs-2b.p1.line2` | | | Dale | Tater ran toward the right net all practice. I’m keeping a chart. |
| `scene.suburbs-2b.p2.line1` | suburbs | dale (surprised) | Kayla | Coach. A kid asked if pizza counts as a vegetable. |
| `scene.suburbs-2b.p2.line2` | | | Dale | Sauce is tomatoes, tomatoes grow in dirt, dirt is nature. Next question! |
| `scene.suburbs-2b.p2.line3` | | | Kayla | Cool. I’m telling his mom you said that. |
| `scene.suburbs-2b.p3.caption` | suburbs | dale (happy) | — | Saturday. The Mudhens score. Then nobody else does. |
| `scene.suburbs-2b.p3.line1` | | | Dale | We WON? We WON! Somebody hold my clipboard. I need to lie on the grass. |
| `scene.suburbs-2b.p3.line2` | | | Dale | First W in Mudhens history, pal. Word’s gonna get around. |

## 6. The Waterfront stretch (waterfront-1 at 32.5 min to the Waterfront manager at 90.5 min)

### 6.1 waterfront-1b
| key | value |
| --- | --- |
| `scene.waterfront-1b.title` | The Lookout |
| `scene.waterfront-1b.trigger` | after waterfront-1 +540 s |
| `scene.waterfront-1b.meta` | city home · character marisol · neighborhood waterfront · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.waterfront-1b.p1.caption` | shop | marisol (neutral) | — | Captain Marisol has claimed the stool by the window. It faces the sea. |
| `scene.waterfront-1b.p1.line1` | | | Captain Marisol | Every shop needs a lookout. I’m the lookout. Also the customer. |
| `scene.waterfront-1b.p1.line2` | | | You | Want a menu? |
| `scene.waterfront-1b.p1.line3` | | | Captain Marisol | I want what I had yesterday. Hold the fish. |
| `scene.waterfront-1b.p2.line1` | waterfront | marisol (happy) | Captain Marisol | Fog rolls in at noon and out by supper. Like a regular. |
| `scene.waterfront-1b.p2.line2` | | | Captain Marisol | Dock crews can’t see a thing in it. They follow your oven by the smell. |
| `scene.waterfront-1b.p3.line1` | shop | marisol (neutral) | Gus | Captain. Oven’s running hot. Seen hotter. In a storm. |
| `scene.waterfront-1b.p3.line2` | | | Captain Marisol | Then feed it, Gus. And kid, ask me about this dock sometime. Not today. |

### 6.2 downtown-4b
| key | value |
| --- | --- |
| `scene.downtown-4b.title` | Where Spoons Live |
| `scene.downtown-4b.trigger` | after waterfront-1b +540 s |
| `scene.downtown-4b.meta` | city home · character nonna-rosa · neighborhood downtown · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.downtown-4b.p1.caption` | shop | nonna-rosa (happy) | — | Downtown. Nonna runs the kitchen now. The kitchen has noticed. |
| `scene.downtown-4b.p1.line1` | | | Marco | Nonna moved every spoon. I can’t find anything. I love it. |
| `scene.downtown-4b.p1.line2` | | | Nonna Rosa | A spoon lives where Nonna puts it. Like a grandchild. |
| `scene.downtown-4b.p2.line1` | shop | nonna-rosa (neutral) | Nonna Rosa | So. You go to the Waterfront every day now. With the fishermen. |
| `scene.downtown-4b.p2.line2` | | | You | It’s a good shop, Nonna. |
| `scene.downtown-4b.p2.line3` | | | Nonna Rosa | Good, you say. Eat something there. The sea makes people thin. |
| `scene.downtown-4b.p3.caption` | shop | nonna-rosa (surprised) | — | Nonna squints at the address on a Waterfront order. |
| `scene.downtown-4b.p3.line1` | | | Nonna Rosa | The Waterfront? Is there still a woman who shouts at gulls? Tall? Bossy? |
| `scene.downtown-4b.p3.line2` | | | Nonna Rosa | Never mind. Tell nobody I asked. |

### 6.3 waterfront-1c
| key | value |
| --- | --- |
| `scene.waterfront-1c.title` | Gulls and Crews |
| `scene.waterfront-1c.trigger` | after downtown-4b +540 s, and not before boats are open |
| `scene.waterfront-1c.meta` | city home · character marisol · neighborhood waterfront · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.waterfront-1c.p1.caption` | waterfront | marisol (happy) | — | A fishing boat ties up at the dock. Its crew follows the smell. |
| `scene.waterfront-1c.p1.line1` | | | Captain Marisol | That’s the Gray Gull. Her crew eats like gulls. Loud, and all at once. |
| `scene.waterfront-1c.p2.line1` | waterfront | marisol (surprised) | You | Nonna Rosa asked if you still shout at gulls. |
| `scene.waterfront-1c.p2.line2` | | | Captain Marisol | Rosa? Rosa from the bread stall? She’s still alive and still nosy? |
| `scene.waterfront-1c.p2.line3` | | | Captain Marisol | Ha! Of course she is. Too stubborn for anything else. |
| `scene.waterfront-1c.p3.line1` | waterfront | marisol (neutral) | Finn | Captain! The crew wants their pies tied up with string! |
| `scene.waterfront-1c.p3.line2` | | | Captain Marisol | Then tie ’em, Finn. A bowline. And kid: tell Rosa I haven’t forgotten the sardine. |

### 6.4 suburbs-1b
| key | value |
| --- | --- |
| `scene.suburbs-1b.title` | Car Wash |
| `scene.suburbs-1b.trigger` | after waterfront-1c +540 s |
| `scene.suburbs-1b.meta` | city home · character dale · neighborhood suburbs · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.suburbs-1b.p1.caption` | suburbs | dale (happy) | — | Mudhens car wash. Nobody’s car is getting any cleaner. |
| `scene.suburbs-1b.p1.line1` | | | Dale | Fundraiser, pal! Every dollar goes to new shin guards. And hoses. |
| `scene.suburbs-1b.p2.line1` | suburbs | dale (surprised) | Hank | A good wash is a patient wash, sport. |
| `scene.suburbs-1b.p2.line2` | | | Dale | Hank, you’ve been on the same minivan since breakfast. |
| `scene.suburbs-1b.p2.line3` | | | Hank | And she’s never looked better. |
| `scene.suburbs-1b.p3.line1` | suburbs | dale (happy) | Dale | Pizza for every washer! It’s in the budget. I am the budget. |
| `scene.suburbs-1b.p3.line2` | | | Dale | And Saturday, pal, I’ve got a secret play. I drew it on a napkin. Then I ate off it. |

### 6.5 downtown-4c
| key | value |
| --- | --- |
| `scene.downtown-4c.title` | The Sardine |
| `scene.downtown-4c.trigger` | after suburbs-1b +540 s |
| `scene.downtown-4c.meta` | city home · character nonna-rosa · neighborhood downtown · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.downtown-4c.p1.line1` | shop | nonna-rosa (surprised) | You | Captain Marisol says she hasn’t forgotten the sardine. |
| `scene.downtown-4c.p1.line2` | | | Nonna Rosa | MARISOL. Ay. The sardine was fine. A little old. Like her. |
| `scene.downtown-4c.p2.caption` | shop | nonna-rosa (happy) | — | Long ago, two stalls at the old fish market. Bread on one side. Fish on the other. |
| `scene.downtown-4c.p2.line1` | | | Nonna Rosa | Every morning we argued who had the best stall. Every morning I won. |
| `scene.downtown-4c.p2.line2` | | | You | And what does she say? |
| `scene.downtown-4c.p2.line3` | | | Nonna Rosa | She says the same. Is a long argument, cara. |
| `scene.downtown-4c.p3.line1` | shop | nonna-rosa (neutral) | Nonna Rosa | Tell her: Rosa’s pizza feeds the whole Waterfront now. She will hate that. |
| `scene.downtown-4c.p3.line2` | | | Marco | Can I take the message? I want to see her face! |

### 6.6 waterfront-1d
| key | value |
| --- | --- |
| `scene.waterfront-1d.title` | Don’t Tell Rosa |
| `scene.waterfront-1d.trigger` | after downtown-4c +540 s, only while Waterfront has no manager |
| `scene.waterfront-1d.meta` | city home · character marisol · neighborhood waterfront · beat interlude |

| key | backdrop | cast | speaker | text |
| --- | --- | --- | --- | --- |
| `scene.waterfront-1d.p1.line1` | waterfront | marisol (angry) | You | Nonna says her pizza feeds the whole Waterfront now. |
| `scene.waterfront-1d.p1.line2` | | | Captain Marisol | Her pizza. In MY harbor. In MY fog. |
| `scene.waterfront-1d.p2.caption` | waterfront | marisol (happy) | — | Marisol takes a slice. Then another. Slowly. |
| `scene.waterfront-1d.p2.line1` | | | Captain Marisol | Fine. It’s good. Don’t you dare tell her I said so. |
| `scene.waterfront-1d.p2.line2` | | | You | My lips are sealed, Captain. |
| `scene.waterfront-1d.p3.line1` | shop | marisol (neutral) | Captain Marisol | Look at this crowd, kid. A shop this busy needs a manager. |
| `scene.waterfront-1d.p3.line2` | | | Captain Marisol | Hire one, and I’ll make an introduction. I know a fellow. |

### 6.7 Ambient beats (one every 3 min between the interludes)
| key | trigger | shop | kind | speaker | text |
| --- | --- | --- | --- | --- | --- |
| `ambient.wf.1` | after waterfront-1 +180 s | waterfront | bark | Captain Marisol | Fog’s in. Crews will follow the smell. Bake, kid! |
| `ambient.wf.2` | after waterfront-1 +360 s | downtown | bark | Nonna Rosa | My kitchen, my rules. The main rule: eat something. |
| `ambient.wf.3` | after waterfront-1b +180 s | suburbs | bark | Dale | Halftime tip, pal: hustle wins games. So does pizza. |
| `ambient.wf.4` | after waterfront-1b +360 s | waterfront | banner | — | The fog smells like pizza now |
| `ambient.wf.5` | after downtown-4b +180 s | waterfront | bark | Captain Marisol | Gulls circling your roof. Take it as a compliment. |
| `ambient.wf.6` | after downtown-4b +360 s | downtown | bark | Marco | Nonna moved the flour. I found it. It was on me. |
| `ambient.wf.7` | after waterfront-1c +180 s | waterfront | bark | Captain Marisol | More crews tie up every day. You did that, kid. |
| `ambient.wf.8` | after waterfront-1c +360 s | suburbs | bark | Dale | Orange slices are retired, pal. Pizza made the team. |
| `ambient.wf.9` | after suburbs-1b +180 s | suburbs | banner | — | Every minivan has a pizza box |
| `ambient.wf.10` | after suburbs-1b +360 s | downtown | bark | Lucia | Zia hums at my oven now. I pretend not to hear. |
| `ambient.wf.11` | after downtown-4c +180 s | waterfront | bark | Captain Marisol | Harbor’s as busy as I’ve ever seen it. Almost. |
| `ambient.wf.12` | after downtown-4c +360 s | waterfront | banner | — | Dock crews line up at your door |
| `ambient.wf.13` | after waterfront-1d +120 s, only while Waterfront has no manager | waterfront | bark | Captain Marisol | Still no manager, kid? I’m retired. Mostly. |
