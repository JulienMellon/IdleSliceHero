# App Store listing: drafts for Julien to edit

Status: DRAFT (card L1, v5.17). Nothing here has been entered in App Store Connect.

## Open decisions
| Item | Working value | Why it is open |
| --- | --- | --- |
| **App title** | "Slice Empire" | Not cleared (trademark search and App Store name check not done). The name below assumes it stays. |
| **Home city's name** | "Port Marinara" (`CITY_NAME` in `src/content/tuning.ts`; the story, the City screen and the finale use it) | Open. If it changes, the description, the screenshots of the City screen and the cut-scene text change with it. The listing text below avoids the name on purpose. |
| Company name, support address, effective date, retention months | placeholders `COMPANY_NAME`, `COMPANY_LOCATION`, `SUPPORT_EMAIL`, `EFFECTIVE_DATE`, `RETENTION_MONTHS` in `site/**` | Yours to fill. Search `site/` for the words in capitals. |

## Text (character counts are exact)
**Name (30 max):** `Slice Empire: Pizza Tycoon` (26)

**Subtitle (30 max):** `Idle pizzeria empire builder` (28)

**Promotional text (170 max, editable any time without a new build):**
`Bake, hire, expand! Turn Nonna's little shop into a pizza empire across six neighbourhoods. Your ovens keep baking while you are away. Free to play.` (148)

**Keywords (100 max, comma-separated, no spaces; none repeats a word of the name or the subtitle, which Apple indexes already):**
`restaurant,clicker,incremental,cook,chef,tap,business,manager,food,story,city,kitchen,oven,dough,pie` (100)

**Description:**
> Nonna Rosa has run one little pizzeria for fifty years. Then MegaSlice moved in across the street.
>
> Tap to prep, bake and serve, and watch the first pies go out the door. Hire a head cook, a head baker and a head cashier, then a manager, and the kitchen runs itself. Upgrade your ovens, your counter and your drivers, expand the building, and decorate. Then open the next pizzeria, in the next neighbourhood.
>
> • Six neighbourhoods, six pizzerias, each with its own look, its own crew and its own story
> • A comic-panel story with Nonna, her rivals and a street full of regulars
> • Your pizzerias keep baking while you are away: come back to a welcome-back gift from Nonna's night oven
> • Daily and weekly tasks, a gift calendar, golden pizzas, special orders and weekly events
> • Game Day rushes, boats at the pier, a rival across the street, and critics who rate your restaurant
> • Collect recipe cards and keep a scrapbook of the story
> • Plays one-handed in short sessions; follows your ring/silent switch
>
> Free to play. Optional rewarded videos give extra rewards, and optional purchases (a starter pack, Nonna's Plus and diamond packs) are never needed to finish the story. No account needed.

(Check the bullet list against the shipped build before you submit: the golden pizzas, orders, events, Game Day, boats, rival and critic are in the code today; the "Plus" and diamond packs depend on the store card.)

**Support URL:** https://julienmellon.github.io/IdleSliceHero/support/ (`SUPPORT_URL` in `src/content/links.ts`)
**Privacy policy URL:** https://julienmellon.github.io/IdleSliceHero/privacy/ (`PRIVACY_URL`)
**Marketing URL:** https://julienmellon.github.io/IdleSliceHero/ (optional)
The site is `site/`, published by `.github/workflows/pages.yml`. Turn Pages on once in the repository: Settings, Pages, Source: GitHub Actions. If the site gets its own domain, change `SITE_URL` in `src/content/links.ts`, and enter the new URLs in App Store Connect.

## Age rating answers
Copied from `docs/specs/APP-PRIVACY-LABEL-AND-AGE-RATING.md`, and checked against the code and the story text (the spec's open item "scan scene text" is done: `src/content/scenes` has no alcohol, tobacco, drug, gambling or weapon words; the only hits are "a smoke machine" (stage smoke), "fight" meaning an argument or an idiom, and "bet" in "never bet against a stubborn crew").

| Topic | Answer |
| --- | --- |
| Cartoon or realistic violence, gore, weapons | None |
| Sexual content or nudity, profanity, mature themes | None |
| Alcohol, tobacco, drugs | None |
| Gambling or simulated gambling | None |
| Loot boxes (paid random rewards) | None. Chests are free and deterministic; no random reward is sold |
| Horror or fear themes | None |
| Medical or wellness topics | None |
| Unrestricted web access | No. The only links open the privacy policy and the support page in an in-app browser (Settings) |
| User-generated content, messaging, social | None |
| Parental controls, age assurance | None |
| Ads | Yes (rewarded video, Google AdMob) |
| In-app purchases | Yes |

Expected calculated rating: 4+. **Then set the minimum age override to 13+** (the decision in the spec; the policy says "not directed to children under 13").
AdMob side: mark the app NOT child-directed, set the maximum ad content rating to teen, block gambling, dating and alcohol categories (spec, "Ad consistency").

## Privacy label answers ("App Privacy" in App Store Connect)
Starts from the spec's verified AdMob table, then corrected by what the code does (step 2 of card L1; the mismatches are listed after the table). Apple asks for "Linked to you" and "Used to track you" per data type; Google lists what the SDK collects but not those two answers, so the AdMob rows are Julien's conclusion from Apple's definitions, as the spec says.

| Apple data type | Who | Linked | Tracking | Purposes to tick |
| --- | --- | --- | --- | --- |
| Identifiers > Device ID (advertising ID, only if the player allows tracking) | AdMob | Yes | **Yes** | Third-party advertising, Analytics |
| Identifiers > User ID (the random Install ID) | PostHog | Yes (Apple counts an ID that ties events together) | No (never combined with ad data) | Analytics |
| Identifiers > User ID (RevenueCat's anonymous app user ID) | RevenueCat | Yes | No | App functionality |
| Usage Data > Advertising Data (ads seen) | AdMob | Yes | **Yes** | Third-party advertising, Analytics |
| Usage Data > Product Interaction (video views from AdMob; session start and end and in-game events from PostHog) | AdMob, PostHog | Yes | **Yes** (AdMob part) | Third-party advertising, Analytics |
| Diagnostics > Performance Data | AdMob | Yes (Google's wording) | Yes | Third-party advertising, Analytics |
| Diagnostics > Crash Data | Sentry | No (not tied to the Install ID, no user set, `sendDefaultPii: false`) | No | App functionality, Analytics |
| Location > Coarse Location (estimated from the IP address) | AdMob only; PostHog's location lookup is switched off (`disableGeoip`) | Yes | Yes | Third-party advertising, Analytics |
| Purchases > Purchase History | RevenueCat | Yes | No | App functionality |

Not collected (answer "No" for each): name, email address, phone number, physical address, precise location, contacts, photos or videos, audio, health and fitness, financial info (Apple handles payment), search history, browsing history, sensitive info, user content. (Emails players send to support are not collected by the app.)
Re-verify on the day of submission against the SDK versions in `package-lock.json` (the spec's last action item).

### Mismatches the code check found (step 2)
Policy text on `site/privacy/` follows the code. These are the places where the code, `app.json` or the spec disagree and someone has to decide:
1. **The iOS tracking prompt does not exist yet.** `src/services/ads.native.ts` returns `'unsupported'` for the tracking step because `expo-tracking-transparency` is not installed, so the game never asks for the IDFA (AdMob then serves non-personalised ads). `app.json` still declares `NSPrivacyTracking: true` and the usage text, and the spec's decision is "personalised ads with the ATT prompt". The policy (section 5) says tracking happens only if the player allows it, which is true in both cases. Either add the package and the prompt, or drop the "Tracking: Yes" rows and `NSPrivacyTracking`.
2. **`app.json` `ios.privacyManifests` does not match the table above.** Device ID is `Linked: false` (the table says linked), Product Interaction lists Analytics only (the table adds Third-party advertising), Purchase History is `Linked: false` (the table says linked), Crash Data lists App functionality only. Missing entirely: Advertising Data, Performance Data, Coarse Location, User ID.
3. **Only two analytics events are sent today** (`session_start`, `session_end`, from `src/app/_layout.tsx`). `EVENTS` also defines `ad_offered`, `ad_started`, `ad_completed`, `iap_viewed`, `iap_purchased`, `scene_seen` and `shop_built`, which no code calls yet. The policy names them (it may describe more than is sent, never less).
4. **Crash reports are not tied to the Install ID** (Sentry has no user set). The privacy page and the support page say so, and a deletion request by Install ID cannot find crash reports. They hold no name or email.
5. **The opt-out covers PostHog and Sentry only, not ads.** Settings says so; the policy says "use the iOS tracking choice" for ads.
6. **The draft policy said PostHog gets an approximate country from the IP address.** The code turns that off (`disableGeoip: true`), so the sentence is gone. Coarse location stays in the AdMob row.
7. **Keys and ids are placeholders in the repo.** `app.json` holds Google's sample AdMob app id (twice) and one SKAdNetwork id; the rewarded unit, RevenueCat key, PostHog key and host and the Sentry DSN come from `EXPO_PUBLIC_*` variables and are empty in the repo, which switches each service off. The policy describes the shipped build with every service on.
8. **The draft's "Settings > [ABOUT]" for the Install ID** is now "Settings, Install ID card" (it exists: card U3).

## Screenshot sizes
- **Required:** the 6.9-inch iPhone set, **1320 x 2868 px** portrait. App Store Connect scales it down for smaller iPhones, so this is the only iPhone set to upload.
- **iPad:** `app.json` has `ios.supportsTablet: false`, so no iPad build and no iPad screenshots are needed today. If it becomes true, the 13-inch iPad set is **2064 x 2752 px** portrait; `python3 scripts/store_shots.py --set ipad` makes it, and the layout at that size has not been checked (the game is drawn for a phone width).
- **These sizes were checked on 2026-11-11 and must be re-checked against Apple's "Screenshot specifications" page before upload.** Apple changes the accepted sizes with new devices.

### Making the shots
`npx expo export --platform web` then `python3 scripts/store_shots.py` (`--only 01,04` for some). It writes `marketing/store/iphone-6.9/` and checks every file's pixel size. No device frames and no added text; the six scenes are seeded the way the fixtures seed them (`scripts/fixtures/README.md`), so two runs of one build give the same pixels.

| # | Scene | Seed |
| --- | --- | --- |
| 01 | Downtown in full swing | late-game save, a payout pop on screen |
| 02 | A cut-scene panel | fresh install, the opening scene on its first line of dialogue |
| 03 | The City screen with stars | the finished city (`56_u1`), an attack marked on Waterfront |
| 04 | A Game Day rush | Suburbs 28 s into its game day (`74_s2a`) |
| 05 | The welcome-back gift | away 3 h 12 m, Nonna's night oven open and counting |
| 06 | The Scrapbook | the Recipes tab of the finished story |

Upload order: 01, 04, 03, 05, 02, 06 puts the busy street first and the story last; reorder to taste. Look at every file before uploading: the script checks size and that each scene reached its state, not that it looks right.
`site/img/shot-1.jpg` to `shot-3.jpg` (the landing page) are 440 x 956 grabs of the same kind of scenes; replace them with downsized store shots when those exist.
