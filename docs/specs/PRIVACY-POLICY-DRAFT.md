# Slice Empire — Privacy Policy (DRAFT)

> **Draft, not legal advice.** Fill every [BRACKET] before publishing. Delete any section for an SDK you don't ship. Have it checked by a lawyer or a generator (iubenda, Termly) if you can. Publish it at a public HTTPS page and link it in-app (Settings) and in App Store Connect.

**Effective date:** [DATE]
**Developer:** [LEGAL NAME / BUSINESS NAME], [CITY, STATE, COUNTRY] ("we", "us")
**Contact:** [SUPPORT EMAIL]

## 1. About this policy
This policy explains what information Slice Empire (the "Game") collects, how it is used, who receives it, and the choices you have. By using the Game you agree to this policy.

## 2. Information we collect
**We do not require an account, and we do not ask for your name, email address, contacts, photos, or precise location.**

**a) Game data stored on your device.** Your progress (cash, upgrades, story progress, settings) is saved locally on your device. We do not receive it. Deleting the Game deletes this data. [If you add cloud save later, update this.]

**b) Analytics and diagnostics (collected automatically).** [Keep only if used.] We use [PostHog / Firebase Analytics] to understand how the Game is used and [Sentry / Firebase Crashlytics] to find and fix crashes. These services may receive: a random installation ID (not linked to your identity), device model, operating system version, app version, language, approximate country (derived from IP address), session timing, in-game events (for example, "finished tutorial"), and crash reports. We do not use this data to identify you.

**c) Advertising data.** The Game shows rewarded video ads, which you choose to watch in exchange for in-game rewards. To serve ads, our advertising partners ([AD NETWORK NAME(S), e.g. Google AdMob, AppLovin]) may collect and use: your device's advertising identifier (IDFA) *only if you allow tracking*, IP address, device and OS information, and information about ads you view or interact with. If you decline tracking, ads are still shown but are not personalized using your IDFA.

**d) Purchases.** [Keep only if you offer in-app purchases.] Purchases are processed by Apple. We do not receive your payment details. We receive confirmation of what was purchased through [RevenueCat / Apple StoreKit], which may process a random app user ID and purchase receipts.

**e) Communications.** If you email us, we receive your email address and message so we can reply.

## 3. How we use information
- To run, maintain, and improve the Game (including fixing crashes and balancing gameplay).
- To show ads and to measure whether ads work.
- To process purchases and restore them. [if IAP]
- To respond to support requests.
- To comply with law and protect against fraud or abuse.

We do not sell your personal information for money. [See §6 for how advertising may count as "sharing" or "selling" under some state laws.]

## 4. Who we share information with
- **Service providers** that help us operate the Game: [analytics provider], [crash reporting provider], [purchase provider]. They may use the data only to provide services to us.
- **Advertising partners**: [AD NETWORK NAME(S)]. They receive the advertising data in §2(c) and act under their own privacy policies: [LINK(S) TO THEIR POLICIES].
- **Legal and safety**: if required by law or to protect rights and safety.
- **Business transfer**: if we are involved in a merger, sale, or similar event.

## 5. Tracking choices (iOS)
On iOS, the Game asks permission before using your advertising identifier for tracking. You can change your choice any time in **Settings > Privacy & Security > Tracking**. [If you add in-app consent for EU/UK users, describe it here and add a "Privacy options" button in Settings.] You can also reset your advertising identifier in iOS settings. Declining tracking does not remove ads; they just are not personalized by your IDFA.

## 6. Your rights
**All users:** you can ask us what data we hold about you, ask us to delete it, or opt out of analytics. Because we do not know who you are, we may ask for your installation ID (shown in Settings > [ABOUT]) to find your data. Email [SUPPORT EMAIL].

**EEA, UK, Switzerland (GDPR):** our legal bases are legitimate interests (running and securing the Game, crash fixing), consent (personalized advertising, where required), and contract (purchases). You may access, correct, delete, restrict, or port your data, object to processing, withdraw consent at any time, and complain to your local data protection authority. Data may be transferred outside your country, including to the United States, using safeguards such as Standard Contractual Clauses.

**California and other US states (CCPA/CPRA and similar):** you may request to know, delete, or correct personal information, and opt out of the "sale" or "sharing" of personal information for cross-context behavioral advertising. Sharing advertising identifiers with ad partners may count as such. You can opt out by declining the iOS tracking prompt or emailing us. We will not discriminate against you for exercising your rights. [Confirm whether these laws apply to you based on your size and revenue; if not, you may still honor requests.]

## 7. Children
The Game is not directed to children under 13 and we do not knowingly collect personal information from children under 13. [Match this to your age rating and your ad network's child-directed setting. If you target a general audience that includes kids, or choose the Kids Category, this section and your ad setup must change.] If you believe a child has given us information, email [SUPPORT EMAIL] and we will delete it.

## 8. Data retention
Analytics and diagnostics data are kept for up to [12/24] months, then deleted or anonymized. Support emails are kept as long as needed to resolve your request. Advertising partners keep data per their own policies.

## 9. Security
We use reasonable measures to protect information, but no method is 100% secure.

## 10. Changes
We may update this policy. We will change the effective date above, and for material changes we will provide notice in the Game or on this page.

## 11. Contact
[LEGAL NAME], [MAILING ADDRESS OR "contact by email"], [SUPPORT EMAIL]

---

## Notes for Julien (delete before publishing)
- Policy must match App Privacy answers in App Store Connect and what the SDKs actually do. Re-check after every SDK change.
- Apple requires the URL in App Store Connect **and** a link inside the app (Guideline 5.1.1).
- Placeholders that depend on your decisions: ad network(s), analytics/crash tools, IAP provider, age target, EU consent flow.
