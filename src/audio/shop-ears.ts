// The shop's state by ear (card A3, v5.22): three quiet effects that say what the shop is doing without looking.
// Pure rules (no store, no clock of its own); the director feeds it the shop's report about once a second and plays what it returns.
//   oven_ding   a baked batch lands on the pass while the ovens' output is piling (one at most every 4 s)
//   phone_ring  the floor has a line (or is losing customers): two rings, then silence (one at most every 30 s)
//   tip_bell    the shop is tipping: one small bell per 20 sales at most

export type ShopSound = 'oven_ding' | 'phone_ring' | 'tip_bell';

export const EARS = {
  /** Between two oven dings, ms. */
  dingGapMs: 4000,
  /** Between two phone rings, ms (the ring itself is 2 s long). */
  ringGapMs: 30_000,
  /** Sales while tipping that earn a bell. */
  salesPerBell: 20,
  /** How often the director looks at the shop, ms. */
  pollMs: 1000,
} as const;

/** What the director reads from the shop's report and the shop itself. */
export interface EarsInput {
  /** The report is live for this shop (a head or a manager is in, a scene or a popup is not in the way). */
  live: boolean;
  /** The ovens' symptom (`piling`, `idle` or none) and the floor's (`line`, `walkout` or none). */
  ovens: string | null;
  floor: string | null;
  /** The service state is `tipping`. */
  tipping: boolean;
  /** Baked pies waiting on the pass (the shop's `line.baked`). */
  baked: number;
  /** The shop's whole-number sold count. */
  sold: number;
}

export class ShopEars {
  private lastDing = -Infinity;
  private lastRing = -Infinity;
  private baked: number | null = null;
  private sold: number | null = null;
  private tipSales = 0;

  /**
   * Forget what was last seen (another shop, a scene, the popup, sound off): the next step only takes a baseline, so a jump in the counts
   * never reads as a batch or as sales. The rate limits keep their times, so a reset never buys a second ring.
   */
  reset(): void {
    this.baked = null;
    this.sold = null;
    this.tipSales = 0;
  }

  /** One look at the shop at `now` (ms): the sounds to play, in order. */
  step(now: number, i: EarsInput): ShopSound[] {
    if (!i.live) {
      this.reset();
      return [];
    }
    const out: ShopSound[] = [];
    const first = this.baked === null || this.sold === null;
    const batch = this.baked !== null && i.baked > this.baked;
    const sales = this.sold !== null ? Math.max(0, i.sold - this.sold) : 0;
    this.baked = i.baked;
    this.sold = i.sold;
    if (first) return out;

    if (i.ovens === 'piling' && batch && now - this.lastDing >= EARS.dingGapMs) {
      this.lastDing = now;
      out.push('oven_ding');
    }
    if ((i.floor === 'line' || i.floor === 'walkout') && now - this.lastRing >= EARS.ringGapMs) {
      this.lastRing = now;
      out.push('phone_ring');
    }
    if (i.tipping) {
      this.tipSales += sales;
      if (this.tipSales >= EARS.salesPerBell) {
        this.tipSales = 0;
        out.push('tip_bell');
      }
    } else {
      this.tipSales = 0;
    }
    return out;
  }
}
