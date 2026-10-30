const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * 1234 → "$1.23K", 9.5e6 → "$9.5M". Small values keep one decimal only when useful.
 * `fixed` keeps 3 significant figures ("$3.90K") so a live counter doesn't change width.
 */
export function money(n: number, fixed = false): string {
  if (!Number.isFinite(n)) return '$0';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return `${sign}$${n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n)}`;
  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3));
  const v = n / Math.pow(1000, tier);
  const digits = v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0);
  return `${sign}$${fixed ? digits : parseFloat(digits)}${SUFFIXES[tier]}`;
}

/** The value `money(n)` displays, so totals can be summed from the same rounded lines. */
export function shownValue(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const a = Math.abs(n);
  if (a < 1000) return Math.sign(n) * (a < 10 && a % 1 !== 0 ? Math.round(a * 10) / 10 : Math.floor(a));
  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(a) / 3));
  const v = a / Math.pow(1000, tier);
  return Math.sign(n) * parseFloat(v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)) * Math.pow(1000, tier);
}

export function count(n: number): string {
  return money(n).replace('$', '');
}

/** A per-second rate: one decimal under 10, then K/M suffixes (never "20000.0"). */
export function rate(n: number): string {
  if (!Number.isFinite(n)) return '0.0';
  return Math.abs(n) < 10 ? n.toFixed(1) : count(n);
}

/** "$1.50K / $1.50K": both sides of the goal bar use the same precision so they never disagree. */
export function goalAmount(current: number, target: number): string {
  return `${money(Math.min(current, target), true)} / ${money(target, true)}`;
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
