// The shop report's words (v5.22, card U3): the sheet's title, the bars' names, the demand line and the served/missed numbers.
// Rows 1-9 are copied byte for byte from docs/story/COPY-v5.22.md section 3 (card W3). The three "state" rows are the card's own neutral words
// (a state, never a station named as the limit); W3 may reword them here. Placeholders: {n}, {served} and {missed} are orders a minute.

/** Every line, by its key in the copy file. */
export const COPY = {
  'report.sheet.title': 'Shop Report',
  'report.bar.prep': 'Prep',
  'report.bar.oven': 'Ovens',
  'report.bar.counter': 'Counter',
  'report.demand': 'Customers',
  'report.customers.split': 'Drivers {drivers}/min · Seats {seats}/min',
  'report.served': 'Served {n}/min',
  'report.missed': 'Missed {n}/min',
  'report.you': 'You',
  'report.strip': 'Served {served}/min · Missed {missed}/min',
  'report.service': 'Service {n}%',
  'report.state.tipping': 'Tips up',
  'report.state.cold': 'Line’s gone cold',
  'report.strip.cold': 'Word’s spreading',
} as const;

export type CopyKey = keyof typeof COPY;
