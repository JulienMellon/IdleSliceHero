# Cards not in v5.19 (Julien, 2026-11-18)

**Do not launch anything in this folder during v5.19.** Julien put every city beyond Boston on hold. v5.19 makes a city only a content pack, separate from the game logic (`../VERSION.md`).

| Card | What | Status | Before it can run again |
| --- | --- | --- | --- |
| W4b, W4s | Cities bible; one city's script | **On hold** (cities beyond Boston) | Julien lifts the hold. Both were checked against the refactor on 2026-11-18 (commit "v5.19 plan check"). |
| E4 | The showdown | **On hold** | Re-check its Files against `src/content/cities/README.md` (card R7a). It assumes cards R1 and R2 have landed. |
| E4f | Fits for three cities | **On hold** | Needs three packs. The fits live in each pack's `fit.ts` (R7a moved Boston's there). |
| CITY | One city pack | **On hold** | **Rewrite against `src/content/cities/README.md`.** After R5c, copy overrides are the pack's `copy`. After R6 and R7b, art is `src/components/cities/<id>/`. After R7a, the cast is the pack's `cast.ts`. |
| A3 | Three city audio bundles | **On hold** | Also needs A2 (`../../v5.18/card-A2.md`, which waits for the music round). R7a already did the director's bid line. |
| R2, R2b | Split `engine/game.ts`; callers off the barrel | Deferred: not needed for packs | R2 first, R2b last and alone. R2b covers `engine/game` only. |
| R3 | Store slices; `components/store` becomes `components/monetization` | Deferred | Its "run after E4" line applies only if E4 runs first. |
| R4 | Goal bar and HUD models | Deferred | After R3. |
| R5f | One flag store, one bus | Deferred | After R1L's folder renames, which v5.19 does. |
| R6s | Storefront hooks | Deferred | U21 and A29 are already fixed; steps 1 and 4 remain. |

The deferred refactor cards are a candidate scope for the next version, along with Julien's parked economy decisions (STATE `open:`). Both are his call.
