# App Privacy Label + Age Rating Plan (decisions 2026-10-30)

## Decisions (Julien)
- Ads: **Google AdMob only** (rewarded video). Add MAX mediation later if wanted.
- **Personalized ads with iOS ATT prompt.**
- Audience: **13+ general audience.**
- IAP in v1: **Yes, hybrid (Path B)**: Starter Pack, Nonna's Plus, diamond packs (see MONETIZATION-PLAN.md).
- Still open: analytics vendor (proposed Sentry + PostHog), IAP provider (proposed RevenueCat).

## Privacy policy placeholders to fill now
- Ad network: Google AdMob; policy link https://policies.google.com/technologies/ads
- Tracking section stays as written (ATT on).
- Section 7 (children): keep "not directed to children under 13". Matches 13+.
- Keep IAP paragraph. Keep analytics/crash paragraphs once vendors are final.
- Add to §2(c) that ad partners also receive performance data (launch time, hangs, energy use), ads viewed and interactions (video views), and IP-derived coarse location.

## App Privacy label — VERIFIED against Google's AdMob iOS data disclosure (2026-10-30)
Source: developers.google.com/admob/ios/privacy/data-disclosure (written as of SDK 7.68.0; SDK 11.2.0+ ships a privacy manifest). **Google lists what the SDK collects and its purposes but does NOT say "linked" or "tracking"; it says you are responsible for those answers.** Linked/tracking below is my conclusion from Apple's definitions, not from Google.

| Apple data type | Google lists it? | Linked to user | Used to track | Purpose to tick |
| --- | --- | --- | --- | --- |
| Identifiers > Device ID | Yes (advertising ID or app-scoped IDs) | Yes | **Yes** (third-party advertising with ATT) | Third-party advertising, Analytics |
| Usage Data > Advertising Data | Yes (ads seen) | Yes | **Yes** | Third-party advertising, Analytics |
| Usage Data > Product Interaction | Yes (launch taps, video views) | Yes | **Yes** | Third-party advertising, Analytics |
| Diagnostics > Performance Data | Yes, described as user-associated | **Yes** (Google's wording) | Yes (shared with ad-displaying entities) | Third-party advertising, Analytics |
| Diagnostics > Crash Data | Yes, described as non-user-related | No | No | App functionality, Analytics |
| Location > Coarse Location | Yes (IP address → estimated location) | Yes | Yes | Third-party advertising, Analytics |
| Purchases > Purchase History | (not AdMob) | Yes | No | App functionality (RevenueCat/StoreKit) |
| Identifiers > User ID | (not AdMob) | Yes | No | App functionality (RevenueCat app user ID) |

**Corrections to my earlier draft:** I had Performance Data as not linked and Product Interaction/Advertising Data as "per SDK"; Google's text makes performance data user-associated and lists advertising data and product interactions explicitly. Coarse Location (from IP) must be declared.

**Analytics/crash vendors add rows** (not decided): PostHog/Sentry collect Usage Data and Diagnostics, usually Device ID/User ID (install UUID). If they use only a random install ID, never combined with ad data, declare as linked-or-not per their docs and tick "not used for tracking". Check each vendor's own Apple disclosure page.

**Other requirements:** use AdMob SDK ≥ 11.2.0; add `NSUserTrackingUsageDescription`, `GADApplicationIdentifier`, SKAdNetwork IDs; privacy manifests in `ios.privacyManifests` for Sentry and others; mediation adapters (later) need manifest-bearing versions. Optional AdMob features (e.g. advanced reporting) or tests may need extra disclosures. Policy §2(c) must mirror this table.

**Optional later:** "Privacy Choices URL" (not required).

## Age rating questionnaire (expected answers)
| Topic | Answer |
| --- | --- |
| Cartoon/realistic violence, gore, weapons | None |
| Sexual content/nudity, profanity, mature themes | None |
| Alcohol, tobacco, drugs | None (check scene text first) |
| Gambling / simulated gambling | None |
| Loot boxes (paid random rewards) | **None. Keep chests free and deterministic; never sell random rewards.** |
| Horror/fear themes | None |
| Medical/wellness topics | None |
| Unrestricted web access | No (links open the policy and support pages only) |
| User-generated content, messaging, social | None |
| In-app controls (parental controls, age assurance) | None |
| Ads | Yes (does not raise rating by itself per 2026 sources) |
| In-app purchases | Yes |

Expected calculated rating: low (4+). **Then set the minimum-age override to 13+** to match the policy and ad setup.

**Ad consistency:**
- In AdMob, mark the app as NOT child-directed (tagForChildDirectedTreatment = false) and not under age of consent unless EU flow says otherwise.
- Set AdMob max ad content rating (e.g. "T"/teen) and block sensitive categories (gambling, dating, alcohol).
- EU/UK: add Google's UMP consent form (GDPR) before ads load; ATT handles the Apple side.
- Risk to watch: a cartoon pizza game appeals to kids. If analytics shows many under-13 users or a regulator disagrees, the setup must change. Keep marketing aimed at teens/adults.

## Action list
- [ ] Update privacy policy §2(c) to match the verified table
- [ ] Write ATT + UMP flow (show ATT after tutorial, before first ad)
- [ ] Final analytics/crash/IAP vendors → add their rows to the label and policy
- [ ] Scan scene text for alcohol/violence terms before answering the questionnaire
- [ ] Re-verify the label on the day of submission against the SDK versions actually shipped
