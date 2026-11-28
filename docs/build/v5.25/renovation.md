# Shop renovation: plaques, fixtures and decor (v5.25, card E10)

A shop at three mastery stars can be renovated up to 3 times. Each level gives a **plaque** (I, II, III), **1 fixture upgrade** (a part of the building changes) and **3 cash decor items** (new props, bought one by one). The ids are `reno<level>-<shop>-<thing>`; `src/content/renovation.ts` holds exactly the ids below (a test checks both ways). The first column of every row is the id.

**Plaque (every shop):** level I is bronze, II is silver, III is gold, each with its numeral in Roman. The frame takes the neighbourhood's style (see the rows). It hangs by the shop's door.

**Variety rules (README section 11):** inside one shop the 9 items differ by silhouette or prop, not only by colour; across shops each set reads as its neighbourhood: Downtown classic trattoria, Suburbs 1950s diner, Waterfront dockside, University dorm, Industrial brick and steel, Uptown marble and gold.

Columns: a plaque row is `id | frame | material`; a fixture row is `id | part | what it changes`; a decor row is `id | where it stands | silhouette or prop`.

## Downtown (classic trattoria: brick, red-white-green, wood)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-downtown-plaque` | oval with a rope edge | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-downtown-awning` | storefront | the plain awning becomes a red-and-white striped one with a scalloped edge |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-downtown-espresso` | counter, left end | tall boxy chrome espresso machine with a steam puff |
| `reno1-downtown-wine-rack` | back wall, right | diamond-lattice rack with bottle necks poking out |
| `reno1-downtown-chalkboard` | pavement beside the door | A-frame sandwich board on two legs, chalk menu |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-downtown-plaque` | oval with a rope edge | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-downtown-oven-arch` | oven | a brick arch with a keystone frames the oven mouth |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-downtown-pendant-lamps` | ceiling over the tables | three drop-cord glass globes at different heights |
| `reno2-downtown-vespa` | kerb, left of the shop | small scooter with a front basket of bread |
| `reno2-downtown-herb-box` | window sill | long planter box with basil and rosemary bushes |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-downtown-plaque` | oval with a rope edge | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-downtown-gold-sign` | roof sign | gold-leaf lettering with a ring of rim bulbs |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-downtown-chandelier` | ceiling, centre | tiered crystal chandelier with candle tips |
| `reno3-downtown-medallion` | floor, centre | round tile mosaic medallion with a compass star (flat disc) |
| `reno3-downtown-bust` | beside the oven | marble bust on a square pedestal |

## Suburbs (1950s diner: chrome, teal and pink, checkerboard)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-suburbs-plaque` | rounded-rectangle with rivets | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-suburbs-neon-open` | window | a pink neon OPEN sign in a rounded-rectangle glow |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-suburbs-jukebox` | right wall | arched-top jukebox with bubble tubes down the sides |
| `reno1-suburbs-stools` | in front of the counter | row of four round chrome stools with red seats |
| `reno1-suburbs-pie-case` | counter, far end | glass cake dome on a stand with a pie inside |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-suburbs-plaque` | rounded-rectangle with rivets | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-suburbs-chrome-counter` | counter | a chrome band and a checkerboard apron on the counter front |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-suburbs-booth` | window side | high-back U-shaped booth in teal vinyl |
| `reno2-suburbs-pennants` | ceiling | string of triangular pennants in the team colours (Game Day) |
| `reno2-suburbs-gumball` | beside the door | glass-dome gumball machine on a short pedestal |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-suburbs-plaque` | rounded-rectangle with rivets | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-suburbs-roof-sign` | roof | a tall arrow-shaped pylon sign with a starburst on top |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-suburbs-cadillac` | car park out front | pink convertible with tail fins |
| `reno3-suburbs-trophy-case` | back wall | glass cabinet with three shelves of trophies |
| `reno3-suburbs-popcorn-cart` | patio | wheeled cart with a striped canopy and a popcorn box |

## Waterfront (dockside: planks, rope, nautical blue)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-waterfront-plaque` | porthole ring with four bolts | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-waterfront-rope-rail` | patio edge | a rope-and-post railing along the patio |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-waterfront-crates` | dock side | stack of slatted lobster crates, three high |
| `reno1-waterfront-life-ring` | wall by the door | red-and-white life ring with a rope loop |
| `reno1-waterfront-anchor` | in front of the patio | iron anchor with a crossbar (a cross silhouette) |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-waterfront-plaque` | porthole ring with four bolts | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-waterfront-plank-deck` | floor | weathered plank deck with nail heads and a gap between boards |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-waterfront-net-buoys` | ceiling | hanging fishing net with round orange buoys |
| `reno2-waterfront-rowboat` | dock | upturned rowboat used as a bench (crescent hull) |
| `reno2-waterfront-lantern-post` | dock edge | tall post with a hanging ship's lantern |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-waterfront-plaque` | porthole ring with four bolts | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-waterfront-beacon` | rooftop | a small lighthouse turret with a lamp and a sweeping beam |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-waterfront-helm` | back wall | spoked ship's wheel on a bracket |
| `reno3-waterfront-mast` | dock, right | short mast with a string of signal flags |
| `reno3-waterfront-barrel-table` | patio | round barrel table with a tankard and a lantern |

## University (dorm: cork, string lights, secondhand sofas)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-university-plaque` | shield with a book on it | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-university-banner` | facade | a tall school pennant banner with a crest hangs by the door |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-university-bulletin-board` | side wall | cork board with scattered pinned flyers (rectangle, ragged) |
| `reno1-university-bean-bag` | floor, corner | slumped teardrop bean bag |
| `reno1-university-string-lights` | ceiling | zig-zag strand of tiny warm bulbs |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-university-plaque` | shield with a book on it | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-university-lounge-counter` | counter | a sticker-covered counter front with a laptop charging rail |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-university-couch` | back wall | long low sofa with a throw blanket |
| `reno2-university-vending` | corner | tall vending machine with a window grid of snacks |
| `reno2-university-bike-rack` | pavement | wheel-loop rack with two bikes |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-university-plaque` | shield with a book on it | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-university-clock-tower` | roof | a slim clock tower with a pointed cap on the roof |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-university-globe` | beside the counter | globe tilted in a wooden stand |
| `reno3-university-library-ladder` | back wall | tall bookshelf with a rolling ladder |
| `reno3-university-telescope` | patio | telescope on a tripod, tube pointing up and out |

## Industrial (brick and steel: pipes, rivets, hazard stripes)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-industrial-plaque` | hex nut shape | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-industrial-steel-shutter` | door | a roll-up steel shutter with a hazard stripe on the door |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-industrial-pipe-run` | ceiling | exposed pipe run with an elbow and two valve wheels |
| `reno1-industrial-drums` | outside, left | two round oil drums, one with a stripe |
| `reno1-industrial-pegboard` | side wall | pegboard with outlined tools hung on it |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-industrial-plaque` | hex nut shape | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-industrial-chimney` | roof | a tall brick stack with a slow smoke plume |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-industrial-flour-pallet` | loading dock | pallet stacked with flour sacks, strapped |
| `reno2-industrial-gear-clock` | back wall | big cog wheel with clock hands |
| `reno2-industrial-work-lamp` | ceiling over the counter | caged work lamp on a swing arm |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-industrial-plaque` | hex nut shape | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-industrial-gantry` | above the entrance | a steel gantry crane with a hook over the entrance |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-industrial-boiler` | corner | round riveted boiler tank with a pressure gauge |
| `reno3-industrial-conveyor` | beside the counter | roller conveyor carrying pizza boxes |
| `reno3-industrial-anvil-table` | floor | block anvil used as a standing table |

## Uptown (marble and gold: art deco, velvet)

### Level I
| id | frame | material |
| --- | --- | --- |
| `reno1-uptown-plaque` | art-deco fan with a stepped edge | bronze, "I" |

| id | part | what it changes |
| --- | --- | --- |
| `reno1-uptown-brass-door` | door | a brass revolving door |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno1-uptown-velvet-rope` | entrance | two brass posts with a swagged red velvet rope |
| `reno1-uptown-orchid` | counter | tall orchid spray in a slim white vase |
| `reno1-uptown-lectern` | beside the door | slanted-top host lectern with a reservation book |

### Level II
| id | frame | material |
| --- | --- | --- |
| `reno2-uptown-plaque` | art-deco fan with a stepped edge | silver, "II" |

| id | part | what it changes |
| --- | --- | --- |
| `reno2-uptown-marble-counter` | counter | a veined marble top with a gold trim |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno2-uptown-columns` | either side of the room | a pair of fluted columns with leaf capitals |
| `reno2-uptown-piano` | corner | grand piano with the lid up (curved side) |
| `reno2-uptown-portrait` | back wall | large gilt-framed portrait with a picture light |

### Level III
| id | frame | material |
| --- | --- | --- |
| `reno3-uptown-plaque` | art-deco fan with a stepped edge | gold, "III" |

| id | part | what it changes |
| --- | --- | --- |
| `reno3-uptown-crown-sign` | rooftop | a gold crown over the sign with a twinkle |

| id | where it stands | silhouette or prop |
| --- | --- | --- |
| `reno3-uptown-ice-swan` | counter | ice-sculpture swan on a silver tray |
| `reno3-uptown-champagne-tower` | centre of the room | pyramid of stacked coupe glasses |
| `reno3-uptown-deco-arch` | back wall | gold sunburst arch over a mirror |
