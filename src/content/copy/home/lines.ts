// Home lines written by hand (not generated: the copy files have no rows for them yet): the app's own words for the founder countdown and the
// rewards lock. Each names the founder as `{founder}` (cityOf(g).founder.name; "Nonna" at home), so a city's pack can reuse the key unchanged.
// A city may override any of them in its own `CityDef.copy`.

/** Every line, by its key. */
export const LINES = {
  /** The City map pin of the next lot while the founder's takeover holds it (`{n}` pies to go). */
  'lot.pin.founder': '{founder} in {n}',
  'lot.pin.founder.soon': '{founder} soon',
  /** The shop tab's countdown under a held lot. */
  'lot.piesToGo': '{n} pies to go',
  'lot.piesToGo.one': '{n} pie to go',
  /** The daily gift's caption before the rewards unlock. */
  'rewards.gift.locked': 'Unlocks when {founder} takes over',
} as const;

export type LineKey = keyof typeof LINES;
