# Slice Empire — Game Design Doc

Oct 27, 2026 · @Julien

## Overview

Slice Empire is a mobile idle game: the player grows one failing pizza shop into a delivery empire that covers a whole city, then franchises into new cities. A non-interactive comic-style storyline plays between milestones to keep players coming back.

| Item | Decision |
| --- | --- |
| Working title | Slice Empire |
| Genre | Idle / incremental, with story cut-scenes |
| Platform | iOS first (Android comes free with the stack) |
| Stack | Expo / React Native, TypeScript |
| Dev flow | Build and test in Expo Go; enroll in the Apple Developer Program before TestFlight |
| Version control | GitHub |
| Backend | None for MVP; saves are local on the device |
| Monetization | Rewarded ads only (post-MVP) |

## Core loop

Shops bake pizzas, drivers deliver them to unlocked neighborhoods, each delivery pays cash, and cash buys upgrades that speed up the loop.

1. **Bake:** each shop produces pizzas at its oven speed.
2. **Deliver:** drivers carry pizzas to neighborhoods. Trip time depends on distance and vehicle.
3. **Earn:** each completed delivery pays that neighborhood's order value.
4. **Upgrade:** spend cash on oven speed, drivers, vehicles, new neighborhoods, new shops and managers.
5. **Repeat faster.** Story milestones trigger cut-scenes along the way.

**Idle rules**

- Earnings continue while the app is closed.
- Offline earnings are capped at 4 hours at the start; upgrades extend the cap.
- On return, a "While you were away" popup shows the total collected.
- Before managers are unlocked, a shop needs a tap to start each batch. Managers automate it.

## Progression

A city runs through four stages; finishing the city lets the player franchise into the next one, which resets progress in exchange for a permanent multiplier.

| Stage | What the player does | Unlocks |
| --- | --- | --- |
| 1. One shop | Bake and deliver to Downtown by bike | Oven speed, drivers |
| 2. Cover the city | Unlock neighborhoods farther out that pay more per order | Neighborhoods, vehicles |
| 3. More shops | Open extra locations to cut delivery distance | Shops, managers (automation) |
| 4. Franchise | Sell the city to move to the next one | Franchise Stars, next city |

**City 1 neighborhoods (in unlock order)**

| Neighborhood | Distance | Order value |
| --- | --- | --- |
| Downtown | Nearest | Lowest |
| Suburbs |  |  |
| Waterfront |  |  |
| University |  |  |
| Industrial |  |  |
| Uptown | Farthest | Highest |

**Vehicles:** bike → scooter → car → van → drone. Each tier shortens trip time. Drones unlock through Priya's University storyline.

**Prestige (franchising)**

- Franchising resets cash, shops and upgrades in the current city.
- The player earns Franchise Stars, each adding a permanent earnings multiplier.
- Each new city has bigger numbers and one new twist, such as traffic or weather.
- City order after the home city: Boston → Chicago → New York → Los Angeles.

## Economy

Upgrade costs grow 15% per level, and milestone levels double an upgrade's output, the standard idle-game curve.

```latex
\text{cost}(n) = \text{baseCost} \cdot 1.15^{n}
```

- Milestones at levels 25, 50 and 100 double that upgrade's speed or output.
- Neighborhood order value and distance both rise with unlock order, so farther neighborhoods pay more but need faster vehicles.
- Earnings per second = deliveries per second × order value × Franchise Star multiplier × any active boost.
- Rewarded-ad boost (post-MVP): 2× earnings for a fixed time.

All base costs, base values and growth rates live in one tuning file so balancing never touches game logic. Starting numbers are an open decision (see below).

## Story

The player inherits Nonna Rosa's failing shop and wins the city back, one neighborhood at a time, from the rival chain MegaSlice. Cut-scenes are non-interactive: the player never makes story choices.

**Overarching plot**

- **Villain:** Victor Crust, CEO of MegaSlice, which is buying up every city.
- Each neighborhood's arc ends with that neighborhood choosing the player over MegaSlice.
- Each city has a local MegaSlice lieutenant who is defeated in that city's finale.
- The final city ends in a showdown with Victor himself.

### City 1 cast

| Neighborhood | Character | Arc |
| --- | --- | --- |
| Downtown | Nonna Rosa, the founder | Skeptical of "modern ideas," then passes on her secret sauce recipe as the tutorial ends |
| Suburbs | Dale Hoffman, youth soccer coach | His hopeless team, fueled by your pizza, makes an underdog run to a championship |
| Waterfront | Captain Marisol, retired fisherman | Her dock is about to be sold for a MegaSlice megastore; your profits save it |
| University | Priya, broke student | Orders the cheapest slice nightly, then becomes your app developer and unlocks drones |
| Industrial | Big Sal, night-shift foreman | Gruff and hates everything; warms up and is revealed as Nonna Rosa's estranged brother |
| Uptown | Genevieve Laurent, food critic | Trashes your first delivery, becomes your biggest fan, and her review launches your expansion |

### City 2 cast (Boston)

| Neighborhood | Character | Arc |
| --- | --- | --- |
| North End | Father Dom, priest | His church bake sale is losing to MegaSlice coupons |
| Southie | Kayla Dunn, bartender | Refuses to stock anything but local food |
| Back Bay | Preston Whitmore III, heir | Secretly wants to be a pizza chef |
| Fenway | Manny Ortiz, ballpark vendor | Fighting for a stadium food contract |
| Cambridge | Dr. Lena Ko, scientist | Building a "perfect pizza oven" that keeps exploding |
| Dorchester | Grandma Bea | Nonna Rosa's old rival who becomes her friend |

- **Lieutenant:** Trish Vance, MegaSlice regional VP.
- **Cameos:** Priya (helps fix Dr. Ko's oven) and Nonna Rosa (visits for the Grandma Bea storyline).

### Rules for later cities

- Each new city brings 6 new neighborhood characters and 1 new lieutenant.
- 1–2 returning favorites appear in supporting roles, in about 3–4 of that city's scenes.
- Returning characters grow between cities, for example Priya now leads a tech team and Genevieve hosts a TV food show.

### Pacing and format

- 4 scenes per character: neighborhood unlock, first milestone, complication (MegaSlice moves in), resolution.
- 6 characters × 4 = 24 scenes per city, roughly 20–40 minutes of play apart.
- Comic-panel format: 3–5 illustrated stills with speech bubbles, simple slide and zoom motion, 20–40 seconds each.
- Scenes play automatically, can be skipped, and are saved to a Scrapbook menu for rewatching.

## Technical architecture

The game is a single client-side state object, ticked once per second while open and caught up from a saved timestamp when reopened. Content (tuning numbers and story scenes) lives in data files, separate from logic.

**Libraries (proposed)**

| Need | Library |
| --- | --- |
| Game state | Zustand |
| Local save | AsyncStorage |
| City map and drivers | react-native-svg |
| Cut-scene motion | react-native-reanimated |
| App open/close detection | React Native AppState |

**Game state and saving**

- One store holds cash, Franchise Stars, shops, upgrade levels, unlocked neighborhoods, seen scenes and `lastSavedAt`.
- Save on every purchase, every 30 seconds, and when the app goes to the background.
- On launch or resume: offline earnings = earnings per second × min(time since `lastSavedAt`, offline cap).
- Plain JavaScript numbers are enough for the MVP; switch to a big-number library if later cities exceed about 1e300.

**Story scenes as data**

Each scene is one JSON file. After every purchase the game checks unseen scenes' triggers and queues any that now pass.

```json
{
  "id": "waterfront-3",
  "city": "home",
  "character": "captain-marisol",
  "trigger": { "neighborhood": "waterfront", "level": 50 },
  "panels": [
    { "image": "waterfront-3-1.png", "lines": [{ "speaker": "Marisol", "text": "They want to pave my dock." }] }
  ]
}
```

**Proposed folder structure**

```
app/            screens (Expo Router): game, scrapbook, settings
src/engine/     tick, offline earnings, cost formulas
src/store/      Zustand store and save/load
src/content/    tuning.ts, cities/, scenes/
src/components/ map, shop panel, upgrade buttons, cut-scene player
assets/         art, character portraits, sounds
```

## Art direction

Flat, cartoony 2D throughout, chosen so a solo developer can produce it.

- **Main screen:** top-down city map. Locked neighborhoods are gray; unlocked ones light up in color.
- **Drivers:** small icons moving along routes from shops to neighborhoods, changing with vehicle tier.
- **Cut-scenes:** comic panels with speech bubbles, in the same flat style.
- **MVP:** placeholder art (simple shapes, character portraits, text boxes), replaced with real illustrations later.

## MVP scope and roadmap

v0.1 is the home city playable end to end with placeholder art, no accounts, ads or purchases.

**v0.1 (MVP)**

- [ ] One city, one shop, 6 neighborhoods
- [ ] 3 upgrades: oven speed, number of drivers, vehicle type
- [ ] Offline earnings with the 4-hour cap
- [ ] Local save and load
- [ ] Cut-scene player and Scrapbook
- [ ] All 24 home-city scenes written, with placeholder art

**Later versions**

1. Extra shops and managers
2. Rush-hour events (Friday night, big game day)
3. Franchising and City 2 (Boston)
4. Real illustrations and sound
5. Rewarded ads (2× earnings)
6. TestFlight beta, then App Store release

## Open decisions

- [ ] Name of the home city: real or fictional?
- [ ] Starting numbers: base costs, order values and distances per neighborhood
- [ ] Final game title (Slice Empire is a working title)
- [ ] Who draws the final art: yourself, a freelancer, or AI-assisted
- [ ] Exact unlock levels that trigger each of the 24 scenes
