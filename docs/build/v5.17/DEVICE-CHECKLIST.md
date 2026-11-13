# Device checklist for v5.17 (Julien)

The web loop can't run native code. These checks need a development build on a real iPhone, ideally an SE 2 or an XR (the slowest phones worth supporting). Tick each; anything that fails goes back to the orchestrator as a bug with the box's letter.

## Before you can build
- [ ] Apple Developer Program membership active.
- [ ] AdMob account and an iOS app ID; put it in `EXPO_PUBLIC_ADMOB_APP_ID`.
- [ ] RevenueCat project with the five products created in App Store Connect: `starter_pack`, `nonnas_plus`, `diamonds_80`, `diamonds_500`, `diamonds_1200`.
- [ ] Sentry and PostHog projects; keys in the `EXPO_PUBLIC_*` variables the card N1 report lists.
- [ ] `eas build --profile development --platform ios`, installed on the phone.

## Ads and consent
- [ ] A. No prompt appears at launch or during the tutorial.
- [ ] B. The tracking prompt appears before the first ad, once.
- [ ] C. With tracking refused, a test ad still plays and still pays.
- [ ] D. Airplane mode: every ad button lets you continue without the reward and without an error.
- [ ] E. Each placement pays what it says: double claim, reroll, streak save, 2× offline, daily booster.

## Purchases (sandbox account)
- [ ] F. Prices show in your currency.
- [ ] G. Starter Pack pays its contents once; buying again is not offered.
- [ ] H. Nonna's Plus: every ad button turns into an instant button.
- [ ] I. A diamond pack pays once; force-quit during purchase and reopen: still paid once.
- [ ] J. Delete the app, reinstall, Restore Purchases: Plus and the Starter Pack cosmetic return; diamonds do not double.

## Audio (AU39–AU41 and the five lofi checks)
- [ ] K. Launch to first tap: no visible hitch; note the time to the title screen.
- [ ] L. Tap a station: the sound is immediate (under about 50 ms; it should feel attached to the finger).
- [ ] M. Let a neighbourhood loop run for three minutes: no gap or click at the loop point.
- [ ] N. Start a podcast, then open the game: music stays off, effects play, the podcast keeps playing.
- [ ] O. The five lofi audition checks in `AUDIOLOG.md`.

## Settings and privacy
- [ ] P. Privacy Policy and Support open the live pages.
- [ ] Q. Analytics toggle off: no events arrive in PostHog from this phone.
- [ ] R. Install ID copies to the clipboard.

## General
- [ ] S. VoiceOver: you can buy an upgrade and read a cut-scene with the screen off.
- [ ] T. Twenty minutes of play on battery: the phone is not hot; note the battery drop.
- [ ] U. Background the app for an hour, return: the welcome-back gift shows the right time.
- [ ] V. Flagship shop (Industrial at the top tier) with the Expo performance monitor on: note the UI and JS frame rates over 20 seconds. The web numbers in card L1's report don't carry over to a phone.
- [ ] W. The same shop with a sheet open over it (tasks, then the shop report): the frame rate should rise, because the scene pauses.
