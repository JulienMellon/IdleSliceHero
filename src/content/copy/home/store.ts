// The Store tab's lines (v5.23, card N1), copied byte for byte from docs/story/COPY-v5.23.md sections 2 to 4 (written by card W4). Hand-kept like
// tutorial.ts, not generated: change the copy file and this table together. Prices are never typed in; the store supplies them.
// `{n}` is a count, `{cash}` in-game cash from money() (the line adds the "≈"), `{mult}` and `{hours}` come from the pack's grant.

/** Every line, by its key in the copy file. */
export const COPY = {
  'store.starter.title': "Nonna's Starter Pack",
  'store.starter.nonna': 'I pack it myself. Like a lunch, cara.',
  'store.starter.blurb': '{n} diamonds, {mult}× income for {hours} hours and the Founder awning',
  'store.starter.ribbon': 'ONE PER OWNER',
  'store.chip.diamonds': 'Enough for {n} shop looks',
  'store.chip.awning': 'Only in this pack',
  'store.chip.boost': "≈ {cash} at your shop's pace",
  'store.starter.rate': 'Most diamonds per dollar in the store',
  'store.pack.diamonds_80.title': 'Pinch of Diamonds',
  'store.pack.diamonds_500.title': 'Box of Diamonds',
  'store.pack.diamonds_1200.title': 'Crate of Diamonds',
  'store.bonus': '+{n} bonus',
  'store.best': 'Best diamond-pack rate',
  'store.firstbuy': 'First buy: 2×',
  'store.looks': 'Enough for {n} looks',
  'store.plus.title': "Nonna's Plus",
  'store.plus.ads': 'You watched {n} ads this week. Plus skips all {n}.',
  'store.plus.once': 'Pay once. Yours forever.',
  // Rows of COPY-v5.23.md (S103, G120, S99, D566).
  'store.firstbuy.pays': 'First buy pays double: {n} diamonds',
  'store.chip.boost.plain': 'Double income for {span}',
} as const;
