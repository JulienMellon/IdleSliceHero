// The shop report (v5.16, card P1): every number and every line of the service feature, the strip and the sheet.
// The rules are in src/engine/features/service.ts (what is measured, tips, the cold line) and src/components/report/ (what is drawn).
// Strings come from docs/story/COPY-v5.16.md section 7, by key. The heads' symptom barks live with the other barks (content/heads.ts).
import type { NeighborhoodId } from './types';

export const SERVICE = {
  /** Service (sold ÷ wanted) is measured in steps this big, rounded down, so the thresholds read the same on screen and in the rules. */
  step: 0.05,
  /** Service at or above this: customers tip. */
  tipAt: 0.9,
  /** The shop's pizzas are worth this much more while they tip. */
  tipMult: 1.1,
  /** Service under this for `coldSeconds` of play in a row turns the line cold, until it is back at this. */
  coldBelow: 0.6,
  coldSeconds: 60,
  /** The shop's pizzas are worth this much less while the line is cold. */
  coldMult: 0.9,
  /** While cold, the street draws this share of its line (the scene reads `reportView().queueShare`). */
  coldQueueShare: 0.5,
  /** A station's lamp: Slammed from this load, Busy from `busyAt`, Idle below. */
  slammedAt: 0.95,
  busyAt: 0.6,
  /** The floor's lamp, from wanted ÷ kitchen: a line out the door from `packedAt`, Steady from `steadyAt`, Quiet below. */
  packedAt: 1.05,
  steadyAt: 0.6,
  /**
   * Symptoms (v5.22, card E3), read off the kitchen line the shop is running, never off the rates. A station is `piling` when its output backlog
   * (dough on the bench, pies on the pass) is over `pileBatches` of one batch while customers outnumber the kitchen; the state is a running
   * average over about `pileSeconds` that must reach `pileOn`. It is `idle` when it waited for input (no job running, output not backed up)
   * for `idleOn` of about the last `idleSeconds`. The drivers are `idle` when more than `driversIdleShare` of them wait, and the floor shows
   * a `line` when customers outnumber the kitchen; each has to hold `holdSeconds` first, and the line is a `walkout` once it has held
   * `walkoutSeconds` (customers are leaving).
   */
  pileBatches: 2,
  pileSeconds: 5,
  pileOn: 0.7,
  idleSeconds: 20,
  idleOn: 0.6,
  driversIdleShare: 0.5,
  holdSeconds: 10,
  walkoutSeconds: 20,
  /** A symptom bark waits until the state has held this long (s); the gaps between barks are in content/heads.ts. */
  barkAfterSeconds: 10,
  /** The pizzas a minute a hand-tapped station "can handle" is what the player made over about this window (s). */
  madeSeconds: 60,
  /** A state's hold timer stops counting here (s): past the long bark gap's threshold there is nothing more to learn. */
  holdCap: 180,
  /** A foreground stamp older than this (ms) means the app was away: no tip, no penalty, and the timers start again. */
  freshMs: 5_000,
  /** The stamp is renewed this often (ms). */
  stampMs: 2_000,
} as const;

/** The copy's key part for each shop's manager (`report.<key>.kitchen`); Downtown's is Nonna Rosa's `nonna`. */
export const MANAGER_COPY_KEY: Record<NeighborhoodId, string> = {
  downtown: 'nonna',
  suburbs: 'deb',
  waterfront: 'skip',
  university: 'noor',
  industrial: 'dee',
  uptown: 'anton',
};

/** The initial in each lamp chip on the strip (D492): Prep, Ovens, Counter, and the floor's customers coming In. */
export const LAMP_INITIAL = { prep: 'P', ovens: 'O', counter: 'C', floor: 'In' } as const;

/** Every line, by the copy's key. `{name}` is filled by `fill` in components/report/report-model.ts. */
export const COPY = {
  'report.kitchen': 'Serving {served} of {wanted} orders a minute. {lost} walking out.',
  'report.quiet': 'Kitchen could do {could} a minute. Only {wanted} come in.',
  'report.tipping': 'Fast service. Customers are tipping 10% extra.',
  'report.cold': 'Service went cold. Income −10% until it recovers.',
  'report.nonna.kitchen': '{served} of {wanted} a minute, cara. {lost} walks out the door!',
  'report.nonna.quiet': 'We bake {could}, they want {wanted}. Go find me hungry people!',
  'report.nonna.tipping': 'Fast and hot! They tip 10% more. Of course they do.',
  'report.nonna.cold': 'Cold service, cold pizza! −10% until we fix it. Bake!',
  'report.deb.kitchen': '{served} of {wanted} a minute. {lost} walked off. Unacceptable.',
  'report.deb.quiet': 'Kitchen can do {could}. Only {wanted} show up. Get me a crowd.',
  'report.deb.tipping': 'Line’s moving, tips up 10%. That’s how it’s done.',
  'report.deb.cold': 'We’re slow and folks noticed. −10% till we fix it.',
  'report.skip.kitchen': '{served} of {wanted} a minute. Counted twice. {lost} walking off.',
  'report.skip.quiet': 'We can do {could}. Only {wanted} came aboard. I checked twice.',
  'report.skip.tipping': 'Tips up 10%. Counted twice. Then once more, for joy.',
  'report.skip.cold': 'Service is slipping. −10% till we mend it. Recounting.',
  'report.noor.kitchen': 'Queue: {served} of {wanted} a minute. {lost} gave up and left.',
  'report.noor.quiet': 'Capacity {could}, arrivals {wanted}. Idle servers. Fascinating.',
  'report.noor.tipping': 'Barely any wait. Tips up 10%. This is publishable.',
  'report.noor.cold': 'Queue’s unstable. Word spread. −10% until it settles.',
  'report.dee.kitchen': '{served} of {wanted} a minute. {lost} clocking out early.',
  'report.dee.quiet': 'Ovens can do {could}. Only {wanted} in line. Slow shift.',
  'report.dee.tipping': 'Crew’s on rhythm. Tips up 10%. Sal might hum.',
  'report.dee.cold': 'Line’s backed up. −10% till it clears. Pick it up.',
  'report.anton.kitchen': '{served} of {wanted} seated a minute. {lost} left without dining.',
  'report.anton.quiet': 'We could seat {could}. Only {wanted} arrive. The room echoes.',
  'report.anton.tipping': 'Impeccable service. Tips up 10%. As it should be.',
  'report.anton.cold': 'Guests waiting. Unforgivable. −10% until we recover.',

  'lamp.station.slammed': 'Slammed',
  'lamp.station.busy': 'Busy',
  'lamp.station.idle': 'Idle',
  'lamp.floor.full': 'Packed',
  'lamp.floor.steady': 'Steady',
  'lamp.floor.quiet': 'Quiet',
  // the strip's one state word when no lamp is the worst (D492)
  'lamp.state.tipping': 'Tipping',
  'lamp.state.cold': 'Cold',

  'effect.gain': '+{gain}/min · pays back in {time}',
  'effect.nogain': '{station} isn’t holding you back',
  'effect.head': 'Runs this station for you, nonstop',
  'effect.manager': 'Full speed while away · income ×2',

  'report.sheet.title': 'Shop Report',
  'report.sheet.fix.faster.title': 'Faster stations',
  'report.sheet.fix.faster.line': 'Upgrade the slowest station first. That’s where orders pile up.',
  'report.sheet.fix.customers.title': 'More customers',
  'report.sheet.fix.customers.line': 'When the kitchen has room to spare, bring in more people.',
  'report.sheet.fix.prices.title': 'Pricier pizzas',
  'report.sheet.fix.prices.line': 'Better recipes earn more per pie, without a single extra order.',
  'report.sheet.tip': 'Serve 90% or more of your orders and customers tip 10% extra.',
  'report.sheet.cold': 'Under 60% served for a minute? Word spreads: −10% until it recovers.',
} as const;

export type CopyKey = keyof typeof COPY;

/** The purchases each "way to fix it" row names (real cards in the drawer). */
export const FIX_ROWS = [
  { key: 'faster', buys: 'Prep, Ovens, Counter' },
  { key: 'customers', buys: 'Seating, Drivers, Fleet' },
  { key: 'prices', buys: 'Oven grade, Decor' },
] as const;
