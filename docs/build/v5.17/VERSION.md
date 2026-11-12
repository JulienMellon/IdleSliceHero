# v5.17 — Money, native modules, launch build (the TestFlight candidate)

**Scope:** wishlist sections 8 (AdMob rewarded video with the tracking prompt and UMP consent; RevenueCat purchases; analytics events), 7's ad buttons, 10 (audio device fixes), and the code half of 11 (Settings links and toggles, crash and analytics, support and privacy site, accessibility and performance pass, store assets).

Everything that needs a development build goes into this one version, so there is one native build to make instead of five.

## Prerequisites
- `ls docs/specs/PRIVACY-POLICY-DRAFT.md docs/specs/APP-PRIVACY-LABEL-AND-AGE-RATING.md` (needed by card L1; see `SETUP.md` section 3).
- Julien's accounts are **not** needed to build or review this version: every native service runs behind a stub on web, with test IDs on device. They are needed to ship it. `LAUNCH-TRACK.md` lists them; do not read it, just tell Julien at close that the device checklist and the account list are waiting.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| N1 | N | `src/services/`: ads, purchases, analytics, crash; config | `card-N1.md` |
| A1 | A | SFX and stingers on `react-native-audio-api`; other-audio hint | `card-A1.md` |
| U3 | U+N | Ad buttons, store, Nonna's Plus, Settings | `card-U3.md` |
| L1 | N | Support and privacy site, accessibility, performance, store shots | `card-L1.md` |

## Waves
1. **N1 + A1.**
2. **U3 + L1.** `extra` for U3: `Services API: docs/API.md (src/services).`
3. Verify, commit, review, fix rounds.

Every card also gets: `extra: Carried notes: rows with your owner letter in <last v5.16 critic review file>`.

## Reviews
- r1: `critic` full effort; `codecritic` full effort, range `<codecritic_range_start>..HEAD`, paths `src/services src/store src/app src/audio app.json` (money and consent code is never skipped); `audiocritic` low effort on `src/audio/**` and the open items AU76 and AU77 (PREV for this version: `AUDIOLOG.md, current state; next ID AU78`).
- r2, r3: medium re-checks.
- `storycritic`: not run.

## Fix routing
| Owner | Cards |
| --- | --- |
| N | N1, L1 |
| U | U3 |
| A | A1 |
| E, S, T | spawn a programmer on the card of the same lane from the version that built the file; name the files in the prompt |

## Defaults
- **No interstitials and no "remove ads" product.** The 2026-10-30 monetization plan dropped them; Nonna's Plus is the paid way to skip ads.
- **Vendors:** Sentry for crashes, PostHog for analytics.
- **Products:** `starter_pack` $2.99 (150 diamonds, a 24-hour 2× boost, the `awning-founder` cosmetic); `nonnas_plus` $4.99 (every rewarded-ad benefit without the ad, 2× offline built in, no permanent income boost); `diamonds_80` $0.99, `diamonds_500` $4.99, `diamonds_1200` $9.99.
- **Audio:** move SFX and stingers to `react-native-audio-api` without waiting for the device measurements; keep `expo-audio` for the music loops unless the card finds looping gaps.
- **SDK questions:** if N1 or A1 reports a `Needs:` about an SDK's API, run the `docs` agent (Haiku) with that question and send its answer back to the same programmer.
- **Names:** the site and policy use "Slice Empire" and leave the home city unnamed until Julien decides.

## Close
The gate here is the web loop only. Native paths are verified by Julien on a device with `DEVICE-CHECKLIST.md`; its failures come back as bugs for a fix round in a later session. After APPROVED, set `codecritic_range_start` to this version's closing commit.
