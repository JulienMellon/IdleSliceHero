// The kitchen line: prep → oven → counter → a departure that pays on the doorstep.
// Pure (no React). Foreground play runs every built shop through this stage machine; offline catch-up
// keeps the closed-form rate in game.ts. Owner direction (playtest 2, 2026-10-30): cash goes up only when
// pizza leaves the shop, and a shop makes pizza in three taps until its heads automate the stations.

import type { HeadKind } from '../content/tuning';

/** One batch of pies at a station. `left`/`total` are seconds. */
export interface StageJob {
  n: number;
  left: number;
  total: number;
}

/** The three stations; the same union as a head's kind (each head runs one station). */
export type Station = HeadKind;
export const STATIONS_IN_ORDER: readonly Station[] = ['prep', 'oven', 'counter'];

/** A carrier with pies: a driver pays at the door, a walk-in at the register. Pays when `left` reaches 0. */
export interface Departure {
  id: number;
  kind: 'driver' | 'walkin';
  n: number;
  cash: number;
  left: number;
}

export interface Line {
  prep: StageJob | null;
  oven: StageJob | null;
  counter: StageJob | null;
  /** Pies on the bench, waiting for the oven. */
  prepped: number;
  /** Pies on the pass, waiting for the counter. */
  baked: number;
  /** Pies served and boxed, waiting for a carrier (G81: nobody leaves → nobody pays). */
  boxed: number;
  /** Seconds until the driver is back at the pickup spot (0: waiting there). */
  driverBusy: number;
  /** Seconds until the next walk-in is waiting at the register (0: one is). */
  walkinBusy: number;
  departures: Departure[];
  /** Pies owed to walk-ins (Bresenham): keeps the long-run walk-in share equal to the steady-state split. */
  walkInDebt: number;
  nextId: number;
}

export const emptyLine = (): Line => ({ prep: null, oven: null, counter: null, prepped: 0, baked: 0, boxed: 0, driverBusy: 0, walkinBusy: 0, departures: [], walkInDebt: 0, nextId: 1 });

export const LINE = {
  /** A managed job lasts about this long at the shop's rate, so high levels move big stacks, not a strobe. */
  cycleSeconds: 2.4,
  /** A tapped prep job won't start while the bench holds this many pies. */
  prepBuffer: 12,
  /** A driver walks from the counter to the door in this long, then pays. */
  departSeconds: 2.0,
  /** A walk-in takes their pie at the register in this long, then pays (long enough for the scene to show it). */
  handoffSeconds: 1.0,
  /** The driver's whole lap: out the door (departSeconds), down the street and back to the pickup spot. */
  driverLap: 5.0,
  /** After a walk-in is served, the next one is waiting at the register this much later. */
  walkinLap: 4.6,
  /** Below this walk-in share nobody comes in to order (every pie goes out with the driver). */
  minWalkInShare: 0.02,
  /** At most this many carriers in flight; more merge into the newest. */
  maxDepartures: 6,
  /** A rush tap takes this much off every running job. */
  rushSeconds: 0.25,
} as const;

/** Bound on |walkInDebt| (C84): a few full prep benches' worth of pies, derived from LINE so it can't drift on its own. */
export const WALK_IN_DEBT_MAX = LINE.prepBuffer * LINE.maxDepartures;
export const clampWalkInDebt = (d: number): number => (Number.isFinite(d) ? Math.min(WALK_IN_DEBT_MAX, Math.max(-WALK_IN_DEBT_MAX, d)) : 0);

/** Rates and prices the line needs from one shop (game.ts `lineRates` computes them). */
export interface LineRates {
  prep: number;
  oven: number;
  /** min(counter, demand): staff can't serve faster than customers arrive. */
  serve: number;
  /** Steady-state pies per second (min of the stages); sizes automated batches. */
  shop: number;
  /** Average cash per pie (game.ts `valuePerPizza`), so the line's revenue equals `shopRevenue` by construction. */
  price: number;
  /** Steady-state share of pies that go to walk-ins (0..1): only decides which figure carries a departure. */
  walkInFraction: number;
  /** Pies per tapped prep batch (grows with prep level). */
  tapBatch: number;
}

/** Which stations run on their own (a head, or the GM, works them). */
export type Automation = Readonly<Record<Station, boolean>>;
export const MANUAL: Automation = { prep: false, oven: false, counter: false };
export const AUTOMATIC: Automation = { prep: true, oven: true, counter: true };

/** Automated batch size: at least a tap batch, big enough that a job takes ~cycleSeconds at the shop's rate. */
export const batchFor = (r: LineRates) => Math.max(r.tapBatch, Math.ceil(r.shop * LINE.cycleSeconds));

/** A job never takes longer than this (a zero rate would otherwise give Infinity, which a save drops: C69). */
const MAX_JOB_SECONDS = 3600;
const job = (n: number, rate: number): StageJob => {
  const total = rate > 0 ? Math.min(MAX_JOB_SECONDS, n / rate) : MAX_JOB_SECONDS;
  return { n, left: total, total };
};

export type TapResult = { ok: true; line: Line } | { ok: false; reason: string };

const secs = (x: number) => `${Math.max(0.1, x).toFixed(1)} s`;

/** A tap on a station (only stations nobody automates take taps). */
export function tapStation(line: Line, st: Station, r: LineRates, auto: Automation = MANUAL): TapResult {
  if (auto[st]) return { ok: false, reason: 'Your head of station has it' };
  if (st === 'prep') {
    if (line.prep) return { ok: false, reason: `Still prepping · ${secs(line.prep.left)}` };
    const room = LINE.prepBuffer - line.prepped;
    if (room <= 0) return { ok: false, reason: 'Bench full — bake what’s prepped' };
    return { ok: true, line: { ...line, prep: job(Math.min(r.tapBatch, room), r.prep) } };
  }
  if (st === 'oven') {
    if (line.oven) return { ok: false, reason: `Oven busy · ${secs(line.oven.left)}` };
    if (line.prepped <= 0) return { ok: false, reason: line.prep ? `Dough’s still prepping · ${secs(line.prep.left)}` : 'Nothing prepped yet — tap the prep table' };
    return { ok: true, line: { ...line, prepped: 0, oven: job(line.prepped, r.oven) } };
  }
  if (line.counter) return { ok: false, reason: `Serving · ${secs(line.counter.left)}` };
  if (line.baked <= 0) return { ok: false, reason: line.oven ? `Still baking · ${secs(line.oven.left)}` : 'Nothing baked yet — tap the oven' };
  return { ok: true, line: { ...line, baked: 0, counter: job(line.baked, r.serve) } };
}

/** Rush tap (managed shop): every running job finishes a little sooner. Pays nothing by itself. */
export function rushLine(line: Line): Line {
  const cut = (j: StageJob | null) => (j ? { ...j, left: Math.max(0, j.left - LINE.rushSeconds) } : j);
  return { ...line, prep: cut(line.prep), oven: cut(line.oven), counter: cut(line.counter) };
}

/** The next station worth tapping (downstream first), or null when nothing can start. */
export function nextTap(line: Line, auto: Automation = MANUAL): Station | null {
  if (!auto.counter && line.baked > 0 && !line.counter) return 'counter';
  if (!auto.oven && line.prepped > 0 && !line.oven) return 'oven';
  if (!auto.prep && !line.prep && line.prepped < LINE.prepBuffer) return 'prep';
  return null;
}

export interface Advance {
  line: Line;
  /** Cash paid by departures that reached the door this step. */
  paid: number;
  /** Pies those departures carried. */
  sold: number;
}

/** Mutable working copy for one advance (never escapes). */
type Work = Line & { paid: number; sold: number };

/**
 * Start every automated station that can. A station starts once a full batch waits (or anything waits, when the
 * station before it is manual, so a tapped batch isn't stranded) and won't start while its output already holds
 * two downstream batches (back-pressure counted in batches). It takes everything waiting while that's under two
 * batches, so a remainder left by a batch-size change or by tapped play never gets stuck (C67).
 */
const take = (waiting: number, b: number) => (waiting < 2 * b ? waiting : b);
function startAutomated(w: Work, r: LineRates, auto: Automation) {
  const b = batchFor(r);
  if (auto.counter && !w.counter && w.baked > 0 && (w.baked >= b || !auto.oven)) {
    const n = take(w.baked, b);
    w.baked -= n;
    w.counter = job(n, r.serve);
  }
  if (auto.oven && !w.oven && w.prepped > 0 && (w.prepped >= b || !auto.prep) && w.baked < 2 * b) {
    const n = take(w.prepped, b);
    w.prepped -= n;
    w.oven = job(n, r.oven);
  }
  if (auto.prep && !w.prep && w.prepped < 2 * b) w.prep = job(b, r.prep);
}

/**
 * Hand boxed pies to whoever is free to carry them (G81): the walk-in waiting at the register when the walk-in
 * split is due, otherwise the driver at the pickup spot. Each trip takes everything boxed, so a busy carrier only
 * makes the next stack bigger, never slower: throughput still equals `shopRate`. A carrier is then busy for its lap.
 */
function dispatch(w: Work, r: LineRates) {
  const walkins = r.walkInFraction > LINE.minWalkInShare;
  // nobody is buying in person: the split owes nothing, so don't let old debt linger or build up (C84)
  if (!walkins) w.walkInDebt = 0;
  while (w.boxed > 0) {
    const n = w.boxed;
    const due = walkins && w.walkInDebt + n * r.walkInFraction >= n / 2;
    let kind: Departure['kind'] | null = null;
    if (due) kind = w.walkinBusy <= 0 ? 'walkin' : null;
    else kind = w.driverBusy <= 0 ? 'driver' : null;
    // the carrier who is due is out: the pies wait and join their next trip (keeps the split true)
    if (!kind) return;
    w.walkInDebt = walkins ? clampWalkInDebt(w.walkInDebt + n * r.walkInFraction - (kind === 'walkin' ? n : 0)) : 0;
    w.boxed = 0;
    const cash = n * r.price;
    const left = kind === 'walkin' ? LINE.handoffSeconds : LINE.departSeconds;
    if (kind === 'walkin') w.walkinBusy = LINE.walkinLap;
    else w.driverBusy = LINE.driverLap;
    if (w.departures.length >= LINE.maxDepartures) {
      // merge into the newest carrier rather than grow without bound
      const last = w.departures[w.departures.length - 1];
      w.departures[w.departures.length - 1] = { ...last, n: last.n + n, cash: last.cash + cash };
    } else w.departures.push({ id: w.nextId++, kind, n, cash, left });
  }
}

/** Pay every departure that has reached the door (and walk-ins at the register). */
function settle(w: Work) {
  if (!w.departures.some((d) => d.left <= 1e-9)) return;
  const keep: Departure[] = [];
  for (const d of w.departures) {
    if (d.left <= 1e-9) {
      w.paid += d.cash;
      w.sold += d.n;
    } else keep.push(d);
  }
  w.departures = keep;
}

/** Safety cap on events handled per advance; managed batches are sized so a 2 s step needs only a few. */
const MAX_EVENTS = 200;

/**
 * Advance the line by dt seconds. Steps from event to event (a job finishing or a carrier reaching the door),
 * so leftover time within a tick carries into the next job and the result doesn't depend on tick size.
 */
export function advanceLine(line: Line, dt: number, r: LineRates, auto: Automation): Advance {
  const w: Work = { ...line, departures: line.departures.map((d) => ({ ...d })), paid: 0, sold: 0 };
  const any = auto.prep || auto.oven || auto.counter;
  if (any) startAutomated(w, r, auto);
  dispatch(w, r);
  settle(w);
  let t = dt;
  let k = 0;
  for (; t > 1e-9 && k < MAX_EVENTS; k++) {
    let step = t;
    // a carrier coming free is an event only while pies wait for one
    if (w.boxed > 0) {
      if (w.driverBusy > 0 && w.driverBusy < step) step = w.driverBusy;
      if (w.walkinBusy > 0 && w.walkinBusy < step) step = w.walkinBusy;
    }
    for (const st of STATIONS_IN_ORDER) {
      const j = w[st];
      if (j && j.left < step) step = j.left;
    }
    for (const d of w.departures) if (d.left < step) step = d.left;
    step = Math.max(0, step);
    // jobs are fresh objects per start, but the input line's jobs are shared: copy once per advance
    for (const st of STATIONS_IN_ORDER) {
      const j = w[st];
      if (j) w[st] = j === line[st] ? { ...j, left: j.left - step } : ((j.left -= step), j);
    }
    for (const d of w.departures) d.left -= step;
    w.driverBusy = Math.max(0, w.driverBusy - step);
    w.walkinBusy = Math.max(0, w.walkinBusy - step);
    t -= step;
    // finish jobs, downstream first so a freed counter can take the oven's batch on the next start
    const c = w.counter;
    if (c && c.left <= 1e-9) {
      w.counter = null;
      w.boxed += c.n;
    }
    const o = w.oven;
    if (o && o.left <= 1e-9) {
      w.oven = null;
      w.baked += o.n;
    }
    const p = w.prep;
    if (p && p.left <= 1e-9) {
      w.prep = null;
      w.prepped += p.n;
    }
    dispatch(w, r);
    settle(w);
    if (any) startAutomated(w, r, auto);
    // nothing running, nobody walking and nothing boxed: nothing more can happen this step (carrier timers still
    // count down, below)
    if (!w.prep && !w.oven && !w.counter && w.departures.length === 0 && w.boxed === 0) {
      w.driverBusy = Math.max(0, w.driverBusy - t);
      w.walkinBusy = Math.max(0, w.walkinBusy - t);
      t = 0;
      break;
    }
  }
  if (k >= MAX_EVENTS && t > 1e-9 && typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`advanceLine: event cap hit, ${t.toFixed(2)} s dropped`); // C70
  const { paid, sold } = w;
  const next: Line = { prep: w.prep, oven: w.oven, counter: w.counter, prepped: w.prepped, baked: w.baked, boxed: w.boxed, driverBusy: w.driverBusy, walkinBusy: w.walkinBusy, departures: w.departures, walkInDebt: w.walkInDebt, nextId: w.nextId };
  return { line: next, paid, sold };
}

/** Whole pies anywhere on the line (prepping, on the bench, baking, on the pass, serving, walking out). */
export function piesInFlight(line: Line): number {
  return (line.prep?.n ?? 0) + line.prepped + (line.oven?.n ?? 0) + line.baked + (line.counter?.n ?? 0) + line.boxed + line.departures.reduce((t, d) => t + d.n, 0);
}
