# Card N1 — services: ads, purchases, analytics, crash (v5.17, lane N)

**Goal:** four small service modules with one interface each, a real implementation for iOS and a stub for web, so the game code never imports a native SDK and the web build, the tests and the screenshot run keep working unchanged.

**Read first:** `docs/API.md`; `grep -n "ad\b\|adDouble\|reroll\|streakSave" -i src/engine/rewards.ts | head -30` (where rewards already expect an ad). For each SDK's current API, ask for it in your report under `Needs:` only if the installed version's types don't answer the question; don't guess an API.

## Files
- Own: `src/services/**` (new), `app.json`, `package.json`, `src/app/_layout.tsx` (service start-up only).
- Do not touch: `src/engine/**`, `src/components/**`, `src/app/settings.tsx` (card U3).

## Interfaces (keep them this small)
```ts
// ads.ts
export type AdPlacement = 'double_claim' | 'reroll_task' | 'streak_save' | 'offline_2x' | 'boost_2x' | 'daily_booster';
export interface Ads { ready(p: AdPlacement): boolean; show(p: AdPlacement): Promise<'rewarded' | 'dismissed' | 'unavailable'>; }
// purchases.ts
export type ProductId = 'starter_pack' | 'nonnas_plus' | 'diamonds_80' | 'diamonds_500' | 'diamonds_1200';
export interface Purchases { products(): Promise<{ id: ProductId; price: string }[]>; buy(id: ProductId): Promise<'purchased' | 'cancelled' | 'failed'>; restore(): Promise<ProductId[]>; owned(): ProductId[]; }
// analytics.ts
export interface Analytics { track(event: string, props?: Record<string, string | number | boolean>): void; setOptOut(v: boolean): void; installId(): string; }
// crash.ts
export interface Crash { capture(e: unknown, context?: string): void; }
```

## Steps
- [ ] **1. Platform split.** `ads.native.ts` / `ads.web.ts` and so on, with a shared `types.ts` and an `index.ts` per service. The web stubs: ads resolve by a `?ads=rewarded|dismissed|unavailable` query flag (default `unavailable`); purchases read `?owned=nonnas_plus,…`; analytics and crash record to an in-memory list a test can read. Nothing native is imported on web: prove it with `npx expo export --platform web`.
- [ ] **2. Ads** (`react-native-google-mobile-ads`): rewarded video only. Google's test unit IDs in development. Consent order on first need: the UMP form where required (EU/UK), then the iOS tracking prompt, shown after the tutorial and before the first ad, never at launch. If an ad fails or doesn't fill, `show` returns `unavailable` and the caller lets the player go on without penalty.
- [ ] **3. Purchases** (`react-native-purchases`, RevenueCat): the five products; `nonnas_plus` and `starter_pack` are non-consumable; diamond packs are consumable. `owned()` is cached locally so the game works offline. Granting is idempotent: a restored or replayed purchase never pays diamonds twice (key grants by transaction ID).
- [ ] **4. Analytics** (PostHog): opt-out respected before any event is sent; a random install ID created once and stored locally. Events to define as constants: `ad_offered`, `ad_started`, `ad_completed`, `iap_viewed`, `iap_purchased`, `scene_seen`, `shop_built`, `session_start`, `session_end`. No personal data in props.
- [ ] **5. Crash** (Sentry): init in `_layout.tsx`, off when analytics is opted out.
- [ ] **6. Config** in `app.json`: `NSUserTrackingUsageDescription`, `GADApplicationIdentifier` (a placeholder and a comment naming where the real one goes), the SKAdNetwork IDs AdMob requires, the config plugins for each SDK, and privacy-manifest entries. All keys come from `process.env.EXPO_PUBLIC_*` with a safe empty default; no key is committed.
- [ ] **7. Grant logic** as a pure module, `src/services/grants.ts`: what each product gives (diamonds, the 24-hour boost, the `awning-founder` cosmetic, the Plus entitlement), tested, including the idempotence rule.

## Tests
Stubs' behaviours; grant idempotence; opt-out stops events; consent order as a pure state machine (`consent.ts`): UMP → tracking prompt → ad, with each refusal path still ending in an ad or a clean `unavailable`.

## Checks
`npx tsc --noEmit`; `npx jest src/services`; `npx expo export --platform web > /tmp/e.log 2>&1; tail -2 /tmp/e.log`. You may run `npx expo install` for the four SDKs; no other installs.
