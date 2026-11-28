const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
/** From here the last suffix would print four digits ("1000Dc"): 999.5 Dc rounds to 1000, so a number this big is written in scientific form instead ("2.4e38"). */
const SCIENTIFIC_FROM = 999.5 * Math.pow(1000, SUFFIXES.length - 1);

/** n at or past SCIENTIFIC_FROM as "2.4e38" (three significant figures at most, trailing zeros dropped). */
function scientific(n: number): string {
  const [m, e] = n.toExponential(2).split('e');
  return `${parseFloat(m)}e${parseInt(e, 10)}`;
}

/**
 * v5.25: every amount is a whole number, rounded down: 0.6 → "$0", 12.5 → "$12", 999.9 → "$999". From 1000 up the K/M/B suffix forms keep their
 * digits (1500 → "$1.5K", 1234 → "$1.23K", 9.5e6 → "$9.5M"): the only decimal point left is inside a suffix form.
 * v5.25: no trailing zeros anywhere ("$3.9K", never "$3.90K"); `fixed` is kept for the call sites that pass it and changes nothing.
 */
export function money(n: number, _fixed = false): string {
  if (!Number.isFinite(n)) return '$0';
  const sign = n <= -1 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return `${sign}$${Math.floor(n)}`;
  if (n >= SCIENTIFIC_FROM) return `${sign}$${scientific(n)}`;
  const { tier, digits } = scaled(n);
  return `${sign}$${parseFloat(digits)}${SUFFIXES[tier]}`;
}

/**
 * n ≥ 1000 as a tier and its rounded digits. Rounding can carry into the next tier (999,500 rounds to "1000" in K),
 * so the tier is recomputed after rounding: "$1M", never "$1000K" (C109).
 */
function scaled(n: number): { tier: number; digits: string } {
  const at = (tier: number) => {
    const v = n / Math.pow(1000, tier);
    return { tier, digits: v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0) };
  };
  let r = at(Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3)));
  if (parseFloat(r.digits) >= 1000 && r.tier < SUFFIXES.length - 1) r = at(r.tier + 1);
  return { tier: r.tier, digits: r.digits };
}

/** The value `money(n)` displays, so totals can be summed from the same rounded lines. */
export function shownValue(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const a = Math.abs(n);
  if (a < 1000) return Math.sign(n) * Math.floor(a);
  if (a >= SCIENTIFIC_FROM) return Math.sign(n) * parseFloat(a.toExponential(2));
  const { tier, digits } = scaled(a);
  return Math.sign(n) * parseFloat(digits) * Math.pow(1000, tier);
}

export function count(n: number): string {
  return money(n).replace('$', '');
}

/**
 * A rate of money per second as the player reads it (v5.25): "$12/s" from $1/s up (suffix forms as in `money`: "$1.5K/s"), "$36/min" under $1/s,
 * and "<$1/min" under $1/min (and for no income at all). Never a decimal point outside a suffix form.
 */
export function rate(perSecond: number): string {
  if (!Number.isFinite(perSecond) || perSecond <= 0) return '<$1/min';
  if (perSecond >= 1) return `${money(perSecond)}/s`;
  const perMinute = Math.floor(perSecond * 60);
  return perMinute >= 1 ? `$${perMinute}/min` : '<$1/min';
}

/** "$1.50K / $1.50K": both sides of the goal bar use the same precision so they never disagree. */
export function goalAmount(current: number, target: number): string {
  // whole dollars under $1K on both sides (D343), so "$3 / $25", never "$3.0 / $25"
  const side = (n: number) => (n < 1000 ? `$${Math.floor(Math.max(0, n))}` : money(n, true));
  return `${side(Math.min(current, target))} / ${side(target)}`;
}

export function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

/** A count of pizzas done: always a whole number ("70", "1.2K"); never "70.0002". */
export function pizzas(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const w = Math.floor(n);
  return w < 1000 ? String(w) : count(w);
}

/** A count of pizzas still to go: rounded up, so "1 more" never shows as "0 more". */
export function pizzasLeft(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const w = Math.ceil(n - 1e-9);
  return w < 1000 ? String(w) : count(w);
}

/** The HUD cash: whole dollars under $1K (cash arrives a pie at a time, so "$3.0" read as a rounding leftover), then "$1.23K". */
export function cashText(n: number): string {
  return Number.isFinite(n) && Math.abs(n) < 1000 ? `$${Math.floor(Math.max(0, n))}` : money(n, true);
}
