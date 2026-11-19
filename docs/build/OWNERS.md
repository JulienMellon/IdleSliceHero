# Owners

Every review note gets one owner letter. Every fix goes to that lane's programmer. A card's own `Files` section overrides this map for that card.

| Owner | Lane | Paths |
| --- | --- | --- |
| E | Engine and numbers | `src/engine/**`, `src/content/**` except `scenes/`, `src/store/**`, `scripts/pacing-*.ts`, `scripts/review/**` |
| U | Screens and panels | `src/app/**` except `settings.tsx` and `store.tsx`; top-level `src/components/*.ts(x)` such as `game-ui`, `rewards-ui`, `shop-ui`, `sidewalk-*`, `goal-model`, `order-chip`, `floating-bonus`, `city-map`, `title-card`, `icons`, `slots`; `src/components/endgame/**`, `src/components/layers/**`, `src/lib/**` (from card R5f), `src/dev/*.tsx` (the Test panel UI) |
| S | Shop scene art | `src/components/scene/**`, `storefront.tsx`, `backdrop.tsx` (from card R6: `src/components/cutscene/backdrops/**`) |
| T | Story and cut-scenes | `src/content/scenes/**`, `src/components/cutscene/**` (except `backdrops/`), `cutscene-player.tsx`, `portrait.tsx` (from card R6: `src/components/portrait/**`), `src/content/copy/**` (from card R5c), `docs/story/**` |
| N | Native, money, settings | `src/dev/**` (the test build; the Test panel's UI files, `src/dev/*.tsx`, are U), `src/services/**`, `src/components/store/**` (from card R3: `src/components/monetization/**`), `src/app/settings.tsx`, `src/app/store.tsx`, `app.json`, `site/**` |
| A | Audio | `src/audio/**`, `tools/audio/**`, `assets/audio/**`, `docs/AUDIO.md` |

Append-only shared files (any lane may add lines; nobody rewrites): `src/engine/features/index.ts`, `src/components/slots.tsx`, `src/content/hooks.ts`, `scripts/fixtures/*.py` (one file per card). Re-read a shared file immediately before editing it.

A note about a screenshot belongs to the lane that draws the thing that is wrong, not the lane that added the fixture.
