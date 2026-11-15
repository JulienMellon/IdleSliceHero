// The four service interfaces. Game code imports these (through ./index) and never a native SDK.

export type AdPlacement = 'double_claim' | 'reroll_task' | 'streak_save' | 'offline_2x' | 'boost_2x' | 'daily_booster';
export type AdResult = 'rewarded' | 'dismissed' | 'unavailable';

export interface Ads {
  /** An ad could be shown now: the tutorial is over and one is loaded, or the first one is yet to be asked for. */
  ready(p: AdPlacement): boolean;
  /** Never throws. `unavailable` (no fill, no consent, an error) means: let the player go on, no penalty. */
  show(p: AdPlacement): Promise<AdResult>;
}

export type ProductId = 'starter_pack' | 'nonnas_plus' | 'diamonds_80' | 'diamonds_500' | 'diamonds_1200';
export const PRODUCT_IDS: readonly ProductId[] = ['starter_pack', 'nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200'];
export type BuyResult = 'purchased' | 'cancelled' | 'failed';

export interface Purchases {
  products(): Promise<{ id: ProductId; price: string }[]>;
  buy(id: ProductId): Promise<BuyResult>;
  restore(): Promise<ProductId[]>;
  owned(): ProductId[];
}

export type Props = Record<string, string | number | boolean>;
export interface Analytics {
  track(event: string, props?: Props): void;
  setOptOut(v: boolean): void;
  installId(): string;
}

export interface Crash {
  capture(e: unknown, context?: string): void;
}

/** A small async key-value store: AsyncStorage on iOS, localStorage or memory on the web and in tests. */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
