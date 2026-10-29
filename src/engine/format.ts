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

/** The value `money(n)` displays, so totals can be summed from the same rounded lines (critic D223). */
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

export function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}
