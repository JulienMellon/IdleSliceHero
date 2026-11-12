# Launch track (Julien)

The wishlist's launch items that no agent can do, with the version each one blocks. Nothing here blocks building; the first four block the device checks for 5.17, and the rest block submission. The orchestrator does not read this file.

## Accounts and programs
| Item | Blocks | Note |
| --- | --- | --- |
| Apple Developer Program enrollment | 5.17 device checks | Needed for any build on a phone |
| App Store Small Business Program | first sale | Apply after enrolling |
| AdMob account and iOS app ID | 5.17 device checks | Test IDs work until then |
| RevenueCat project; five products in App Store Connect | 5.17 device checks | Product ids are on card N1 and in DECISIONS #9 |
| Sentry and PostHog projects | 5.17 device checks | Keys go in `EXPO_PUBLIC_*` variables |
| Support email address | submission | Fills `SUPPORT_EMAIL` on the site |

## Name and brand
| Item | Blocks | Note |
| --- | --- | --- |
| Trademark and name check on "Slice Empire" | listing, icon, any ad spend | Include "MegaSlice" and "Mudhens" (there is a real minor-league team, the Toledo Mud Hens) |
| Final title and the home city's name | listing | DECISIONS #10 and #11 |
| App icon | submission | The one piece of art worth commissioning |

## Store
| Item | Blocks | Note |
| --- | --- | --- |
| Listing: name, subtitle, keywords, description | submission | Card L1 drafts them in `docs/STORE-LISTING.md` for you to edit |
| Screenshots | submission | Card L1 generates the 6.9-inch iPhone set. Re-check Apple's screenshot specifications page on the day you upload |
| App Privacy label and age rating (13+) | submission | Card L1 reconciles the answers with what the code collects |
| Support and privacy pages live | submission | Card L1 builds the site; turn on GitHub Pages for the repo |

## Testing and release
| Item | When | Note |
| --- | --- | --- |
| Device checklist | after 5.17's gate | `docs/build/v5.17/DEVICE-CHECKLIST.md` |
| TestFlight beta with real testers | after the checklist passes | Their notes come back as a fix round |
| Promo ad draft 2 | after your notes on draft 1 | Re-record with the lofi score; TikTok-safe caption position |
| Soft launch in a small market | after TestFlight | Measure rewarded views per daily player, opt-in rate, payer conversion, day-1 / day-7 / day-30 retention, crash-free sessions |
| Landing page and press kit | before the wider launch | The site from card L1 is the landing page; the press kit is the store screenshots, the icon, the promo ad and a one-page fact sheet |
| Support plan | before the wider launch | Who answers the support address, and how a data request with an Install ID is handled |

I'm not a lawyer: treat the trademark, privacy-policy and consent items as things to confirm with one.
